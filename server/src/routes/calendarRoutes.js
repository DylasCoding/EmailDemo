import express from 'express';
import { authenticateJWT } from '../middlewares/authJwt.js';
import { createEvent, getEvents, getWeekEvents, updateEvent , deleteEvent} from '../controllers/calendarController.js';

const router = express.Router();

router.post('/events', authenticateJWT, createEvent); // Tạo sự kiện mới
router.get('/events', authenticateJWT, getEvents); // Lấy tất cả sự kiện của người dùng
router.get('/events/week', authenticateJWT, getWeekEvents); // Lấy sự kiện trong tuần cụ thể
router.put('/update/events/:eventId', authenticateJWT, updateEvent); // Cập nhật sự kiện
router.delete('/delete/events/:eventId', authenticateJWT, deleteEvent);

export default router;
