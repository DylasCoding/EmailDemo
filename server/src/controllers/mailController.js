// src/controllers/mailController.js
import {
    createNewThreadAndMessage,
    sendMessageInThread,
    getInbox,
    getMailById,
    getConversations,
    getConversationMessagesByThread, updateThreadClass, setUserThreadStatus, getUserThreadStatuses,
    updateUserThreadStatus,
} from '../services/mailService.js';

export async function sendMail(req, res) {
    try {
        const { to, subject, body } = req.body || {};
        const senderEmail = req.user?.email;

        if (!senderEmail || !to || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Soạn thư mới (luôn tạo thread mới)
        await createNewThreadAndMessage(senderEmail, to, subject, body);

        return res.json({ success: true, message: 'Mail sent successfully (new thread)' });
    } catch (err) {
        console.error('sendMail error', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function sendReply(req, res) {
    try {
        const { threadId, body } = req.body || {};
        const senderEmail = req.user?.email;

        if (!senderEmail || !threadId || !body) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Gửi mail trong hội thoại
        await sendMessageInThread(senderEmail, threadId, body);

        return res.json({ success: true, message: 'Reply sent successfully' });
    } catch (err) {
        console.error('sendReply error', err);
        return res.status(500).json({ error: err.message });
    }
}

// Inbox / Conversation API giữ nguyên
export async function inbox(req, res) {
    try {
        if (!req.user?.email) return res.status(401).json({ error: 'Unauthorized' });
        const list = await getInbox(req.user.email);
        return res.json(list);
    } catch (err) {
        console.error('inbox error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function conversations(req, res) {
    try {
        if (!req.user?.email) return res.status(401).json({ error: 'Unauthorized' });
        const convos = await getConversations(req.user.email);
        return res.json(convos);
    } catch (err) {
        console.error('conversations error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function conversationDetail(req, res) {
    try {
        const threadId = parseInt(req.params.threadId, 10);
        if (Number.isNaN(threadId)) return res.status(400).json({ error: 'Invalid threadId' });
        const messages = await getConversationMessagesByThread(req.user.email, threadId);
        return res.json(messages);
    } catch (err) {
        console.error('conversationDetail error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function sendInThread(req, res) {
    try {
        const senderEmail = req.user.email;  // lấy từ token
        const threadId = req.params.id;      // id nằm ở URL
        const { body } = req.body;

        const message = await sendMessageInThread(senderEmail, threadId, body);
        res.json(message);
    } catch (err) {
        console.error("Send in thread error:", err);
        res.status(400).json({ error: err.message });
    }
}


export async function getMail(req, res) {
    try {
        if (!req.user?.email) return res.status(401).json({ error: 'Unauthorized' });
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid mail ID' });

        const mail = await getMailById(req.user.email, id);
        return res.json(mail);
    } catch (err) {
        console.error('getMail error', err);
        return res.status(500).json({ error: err.message });
    }
}

export async function updateThreadClassController(req, res) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const id = parseInt(req.params.id, 10);
        const { newClass } = req.body;

        if (Number.isNaN(id) || !['normal', 'star', 'spam'].includes(newClass)) {
            return res.status(400).json({ error: 'Invalid threadId or class value' });
        }

        // Persist per-user status into MailThreadStatus (threadId + userId + class)
        const status = await updateUserThreadStatus(Number(id), user.id, newClass);

        return res.json({ success: true, data: status });
    } catch (err) {
        console.error("updateThreadClass error:", err);
        return res.status(400).json({ success: false, message: err.message });
    }
}

export async function getThreadStatuses(req, res) {
    try {
        const email = req.user?.email;
        const result = await getUserThreadStatuses(email);
        res.json(result);
    } catch (err) {
        console.error('getThreadStatuses error:', err);
        res.status(500).json({ error: 'Failed to load thread statuses' });
    }
}

export async function updateThreadStatus(req, res) {
    try {
        const email = req.user?.email;
        const { threadId } = req.params;
        const { newClass } = req.body; // normal | star | spam

        const result = await setUserThreadStatus(email, threadId, newClass);
        res.json(result);
    } catch (err) {
        console.error('updateThreadStatus error:', err);
        res.status(500).json({ error: 'Failed to update thread status' });
    }
}

export async function updateThreadStatusHandler(req, res) {
    try {
        const user = req.user; // auth middleware must set req.user
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        console.log("Updating thread status for user:", user.id);
        console.log("", req.params, req.body);

        const { threadId } = req.params;
        const { newClass } = req.body;

        const status = await updateUserThreadStatus(Number(threadId), user.id, newClass);
        return res.json(status);
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message || "Failed" });
    }
}