import { Router } from 'express';
import {
    chatCompletion,
    streamChatCompletion,
    getChatHistory,
    getChatById,
    deleteChatHistory,
    deleteAllChatHistory
} from '../controllers/openai.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// Route để gửi prompt và nhận response
router.post('/chat', chatCompletion);

// Route để gửi prompt và nhận response dạng stream (real-time)
router.post('/chat/stream', streamChatCompletion);

// Route để lấy lịch sử chat (có phân trang)
router.get('/history', getChatHistory);

// Route để lấy một cuộc trò chuyện cụ thể
router.get('/history/:id', getChatById);

// Route để xóa một cuộc trò chuyện
router.delete('/history/:id', deleteChatHistory);

// Route để xóa tất cả lịch sử chat
router.delete('/history', deleteAllChatHistory);

export default router;
