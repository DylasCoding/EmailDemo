import React, { useEffect, useState } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useNavigate } from "react-router-dom";
import { getConversations } from "../api";
import ChatIcon from "@mui/icons-material/Chat";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmailIcon from "@mui/icons-material/Email";

export default function Inbox({ token }) {
    const [conversations, setConversations] = useState([]);
    const navigate = useNavigate();
    const { subscribeNewMail } = useSocketContext();

    // Load danh sách hội thoại
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

    // Cập nhật realtime khi có mail mới
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
                };
                const next = prev.slice();
                if (idx >= 0) next.splice(idx, 1);
                return [newConv, ...next];
            });
        });

        return unsub;
    }, [token, subscribeNewMail]);

    const openConversation = (partnerId, partnerEmail) => {
        navigate(`/mail/${partnerId}`, { state: { partnerEmail } });
    };

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

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header với gradient background */}
                <div className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-3xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                                <ChatIcon className="text-white" fontSize="large" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent">
                                    Hộp thư đến
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {conversations.length} cuộc trò chuyện
                                </p>
                            </div>
                        </div>

                        {/* Badge thống kê */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                <EmailIcon fontSize="small" />
                                <span>{conversations.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty State - Sang trọng */}
                {conversations.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <EmailIcon className="text-blue-400 text-4xl" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có cuộc trò chuyện</h3>
                        <p className="text-gray-500 mb-6">Hãy gửi email đầu tiên để bắt đầu kết nối</p>
                        <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 font-medium">
                            Gửi email mới
                        </button>
                    </div>
                ) : (
                    /* List conversations - Design hiện đại */
                    <div className="space-y-1">
                        {conversations.map((c, index) => (
                            <div
                                key={c.partnerId || c.partnerEmail}
                                onClick={() => openConversation(c.partnerId, c.partnerEmail)}
                                className={`
                                    group cursor-pointer p-4 rounded-2xl bg-white/70 backdrop-blur-sm 
                                    border border-blue-100 hover:border-blue-200 transition-all duration-300
                                    hover:shadow-lg hover:scale-[1.02] hover:bg-white/90
                                    ${index === 0 ? 'border-blue-300 bg-blue-50' : ''}
                                `}
                            >
                                {/* Header conversation */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                            <span className="text-white font-semibold text-sm">
                                                {c.partnerEmail?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-800 truncate pr-2">
                                                    {c.partnerEmail}
                                                </h3>
                                                {index === 0 && (
                                                    <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                                        <span>Mới</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                                {c.lastMessage}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="flex flex-col items-end ml-3 flex-shrink-0">
                                        <div className="text-xs text-gray-400 mb-1">
                                            {formatTime(c.lastSentAt)}
                                        </div>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
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