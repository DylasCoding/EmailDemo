import React, { useEffect, useState } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useNavigate } from "react-router-dom";
import { getConversations, updateThreadStatus } from "../api";
import ChatIcon from "@mui/icons-material/Chat";
import EmailIcon from "@mui/icons-material/Email";
import StarIcon from "@mui/icons-material/Star";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function Inbox({ token }) {
    const [conversations, setConversations] = useState([]);
    const navigate = useNavigate();
    const { subscribeNewMail, subscribeNewThread } = useSocketContext();
    const [filter, setFilter] = useState("inbox"); // inbox | star | spam

    useEffect(() => {
        if (!token) return;
        getConversations(token)
            .then((res) => setConversations(res.data || []))
            .catch((err) => {
                console.error(
                    "getConversations failed:",
                    err.response?.status,
                    err.response?.data || err.message
                );
            });
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const unsubThread = subscribeNewThread((threadInfo) => {
            setConversations(prev => [threadInfo, ...prev]); // thêm vào đầu danh sách
        });

        return () => unsubThread();
    }, [token, subscribeNewThread]);

    useEffect(() => {
        if (!token || !subscribeNewMail) return;
        const unsub = subscribeNewMail((msg) => {
            const partnerId = msg.partnerId || null;
            const partnerEmail =
                msg.partnerEmail ||
                msg.from ||
                msg.to ||
                msg.fromEmail ||
                msg.toEmail ||
                null;
            const lastMessage = msg.body || msg.subject || "";

            setConversations((prev) => {
                const idx = prev.findIndex(
                    (c) =>
                        (c.partnerId && partnerId && String(c.partnerId) === String(partnerId)) ||
                        (c.partnerEmail && partnerEmail && c.partnerEmail === partnerEmail)
                );
                const newConv = {
                    partnerId: partnerId || (idx >= 0 ? prev[idx].partnerId : null),
                    partnerEmail: partnerEmail || (idx >= 0 ? prev[idx].partnerEmail : "unknown"),
                    lastMessage,
                    lastSentAt: msg.sentAt || new Date().toISOString(),
                    class: idx >= 0 ? prev[idx].class : "normal"
                };
                const next = prev.slice();
                if (idx >= 0) next.splice(idx, 1);
                return [newConv, ...next];
            });
        });

        return unsub;
    }, [token, subscribeNewMail]);

    const openConversation = (threadId, partnerEmail) => {
        if (!threadId) {
            console.warn('openConversation: missing threadId — partnerEmail=', partnerEmail);
            return;
        }
        console.log("openConversation: " + threadId);
        navigate(`/mail/thread/${threadId}`, {
            state: { threadId, partnerEmail }
        });
    };

    useEffect(() => {
        if (!token) return;
        getConversations(token)
            .then((res) => {
                console.log('GET /mail/conversations =>', res.data);
                setConversations(res.data || []);
            })
            .catch((err) => { console.error('getConversations failed:', err.response?.data || err.message); });
    }, [token]);

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) return "Vừa xong";
        if (diffInHours < 24) return `${Math.floor(diffInHours)} giờ trước`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
        return date.toLocaleDateString("vi-VN", {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filtered = conversations.filter((c) => {
        if (filter === "star") return c.class === "star";
        if (filter === "spam") return c.class === "spam";
        return c.class !== "spam";
    });

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-3xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                                <ChatIcon className="text-white" fontSize="large" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                                    Hộp thư
                                </h1>
                                <p className="text-sm text-gray-500">{filtered.length} cuộc trò chuyện</p>
                            </div>
                        </div>

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border border-blue-200 bg-white/90 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        >
                            <option value="inbox">📥 Hộp thư</option>
                            <option value="star">⭐ Star</option>
                            <option value="spam">⚠️ Spam</option>
                        </select>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <EmailIcon className="text-blue-400 text-4xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có cuộc trò chuyện</h3>
                        <p className="text-gray-500 mb-6">Hãy gửi email đầu tiên để bắt đầu kết nối</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filtered.map((c, index) => (
                            <div
                                key={c.threadId || c.partnerEmail}
                                onClick={() => openConversation(c.threadId, c.partnerEmail)}
                                className="group cursor-pointer p-4 rounded-2xl bg-white/70 backdrop-blur-sm
                                    border border-blue-100 hover:border-blue-200 transition-all duration-300
                                    hover:shadow-lg hover:scale-[1.02] hover:bg-white/90"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                            <span className="text-white font-semibold text-sm">
                                                {c.partnerEmail?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-800 truncate pr-2">{c.title}</h3>
                                                <div
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const nextClass =
                                                            c.class === "star" ? "normal" : c.class === "spam" ? "normal" : "star";

                                                        // Basic guards
                                                        if (!token) {
                                                            console.warn("updateThreadStatus: missing auth token");
                                                            return;
                                                        }
                                                        if (!c.threadId) {
                                                            console.warn("updateThreadStatus: missing threadId — cannot update server for local-only conversation", c);
                                                            // Optionally: create thread on server first, or show UI to the user.
                                                            return;
                                                        }

                                                        try {
                                                            // call API first
                                                            await updateThreadStatus(token, c.threadId, nextClass);

                                                            // update local state only on success
                                                            setConversations((prev) =>
                                                                prev.map((conv) =>
                                                                    conv.threadId === c.threadId ? { ...conv, class: nextClass } : conv
                                                                )
                                                            );
                                                        } catch (err) {
                                                            console.error("updateThreadStatus failed:", err.response?.data || err.message || err);
                                                        }
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    {c.class === "star" ? (
                                                        <StarIcon className="text-yellow-400" fontSize="small" />
                                                    ) : c.class === "spam" ? (
                                                        <WarningAmberIcon className="text-red-500" fontSize="small" />
                                                    ) : (
                                                        <StarIcon className="text-gray-300" fontSize="small" />
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                                {c.lastMessage}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end ml-3 flex-shrink-0">
                                        <div className="text-xs text-gray-400 mb-1">{formatTime(c.lastSentAt)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
