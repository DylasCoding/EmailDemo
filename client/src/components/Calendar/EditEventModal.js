// client/src/components/Calendar/EditEventModal.js
import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { updateCalendarEvent, deleteCalendarEvent } from '../../api'; // Bạn cần định nghĩa các hàm này trong api.js

export default function EditEventModal({ isOpen, onClose, token, event, onEventUpdated }) {
    const [formData, setFormData] = useState({ ...event });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                ...event,
                date: new Date(event.date)
            });
        }
    }, [event]);

    if (!isOpen || !event) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Gọi api update (Ví dụ: PUT /api/calendar/events/:id)
            await updateCalendarEvent(token, event.id, formData);
            onEventUpdated();
            onClose();
        } catch (err) {
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
            // Gọi api delete (Ví dụ: DELETE /api/calendar/events/:id)
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
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-gray-800">Event detail</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            value={formData.note || ''}
                            onChange={(e) => setFormData({...formData, note: e.target.value})}
                            className="w-full px-4 py-2 border rounded-lg outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={formData.start}
                            onChange={(e) => setFormData({...formData, start: e.target.value})}
                            className="border p-2 rounded"
                        />
                        <input
                            type="text"
                            value={formData.end}
                            onChange={(e) => setFormData({...formData, end: e.target.value})}
                            className="border p-2 rounded"
                        />
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            className="flex items-center text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                            onClick={handleDelete}
                        >
                            <Trash2 size={18} className="mr-1" /> Delete
                        </button>
                        <div className="space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md"
                            >
                                {loading ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}