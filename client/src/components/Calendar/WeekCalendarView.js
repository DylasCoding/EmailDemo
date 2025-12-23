// client/src/components/Calendar/WeekCalendarView.js
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import CreateEventModal from './CalendarEventForm';
import EditEventModal from './EditEventModal';

// Component: Week Calendar View
export default function WeekCalendarView({ currentDate, weekDays, mockEvents, onPrevWeek, onNextWeek, token, onEventCreated }) {
    const weekDayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    console.log("Week calendar token:", token);

    // colorMap is now an array where index corresponds to mockEvents.color numeric value
    const colorMap = [
        '34,197,94',   // 0 - green
        '168,85,247',  // 1 - purple-300
        '147,51,234',  // 2 - purple-400
        '34,211,238',  // 3 - cyan
        '252,165,165', // 4 - red-300
        '248,113,113', // 5 - red-400
        '147,197,253', // 6 - blue
    ];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const getEventStyle = (start, end) => {
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = endMinutes - startMinutes;

        const top = (startMinutes / 60) * 60;
        const height = (duration / 60) * 60;

        return { top: `${top}px`, height: `${height}px` };
    };

    const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const formatWeekRange = () => {
        const firstDay = weekDays[0];
        const lastDay = weekDays[6];

        const options = { month: 'long', day: 'numeric' };
        const firstStr = firstDay.toLocaleDateString('en-US', options);
        const lastStr = lastDay.toLocaleDateString('en-US', options);
        const year = lastDay.getFullYear();

        return `${firstStr} - ${lastStr}, ${year}`;
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <button onClick={onPrevWeek} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {formatWeekRange()}
                    </h2>
                    <button onClick={onNextWeek} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ChevronRight size={24} className="text-gray-700" />
                    </button>
                </div>

                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 font-medium">Week {getWeekNumber(currentDate)}</span>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all"
                    >
                        <Plus size={20} />
                        <span className="font-semibold">Create</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
                <div className="bg-white/60 sticky left-0 z-10">
                    <div className="h-16 border-b border-gray-200"></div>
                    {hours.map((hour, idx) => (
                        <div key={idx} className="h-[60px] flex items-start justify-end pr-3 pt-1 text-xs text-gray-500 border-b border-gray-100">
                            {hour.toString().padStart(2, '0')}:00
                        </div>
                    ))}
                </div>

                {weekDays.map((day, dayIdx) => {
                    const todayHighlight = isToday(day);

                    return (
                        <div key={dayIdx} className="bg-white/60 relative">
                            <div className={`h-16 flex flex-col items-center justify-center border-b border-gray-200 sticky top-0 backdrop-blur-sm z-10 ${todayHighlight ? 'bg-amber-50' : 'bg-white/80'}`}>
                <span className="text-xs text-gray-600 font-medium mb-1">
                  {weekDayNames[dayIdx]}
                </span>
                                <span className={`text-2xl font-bold ${todayHighlight ? 'text-yellow-500' : 'text-gray-800'}`}>
                  {day.getDate()}
                </span>
                            </div>

                            {hours.map((hour, hourIdx) => (
                                <div key={hourIdx} className="h-[60px] border-b border-gray-200/60"></div>
                            ))}

                            <div className="absolute top-16 left-0 right-0 bottom-0">
                                {mockEvents
                                    .filter(event => {
                                        const eventDate = new Date(event.date);
                                        return eventDate.toDateString() === day.toDateString();
                                    })
                                    .map(event => {
                                        const style = getEventStyle(event.start, event.end);
                                        const rgb = colorMap[event.color] || '0,0,0';
                                        return (
                                            <div
                                                key={event.id}
                                                onClick={() => handleEventClick(event)} // Bấm vào để mở modal
                                                className="absolute left-1 right-1 p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                                style={{
                                                    ...style,
                                                    backgroundColor: `rgba(${rgb}, 0.15)`,
                                                    borderLeft: `4px solid rgb(${rgb})`,
                                                }}
                                            >
                                                <div className="text-xs font-semibold text-gray-800 mb-1">
                                                    {event.title}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {event.start} - {event.end}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <EditEventModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                token={token}
                event={selectedEvent}
                onEventUpdated={onEventCreated} // Dùng chung hàm refresh data
            />

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                token={token}
                onEventCreated={onEventCreated} // để parent refresh nếu cần
            />
        </div>
    );
}
