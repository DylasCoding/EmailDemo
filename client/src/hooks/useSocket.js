// File: client/src/hooks/useSocket.js
import { useEffect } from "react";
import { initSocket } from "../socket";

export function useSocket(userEmail, token, handlers = {}) {
    useEffect(() => {
        if (!token || !userEmail) return;
        const s = initSocket(token);

        // join room by email (server should handle "join")
        s.emit("join", userEmail);

        // attach handlers
        if (handlers.newMail) s.on("newMail", handlers.newMail);
        if (handlers.connected) s.on("connect", handlers.connected);
        if (handlers.disconnect) s.on("disconnect", handlers.disconnect);

        // cleanup
        return () => {
            if (handlers.newMail) s.off("newMail", handlers.newMail);
            if (handlers.connected) s.off("connect", handlers.connected);
            if (handlers.disconnect) s.off("disconnect", handlers.disconnect);
            // optionally leave room
            s.emit("leave", userEmail);
        };
    }, [userEmail, token, handlers]);
}
