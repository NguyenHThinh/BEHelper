import mongoose, { Document, Schema } from 'mongoose';

// Interface cho ChatHistory document
export interface IChatHistory {
    userId?: mongoose.Types.ObjectId;
    prompt: string;
    response: string;
    model: string;
    tokensUsed?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ChatHistorySchema = new Schema<IChatHistory>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        prompt: {
            type: String,
            required: true,
        },
        response: {
            type: String,
            required: true,
        },
        model: {
            type: String,
            required: true,
        },
        tokensUsed: {
            promptTokens: Number,
            completionTokens: Number,
            totalTokens: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm nhanh hơn
ChatHistorySchema.index({ userId: 1, createdAt: -1 });
ChatHistorySchema.index({ createdAt: -1 });

const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);

export default ChatHistory;
