// File: `client/src/components/Inbox.js`
import React, { useEffect, useState } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useNavigate } from "react-router-dom";
import { getConversations, getConversationMessages } from "../api";

export default function Inbox({ token }) {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [selectedPartnerEmail, setSelectedPartnerEmail] = useState(null);
    const navigate = useNavigate();

    const { subscribeNewMail } = useSocketContext();

    useEffect(() => {
        if (!token) return;
        getConversations(token)
            .then((res) => setConversations(res.data || []))
            .catch((err) => {
                console.error('getConversations failed:', err.response?.status, err.response?.data || err.message);
            });
    }, [token]);

    const openConversation = async (partnerId, partnerEmail) => {
        setSelectedPartner(partnerId);
        setSelectedPartnerEmail(partnerEmail || null);
        try {
            const res = await getConversationMessages(token, partnerId);
            setMessages(res.data || []);
            navigate(`/mail/${partnerId}`, { state: { partnerEmail } });
        } catch (err) {
            console.error('getConversationMessages failed:', err.response?.status, err.response?.data || err.message);
            setMessages([]);
            navigate(`/mail/${partnerId}`, { state: { partnerEmail } });
        }
    };

    // Subscribe to realtime newMail and update conversations + current messages
    useEffect(() => {
        if (!token || !subscribeNewMail) return;
        const unsub = subscribeNewMail((msg) => {
            // Normalize fields
            const partnerIdFromMsg = msg.partnerId || null;
            const partnerEmailFromMsg = msg.partnerEmail || msg.from || msg.to || msg.fromEmail || msg.toEmail || null;
            const lastMessage = msg.body || msg.subject || "";

            // Update conversations: move or prepend, update lastMessage/lastSentAt
            setConversations((prev) => {
                const idx = prev.findIndex(
                    (c) =>
                        (c.partnerId && partnerIdFromMsg && String(c.partnerId) === String(partnerIdFromMsg)) ||
                        (c.partnerEmail && partnerEmailFromMsg && c.partnerEmail === partnerEmailFromMsg)
                );

                const newConv = {
                    partnerId: partnerIdFromMsg || (idx >= 0 ? prev[idx].partnerId : null),
                    partnerEmail: partnerEmailFromMsg || (idx >= 0 ? prev[idx].partnerEmail : "unknown"),
                    lastMessage,
                    lastSentAt: msg.sentAt || new Date().toISOString(),
                };

                const next = prev.slice();
                if (idx >= 0) next.splice(idx, 1); // remove existing so we prepend updated
                return [newConv, ...next];
            });

            // If the conversation is currently open, append message to messages view (avoid duplicates)
            const belongsToOpen =
                (selectedPartner && partnerIdFromMsg && String(partnerIdFromMsg) === String(selectedPartner)) ||
                (selectedPartnerEmail && partnerEmailFromMsg && partnerEmailFromMsg === selectedPartnerEmail);

            if (belongsToOpen) {
                setMessages((prev) => {
                    if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        return unsub;
    }, [token, subscribeNewMail, selectedPartner, selectedPartnerEmail]);

    return (
        <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ width: "30%", borderRight: "1px solid gray" }}>
                <h2>Conversations</h2>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {conversations.map((c) => (
                        <li
                            key={c.partnerId || c.partnerEmail}
                            onClick={() => openConversation(c.partnerId, c.partnerEmail)}
                            style={{ cursor: "pointer", padding: 8, borderBottom: "1px solid #eee" }}
                            role="button"
                            tabIndex={0}
                        >
                            <b>{c.partnerEmail}</b>
                            <p style={{ margin: "4px 0" }}>{c.lastMessage}</p>
                            <small>{c.lastSentAt ? new Date(c.lastSentAt).toLocaleString() : ""}</small>
                        </li>
                    ))}
                </ul>
            </div>

            <div style={{ flex: 1 }}>
                {selectedPartner ? (
                    <>
                        <h3>Chat</h3>
                        <ul>
                            {messages.map((m) => (
                                <li key={m.id || m.sentAt}>
                                    <b>{m.senderId === selectedPartner ? "Partner" : "You"}:</b> {m.body}
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p>Select a conversation</p>
                )}
            </div>
        </div>
    );
}