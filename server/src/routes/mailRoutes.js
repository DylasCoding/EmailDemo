import express from 'express';
import {
    sendMail,
    inbox,
    getMail,
    conversations,
    conversationDetail, sendReply,
    sendInThread, updateThreadClassController, getThreadStatuses, updateThreadStatus, updateThreadStatusHandler
} from '../controllers/mailController.js';
import { authenticateJWT } from '../middlewares/authJwt.js';

const router = express.Router();

router.post('/send', authenticateJWT, sendMail);       // Soạn thư mới
router.post('/reply', authenticateJWT, sendReply);     // Gửi tin trong thread

router.post('/thread/:id/send', authenticateJWT, sendInThread);

router.put("/thread/:id/class", authenticateJWT, updateThreadClassController);

router.get('/thread-status', authenticateJWT, getThreadStatuses);
router.put('/thread-status/:threadId', authenticateJWT, updateThreadStatusHandler);


// Hộp thư đến (có thể hiển thị theo thread)
router.get('/inbox', authenticateJWT, inbox);

// Danh sách các hội thoại (MailThread)
router.get('/conversations', authenticateJWT, conversations);

// Danh sách tin nhắn giữa user hiện tại và partnerId
// router.get('/conversations/:partnerId', authenticateJWT, conversationDetail);
router.get('/thread/:threadId', authenticateJWT, conversationDetail);

// Lấy chi tiết 1 message cụ thể
router.get('/:id', authenticateJWT, getMail);

export default router;
