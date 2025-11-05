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


export const sendReply = (token, data) =>
    api.post("/mail/reply", data, { headers: authHeaders(token) });

export const getThreadStatuses = async (token) => {
    const res = await api.get("/mail/thread-status", { headers: authHeaders(token) });
    return res.data;
};

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
            sentAt: await tryDecryptDate(m.sentAt),
        }))
    );

    return { ...res, data: messages };
};

export const getInbox = async (token) => {
    const res = await api.get("/mail/inbox", { headers: authHeaders(token) });
    const decoded = await Promise.all(
        (res.data || []).map(async (m) => ({
            ...m,
            subject: typeof m.subject === "string" ? await tryDecryptValue(m.subject) : m.subject,
            body: typeof m.body === "string" ? await tryDecryptValue(m.body) : m.body,
            sentAt: await tryDecryptDate(m.sentAt),
        }))
    );
    return { ...res, data: decoded };
};

export const getMailById = async (token, id) => {
    const res = await api.get(`/mail/${id}`, { headers: authHeaders(token) });
    if (!res.data) return res;
    const m = res.data;
    const decoded = {
        ...m,
        subject: typeof m.subject === "string" ? await tryDecryptValue(m.subject) : m.subject,
        body: typeof m.body === "string" ? await tryDecryptValue(m.body) : m.body,
        sentAt: await tryDecryptDate(m.sentAt),
    };
    return { ...res, data: decoded };
};

export const getConversations = async (token) => {
    const res = await api.get("/mail/conversations", { headers: authHeaders(token) });
    const convos = await Promise.all(
        (res.data || []).map(async (c) => ({
            threadId: c.threadId, // ✅ quan trọng
            partnerId: c.partnerId,
            partnerEmail: typeof c.partnerEmail === "string" ? await tryDecryptValue(c.partnerEmail) : c.partnerEmail,
            title: c.title,
            class: c.class,
            lastMessage: typeof c.lastMessage === "string" ? await tryDecryptValue(c.lastMessage) : c.lastMessage,
            lastSentAt: await tryDecryptDate(c.lastSentAt),
        }))
    );
    return { ...res, data: convos };
};


export const getConversationMessages = async (token, partnerId) => {
    const res = await api.get(`/mail/conversations/${partnerId}`, { headers: authHeaders(token) });
    const msgs = await Promise.all(
        (res.data || []).map(async (m) => ({
            ...m,
            body: typeof m.body === "string" ? await tryDecryptValue(m.body) : m.body,
            subject: typeof m.subject === "string" ? await tryDecryptValue(m.subject) : m.subject,
            sentAt: await tryDecryptDate(m.sentAt),
        }))
    );
    return { ...res, data: msgs };
};

