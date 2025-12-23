import React, { useEffect, useState, useRef } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import { useNavigate, useLocation } from "react-router-dom";
import {addThreadToTrash, getConversations, updateThreadStatus} from "../api";
import ChatIcon from "@mui/icons-material/Chat";
import EmailIcon from "@mui/icons-material/Email";
import StarIcon from "@mui/icons-material/Star";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
// Import thêm các icon và component cần thiết
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReportGmailerrorredIcon from "@mui/icons-material/ReportGmailerrorred";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";

export default function Inbox({ token, currentUserId }) {
    const [conversations, setConversations] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { subscribeNewMail, subscribeNewThread } = useSocketContext();

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedThread, setSelectedThread] = useState(null);
    const open = Boolean(anchorEl);

    const initialFilter = (() => {
        const h = window.location.hash || "";
        if (h === "#starred") return "star";
        if (h === "#spam") return "spam";
        return "inbox";
    })();
    const [filter, setFilter] = useState(initialFilter);

    const headerRef = useRef(null);
    const [listHeight, setListHeight] = useState("60vh");
    const [scale, setScale] = useState(1);

    // Xử lý mở menu 3 chấm
    const handleMenuOpen = (event, thread) => {
        event.stopPropagation(); // Ngăn chặn sự kiện click vào row để mở mail
        setAnchorEl(event.currentTarget);
        setSelectedThread(thread);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedThread(null);
    };

    // Hàm cập nhật trạng thái chung (Spam/Trash/Star)
    const handleUpdateStatus = async (newStatus) => {
        if (!token || !selectedThread?.threadId) return;

        try {
            if (newStatus === "trash") {
                // Sử dụng API chuyên biệt cho thùng rác theo yêu cầu của bạn
                await addThreadToTrash(token, selectedThread.threadId);
            } else {
                // Các trạng thái khác (star, spam, normal) dùng API chung
                await updateThreadStatus(token, selectedThread.threadId, newStatus);
            }

            // Cập nhật UI: Loại bỏ thread khỏi danh sách hiện tại hoặc cập nhật class
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.threadId === selectedThread.threadId
                        ? { ...conv, class: newStatus }
                        : conv
                )
            );

            handleMenuClose();
        } catch (err) {
            console.error(`Lỗi khi chuyển trạng thái sang ${newStatus}:`, err);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        }
    };
    // Hàm xử lý riêng cho Star (Toggle: nếu đang star thì thành normal và ngược lại)
    const handleToggleStar = async (e, thread) => {
        e.stopPropagation(); // Quan trọng: Tránh mở chi tiết mail
        const nextClass = thread.class === "star" ? "normal" : "star";

        try {
            await updateThreadStatus(token, thread.threadId, nextClass);
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.threadId === thread.threadId ? { ...conv, class: nextClass } : conv
                )
            );
        } catch (err) {
            console.error("Lỗi cập nhật Star:", err);
        }
    };

    useEffect(() => {
        if (!token) return;
        getConversations(token)
            .then((res) => setConversations(res.data || []))
            .catch((err) => console.error("getConversations failed:", err));
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
                {/* Header */}
                <div ref={headerRef} className="bg-white border border-white-100 p-6 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-lg">
                                <ChatIcon className="text-white" fontSize="large" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                                <p className="text-sm text-gray-500">{filtered.length} conversations</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Area */}
                <div className="overflow-y-auto" style={{ maxHeight: listHeight, padding: "6px" }}>
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 font-medium">Hộp thư trống</div>
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((c) => {
                                const isRead = isConversationRead(c);
                                const isStarred = c.class === "star";
                                const isSpam = c.class === "spam"; // Kiểm tra xem có phải spam không

                                return (
                                    <div
                                        key={c.threadId}
                                        onClick={() => openConversation(c.threadId, c.partnerEmail, c.title)}
                                        className="group relative flex items-center p-3 bg-white border border-gray-100 hover:border-amber-300 hover:shadow-md transition-all duration-200 rounded-xl"
                                        style={{ opacity: isRead ? 0.8 : 1 }}
                                    >
                                        {/* 1. Icon đầu dòng: Warning nếu là Spam, Star nếu là bình thường */}
                                        <div
                                            className="mr-3 flex items-center justify-center w-6 h-6"
                                            onClick={(e) => {
                                                // Nếu là spam, có thể không cho toggle star hoặc toggle tùy ý bạn
                                                if (!isSpam) handleToggleStar(e, c);
                                                else e.stopPropagation();
                                            }}
                                        >
                                            {isSpam ? (
                                                // Hiển thị Warning màu đỏ khi là Spam
                                                <WarningAmberIcon className="text-red-500" fontSize="small" />
                                            ) : (
                                                // Hiển thị Star như cũ khi không phải Spam
                                                <div className="cursor-pointer transition-transform hover:scale-125">
                                                    {isStarred ? (
                                                        <StarIcon className="text-yellow-400" fontSize="small" />
                                                    ) : (
                                                        <StarIcon className="text-gray-200 group-hover:text-gray-400" fontSize="small" />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Nội dung Avatar & Content */}
                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${isRead ? 'bg-gray-400' : 'bg-gray-800'}`}>
                                                {c.partnerEmail?.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`truncate text-sm ${isRead ? 'font-normal text-gray-500' : 'font-bold text-gray-900'}`}>
                                                        {c.title || "(No title)"}
                                                    </h3>
                                                    {/* Tag nhỏ nếu là spam để người dùng dễ nhận biết */}
                                                    {isSpam && (
                                                        <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100">
                                                            Spam
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                                            </div>
                                        </div>

                                        {/* 3. Phía bên phải: Thời gian & Nút 3 chấm */}
                                        <div className="flex items-center ml-4 space-x-2">
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {formatTime(c.lastSentAt)}
                                            </span>

                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, c)}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Menu Dropdown cho Spam và Trash */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                // ... các props style ...
            >
                {/* Nút Spam/Not Spam */}
                {selectedThread?.class === "spam" ? (
                    <MenuItem onClick={() => handleUpdateStatus("normal")} className="gap-3 text-blue-600">
                        <EmailIcon fontSize="small" />
                        <span className="text-sm font-medium">Not spam</span>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => handleUpdateStatus("spam")} className="gap-3 text-orange-600">
                        <ReportGmailerrorredIcon fontSize="small" />
                        <span className="text-sm font-medium">Report Spam</span>
                    </MenuItem>
                )}

                {/* Nút Thùng rác gọi handleUpdateStatus("trash") */}
                <MenuItem
                    onClick={() => handleUpdateStatus("trash")}
                    className="gap-3 text-red-600"
                >
                    <DeleteOutlineIcon fontSize="small" />
                    <span className="text-sm font-medium">Move to trash</span>
                </MenuItem>
            </Menu>
        </div>
    );
}