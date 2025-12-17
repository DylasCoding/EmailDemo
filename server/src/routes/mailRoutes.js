import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
    sendMail,
    getMail,
    conversations,
    conversationDetail, sendReply,
    sendInThread, updateThreadClassController, getThreadStatuses, sendMailWithFiles, updateThreadStatusHandler,
    sendInThreadWithFiles
} from '../controllers/mailController.js';
import { authenticateJWT } from '../middlewares/authJwt.js';

const router = express.Router();

// --- multer setup for attachments ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${unique}-${file.originalname}`);
    }
});
const upload = multer({ storage });

router.post('/send', authenticateJWT, sendMail);       // Soạn thư mới
router.post('/reply', authenticateJWT, sendReply);     // Gửi tin trong thread

router.post('/thread/:id/send', authenticateJWT, sendInThread);

router.put("/thread/:id/class", authenticateJWT, updateThreadClassController);

router.get('/thread-status', authenticateJWT, getThreadStatuses);
router.put('/thread-status/:threadId', authenticateJWT, updateThreadStatusHandler);

router.post('/send-with-files', authenticateJWT, upload.array('files', 5), sendMailWithFiles);
router.post('/thread/:id/send-with-files', authenticateJWT, upload.array('files', 5), sendInThreadWithFiles);

// Danh sách các hội thoại (MailThread)
router.get('/conversations', authenticateJWT, conversations);

// Danh sách tin nhắn giữa user hiện tại và partnerId
// router.get('/conversations/:partnerId', authenticateJWT, conversationDetail);
router.get('/thread/:threadId', authenticateJWT, conversationDetail);

// Lấy chi tiết 1 message cụ thể
router.get('/:id', authenticateJWT, getMail);

export default router;
