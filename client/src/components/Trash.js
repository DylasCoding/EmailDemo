// javascript
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { getAllTrashThreads, deleteThreadPermanently, restoreThreadFromTrash } from "../api";

export default function Trash({ token }) {
    const [trashThreads, setTrashThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchTrash = async () => {
        try {
            setLoading(true);
            const res = await getAllTrashThreads(token);

            if (res.data && res.data.trashThreads) {
                setTrashThreads(res.data.trashThreads);
            } else {
                setTrashThreads([]);
            }
        } catch (error) {
            console.error("Error loading trash bin:", error);
            setTrashThreads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchTrash();
    }, [token]);

    const handleRestore = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Do you want to restore this thread?")) {
            try {
                await restoreThreadFromTrash(token, id);
                setTrashThreads(prev => prev.filter(t => t.threadId !== id));
            } catch (err) {
                console.error("Restore failed", err);
            }
        }
    };

    const handleDeleteForever = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("This thread will be permanently deleted. Are you sure?")) {
            try {
                await deleteThreadPermanently(token, id);
                setTrashThreads(prev => prev.filter(t => t.threadId !== id));
            } catch (err) {
                console.error("Delete failed", err);
            }
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openConversation = (threadId, partnerEmail, title) => {
        if (!threadId) {
            console.warn('openConversation: missing threadId — partnerEmail=', partnerEmail);
            return;
        }

        // Ensure only primitives (serializable) are put into history state.
        const safeThreadId = String(threadId);
        const safePartnerEmail = partnerEmail == null ? null : String(partnerEmail);
        const safeTitle = title == null ? "" : String(title);

        navigate(`/mail/thread/${encodeURIComponent(safeThreadId)}`, {
            state: { threadId: safeThreadId, partnerEmail: safePartnerEmail, title: safeTitle }
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-gray-100 p-6 mb-6 rounded-xl shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-600 rounded-2xl shadow-lg">
                    <DeleteIcon className="text-white" fontSize="large" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
                    <p className="text-sm text-gray-500">{trashThreads.length} conversations</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {!Array.isArray(trashThreads) || trashThreads.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-dashed rounded-2xl">
                        <DeleteSweepIcon className="text-gray-200 text-6xl mb-2" />
                        <p className="text-gray-400">The trash is empty</p>
                    </div>
                ) : (
                    trashThreads.map((thread) => (
                        <div
                            key={thread.threadId}
                            onClick={() => openConversation(thread.threadId, thread.partnerEmail, thread.title)}
                            className="group flex items-center p-4 bg-white border border-gray-100 hover:border-red-200 hover:shadow-md transition-all rounded-xl cursor-pointer"
                        >
                            {/* Avatar */}
                            <div className="mr-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                    {thread.partnerEmail?.charAt(0).toUpperCase() || "?"}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                        {thread.title}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                        {formatTime(thread.lastSentAt)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-blue-600 font-medium">
                                        {thread.partnerEmail}
                                    </span>
                                    <p className="text-xs text-gray-500 truncate flex-1">
                                        {thread.lastMessage}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center ml-4 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleRestore(e, thread.threadId)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                    title="Restore"
                                >
                                    <RestoreFromTrashIcon fontSize="small" />
                                </button>
                                <button
                                    onClick={(e) => handleDeleteForever(e, thread.threadId)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                    title="Delete permanently"
                                >
                                    <DeleteForeverIcon fontSize="small" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
