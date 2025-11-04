// File: `client/src/components/MailDetail.js`
import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getMailById, getConversationMessages, sendMail } from "../api";
import { useSocketContext } from "../contexts/SocketContext";

/* decode JWT payload without external dependency */
function decodeJwtPayload(token) {
    try {
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const raw = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(raw)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

function fmtTime(value) {
    if (!value) return "";
    const d = typeof value === "number" ? new Date(value) : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
}

export default function MailDetail({ token, mailId: propMailId }) {
    const { id: paramId } = useParams();
    const location = useLocation();
    const partnerEmailFromState = location.state?.partnerEmail;
    const partnerId = paramId || propMailId;

    const [mailMeta, setMailMeta] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const tokenPayload = token ? decodeJwtPayload(token) : null;

    const { subscribeNewMail } = useSocketContext();

    function isMessageMine(m) {
        if (!tokenPayload) {
            return m.sentBy === "me";
        }

        const idCandidates = [
            tokenPayload.sub,
            tokenPayload.userId,
            tokenPayload.id,
            tokenPayload._id,
            tokenPayload.uid,
        ]
            .filter(Boolean)
            .map(String);

        const myEmail = tokenPayload.email || tokenPayload.mail || null;

        if (idCandidates.length) {
            if (m.senderId && idCandidates.includes(String(m.senderId))) return true;
            if (m.fromId && idCandidates.includes(String(m.fromId))) return true;
            if (m.userId && idCandidates.includes(String(m.userId))) return true;
        }

        if (myEmail) {
            const fromVals = [m.from, m.fromEmail, m.senderEmail, m.fromAddress, m.email]
                .filter(Boolean)
                .map(String);
            if (fromVals.includes(String(myEmail))) return true;
        }

        if (m.sentBy === "me") return true;
        return false;
    }

    useEffect(() => {
        if (!token) return;
        let mounted = true;

        async function load() {
            try {
                if (partnerId) {
                    const conv = await getConversationMessages(token, partnerId);
                    if (!mounted) return;
                    const raw = Array.isArray(conv.data) ? conv.data : [];
                    const mapped = raw.map((m) => ({ ...m, isMine: isMessageMine(m) }));
                    setMessages(mapped);
                    const first = raw[0];
                    setMailMeta({
                        subject: first?.subject || "",
                        partnerId,
                        partnerEmail: partnerEmailFromState || first?.from || first?.partnerEmail || null,
                    });
                } else if (propMailId) {
                    const res = await getMailById(token, propMailId);
                    if (!mounted) return;
                    const m = res.data || {};
                    const msgs = Array.isArray(m.messages) ? m.messages : [m];
                    setMessages(msgs.map((msg) => ({ ...msg, isMine: isMessageMine(msg) })));
                    setMailMeta({
                        subject: m.subject || "",
                        partnerId: m.partnerId,
                        partnerEmail: m.partnerEmail || m.from || m.to || null,
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }

        load();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, partnerId, propMailId, partnerEmailFromState]);

    // Scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    // Subscribe to newMail and append if it belongs to this conversation
    useEffect(() => {
        if (!token || !subscribeNewMail) return;
        const unsub = subscribeNewMail((msg) => {
            const belongs =
                (msg.partnerId && partnerId && String(msg.partnerId) === String(partnerId)) ||
                (mailMeta?.partnerEmail &&
                    (msg.from === mailMeta.partnerEmail ||
                        msg.to === mailMeta.partnerEmail ||
                        msg.fromEmail === mailMeta.partnerEmail ||
                        msg.toEmail === mailMeta.partnerEmail));

            if (!belongs) return;

            setMessages((prev) => {
                if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, { ...msg, isMine: isMessageMine(msg) }];
            });
        });

        return unsub;
    }, [token, subscribeNewMail, partnerId, mailMeta?.partnerEmail]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        if (!token) {
            alert("Missing auth token");
            return;
        }
        const to = mailMeta?.partnerEmail;
        if (!to) {
            alert("No recipient email available");
            return;
        }

        const subject = mailMeta?.subject ? `Re: ${mailMeta.subject}` : "";
        const body = input.trim();

        const newMsg = { body, sentAt: new Date().toISOString(), sentBy: "me", subject, isMine: true };
        // setMessages((prev) => [...prev, newMsg]);
        setInput("");
        setSending(true);

        try {
            await sendMail(token, { to, subject, body });
        } catch (err) {
            console.error("sendMail failed", err);
            alert("Send failed: " + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    };

    if (!mailMeta) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ borderBottom: "1px solid #ddd", padding: "8px 12px" }}>
                <h3 style={{ margin: 0 }}>{mailMeta.subject || "(no subject)"}</h3>
                <div style={{ fontSize: 12, color: "#666" }}>{mailMeta.partnerEmail}</div>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    background: "#fafafa",
                }}
            >
                {messages.length === 0 && <div style={{ color: "#666" }}>No messages</div>}
                {messages.map((m, idx) => (
                    <div
                        key={m.id || m.sentAt || idx}
                        style={{
                            alignSelf: m.isMine ? "flex-end" : "flex-start",
                            maxWidth: "80%",
                            background: m.isMine ? "#d1e7dd" : "#fff",
                            padding: "8px 10px",
                            borderRadius: 8,
                            boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
                        }}
                    >
                        <div style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}>{m.body}</div>
                        <div style={{ fontSize: 11, color: "#666", textAlign: "right" }}>{fmtTime(m.sentAt)}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ borderTop: "1px solid #ddd", padding: 8, display: "flex", gap: 8 }}>
        <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            style={{ flex: 1, resize: "none", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
        />
                <button type="submit" disabled={sending || input.trim() === ""} style={{ minWidth: 90 }}>
                    {sending ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
}