import {createCalendarEvent, getCalendarEventsByUser, getWeekCalendarEventsByUser, updateCalendarEvent} from '../services/calendarService.js';

export async function createEvent(req, res) {
    try {
        const {title, color, note, start, end, date} = req.body;
        const userId = req.user.id;

        const event = await createCalendarEvent(userId, title, color, note, start, end, date);
        res.json({success: true, event});
    } catch (err) {
        res.status(400).json({success: false, error: err.message});
    }
}

export async function getEvents(req, res) {
    try {
        const userId = req.user.id;
        const events = await getCalendarEventsByUser(userId);
        res.json({success: true, events});
    } catch (err) {
        res.status(500).json({success: false, error: err.message});
    }
}

export async function getWeekEvents(req, res) {
    try {
        const userId = req.user.id;
        const {weekStartDate} = req.query;

        if (!weekStartDate) {
            return res.status(400).json({success: false, error: 'weekStartDate query parameter is required'});
        }

        const events = await getWeekCalendarEventsByUser(userId, new Date(weekStartDate));
        res.json({success: true, events});
    } catch (err) {
        res.status(500).json({success: false, error: err.message});
    }
}

export async function updateEvent(req, res) {
    try {
        const {eventId} = req.params;
        const updates = req.body;

        const updatedEvent = await updateCalendarEvent(eventId, updates);
        res.json({success: true, event: updatedEvent});
    } catch (err) {
        res.status(400).json({success: false, error: err.message});
    }
}