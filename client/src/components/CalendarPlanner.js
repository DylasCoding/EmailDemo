// client/src/components/CalendarPlanner.js
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import WeekCalendarView from './Calendar/WeekCalendarView';
import MiniCalendar from './Calendar/MiniCalendarView';

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
export default function CalendarPlanner() {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);

    // Mock data - có thể thay thế từ API sau này
    // Tạo events cho tuần hiện tại
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const weekStart = getWeekStart(today);

    // color now uses numeric indices that map to WeekCalendarView's color array
    const mockEvents = [
        {
            id: 1,
            title: "Product Design Course",
            color: 0, // green
            start: "09:30",
            end: "12:00",
            date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 1), // Tuesday
        },
        {
            id: 2,
            title: "Conversational Interview",
            color: 1, // purple-300
            start: "12:30",
            end: "14:00",
            date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 1), // Tuesday
        },
        {
            id: 3,
            title: "Team Meeting",
            color: 2, // purple-400
            start: "09:00",
            end: "11:00",
            date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 2), // Wednesday
        },
        {
            id: 4,
            title: "App Design",
            color: 0, // green
            start: "13:00",
            end: "15:30",
            date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 2), // Wednesday
        },
        {
            id: 5,
            title: "Frontend development",
            color: 3, // cyan
            start: "10:00",
            end: "13:00",
            date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 3), // Thursday
        },
        {
            id: 6,
            title: "Morning Standup",
            color: 4, // red-300
            start: "08:00",
            end: "09:00",
            date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()), // Monday
        },
        {
            id: 7,
            title: "Code Review",
            color: 6, // blue
            start: "15:00",
            end: "17:00",
            date: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 4), // Friday
        },
        {
            id: 8,
            title: "Lunch Meeting",
            color: 5, // red-400
            start: "12:00",
            end: "13:30",
            date: today, // Hôm nay
        },
    ];

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

    const handleDateChange = (newDate) => {
        setCurrentDate(newDate);
    };

    const goToPrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-7xl mx-auto">
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-3 space-y-6">
                        <MiniCalendar
                            currentDate={currentDate}
                            onDateChange={handleDateChange}
                        />
                        <EventList mockEvents={mockEvents} />
                    </div>

                    <div className="col-span-9">
                        <WeekCalendarView
                            currentDate={currentDate}
                            weekDays={weekDays}
                            mockEvents={mockEvents}
                            onPrevWeek={goToPrevWeek}
                            onNextWeek={goToNextWeek}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
