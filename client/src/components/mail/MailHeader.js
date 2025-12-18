// File: `client/src/components/mail/MailHeader.js`
import React from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function MailHeader({ mailMeta, onBack }) {
    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-6 py-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowBackIcon className="text-gray-700" />
                    </button>

                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-gray-900">
                            {mailMeta.subject || mailMeta.title}
                        </h1>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">Từ:</span>
                            <span className="text-sm font-medium text-gray-800">
                                {mailMeta.partnerEmail}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}