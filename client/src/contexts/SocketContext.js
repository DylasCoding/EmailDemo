// File: client/src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { initSocket, getSocket, disconnectSocket } from "../socket";

const SocketContext = createContext({
    connected: false,
    subscribeNewMail: (fn) => () => {},
});

export function useSocketContext() {
    return useContext(SocketContext);
}

export function SocketProvider({ token, userEmail, children }) {
    const [connected, setConnected] = useState(false);
    const listenersRef = useRef(new Set());
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) {
            // ensure disconnected and clear
            disconnectSocket();
            socketRef.current = null;
            setConnected(false);
            return;
        }

        const s = initSocket(token);
        socketRef.current = s;

        function onConnect() {
            setConnected(true);
            if (userEmail) s.emit("join", userEmail);
        }
        function onDisconnect() {
            setConnected(false);
        }
        function onNewMail(msg) {
            for (const fn of Array.from(listenersRef.current)) {
                try { fn(msg); } catch (e) { console.error("listener error", e); }
            }
        }

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("newMail", onNewMail);
        s.on("connect_error", (err) => console.warn("socket connect_error", err?.message || err));

        // immediate connected state
        setConnected(!!s.connected);

        return () => {
            if (s && userEmail) s.emit("leave", userEmail);
            s.off("connect", onConnect);
            s.off("disconnect", onDisconnect);
            s.off("newMail", onNewMail);
            // keep socket alive across route changes if you want; we do not disconnect here
        };
    }, [token, userEmail]);

    // subscribe/unsubscribe API
    const subscribeNewMail = (fn) => {
        listenersRef.current.add(fn);
        return () => {
            listenersRef.current.delete(fn);
        };
    };

    return (
        <SocketContext.Provider value={{ connected, subscribeNewMail }}>
            {children}
        </SocketContext.Provider>
    );
}
