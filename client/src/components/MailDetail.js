import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getMailById, getThreadMessages, sendMail, sendMessageInThread } from "../api";
import { useSocketContext } from "../contexts/SocketContext";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";


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
    const d = new Date(value);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return d.toLocaleDateString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MailDetail({ token, mailId: propMailId }) {
    const { id: paramId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const partnerEmailFromState = location.state?.partnerEmail;
    const partnerId = paramId || propMailId;

    const [setMailMeta] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const tokenPayload = token ? decodeJwtPayload(token) : null;
    const { subscribeNewMail } = useSocketContext();

    const { id: threadIdParam } = useParams(); // ✅ Lấy "6" từ URL (/mail/thread/6)
    const mailMeta = location.state || {};
    const threadId = mailMeta.threadId || threadIdParam; // Ưu tiên state, fallback param

    console.log("🧭 Thread ID from URL:", threadId);

    const isMessageMine = (m) => {
        if (!tokenPayload) return m.sentBy === "me";
        const idCandidates = [tokenPayload.sub, tokenPayload.userId, tokenPayload.id, tokenPayload._id, tokenPayload.uid]
            .filter(Boolean).map(String);
        const myEmail = tokenPayload.email || tokenPayload.mail;

        if (idCandidates.length && m.senderId && idCandidates.includes(String(m.senderId))) return true;
        if (myEmail && [m.from, m.fromEmail, m.senderEmail].includes(myEmail)) return true;
        return m.sentBy === "me";
    };

    useEffect(() => {
        if (!token || !partnerId) return;
        let mounted = true;

        const load = async () => {
            try {
                const conv = await getThreadMessages(token, partnerId);

                if (!mounted) return;
                const raw = Array.isArray(conv.data) ? conv.data : [];
                const mapped = raw.map(m => ({ ...m, isMine: isMessageMine(m) }));
                setMessages(mapped);
                const first = raw[0];
                setMailMeta({
                    subject: first?.subject || "(Không có tiêu đề)",
                    partnerId,
                    partnerEmail: partnerEmailFromState || first?.from || first?.partnerEmail || "Không xác định"
                });
            } catch (err) {
                console.error("Load conversation failed:", err);
            }
        };
        load();
        return () => { mounted = false; };
    }, [token, partnerId, partnerEmailFromState]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!token || !subscribeNewMail) return;
        const unsub = subscribeNewMail((msg) => {
            const belongs = (msg.partnerId && String(msg.partnerId) === String(partnerId)) ||
                (mailMeta?.partnerEmail && [msg.from, msg.to, msg.fromEmail, msg.toEmail].includes(mailMeta.partnerEmail));
            if (!belongs) return;
            if (msg.id && messages.some(m => m.id === msg.id)) return;
            setMessages(prev => [...prev, { ...msg, isMine: isMessageMine(msg) }]);
        });
        return unsub;
    }, [token, subscribeNewMail, partnerId, mailMeta?.partnerEmail, messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;
        const to = mailMeta?.partnerEmail;
        if (!to) return alert("Không tìm thấy email người nhận");

        const subject = mailMeta?.subject?.startsWith("Re:") ? mailMeta.subject : `Re: ${mailMeta.subject}`;
        const body = input.trim();

        const optimisticMsg = { body, sentAt: new Date().toISOString(), isMine: true, sending: true };
        // setMessages(prev => [...prev, optimisticMsg]);
        setInput("");
        setSending(true);

        try {
            console.log("1");
            console.log(mailMeta.threadId);
            await sendMessageInThread(token, threadId, { body });

        } catch (err) {
            setMessages(prev => prev.filter(m => !m.sending));
            alert("Gửi thất bại: " + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    };

    if (!mailMeta) return null;

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header - Glassmorphism */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <ArrowBackIcon className="text-gray-600" />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 truncate max-w-xs">
                                {mailMeta.subject}
                            </h2>
                            <p className="text-sm text-gray-500 flex items-center space-x-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span>{mailMeta.partnerEmail}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" style={{ scrollbarWidth: "thin" }}>
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SendIcon className="text-blue-500 text-3xl" />
                        </div>
                        <p>Chưa có tin nhắn</p>
                        <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                ) : (
                    messages.map((m, idx) => (
                        <div
                            key={m.id || m.sentAt || idx}
                            className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`
                                    max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm
                                    ${m.isMine
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                                    : "bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800"
                                }
                                    ${m.sending ? "opacity-70" : ""}
                                `}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                                <p className={`text-xs mt-1 ${m.isMine ? "text-blue-100" : "text-gray-400"} text-right`}>
                                    {m.sending ? "Đang gửi..." : fmtTime(m.sentAt)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="bg-white/80 backdrop-blur-xl border-t border-white/20 p-4">
                <div className="flex items-end space-x-3 max-w-4xl mx-auto">
                    <button type="button" className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                        <AttachFileIcon />
                    </button>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(e)}
                        placeholder="Soạn tin nhắn..."
                        rows={1}
                        className="flex-1 resize-none bg-gray-50/70 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800"
                        style={{ minHeight: "48px", maxHeight: "120px" }}
                    />
                    <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className={`
                            p-3 rounded-full shadow-lg transition-all duration-300
                            ${sending || !input.trim()
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-xl hover:scale-110 active:scale-100 text-white"
                        }
                        `}
                    >
                        <SendIcon fontSize="small" />
                    </button>
                </div>
            </form>
        </div>
    );
}