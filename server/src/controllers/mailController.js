// src/controllers/mailController.js
import { sendViaSMTP } from '../smtp/smtpClient.js';
import { saveEmail, getInbox, getMessageById , getConversations, getConversationMessages} from '../services/mailService.js';
import { encrypt as encryptFn } from '../utils/crypto.js';

export async function sendMail(req, res) {
    try {
        const bodyObj = req.body || {};
        console.log('sendMail req.body:', bodyObj);

        // allow sender from body or authenticated user
        const from = bodyObj.from || req.user?.email;
        // accept either `to` (email) or `recipientId` (id string/number)
        const toEmail = bodyObj.to || null;
        const recipientId = bodyObj.recipientId ? parseInt(bodyObj.recipientId, 10) : null;
        const subject = bodyObj.subject || '';
        const body = bodyObj.body || '';
        const encrypted = !!bodyObj.encrypted;

        if (!from) {
            return res.status(400).json({ success: false, error: 'Missing sender: `from` or authenticated user required' });
        }
        if (!toEmail && !recipientId) {
            return res.status(400).json({ success: false, error: 'Missing recipient: provide `to` (email) or `recipientId`' });
        }
        if (recipientId !== null && Number.isNaN(recipientId)) {
            return res.status(400).json({ success: false, error: '`recipientId` must be a valid integer' });
        }

        // If your saveEmail expects an email address, prefer to send `toEmail`.
        // If it can accept recipientId, pass that. Adjust according to your service implementation.
        if (toEmail) {
            await saveEmail(from, toEmail, subject, body, { encrypted });
        } else {
            // pass recipientId when you store by id (ensure saveEmail supports it)
            await saveEmail(from, recipientId, subject, body, { encrypted });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('sendMail error', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}

export async function inbox(req, res) {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
        }
        const email = req.user.email;
        const list = await getInbox(email, { raw: true });
        console.log('inbox list:', list);
        return res.json(list);
    } catch (err) {
        console.error('inbox error', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function getMail(req, res) {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ success: false, error: 'Unauthorized: missing user' });
        }
        const idParam = req.params.id;
        if (!idParam) {
            return res.status(400).json({ success: false, error: 'Missing mail id in params' });
        }
        const id = parseInt(idParam, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid mail id' });
        }

        const msg = await getMessageById(req.user.email, id, { raw: true });
        if (!msg) return res.status(404).json({ success: false, error: 'Not found' });
        return res.json({ success: true, message: msg });
    } catch (err) {
        console.error('getMail error', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export async function conversations(req, res) {
    try {
        console.log("1");
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'Unauthorized: missing user' });
        }
        console.log("2");
        const email = req.user.email;
        console.log("3");
        const convos = await getConversations(email);
        console.log('conversations result:', convos);
        return res.json(convos);
    } catch (err) {
        console.error('conversations error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function conversationDetail(req, res) {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ error: 'Unauthorized: missing user' });
        }
        const partnerIdParam = req.params.partnerId;
        if (!partnerIdParam) {
            return res.status(400).json({ error: 'Missing partnerId param' });
        }
        const partnerId = parseInt(partnerIdParam, 10);
        if (Number.isNaN(partnerId)) {
            return res.status(400).json({ error: 'Invalid partnerId param' });
        }
        const email = req.user.email;
        const messages = await getConversationMessages(email, partnerId);
        return res.json(messages);
    } catch (err) {
        console.error('conversationDetail error', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
