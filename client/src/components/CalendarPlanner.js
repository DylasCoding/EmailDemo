// client/src/components/CalendarPlanner.js
import React, {useState, useMemo, useCallback, useEffect} from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import WeekCalendarView from './Calendar/WeekCalendarView';
import MiniCalendar from './Calendar/MiniCalendarView';
import { createCalendarEvent, getCalendarEvents, getWeekCalendarEvents } from '../api';

// Component: Calendar List
function EventList({ mockEvents }) {
    const now = new Date();

    const colorMap = [
        '34,197,94',   // 0 - green
        '168,85,247',  // 1 - purple
        '147,51,234',  // 2 - purple-dark
        '34,211,238',  // 3 - cyan
        '252,165,165', // 4 - red-light
        '248,113,113', // 5 - red
        '147,197,253', // 6 - blue
    ];

    const toDateTime = (dateObj, timeStr) => {
        const d = new Date(dateObj);
        const [h, m] = timeStr.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const diffMs = (event) => {
        const dt = toDateTime(event.date, event.start);
        return dt - now;
    };

    const formatRemaining = (ms) => {
        const abs = Math.abs(ms);
        const days = Math.floor(abs / 86400000);
        const hours = Math.floor((abs % 86400000) / 3600000);
        const minutes = Math.floor((abs % 3600000) / 60000);

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (days === 0 && hours === 0) parts.push(`${minutes}m`);

        const base = parts.join(' ');
        return ms >= 0 ? base : `${base} ago`;
    };

    // sort upcoming first (diff>0), by smallest diff; if less than 4 upcoming, fill with closest past
    const sortedUpcoming = mockEvents
        .map(e => ({ ...e, __diff: diffMs(e) }))
        .filter(e => e.__diff >= 0)
        .sort((a, b) => a.__diff - b.__diff);

    const sortedPast = mockEvents
        .map(e => ({ ...e, __diff: diffMs(e) }))
        .filter(e => e.__diff < 0)
        .sort((a, b) => Math.abs(a.__diff) - Math.abs(b.__diff));

    const nearest = [...sortedUpcoming, ...sortedPast].slice(0, 4);

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Upcoming (nearest)</h3>
            <div className="space-y-3">
                {nearest.map((ev) => {
                    const rgb = colorMap[ev.color] || '0,0,0';
                    const remaining = formatRemaining(ev.__diff);
                    return (
                        <div key={ev.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: `rgba(${rgb}, 1)` }}
                                />
                                <div>
                                    <div className="text-sm text-gray-700 font-medium">{ev.title}</div>
                                    <div className="text-xs text-gray-500">{ev.start} • {new Date(ev.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">{remaining}</div>
                        </div>
                    );
                })}
                {nearest.length === 0 && <div className="text-sm text-gray-500">No events</div>}
            </div>
        </div>
    );
}

// Component chính: Calendar Planner
export default function CalendarPlanner({ token }) {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [events, setEvents] = useState([]); // Dùng state để lưu data thật
    const [loading, setLoading] = useState(false);

    // Hàm lấy dữ liệu từ API
    const fetchEvents = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await getCalendarEvents(token);
            // Giả định response.data chứa array events
            setEvents(response.data.events || response.data);
        } catch (err) {
            console.error("Failed to fetch events:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Gọi API khi component mount hoặc token thay đổi
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Tính toán số ngày trong tuần dựa trên currentDate
    const getWeekDays = (date) => {
        const days = [];
        const current = new Date(date);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        current.setDate(diff);

        for (let i = 0; i < 7; i++) {
            const weekDay = new Date(current);
            weekDay.setDate(current.getDate() + i);
            days.push(weekDay);
        }
        return days;
    };

    const weekDays = getWeekDays(currentDate);

    // Handlers
    const handleDateChange = (newDate) => setCurrentDate(newDate);
    const goToPrevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };
    const goToNextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    // Khi tạo xong event, gọi lại hàm fetch để cập nhật danh sách
    const handleEventCreated = () => {
        fetchEvents();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
            {/* Background decor giữ nguyên */}
            <div className="relative max-w-7xl mx-auto">
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-3 space-y-6">
                        <MiniCalendar
                            currentDate={currentDate}
                            onDateChange={handleDateChange}
                        />
                        {/* Truyền events thật vào list bên trái */}
                        <EventList mockEvents={events} />
                    </div>

                    <div className="col-span-9">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">Đang tải...</div>
                        ) : (
                            <WeekCalendarView
                                currentDate={currentDate}
                                weekDays={weekDays}
                                mockEvents={events} // Truyền events thật vào view chính
                                onPrevWeek={goToPrevWeek}
                                onNextWeek={goToNextWeek}
                                token={token}
                                onEventCreated={handleEventCreated}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}