import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { updateCalendarEvent, deleteCalendarEvent } from '../../api';

// Định nghĩa bảng màu đồng bộ với CreateEventModal
const colorOptions = [
    { value: 0, rgb: '34,197,94', name: 'Green' },
    { value: 1, rgb: '168,85,247', name: 'Purple' },
    { value: 2, rgb: '147,51,234', name: 'Dark Purple' },
    { value: 3, rgb: '34,211,238', name: 'Cyan' },
    { value: 4, rgb: '252,165,165', name: 'Light Red' },
    { value: 5, rgb: '248,113,113', name: 'Red' },
    { value: 6, rgb: '147,197,253', name: 'Blue' },
];

export default function EditEventModal({ isOpen, onClose, token, event, onEventUpdated }) {
    const [formData, setFormData] = useState({
        title: '',
        color: 0,
        note: '',
        start: '',
        end: '',
        date: new Date()
    });
    const [loading, setLoading] = useState(false);

    // Cập nhật formData khi event prop thay đổi
    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || '',
                color: event.color ?? 0, // Sử dụng nullish coalescing để tránh lỗi nếu color = 0
                note: event.note || '',
                start: event.start || '',
                end: event.end || '',
                date: event.date ? new Date(event.date) : new Date()
            });
        }
    }, [event]);

    if (!isOpen || !event) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateCalendarEvent(token, event.id, formData);
            onEventUpdated();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Cập nhật thất bại!");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        setLoading(true);
        try {
            await deleteCalendarEvent(token, event.id);
            onEventUpdated();
            onClose();
        } catch (err) {
            alert("Delete failed!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={loading}
                >
                    <X size={20} className="text-gray-600" />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-gray-800">Event detail</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            disabled={loading}
                        />
                    </div>

                    {/* Color Picker Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <div className="grid grid-cols-7 gap-2">
                            {colorOptions.map((col) => (
                                <button
                                    key={col.value}
                                    type="button"
                                    onClick={() => setFormData((p) => ({ ...p, color: col.value }))}
                                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                                        formData.color === col.value ? 'border-gray-800 scale-110' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: `rgb(${col.rgb})` }}
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={formData.note}
                            onChange={(e) => setFormData({...formData, note: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Add notes..."
                            disabled={loading}
                        />
                    </div>

                    {/* Time: Start & End */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                            <input
                                type="text"
                                value={formData.start}
                                onChange={(e) => setFormData({...formData, start: e.target.value})}
                                placeholder="HH:MM"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                            <input
                                type="text"
                                value={formData.end}
                                onChange={(e) => setFormData({...formData, end: e.target.value})}
                                placeholder="HH:MM"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            className="flex items-center text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg font-medium transition-colors"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 size={18} className="mr-1.5" /> Delete
                        </button>

                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                {loading ? 'Saving...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}