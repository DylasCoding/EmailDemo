import React, { useState } from 'react';
import { X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createCalendarEvent } from '../../api'; // điều chỉnh đường dẫn nếu cần

const colorOptions = [
    { value: 0, rgb: '34,197,94', name: 'Green' },
    { value: 1, rgb: '168,85,247', name: 'Purple' },
    { value: 2, rgb: '147,51,234', name: 'Dark Purple' },
    { value: 3, rgb: '34,211,238', name: 'Cyan' },
    { value: 4, rgb: '252,165,165', name: 'Light Red' },
    { value: 5, rgb: '248,113,113', name: 'Red' },
    { value: 6, rgb: '147,197,253', name: 'Blue' },
];

export default function CreateEventModal({ isOpen, onClose, token, onEventCreated, initialData = null }) {

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        color: 0,
        note: initialData?.note || '',
        start: initialData?.start || '',
        end: initialData?.end || '',
        date: initialData?.date || new Date(),
    });

    React.useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                color: 0,
                note: initialData.note || '',
                start: initialData.start || '',
                end: initialData.end || '',
                date: initialData.date || new Date(),
            });
        }
    }, [initialData]);

    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleTimeInput = (field) => (e) => {
        let value = e.target.value.replace(/[^\d]/g, ''); // chỉ giữ số

        if (value.length > 4) value = value.slice(0, 4);

        if (value.length >= 2) {
            const hours = value.slice(0, 2);
            if (parseInt(hours) > 23) value = '23';
            value = value.slice(0, 2) + (value.length > 2 ? ':' + value.slice(2) : ':');
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (date) => {
        // Lưu chỉ year, month, date (giờ = 0)
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        setFormData((prev) => ({ ...prev, date: normalizedDate }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form"+token);

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(formData.start) || !timeRegex.test(formData.end)) {
            alert('Please enter the time in the correct HH:MM format.');
            return;
        }

        if (!formData.title.trim()) {
            alert('Title is required');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: formData.title.trim(),
                color: Number(formData.color),
                note: formData.note.trim(),
                start: formData.start,
                end: formData.end,
                date: formData.date, // Date object sẽ được backend xử lý
            };

            await createCalendarEvent(token, payload);
            onEventCreated?.(); // callback để refresh danh sách event nếu cần
            onClose();
        } catch (err) {
            console.error('Create event failed:', err);
            alert('Create event failed. please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                {/* Nút đóng */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={loading}
                >
                    <X size={20} className="text-gray-600" />
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create new event</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter title"
                            disabled={loading}
                        />
                    </div>

                    {/* Color */}
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

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={formData.note}
                            onChange={(e) => setFormData((p) => ({ ...p, note: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="note about event (optional)"
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
                                onChange={handleTimeInput('start')}
                                placeholder="HH:MM"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                            <input
                                type="text"
                                value={formData.end}
                                onChange={handleTimeInput('end')}
                                placeholder="HH:MM"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <DatePicker
                            selected={formData.date}
                            onChange={handleDateChange}
                            dateFormat="dd/MM/yyyy"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            wrapperClassName="w-full"
                            disabled={loading}
                         showMonthYearDropdown/>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-600 text-white rounded-lg shadow-lg hover:scale-105 transition-all disabled:opacity-70"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}