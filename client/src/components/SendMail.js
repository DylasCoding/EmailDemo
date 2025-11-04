import React, { useState, useRef } from "react";
import { sendMail } from "../api";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

export default function SendMail({ token }) {
    const [form, setForm] = useState({ to: "", subject: "", body: "" });
    const [sending, setSending] = useState(false);
    const navigate = useNavigate();
    const textareaRef = useRef(null);

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValidEmail(form.to)) return alert("Vui lòng nhập email hợp lệ (ví dụ: abc@def.com)");
        if (!form.body.trim()) return alert("Nội dung không được để trống");

        setSending(true);
        try {
            await sendMail(token, form);
            alert("Đã gửi email thành công!");
            setForm({ to: "", subject: "", body: "" });
            navigate("/inbox");
        } catch (err) {
            alert("Gửi thất bại: " + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 -right-40 w-80 h-80 bg-gradient-to-r from-indigo-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Compose Card */}
            <div className="relative w-full max-w-3xl">
                <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            Soạn thư mới
                        </h1>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <CloseIcon className="text-gray-600" />
                        </button>
                    </div>

                    {/* To Field */}
                    <div className="mb-4">
                        <input
                            type="email"
                            placeholder="Đến (abc@def.com)"
                            value={form.to}
                            onChange={(e) => setForm({ ...form, to: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                        />
                    </div>

                    {/* Subject Field */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Tiêu đề"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                        />
                    </div>

                    {/* Body Field */}
                    <div className="mb-6">
                        <textarea
                            ref={textareaRef}
                            placeholder="Nội dung email..."
                            value={form.body}
                            onChange={(e) => setForm({ ...form, body: e.target.value })}
                            rows={8}
                            required
                            className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 resize-none"
                            style={{ minHeight: "160px" }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button type="button" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <AttachFileIcon />
                            <span className="text-sm">Đính kèm</span>
                        </button>

                        <button
                            type="submit"
                            disabled={sending || !form.to || !form.body}
                            className={`
                                px-6 py-3 rounded-2xl font-semibold text-white shadow-lg flex items-center space-x-2 transition-all duration-300
                                ${sending || !form.to || !form.body
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:shadow-xl hover:scale-105 active:scale-100"
                            }
                            `}
                        >
                            {sending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang gửi...</span>
                                </>
                            ) : (
                                <>
                                    <SendIcon />
                                    <span>Gửi email</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}