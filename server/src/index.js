// javascript
// File: `server/src/index.js` (fixed: start Gmail watcher only once)
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
import uploadRoutes from "./routes/uploadRoutes.js";
import calendarRoutes from './routes/calendarRoutes.js';
import { sequelizeInstance as sequelize } from '../models/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";
import { checkNewReplies, createGmailClient } from "./gmail/gmailService.js";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("📁 uploads/ folder created automatically");
}

// serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ======= ROUTES =======
app.use('/api/auth', authRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/files', uploadRoutes);
app.use('/calendar',calendarRoutes)

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

// ======= GMAIL WATCHER =======
global.gmailClient = null;
let gmailClient = null;
let gmailWatcherStarted = false; // guard to prevent double-start

async function startEmailWatcher() {
    if (!gmailClient) {
        console.log('⚠️ Gmail client not available, watcher not started');
        return;
    }

    if (gmailWatcherStarted) {
        console.log('⚠️ Gmail watcher already started, skipping duplicate start');
        return;
    }
    gmailWatcherStarted = true;

    console.log('👀 Gmail Watcher started...');

    setInterval(async () => {
        try {
            const replies = await checkNewReplies(gmailClient);

            if (replies.length > 0) {
                replies.forEach(reply => {
                    console.log(`📩 New reply from ${reply.from}: ${reply.snippet}`);
                    // handle reply...
                });
            }
        } catch (error) {
            console.error('❌ Error checking Gmail:', error.message || error);
        }
    }, 5000); // 5.000ms = 5 seconds
}

// ======= DATABASE INIT + SERVER START =======
(async () => {
    try {
        await sequelize.authenticate();
        console.log(' Database connected');
        await sequelize.sync({ alter: false });

        server.listen(PORT, () => {
            console.log(`API Server running on http://localhost:${PORT}`);
        });

        // Initialize Gmail client once and start watcher once
        try {
            gmailClient = await createGmailClient();
            global.gmailClient = gmailClient;
            await startEmailWatcher();
        } catch (gmailErr) {
            console.error('❌ Could not initialize Gmail client:', gmailErr.message || gmailErr);
        }

        startSMTPServer(); // port 2525
        startPOP3Server(); // port 1100
    } catch (err) {
        console.error('Unable to start server:', err);
    }
})();
