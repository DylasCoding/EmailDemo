// File: client/src/components/Inbox.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConversations, getConversationMessages } from "../api";

export default function Inbox({ token }) {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const navigate = useNavigate();

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
        try {
            const res = await getConversationMessages(token, partnerId);
            setMessages(res.data || []);
            // navigate to detail route
            navigate(`/mail/${partnerId}`, { state: { partnerEmail } });
        } catch (err) {
            console.error('getConversationMessages failed:', err.response?.status, err.response?.data || err.message);
            setMessages([]);
            navigate(`/mail/${partnerId}`, { state: { partnerEmail } });
        }
    };

    return (
        <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ width: "30%", borderRight: "1px solid gray" }}>
                <h2>Conversations</h2>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {conversations.map((c) => (
                        <li
                            key={c.partnerId}
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
