// javascript
import React, { useEffect, useState, useRef } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getConversations, updateThreadStatus } from "../api";
import ChatIcon from "@mui/icons-material/Chat";
import EmailIcon from "@mui/icons-material/Email";
import StarIcon from "@mui/icons-material/Star";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function Inbox({ token, currentUserId }) {
    const [conversations, setConversations] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { subscribeNewMail, subscribeNewThread } = useSocketContext();
    // initialize filter from hash
    const initialFilter = (() => {
        const h = window.location.hash || "";
        if (h === "#starred") return "star";
        if (h === "#spam") return "spam";
        return "inbox";
    })();
    const [filter, setFilter] = useState(initialFilter); // inbox | star | spam

    const headerRef = useRef(null);
    const listContainerRef = useRef(null);
    const [listHeight, setListHeight] = useState("60vh");
    const [scale, setScale] = useState(1);

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
            setConversations(prev => [threadInfo, ...prev]);
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
            const lastSenderId = msg.senderId || msg.fromId || null;
            const isRead = msg.isRead || false;

            setConversations((prev) => {
                const idx = prev.findIndex(
                    (c) =>
                        (c.partnerId && partnerId && String(c.partnerId) === String(partnerId)) ||
                        (c.partnerEmail && partnerEmail && c.partnerEmail === partnerEmail)
                );

                const titleFromMsg = msg.title || msg.subject || null;
                const lastSentAt = msg.sentAt || new Date().toISOString();

                if (idx >= 0) {
                    const existing = prev[idx];
                    const merged = {
                        ...existing,
                        threadId: msg.threadId || existing.threadId || null,
                        partnerId: partnerId || existing.partnerId || null,
                        partnerEmail: partnerEmail || existing.partnerEmail || "unknown",
                        lastMessage,
                        lastSentAt,
                        lastSenderId,
                        isRead,
                        class: existing.class || "normal",
                        title: titleFromMsg || existing.title || "(No subject)"
                    };
                    const next = prev.slice();
                    next.splice(idx, 1);
                    return [merged, ...next];
                } else {
                    const newConv = {
                        threadId: msg.threadId || null,
                        partnerId: partnerId,
                        partnerEmail: partnerEmail || "unknown",
                        lastMessage,
                        lastSentAt,
                        lastSenderId,
                        isRead,
                        class: "normal",
                        title: titleFromMsg || "(No subject)"
                    };
                    return [newConv, ...prev];
                }
            });
        });

        return unsub;
    }, [token, subscribeNewMail]);

    const openConversation = (threadId, partnerEmail, title) => {
        if (!threadId) {
            console.warn('openConversation: missing threadId — partnerEmail=', partnerEmail);
            return;
        }
        navigate(`/mail/thread/${threadId}`, {
            state: { threadId, partnerEmail, title }
        });
    };

    // compute available height for the list and a scale factor for cards
    useEffect(() => {
        function recompute() {
            const headerRect = headerRef.current?.getBoundingClientRect();
            const bottom = headerRect ? headerRect.bottom : 200;
            const available = Math.max(200, window.innerHeight - bottom - 120);
            setListHeight(`${available}px`);

            const baseline = 1200;
            const newScale = Math.min(1, window.innerWidth / baseline);
            setScale(newScale);
        }

        recompute();
        window.addEventListener("resize", recompute);
        return () => window.removeEventListener("resize", recompute);
    }, []);

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

    // Helper function to determine if conversation is read
    const isConversationRead = (c) => {
        // Nếu tin nhắn cuối cùng là của mình thì coi như đã đọc
        if (c.lastSenderId && currentUserId && String(c.lastSenderId) === String(currentUserId)) {
            return true;
        }
        // Nếu không, dựa vào isRead từ server
        return c.isRead === true;
    };

    // Sync filter with URL hash
    useEffect(() => {
        const h = location.hash || "";
        if (h === "#starred") setFilter("star");
        else if (h === "#spam") setFilter("spam");
        else setFilter("inbox");
    }, [location.hash]);

    const filtered = conversations.filter((c) => {
        if (filter === "star") return c.class === "star";
        if (filter === "spam") return c.class === "spam";
        return c.class !== "spam";
    });

    return (
        <div className="w-full py-4">
            <div className="w-full max-w-none lg:max-w-6xl mx-auto px-4">

                {/* Header (flat, white with cream context) */}
                <div ref={headerRef} className="bg-white border border-white-100 p-6 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg">
                                <ChatIcon className="text-white" fontSize="large" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Hộp thư</h1>
                                <p className="text-sm text-gray-500">{filtered.length} cuộc trò chuyện</p>
                            </div>
                        </div>

                        <select
                            value={filter}
                            onChange={(e) => {
                                const v = e.target.value;
                                setFilter(v);
                                if (v === "star") window.location.hash = "#starred";
                                else if (v === "spam") window.location.hash = "#spam";
                                else window.location.hash = "";
                            }}
                            className="border border-amber-200 bg-white rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                        >
                            <option value="inbox">📥 Hộp thư</option>
                            <option value="star">⭐ Star</option>
                            <option value="spam">⚠️ Spam</option>
                        </select>
                    </div>
                </div>

                {/* Scrollable list area (cards sit flat on cream background) */}
                <div
                    ref={listContainerRef}
                    className="bg-transparent overflow-y-auto"
                    style={{ maxHeight: listHeight, padding: "6px" }}
                >
                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gradient-to-r from-amber-50 to-white-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <EmailIcon className="text-amber-400 text-4xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có cuộc trò chuyện</h3>
                            <p className="text-gray-500 mb-6">Hãy gửi email đầu tiên để bắt đầu kết nối</p>
                        </div>
                    ) : (
                        <div className="space-y-3" style={{ transformOrigin: "top left" }}>
                            {filtered.map((c) => {
                                const isRead = isConversationRead(c);

                                return (
                                    <div
                                        key={c.threadId || c.partnerEmail}
                                        onClick={() => openConversation(c.threadId, c.partnerEmail, c.title)}
                                        className="group cursor-pointer p-4 bg-white border border-white-100 hover:border-amber-200 transition-all duration-200"
                                        style={{
                                            borderRadius: "8px",
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                            transform: `scale(${scale})`,
                                            transformOrigin: "top left",
                                            opacity: isRead ? 0.7 : 1
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div
                                                    className="w-10 h-10 bg-gradient-to-r from-gray-900 to-black rounded-full flex items-center justify-center shadow-md"
                                                    style={{ opacity: isRead ? 0.6 : 1 }}
                                                >
                                                    <span className="text-amber-50 font-semibold text-sm">
                                                        {c.partnerEmail?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3
                                                            className="truncate pr-2 text-sm md:text-base"
                                                            style={{
                                                                fontWeight: isRead ? 400 : 600,
                                                                color: isRead ? '#6b7280' : '#1f2937'
                                                            }}
                                                        >
                                                            {c.title}
                                                        </h3>
                                                        <div
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const nextClass =
                                                                    c.class === "star" ? "normal" : c.class === "spam" ? "normal" : "star";

                                                                if (!token) {
                                                                    console.warn("updateThreadStatus: missing auth token");
                                                                    return;
                                                                }
                                                                if (!c.threadId) {
                                                                    console.warn("updateThreadStatus: missing threadId — cannot update server for local-only conversation", c);
                                                                    return;
                                                                }

                                                                try {
                                                                    await updateThreadStatus(token, c.threadId, nextClass);
                                                                    setConversations((prev) =>
                                                                        prev.map((conv) =>
                                                                            conv.threadId === c.threadId ? { ...conv, class: nextClass } : conv
                                                                        )
                                                                    );
                                                                } catch (err) {
                                                                    console.error("updateThreadStatus failed:", err.response?.data || err.message || err);
                                                                }
                                                            }}
                                                            className="cursor-pointer ml-2"
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
                                                    <p
                                                        className="text-sm mt-1 line-clamp-2 leading-relaxed"
                                                        style={{
                                                            color: isRead ? '#9ca3af' : '#4b5563'
                                                        }}
                                                    >
                                                        {c.lastMessage}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end ml-3 flex-shrink-0">
                                                <div
                                                    className="text-xs mb-1"
                                                    style={{
                                                        color: isRead ? '#d1d5db' : '#9ca3af'
                                                    }}
                                                >
                                                    {formatTime(c.lastSentAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
