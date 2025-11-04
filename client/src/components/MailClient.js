// File: client/src/components/MailClient.js
import React from "react";
import { useSocket } from "../hooks/useSocket";

export default function MailClient({ userEmail, token, onNewMail }) {
    useSocket(userEmail, token, {
        newMail: (msg) => {
            console.log("📩 New mail received:", msg);
            if (typeof onNewMail === "function") onNewMail(msg);
            // or call an API to refresh inbox
        },
    });

    return <div>Mail client online</div>;
}