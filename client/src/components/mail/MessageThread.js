// File: `client/src/components/mail/MessageThread.js`
import React, { useState } from "react";
import { fmtTime } from "../../utils/FmtTime";
import EmailIcon from "@mui/icons-material/Email";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CreateEventModal from "../Calendar/CalendarEventForm";

export default function MessageThread({ messages, fileUrls, messagesEndRef, partnerEmail, token }) {
    const [previewFile, setPreviewFile] = useState(null);

    // State quản lý Modal Lịch
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    if (!messages || messages.length === 0) {
        return (
            <div className="text-center text-gray-500 py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EmailIcon className="text-gray-400 text-2xl" />
                </div>
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm mt-1">Let's start a conversation!</p>
            </div>
        );
    }

    const getFileIcon = (mimeType) => {
        if (!mimeType) return <DescriptionIcon />;
        if (mimeType.startsWith("image/")) return <ImageIcon />;
        if (mimeType.includes("pdf")) return <PictureAsPdfIcon />;
        return <DescriptionIcon />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes && bytes !== 0) return "";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    // Hàm xử lý khi click vào icon lịch
    const handleCalendarClick = (appointment, messageBody) => {
        // Ánh xạ dữ liệu từ AI về định dạng của Form Modal
        const initialData = {
            title: appointment.title || "Cuộc hẹn từ tin nhắn",
            start: appointment.start || "08:00",
            end: appointment.end || "09:00",
            date: appointment.date ? new Date(appointment.date) : new Date(),
            note: messageBody // Gắn nội dung tin nhắn vào Note để tiện theo dõi
        };

        setSelectedAppointment(initialData);
        setIsEventModalOpen(true);
    };

    return (
        <>
            <div className="divide-y divide-gray-100">
                {messages.map((m, idx) => {
                    const messageFiles = [];
                    if (Array.isArray(m.files) && m.files.length > 0) {
                        m.files.forEach((f) => {
                            // try direct lookup then fallback to search all entries
                            let fileEntry = (fileUrls && (fileUrls[m.id] || [])).find(x => String(x.id) === String(f.id));
                            if (!fileEntry && fileUrls) {
                                for (const key in fileUrls) {
                                    const found = (fileUrls[key] || []).find(x => String(x.id) === String(f.id));
                                    if (found) {
                                        fileEntry = found;
                                        break;
                                    }
                                }
                            }

                            messageFiles.push({
                                ...f,
                                url: fileEntry?.url || null,
                                mimeType: f.mimeType || fileEntry?.mimeType || "",
                                fileName: f.fileName || fileEntry?.fileName || "file",
                                fileSize: f.fileSize || fileEntry?.fileSize,
                            });
                        });
                    }

                    const hasBody = typeof m.body === "string" && m.body.trim().length > 0;

                    return (
                        /* Thêm class 'group' để nhận diện hover cho cả khối tin nhắn */
                        <div key={m.id || m.sentAt || idx} className="p-6 hover:bg-gray-50 transition-colors group">
                            {/* TRƯỜNG HỢP: TIN NHẮN CỦA BẠN */}
                            {m.isMine ? (
                                <div className="flex justify-start">
                                    <div className="max-w-2xl w-full">
                                        <div className="flex items-start space-x-3 mb-2">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-700 text-white font-semibold flex-shrink-0">
                                                Y
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">You</div>
                                                <div className="text-sm text-gray-500">{fmtTime(m.sentAt)}</div>
                                            </div>
                                        </div>

                                        {hasBody && (
                                            /* Đã xóa bg-gray-900 và border-black */
                                            <div className="text-gray-800 py-1 text-left block max-w-full break-words relative">
                                                <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>

                                                {/* Hiển thị Icon Lịch nếu có appointment và đang hover (group-hover) */}
                                                {m.appointment && (
                                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer inline-block">
                                                        <CalendarTodayIcon
                                                            className="text-gray-600 hover:text-black"
                                                            fontSize="small"
                                                            onClick={() => handleCalendarClick(m.appointment)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {messageFiles.length > 0 && (
                                            <div className={hasBody ? "mt-3" : ""}>
                                                <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                                                    <AttachFileIcon fontSize="small" />
                                                    <span>{messageFiles.length} tệp đính kèm</span>
                                                </div>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {messageFiles.map((file, fidx) => {
                                                        const isImage = file.mimeType && file.mimeType.startsWith("image/");
                                                        const isPdf = file.mimeType && file.mimeType.includes("pdf");
                                                        const isExcel = file.mimeType && (
                                                            file.mimeType.includes("spreadsheet") ||
                                                            file.mimeType.includes("excel") ||
                                                            file.fileName?.match(/\.(xlsx?|csv)$/i)
                                                        );

                                                        return (
                                                            <div
                                                                key={`${m.id}-${file.id || fidx}`}
                                                                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer aspect-square"
                                                                onClick={() => file.url && setPreviewFile(file)}
                                                            >
                                                                {isImage && file.url ? (
                                                                    <div className="relative w-full h-full">
                                                                        <img
                                                                            src={file.url}
                                                                            alt={file.fileName}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                                            <div className="text-xs text-white truncate font-medium">
                                                                                {file.fileName}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : isPdf && file.url ? (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2 bg-red-50">
                                                                        <PictureAsPdfIcon className="text-red-600 text-3xl mb-1" />
                                                                        <div className="text-xs font-medium text-gray-900 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            PDF
                                                                        </div>
                                                                    </div>
                                                                ) : isExcel && file.url ? (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2 bg-green-50">
                                                                        <DescriptionIcon className="text-green-600 text-3xl mb-1" />
                                                                        <div className="text-xs font-medium text-gray-900 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            Excel
                                                                        </div>
                                                                    </div>
                                                                ) : file.url ? (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2 bg-gray-50">
                                                                        <div className="text-gray-600 text-3xl mb-1">
                                                                            {getFileIcon(file.mimeType)}
                                                                        </div>
                                                                        <div className="text-xs font-medium text-gray-900 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            {formatFileSize(file.fileSize)}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2">
                                                                        <div className="text-gray-400 text-3xl mb-1">
                                                                            {getFileIcon(file.mimeType)}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* TRƯỜNG HỢP: TIN NHẮN ĐỐI TÁC */
                                <div className="flex justify-start">
                                    <div className="max-w-2xl w-full">
                                        <div className="flex items-start space-x-3 mb-2">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-200 text-white font-semibold flex-shrink-0">
                                                T
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {partnerEmail || m.from || m.fromEmail || 'Sender'}
                                                </div>
                                                <div className="text-sm text-gray-500">{fmtTime(m.sentAt)}</div>
                                            </div>
                                        </div>

                                        {hasBody && (
                                            /* Đã xóa bg-white và border-black */
                                            <div className="text-gray-800 py-1 block max-w-full break-words relative">
                                                <div className="whitespace-pre-wrap leading-relaxed">
                                                    {m.body}
                                                </div>

                                                {/* Hiển thị Icon Lịch */}
                                                {m.appointment && (
                                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer inline-block">
                                                        <CalendarTodayIcon
                                                            className="text-gray-600 hover:text-black"
                                                            fontSize="small"
                                                            onClick={() => handleCalendarClick(m.appointment)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {messageFiles.length > 0 && (
                                            <div className={hasBody ? "mt-3" : ""}>
                                                <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                                                    <AttachFileIcon fontSize="small" />
                                                    <span>{messageFiles.length} tệp đính kèm</span>
                                                </div>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {messageFiles.map((file, fidx) => {
                                                        const isImage = file.mimeType && file.mimeType.startsWith("image/");
                                                        const isPdf = file.mimeType && file.mimeType.includes("pdf");
                                                        const isExcel = file.mimeType && (
                                                            file.mimeType.includes("spreadsheet") ||
                                                            file.mimeType.includes("excel") ||
                                                            file.fileName?.match(/\.(xlsx?|csv)$/i)
                                                        );

                                                        return (
                                                            <div
                                                                key={`${m.id}-${file.id || fidx}`}
                                                                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer aspect-square"
                                                                onClick={() => file.url && setPreviewFile(file)}
                                                            >
                                                                {isImage && file.url ? (
                                                                    <div className="relative w-full h-full">
                                                                        <img
                                                                            src={file.url}
                                                                            alt={file.fileName}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                                                            <div className="text-xs text-white truncate font-medium">
                                                                                {file.fileName}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : isPdf && file.url ? (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2 bg-red-50">
                                                                        <PictureAsPdfIcon className="text-red-600 text-3xl mb-1" />
                                                                        <div className="text-xs font-medium text-gray-900 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            PDF
                                                                        </div>
                                                                    </div>
                                                                ) : isExcel && file.url ? (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2 bg-green-50">
                                                                        <DescriptionIcon className="text-green-600 text-3xl mb-1" />
                                                                        <div className="text-xs font-medium text-gray-900 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            Excel
                                                                        </div>
                                                                    </div>
                                                                ) : file.url ? (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2 bg-gray-50">
                                                                        <div className="text-gray-600 text-3xl mb-1">
                                                                            {getFileIcon(file.mimeType)}
                                                                        </div>
                                                                        <div className="text-xs font-medium text-gray-900 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 mt-1">
                                                                            {formatFileSize(file.fileSize)}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center h-full p-2">
                                                                        <div className="text-gray-400 text-3xl mb-1">
                                                                            {getFileIcon(file.mimeType)}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 truncate w-full text-center px-1">
                                                                            {file.fileName}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {isEventModalOpen && (
                <CreateEventModal
                    isOpen={isEventModalOpen}
                    onClose={() => setIsEventModalOpen(false)}
                    token={token}
                    // Truyền dữ liệu ban đầu vào Modal
                    initialData={selectedAppointment}
                    onEventCreated={() => {
                        alert("Create event successfully!");
                    }}
                />
            )}

            {previewFile && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewFile(null)}
                >
                    <div
                        className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                            <div>
                                <div className="font-semibold text-gray-900">{previewFile.fileName}</div>
                                <div className="text-sm text-gray-500">{formatFileSize(previewFile.fileSize)}</div>
                            </div>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="p-6">
                            {previewFile?.mimeType?.startsWith("image/") && previewFile.url ? (
                                <img
                                    src={previewFile.url}
                                    alt={previewFile.fileName}
                                    className="max-w-full h-auto"
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4 text-4xl">
                                        {getFileIcon(previewFile?.mimeType)}
                                    </div>
                                    <p className="text-gray-600 mb-4">Không thể xem trước loại tệp này</p>
                                    {previewFile.url && (
                                        <a
                                            href={previewFile.url}
                                            download={previewFile.fileName}
                                            className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                                        >
                                            Tải xuống
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
