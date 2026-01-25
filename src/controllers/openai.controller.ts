import { Request, Response } from 'express';
import OpenAI from 'openai';
import ChatHistory from '../models/ChatHistory';

const openai = new OpenAI({
    apiKey: process.env.API_OPENAI_KEY,
});

export const chatCompletion = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp prompt',
            });
        }

        if (!process.env.API_OPENAI_KEY) {
            return res.status(500).json({
                success: false,
                message: 'API key OpenAI chưa được cấu hình',
            });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Lưu lịch sử chat vào database
        try {
            await ChatHistory.create({
                userId: (req as any).userId, // Nếu có middleware auth
                prompt: prompt,
                response: responseText,
                model: completion.model,
                tokensUsed: {
                    promptTokens: completion.usage?.prompt_tokens || 0,
                    completionTokens: completion.usage?.completion_tokens || 0,
                    totalTokens: completion.usage?.total_tokens || 0,
                },
            });
        } catch (dbError) {
            console.error('Lỗi khi lưu lịch sử chat:', dbError);
            // Không throw error, vẫn trả về response cho user
        }

        return res.status(200).json({
            success: true,
            data: {
                response: responseText,
                usage: completion.usage,
                model: completion.model,
            },
        });
    } catch (error: any) {
        console.error('OpenAI Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xử lý yêu cầu',
            error: error.message,
        });
    }
};

export const streamChatCompletion = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp prompt',
            });
        }

        if (!process.env.API_OPENAI_KEY) {
            return res.status(500).json({
                success: false,
                message: 'API key OpenAI chưa được cấu hình',
            });
        }

        // Thiết lập headers cho Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
            stream: true,
        });

        let fullResponse = '';
        let modelUsed = 'gpt-3.5-turbo';

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
            if (chunk.model) {
                modelUsed = chunk.model;
            }
        }

        // Lưu lịch sử chat sau khi stream hoàn thành
        try {
            await ChatHistory.create({
                userId: (req as any).userId,
                prompt: prompt,
                response: fullResponse,
                model: modelUsed,
            });
        } catch (dbError) {
            console.error('Lỗi khi lưu lịch sử chat:', dbError);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        console.error('OpenAI Stream Error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
};

// Lấy tất cả lịch sử chat
export const getChatHistory = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = (req as any).userId; // Từ middleware auth nếu có

        const query = userId ? { userId } : {};
        
        const totalItems = await ChatHistory.countDocuments(query);
        const history = await ChatHistory.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .select('-__v');

        return res.status(200).json({
            success: true,
            data: {
                history,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalItems / Number(limit)),
                    totalItems,
                    itemsPerPage: Number(limit),
                },
            },
        });
    } catch (error: any) {
        console.error('Lỗi khi lấy lịch sử chat:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy lịch sử chat',
            error: error.message,
        });
    }
};

// Lấy một cuộc trò chuyện cụ thể
export const getChatById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const chat = await ChatHistory.findById(id).select('-__v');

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc trò chuyện',
            });
        }

        return res.status(200).json({
            success: true,
            data: chat,
        });
    } catch (error: any) {
        console.error('Lỗi khi lấy cuộc trò chuyện:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy cuộc trò chuyện',
            error: error.message,
        });
    }
};

// Xóa lịch sử chat
export const deleteChatHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const deletedChat = await ChatHistory.findByIdAndDelete(id);

        if (!deletedChat) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc trò chuyện',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Đã xóa lịch sử chat thành công',
        });
    } catch (error: any) {
        console.error('Lỗi khi xóa lịch sử chat:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa lịch sử chat',
            error: error.message,
        });
    }
};

// Xóa tất cả lịch sử chat
export const deleteAllChatHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const query = userId ? { userId } : {};

        const result = await ChatHistory.deleteMany(query);

        return res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} cuộc trò chuyện`,
            deletedCount: result.deletedCount,
        });
    } catch (error: any) {
        console.error('Lỗi khi xóa tất cả lịch sử chat:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa lịch sử chat',
            error: error.message,
        });
    }
};
