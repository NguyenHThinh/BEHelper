import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ChatHistory from '../models/ChatHistory';

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const chatCompletion = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp prompt',
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'API key Gemini chưa được cấu hình',
            });
        }

        // Sử dụng Gemini Pro model
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // Lưu lịch sử chat vào database
        try {
            await ChatHistory.create({
                userId: (req as any).userId,
                prompt: prompt,
                response: responseText,
                model: 'gemini-3-flash-preview',
                tokensUsed: {
                    promptTokens: 0, // Gemini không trả về token usage trong free tier
                    completionTokens: 0,
                    totalTokens: 0,
                },
            });
        } catch (dbError) {
            console.error('Lỗi khi lưu lịch sử chat:', dbError);
        }

        return res.status(200).json({
            success: true,
            data: {
                response: responseText,
                model: 'gemini-3-flash-preview',
            },
        });
    } catch (error: any) {
        console.error('Gemini Error:', error);
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

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'API key Gemini chưa được cấu hình',
            });
        }

        // Thiết lập headers cho Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const result = await model.generateContentStream(prompt);

        let fullResponse = '';

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
            }
        }

        // Lưu lịch sử chat sau khi stream hoàn thành
        try {
            await ChatHistory.create({
                userId: (req as any).userId,
                prompt: prompt,
                response: fullResponse,
                model: 'gemini-3-flash-preview',
            });
        } catch (dbError) {
            console.error('Lỗi khi lưu lịch sử chat:', dbError);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        console.error('Gemini Stream Error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
};

// Lấy tất cả lịch sử chat
export const getChatHistory = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const userId = (req as any).userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        const query = { userId };

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
        const userId = (req as any).userId;
        const chat = await ChatHistory.findOne({ _id: id, userId }).select('-__v');

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền truy cập',
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
        const userId = (req as any).userId;

        const deletedChat = await ChatHistory.findOneAndDelete({ _id: id, userId });

        if (!deletedChat) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền xóa',
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
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        const query = { userId };

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
