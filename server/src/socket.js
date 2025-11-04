import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

let io;
const userSockets = new Map();

export function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
        },
    });

    // ===== Authenticate socket connection using JWT =====
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token || socket.handshake.query?.token;

            if (!token) return next(new Error('Authentication error'));

            const payload = jwt.verify(token, process.env.JWT_SECRET);
            let user;

            if (payload.id) {
                user = await User.findByPk(payload.id);
            } else if (payload.email) {
                user = await User.findOne({ where: { email: payload.email } });
            }

            if (!user) return next(new Error('Authentication error'));

            socket.user = { id: user.id, email: user.email };
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    // ===== On connection =====
    io.on('connection', (socket) => {
        userSockets.set(socket.user.id, socket);
        socket.join(`user_${socket.user.id}`);

        socket.on('disconnect', () => {
            userSockets.delete(socket.user.id);
        });
    });
}

export function getIo() {
    return io;
}

export function emitToUser(userId, event, payload) {
    if (!io) return;

    // Emit to specific socket if stored
    const sock = userSockets.get(userId);
    if (sock) sock.emit(event, payload);

    // Also emit to room as fallback
    io.to(`user_${userId}`).emit(event, payload);
}
