// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { startSMTPServer } from './smtp/smtpServer.js';
import { startPOP3Server } from './pop3/pop3Server.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import mailRoutes from './routes/mailRoutes.js';

// Import models (tự động thiết lập quan hệ)
import { sequelizeInstance as sequelize } from '../models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ======= MIDDLEWARE =======
app.use(express.json());
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// ======= ROUTES =======
app.use('/api/auth', authRoutes);   // Đăng ký, đăng nhập
app.use('/api/mail', mailRoutes);   // Gửi mail, xem inbox, xem chi tiết

// ======= ERROR HANDLER =======
app.use((err, req, res, next) => {
    console.error('Internal error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// ======= DATABASE INIT + SERVER START =======
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully');
        await sequelize.sync({ alter: false }); // Giữ dữ liệu cũ, đồng bộ schema

        app.listen(PORT, () => {
            console.log(`API Server is running on http://localhost:${PORT}`);
        });

        // ======= MAIL SERVERS =======
        startSMTPServer();  // chạy port 2525
        startPOP3Server();  // chạy port 1100

    } catch (error) {
        console.error('Unable to start server:', error);
    }
})();
