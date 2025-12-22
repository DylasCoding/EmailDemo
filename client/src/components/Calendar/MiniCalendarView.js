import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

// Component: Mini Calendar
export default function MiniCalendar({ currentDate, onDateChange }) {
    const [displayMonth, setDisplayMonth] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        const prevMonthDays = new Date(year, month, 0).getDate();
        const startDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                day: prevMonthDays - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthDays - i)
            });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return days;
    };

    const monthDays = getDaysInMonth(displayMonth);
    const monthName = displayMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const goToPrevMonth = () => {
        setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (date) => {
        onDateChange(date);
    };

    const isSelectedDate = (date) => {
        return date.toDateString() === currentDate.toDateString();
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">{monthName}</h3>
                <div className="flex space-x-2">
                    <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-500 font-medium">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {monthDays.map((dayObj, idx) => {
                    const selected = isSelectedDate(dayObj.date);
                    const today = isToday(dayObj.date);

                    return (
                        <button
                            key={idx}
                            onClick={() => handleDateClick(dayObj.date)}
                            className={`
                aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                ${!dayObj.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                ${selected ? 'bg-gradient-to-r from-gray-500 via-gray-600 to-gray-600 text-white font-bold shadow-md' : ''}
                ${today && !selected ? 'bg-amber-100 font-semibold' : ''}
                ${!selected && !today ? 'hover:bg-gray-100' : ''}
              `}
                        >
                            {dayObj.day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}