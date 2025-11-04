// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { startSMTPServer } from './smtp/smtpServer.js';
import { startPOP3Server } from './pop3/pop3Server.js';
import authRoutes from './routes/authRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
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
app.use('/api/auth', authRoutes);
app.use('/api/mail', mailRoutes);

// ======= HTTP + SOCKET SERVER =======
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});
global._io = io; // để mailService.js có thể emit event

// Quản lý kết nối socket
io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    // client join room theo email của họ
    socket.on('join', (email) => {
        socket.join(email);
        console.log(`📨 ${email} joined room`);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
    });
});

// ======= DATABASE INIT + SERVER START =======
(async () => {
    try {
        await sequelize.authenticate();
        console.log(' Database connected');
        await sequelize.sync({ alter: false });

        server.listen(PORT, () => {
            console.log(`API Server running on http://localhost:${PORT}`);
        });

        startSMTPServer(); // port 2525
        startPOP3Server(); // port 1100
    } catch (err) {
        console.error('Unable to start server:', err);
    }
})();
