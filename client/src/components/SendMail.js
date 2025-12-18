// File: `client/src/components/SendMail.js`
import React, { useState, useRef } from "react";
import { sendMailWithFiles } from "../api";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

export default function SendMail({ token }) {
    const [form, setForm] = useState({ to: "", subject: "", body: "" });
    const [sending, setSending] = useState(false);
    const [files, setFiles] = useState([]); // File objects
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const MAX_FILES = 5;
    const ACCEPT = "application/pdf,image/png,image/jpeg,image/jpg,image/webp";

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleAttachClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFilesChange = (e) => {
        const picked = Array.from(e.target.files || []);
        if (!picked.length) return;
        // filter allowed types just in case
        const allowed = picked.filter((f) =>
            ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"].includes(f.type)
        );
        if (allowed.length !== picked.length) {
            alert("Only PDF and images (png, jpg, webp) are allowed. Some files were ignored.");
        }
        const combined = [...files, ...allowed];
        if (combined.length > MAX_FILES) {
            alert(`Maximum ${MAX_FILES} files allowed. Extra files were ignored.`);
        }
        setFiles(combined.slice(0, MAX_FILES));
        // reset input so same file can be selected again
        e.target.value = null;
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValidEmail(form.to)) return alert("Email không hợp lệ");
        if (!form.body.trim()) return alert("Nội dung trống");
        setSending(true);
        try {
            const fd = new FormData();
            fd.append("to", form.to);
            fd.append("subject", form.subject || "");
            fd.append("body", form.body);
            files.forEach((f) => fd.append("files", f)); // key 'files' => backend should accept array
            await sendMailWithFiles(token, fd, (progressEvent) => {
                // optional: progressEvent.loaded / progressEvent.total
            });
            alert("Đã gửi email thành công!");
            setForm({ to: "", subject: "", body: "" });
            setFiles([]);
            navigate("/inbox");
        } catch (err) {
            alert("Gửi thất bại: " + (err.response?.data?.error || err.message));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-96 bg-gradient-to-br from-white via-white to-white flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 -right-40 w-80 h-80 bg-gradient-to-r from-indigo-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative w-full max-w-3xl">
                <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-600 to-gray-700 bg-clip-text text-transparent">
                            Soạn thư mới
                        </h1>
                        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                            <CloseIcon className="text-gray-600" />
                        </button>
                    </div>

                    <div className="mb-4">
                        <input type="email" placeholder="Đến (abc@def.com)" value={form.to}
                               onChange={(e) => setForm({ ...form, to: e.target.value })} required
                               className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium" />
                    </div>

                    <div className="mb-4">
                        <input type="text" placeholder="Tiêu đề" value={form.subject}
                               onChange={(e) => setForm({ ...form, subject: e.target.value })}
                               className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium" />
                    </div>

                    <div className="mb-6">
            <textarea ref={textareaRef} placeholder="Nội dung email..." value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} required
                      className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 resize-none"
                      style={{ minHeight: "160px" }} />
                    </div>

                    {/* file input (hidden) */}
                    <input ref={fileInputRef} type="file" accept={ACCEPT} multiple style={{ display: "none" }}
                           onChange={handleFilesChange} />

                    {/* selected files list */}
                    {files.length > 0 && (
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">Attachments ({files.length}/{MAX_FILES}):</div>
                            <ul className="space-y-2">
                                {files.map((f, i) => (
                                    <li key={i} className="flex items-center justify-between bg-gray-50/60 p-2 rounded-xl border border-gray-200">
                                        <div className="text-sm text-gray-800 truncate max-w-xl">{f.name} <span className="text-xs text-gray-500">({Math.round(f.size/1024)} KB)</span></div>
                                        <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 ml-4">x</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button type="button" onClick={handleAttachClick} className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors">
                            <AttachFileIcon />
                            <span className="text-sm">Đính kèm</span>
                        </button>

                        <button type="submit" disabled={sending || !form.to || !form.body}
                                className={`
                px-6 py-3 rounded-2xl font-semibold text-white shadow-lg flex items-center space-x-2 transition-all duration-300
                ${sending || !form.to || !form.body
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-gray-500 via-gray-600 to-gray-600 hover:shadow-xl hover:scale-105 active:scale-100"}
              `}>
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
