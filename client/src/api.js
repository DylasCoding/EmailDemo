// javascript
import axios from "axios";
import { decrypt } from "./utils/ClientCrypto";

const API_URL = "http://localhost:3000/api";
const api = axios.create({ baseURL: API_URL });

function authHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function isHexString(s) {
    return typeof s === "string" && /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0;
}

async function tryDecryptValue(value) {
    if (value === undefined || value === null) return value;

    if (Array.isArray(value)) {
        return await Promise.all(value.map((v) => tryDecryptValue(v)));
    }

    if (typeof value === "object") {
        const out = {};
        const entries = Object.entries(value);
        for (const [k, v] of entries) {
            out[k] = await tryDecryptValue(v);
        }
        return out;
    }

    if (typeof value === "string" && isHexString(value)) {
        try {
            return await decrypt(value);
        } catch (e) {
            console.error("decrypt failed for value preview:", value.slice(0, 120), e);
            return value;
        }
    }

    return value;
}

export async function tryDecryptDate(encrypted) {
    const d = await tryDecryptValue(encrypted);
    const n = Number(d);
    return Number.isFinite(n) ? n : d;
}

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);

export const sendMail = (token, data) =>
    api.post("/mail/send", data, { headers: authHeaders(token) });

export const sendMessageInThread = (token, threadId, data) =>
    api.post(`/mail/thread/${threadId}/send`, data, { headers: authHeaders(token) });


export const updateThreadStatus = async (token, threadId, newClass) => {
    if (!token) throw new Error('Missing auth token');
    const res = await api.put(
        `/mail/thread-status/${threadId}`,
        { newClass },
        { headers: authHeaders(token) }
    );
    return res.data;
};

export const getThreadMessages = async (token, threadId) => {
    const res = await api.get(`/mail/thread/${threadId}`, { headers: authHeaders(token) });

    const messages = await Promise.all(
        (res.data || []).map(async (m) => ({
            id: m.id,
            threadId: m.threadId,
            senderId: m.senderId,
            senderEmail: typeof m.senderEmail === "string" ? await tryDecryptValue(m.senderEmail) : m.senderEmail,
            body: typeof m.body === "string" ? await tryDecryptValue(m.body) : m.body,
            subject: typeof m.subject === "string" ? await tryDecryptValue(m.subject) : m.subject,
            files: Array.isArray(m.files)
                ? m.files.map(f => ({
                    id: f.id,
                    fileName: f.fileName,
                    mimeType: f.mimeType,
                    fileSize: f.fileSize,
                    dataBase64: f.dataBase64
                }))
                : [],
            sentAt: await tryDecryptDate(m.sentAt),
        }))
    );

    return { ...res, data: messages };
};

export const getConversations = async (token) => {
    const res = await api.get("/mail/conversations", { headers: authHeaders(token) });
    const convos = await Promise.all(
        (res.data || []).map(async (c) => ({
            threadId: c.threadId, // quan trọng
            partnerId: c.partnerId,
            partnerEmail: typeof c.partnerEmail === "string" ? await tryDecryptValue(c.partnerEmail) : c.partnerEmail,
            title: c.title,
            class: c.class,
            lastMessage: typeof c.lastMessage === "string" ? await tryDecryptValue(c.lastMessage) : c.lastMessage,
            lastSentAt: await tryDecryptDate(c.lastSentAt),
            isRead: c.isRead,
            lastSenderId: c.lastSenderId,
        }))
    );

    console.log(convos);
    return { ...res, data: convos };
};

//================= File Upload =================//
export const uploadFile = (token, messageId, file, onUploadProgress) => {
    const form = new FormData();
    form.append('file', file);
    form.append('messageId', String(messageId));

    return api.post('/files/upload', form, {
        headers: { ...authHeaders(token) },
        onUploadProgress,
    });
};

export const uploadFiles = (token, messageId, files = [], onUploadProgress) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    form.append('messageId', String(messageId));

    return api.post('/files/upload', form, {
        headers: { ...authHeaders(token) },
        onUploadProgress,
    });
};

export const sendMailWithFiles = (token, formData, onUploadProgress) => {
    return api.post('/mail/send-with-files', formData, {
        headers: { ...authHeaders(token) }, // do not set Content-Type manually
        onUploadProgress,
    });
};

export const sendMessageInThreadWithFiles = (token, threadId, formData, onUploadProgress) => {
    return api.post(`/mail/thread/${threadId}/send-with-files`, formData, {
        headers: { ...authHeaders(token) }, // do not set Content-Type manually
        onUploadProgress,
    });
}

export const createCalendarEvent = (token, data)=>{
    const { title, color, note, start, end, date } = data;
    console.log(title, color, note, start, end, date);
    return api.post('/calendar/events', { title, color, note, start, end, date }, {
        headers: authHeaders(token)
    });
}
export const getCalendarEvents = (token)=>{
    return api.get('/calendar/events', {
        headers: authHeaders(token)
    });
}
export const getWeekCalendarEvents = (token, weekStartDate)=>{
    return api.get('/calendar/events/week', {
        headers: authHeaders(token),
        params: { weekStartDate }
    });
}

export const updateCalendarEvent = (token, eventId, updates)=>{
    return api.put(`/calendar/update/events/${eventId}`, updates, {
        headers: authHeaders(token)
    });
}

export const deleteCalendarEvent = (token,eventId)=>{
    return api.delete(`/calendar/delete/events/${eventId}`, {
        headers: authHeaders(token)
    });
}