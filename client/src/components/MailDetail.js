// File: `client/src/components/MailDetail.js`
import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getThreadMessages, sendMessageInThread, sendMessageInThreadWithFiles } from "../api";
import { useSocketContext } from "../contexts/SocketContext";
import { decodeJwtPayload } from "../utils/DecodeJwtPayload";
import { base64ToBlob } from "../utils/Base64ToBlob";
import MailHeader from "./mail/MailHeader";
import MessageThread from "./mail/MessageThread";
import ComposeArea from "./mail/ComposeArea";

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

    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    const [fileUrls, setFileUrls] = useState({});

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const tokenPayload = token ? decodeJwtPayload(token) : null;
    const { subscribeNewMail } = useSocketContext();

    const threadId = mailMeta.threadId || paramId;

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

    // Create object URLs from base64 files
    useEffect(() => {
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

        setFileUrls((prev) => {
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
                files.forEach((f) => form.append("files", f));
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
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0">
                <MailHeader
                    mailMeta={mailMeta}
                    onBack={() => navigate(-1)}
                />
            </div>

            {/* Message list – CHỈ NƠI NÀY ĐƯỢC SCROLL */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto bg-white border-x border-gray-200 h-full">
                    <MessageThread
                        messages={messages}
                        fileUrls={fileUrls}
                        messagesEndRef={messagesEndRef}
                        partnerEmail={mailMeta.partnerEmail}
                        token={token}
                    />
                </div>
            </div>

            {/* Compose */}
            <div className="flex-shrink-0">
                <ComposeArea
                    input={input}
                    setInput={setInput}
                    files={files}
                    setFiles={setFiles}
                    fileInputRef={fileInputRef}
                    handleSelectFiles={handleSelectFiles}
                    handleSend={handleSend}
                    sending={sending}
                    inputRef={inputRef}
                />
            </div>
        </div>
    );

}