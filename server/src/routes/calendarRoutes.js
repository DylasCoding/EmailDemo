import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateJWT } from '../middlewares/authJwt.js';
import { createEvent, getEvents, getWeekEvents, updateEvent } from '../controllers/calendarController.js';

const router = express.Router();

router.post('/events', authenticateJWT, createEvent); // Tạo sự kiện mới
router.get('/events', authenticateJWT, getEvents); // Lấy tất cả sự kiện của người dùng
router.get('/events/week', authenticateJWT, getWeekEvents); // Lấy sự kiện trong tuần cụ thể
router.put('/events/:eventId', authenticateJWT, updateEvent); // Cập nhật sự kiện

export default router;
