import {CalendarEvent} from '../../models/index.js';

export async function createCalendarEvent(userId, title, color, note, start, end, date) {
    if (!userId || !title || !start || !end || !date) {
        throw new Error('Missing required fields to create calendar event');
    }

    return await CalendarEvent.create({
        userId,
        title,
        color,
        note,
        start,
        end,
        date
    });
}

export async function getCalendarEventsByUser(userId) {
    return await CalendarEvent.findAll({
        where: {userId}
    });
}

export async function getWeekCalendarEventsByUser(userId, weekStartDate) {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    return await CalendarEvent.findAll({
        where: {
            userId,
            date: {
                $gte: weekStartDate,
                $lt: weekEndDate
            }
        }
    });
}

export async function updateCalendarEvent(eventId, updates) {
    const event = await CalendarEvent.findByPk(eventId);
    if (!event) {
        throw new Error('Event not found');
    }
    await event.update(updates);
    return event;
}