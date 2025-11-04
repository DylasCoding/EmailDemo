// File: client/src/socket.js
import { io } from "socket.io-client";

const API_URL = "http://localhost:3000";
let socket = null;

export function initSocket(token) {
    if (socket && socket.connected) return socket;
    socket = io(API_URL, {
        auth: { token },
        transports: ["websocket"],
        autoConnect: true,
    });

    socket.on("connect_error", (err) => {
        console.warn("socket connect_error:", err.message || err);
    });

    return socket;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        try {
            socket.disconnect();
        } catch (e) {
            console.warn("socket disconnect error", e);
        }
        socket = null;
    }
}
