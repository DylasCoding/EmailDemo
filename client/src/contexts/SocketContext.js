// File: client/src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { initSocket, disconnectSocket } from "../socket";

const SocketContext = createContext({
    connected: false,
    subscribeNewMail: (fn) => () => {},
    subscribeNewThread: (fn) => () => {},
});

export function useSocketContext() {
    return useContext(SocketContext);
}

export function SocketProvider({ token, userEmail, children }) {
    const [connected, setConnected] = useState(false);

    // Lưu danh sách listener riêng biệt
    const mailListenersRef = useRef(new Set());
    const threadListenersRef = useRef(new Set());
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) {
            disconnectSocket();
            socketRef.current = null;
            setConnected(false);
            return;
        }

        const s = initSocket(token);
        socketRef.current = s;

        // 🟢 Khi socket kết nối
        function onConnect() {
            setConnected(true);
            if (userEmail) s.emit("join", userEmail);
        }

        function onDisconnect() {
            setConnected(false);
        }

        // 🟢 Khi nhận tin nhắn mới trong thread hiện có
        function onNewMail(msg) {
            for (const fn of Array.from(mailListenersRef.current)) {
                try { fn(msg); } catch (e) { console.error("listener error (newMail)", e); }
            }
        }

        // 🟢 Khi nhận thread hoàn toàn mới
        function onNewThread(threadInfo) {
            for (const fn of Array.from(threadListenersRef.current)) {
                try { fn(threadInfo); } catch (e) { console.error("listener error (newThread)", e); }
            }
        }

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("newMail", onNewMail);
        s.on("newThread", onNewThread);
        s.on("connect_error", (err) => console.warn("socket connect_error", err?.message || err));

        setConnected(!!s.connected);

        return () => {
            if (s && userEmail) s.emit("leave", userEmail);
            s.off("connect", onConnect);
            s.off("disconnect", onDisconnect);
            s.off("newMail", onNewMail);
            s.off("newThread", onNewThread);
        };
    }, [token, userEmail]);

    // 🟢 API cho component khác đăng ký nhận newMail
    const subscribeNewMail = (fn) => {
        mailListenersRef.current.add(fn);
        return () => mailListenersRef.current.delete(fn);
    };

    // 🟢 API cho component khác đăng ký nhận newThread
    const subscribeNewThread = (fn) => {
        threadListenersRef.current.add(fn);
        return () => threadListenersRef.current.delete(fn);
    };

    return (
        <SocketContext.Provider
            value={{
                connected,
                subscribeNewMail,
                subscribeNewThread
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}
