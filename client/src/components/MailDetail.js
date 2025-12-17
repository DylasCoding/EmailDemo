// javascript
// File: `client/src/components/MailDetail.js`
import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getThreadMessages, sendMessageInThread, sendMessageInThreadWithFiles } from "../api";
import { useSocketContext } from "../contexts/SocketContext";
import {decodeJwtPayload} from "../utils/DecodeJwtPayload";
import {fmtTime} from "../utils/FmtTime";
import {base64ToBlob} from "../utils/Base64ToBlob";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function MailDetail({ token, mailId: propMailId }) {

    const { id: paramId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const partnerEmailFromState = location.state?.partnerEmail;
    const partnerId = paramId || propMailId;

    const initialMeta = location.state
        ? { ...location.state, subject: location.state.subject || location.state.title }
        : {};
    const [mailMeta, setMailMeta] = useState(initialMeta);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const [files, setFiles] = useState([]);           // ⭐ FILE STATE
    const fileInputRef = useRef(null);                // ⭐ FILE INPUT REF

    const [fileUrls, setFileUrls] = useState({});     // map messageId -> array of { id, url, fileName, mimeType }

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const tokenPayload = token ? decodeJwtPayload(token) : null;
    const { subscribeNewMail } = useSocketContext();

    const threadId = mailMeta.threadId || paramId;
    console.log("🧭 Thread ID:", threadId);


    const isMessageMine = (m) => {
        if (!tokenPayload) return m.sentBy === "me";

        const idCandidates = [
            tokenPayload.sub,
            tokenPayload.userId,
            tokenPayload.id,
            tokenPayload._id,
            tokenPayload.uid,
        ]
            .filter(Boolean)
            .map(String);

        const myEmail = tokenPayload.email || tokenPayload.mail;

        if (idCandidates.length && m.senderId && idCandidates.includes(String(m.senderId))) {
            return true;
        }

        if (myEmail && [m.from, m.fromEmail, m.senderEmail].includes(myEmail)) {
            return true;
        }

        return m.sentBy === "me";
    };


    // Load messages
    useEffect(() => {
        if (!token || !partnerId || !threadId) return;

        let mounted = true;
        const load = async () => {
            try {
                const resp = await getThreadMessages(token, partnerId);
                if (!mounted) return;

                if (!resp || !resp.data) {
                    console.warn("getThreadMessages returned empty/null:", resp);
                    setMessages([]);
                    setMailMeta(prev => ({
                        ...prev,
                        subject: prev.subject || prev.title || "(Không có tiêu đề)",
                        partnerId,
                        threadId: prev.threadId || threadId,
                        partnerEmail: partnerEmailFromState || prev.partnerEmail || "Không xác định",
                    }));
                    return;
                }

                const raw = Array.isArray(resp.data) ? resp.data : [];
                const mapped = raw.map(m => ({ ...m, isMine: isMessageMine(m) }));

                setMessages(mapped);

                const first = raw[0];
                setMailMeta(prev => ({
                    ...prev,
                    subject: first?.subject || first?.title || prev.subject || prev.title || "(Không có tiêu đề)",
                    partnerId,
                    threadId: prev.threadId || first?.threadId || threadId,
                    partnerEmail: partnerEmailFromState ||
                        prev.partnerEmail ||
                        first?.from ||
                        first?.partnerEmail ||
                        "Không xác định"
                }));

            } catch (err) {
                console.error("Load conversation failed:", err);
            }
        };

        load();
        return () => { mounted = false; };
    }, [token, partnerId, threadId, partnerEmailFromState]);


    // Create object URLs from base64 files and clean up previous URLs
    useEffect(() => {
        // collect created urls so we can revoke them on cleanup
        const createdUrls = [];

        const map = {};
        messages.forEach((m) => {
            if (!m || !Array.isArray(m.files) || m.files.length === 0) return;
            map[m.id] = m.files.map((f) => {
                if (!f || !f.dataBase64) {
                    return { id: f?.id, url: null, fileName: f?.fileName, mimeType: f?.mimeType };
                }
                try {
                    const blob = base64ToBlob(f.dataBase64, f.mimeType || "application/octet-stream");
                    const url = URL.createObjectURL(blob);
                    createdUrls.push(url);
                    return { id: f.id, url, fileName: f.fileName, mimeType: f.mimeType, fileSize: f.fileSize };
                } catch (err) {
                    return { id: f.id, url: null, fileName: f.fileName, mimeType: f.mimeType };
                }
            });
        });

        // replace previous map and revoke old urls
        setFileUrls((prev) => {
            // revoke previous urls
            Object.values(prev).flat().forEach(x => { if (x && x.url) URL.revokeObjectURL(x.url); });
            return map;
        });

        return () => {
            createdUrls.forEach(u => URL.revokeObjectURL(u));
        };
    }, [messages]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    useEffect(() => {
        if (!token || !subscribeNewMail) return;

        const unsub = subscribeNewMail((msg) => {
            const belongs =
                (msg.partnerId && String(msg.partnerId) === String(partnerId)) ||
                (mailMeta?.partnerEmail &&
                    [msg.from, msg.to, msg.fromEmail, msg.toEmail].includes(mailMeta.partnerEmail));

            if (!belongs) return;

            setMessages(prev => {
                if (msg.id && prev.some(m => m.id === msg.id)) return prev;
                return [...prev, { ...msg, isMine: isMessageMine(msg) }];
            });
        });

        return unsub;
    }, [token, subscribeNewMail, partnerId, mailMeta.partnerEmail]);



    // ⭐ SELECT FILES HANDLER
    const handleSelectFiles = (e) => {
        let selected = Array.from(e.target.files);

        let merged = [...files, ...selected];
        if (merged.length > 5) {
            merged = merged.slice(0, 5);
            alert("Chỉ được chọn tối đa 5 file.");
        }

        setFiles(merged);
        e.target.value = null;
    };


    // ⭐ HANDLE SEND (có hỗ trợ file)
    const handleSend = async (e) => {
        e.preventDefault();
        if (sending) return;

        if (!mailMeta?.partnerEmail) return alert("Không tìm thấy email người nhận");
        if (!threadId) return alert("Không tìm thấy threadId");

        const hasText = input.trim().length > 0;
        const hasFiles = files.length > 0;

        if (!hasText && !hasFiles) return;

        setSending(true);

        try {
            if (hasFiles) {
                const form = new FormData();
                form.append("body", input.trim());

                files.forEach((f) => {
                    form.append("files", f);
                });

                await sendMessageInThreadWithFiles(token, threadId, form);

                setFiles([]);
            } else {
                await sendMessageInThread(token, threadId, { body: input.trim() });
            }

            setInput("");

        } catch (err) {
            alert("Gửi thất bại: " + (err.response?.data?.message || err.message));
        } finally {
            setSending(false);
        }
    };



    if (!mailMeta) return null;

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">

            {/* Header */}
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
                                {mailMeta.subject || mailMeta.title}
                            </h2>
                            <p className="text-sm text-gray-500 flex items-center space-x-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span>{mailMeta.partnerEmail}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
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
                        <div key={m.id || m.sentAt || idx} className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`
                                    max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm
                                    ${m.isMine
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                                    : "bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-800"}
                                `}
                            >
                                <p className="text-sm whitespace-pre-wrap">{m.body}</p>

                                {/* Files preview under each message */}
                                {Array.isArray(m.files) && m.files.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {m.files.map((f) => {
                                            const fileEntry = (fileUrls[m.id] || []).find(x => String(x.id) === String(f.id));
                                            const url = fileEntry?.url || null;
                                            const mime = f.mimeType || fileEntry?.mimeType || "";
                                            const name = f.fileName || fileEntry?.fileName || "file";

                                            if (mime && mime.startsWith("image/") && url) {
                                                return (
                                                    <div key={f.id} className="rounded overflow-hidden border p-1 bg-white">
                                                        <img src={url} alt={name} className="max-w-full max-h-60 object-contain" />
                                                        <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                                                            <span>{name}</span>
                                                            <a href={url} download={name} className="text-blue-600">Download</a>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // non-image or missing url -> show download button (use data url if no object URL)
                                            if (url) {
                                                return (
                                                    <div key={f.id} className="flex items-center justify-between bg-white border p-2 rounded-xl">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{name}</div>
                                                            <div className="text-xs text-gray-500">{mime}</div>
                                                        </div>
                                                        <a href={url} download={name} className="text-blue-600 text-sm">Download</a>
                                                    </div>
                                                );
                                            }

                                            // fallback: show filename only
                                            return (
                                                <div key={f.id} className="text-xs text-gray-500">
                                                    {name} {mime ? `(${mime})` : ""}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <p className={`text-xs mt-1 ${m.isMine ? "text-blue-100" : "text-gray-400"} text-right`}>
                                    {fmtTime(m.sentAt)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>


            {/* ⭐ FILE PREVIEW */}
            {files.length > 0 && (
                <div className="px-4 pb-2 space-y-2 bg-white/60 backdrop-blur-md border-t border-white/30">
                    {files.map((f, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between bg-white border p-2 rounded-xl shadow-sm"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{f.name}</span>
                                <span className="text-xs text-gray-500">
                                    {(f.size / 1024).toFixed(1)} KB
                                </span>
                            </div>

                            <button
                                className="text-red-500 px-2 py-1"
                                onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}


            {/* Input */}
            <form onSubmit={handleSend} className="bg-white/80 backdrop-blur-xl border-t border-white/20 p-4">
                <div className="flex items-end space-x-3 max-w-4xl mx-auto">

                    {/* ⭐ ATTACH FILE BUTTON */}
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-blue-600"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <AttachFileIcon />
                    </button>

                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleSelectFiles}
                    />


                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(e)}
                        placeholder="Soạn tin nhắn..."
                        rows={1}
                        className="flex-1 resize-none bg-gray-50/70 border border-gray-200 rounded-2xl px-4 py-3
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />

                    <button
                        type="submit"
                        disabled={sending || (!input.trim() && files.length === 0)}
                        className={`
                            p-3 rounded-full shadow-lg transition-all
                            ${sending || (!input.trim() && files.length === 0)
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-110 text-white"}
                        `}
                    >
                        <SendIcon fontSize="small" />
                    </button>
                </div>
            </form>

        </div>
    );
}
