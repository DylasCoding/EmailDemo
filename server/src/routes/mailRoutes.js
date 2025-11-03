// src/routes/mailRoutes.js
import express from 'express';
import { sendMail, inbox, getMail, conversations, conversationDetail } from '../controllers/mailController.js';
import { authenticateJWT } from '../middlewares/authJwt.js';

const router = express.Router();

// register specific/static routes first
router.post('/send', authenticateJWT, sendMail);
router.get('/inbox', authenticateJWT, inbox);
router.get('/conversations', authenticateJWT, conversations);
router.get('/conversations/:partnerId', authenticateJWT, conversationDetail);

// generic dynamic route last
router.get('/:id', authenticateJWT, getMail);

export default router;

