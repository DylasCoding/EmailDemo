// File: `client/src/components/mail/ComposeArea.js`
import React from "react";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";

export default function ComposeArea({
                                        input,
                                        setInput,
                                        files,
                                        setFiles,
                                        fileInputRef,
                                        handleSelectFiles,
                                        handleSend,
                                        sending,
                                        inputRef
                                    }) {
    return (
        <div className="bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-5xl mx-auto">
                {/* File Preview Area */}
                {files.length > 0 && (
                    <div className="px-6 pt-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center space-x-2 mb-3">
                            <AttachFileIcon fontSize="small" className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">
                                {files.length} tệp đính kèm
                            </span>
                        </div>
                        <div className="space-y-2">
                            {files.map((f, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {f.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {(f.size / 1024).toFixed(1)} KB
                                        </div>
                                    </div>
                                    <button
                                        className="ml-2 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Compose Form */}
                <form onSubmit={handleSend} className="p-6">
                    <div className="flex items-end space-x-3">
                        {/* Attach Button */}
                        <button
                            type="button"
                            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => fileInputRef.current.click()}
                            title="Đính kèm tệp"
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

                        {/* Text Input */}
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(e)}
                            placeholder="Soạn tin nhắn..."
                            rows={3}
                            className="flex-1 resize-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-3
                                       focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                                       transition-all text-gray-900"
                        />

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={sending || (!input.trim() && files.length === 0)}
                            className={`
                                px-6 py-3 rounded-lg font-medium transition-all
                                ${sending || (!input.trim() && files.length === 0)
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg"}
                            `}
                        >
                            <div className="flex items-center space-x-2">
                                <SendIcon fontSize="small" />
                                <span>Gửi</span>
                            </div>
                        </button>
                    </div>

                    {/*<div className="mt-2 text-xs text-gray-500">*/}
                    {/*    Nhấn Enter để gửi, Shift + Enter để xuống dòng*/}
                    {/*</div>*/}
                </form>
            </div>
        </div>
    );
}