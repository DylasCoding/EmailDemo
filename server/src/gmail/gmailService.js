// javascript
// File: `server/src/gmail/gmailService.js`
import { google } from 'googleapis';
import {ExternalEmailLog, MailMessage} from '../../models/index.js';
import { sendMessageInThread } from '../services/mailService.js';
import { findUserByEmail } from '../services/Helper/emailHelpers.js';
/*
  Required Gmail scopes used to validate the refresh token's granted scopes.
*/
const REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send'
];

/*
  - When polling new unread messages, extract Subject (or headers).
  - Look for our token pattern `[ref:<token>]`.
  - If found, find the ExternalEmailLog row and log/emit a notification.
*/
export async function createGmailClient() {
    const auth = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    );

    // Use existing refresh token from .env
    auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    let accessToken;
    try {
        // Force refresh and obtain an access token
        const res = await auth.getAccessToken();
        accessToken = res?.token || (typeof res === 'string' ? res : null);
        if (!accessToken) throw new Error('No access token obtained from refresh.');
    } catch (err) {
        console.error('❌ Failed to refresh Gmail access token:', err);
        throw err;
    }

    // Validate scopes granted to this access token
    try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
        if (!tokenInfoRes.ok) {
            const txt = await tokenInfoRes.text().catch(() => '');
            throw new Error(`tokeninfo failed: ${tokenInfoRes.status} ${txt}`);
        }

        const info = await tokenInfoRes.json();
        const grantedScopes = (info.scope || '').split(' ');
        const missing = REQUIRED_SCOPES.filter(s => !grantedScopes.includes(s));
        if (missing.length > 0) {
            const msg = `Insufficient Gmail scopes. Missing: ${missing.join(', ')}. Re-authorize app requesting scopes: ${REQUIRED_SCOPES.join(' ')}`;
            console.error('❌', msg);
            throw new Error(msg);
        }
    } catch (err) {
        console.error('❌ Gmail token scope check failed:', err.message || err);
        throw err;
    }

    return google.gmail({ version: 'v1', auth });
}

export async function fetchUnreadReplies(gmail) {
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
    });

    return res.data.messages || [];
}

export async function getMessageDetail(gmail, messageId) {
    const res = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'In-Reply-To', 'References'],
    });

    return res.data;
}

function extractReplyText(text) {
    if (!text) return '';
    let t = String(text).replace(/&lt;|&gt;/g, ''); // remove common html-escaped angle brackets
    // patterns to cut off quoted/forwarded parts
    const cutPatterns = [/Vào Thứ/i, /đã viết:/i, /wrote:/i, /On .* wrote:/i, /\r?\n/];
    for (const p of cutPatterns) {
        const idx = t.search(p);
        if (idx !== -1) {
            t = t.substring(0, idx).trim();
            break;
        }
    }
    return t.trim();
}

export async function checkNewReplies(gmail) {
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
    });

    const messages = res.data.messages || [];
    const newReplies = [];

    for (const msg of messages) {
        const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
        });

        // mark as read to avoid duplicate processing
        await gmail.users.messages.batchModify({
            userId: 'me',
            ids: [msg.id],
            resource: { removeLabelIds: ['UNREAD'] }
        });

        const headers = detail.data.payload.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const fromHeader = headers.find(h => h.name === 'From')?.value || '';

        // normalize email from "Name <email@...>" or plain
        const emailMatch = fromHeader.match(/<([^>]+)>/);
        const fromEmailAddr = (emailMatch ? emailMatch[1] : (fromHeader.split(/\s+/).pop() || fromHeader)).replace(/[<>]/g, '').trim();

        // detect our tracking token in subject: [ref:token]
        const m = subject.match(/\[ref:([A-Za-z0-9\-]+)\]/i);
        if (m) {
            const token = m[1];
            try {
                const log = await ExternalEmailLog.findOne({ where: { trackingToken: token } });
                if (log) {
                    const rawSnippet = detail.data.snippet || '';
                    const replyText = extractReplyText(rawSnippet) || '(No content)';

                    console.log(`📣 Reply received for tracked message token=${token} from=${fromHeader}. snippet=${rawSnippet}`);
                    // find the original MailMessage to get threadId
                    let threadId = null;
                    try {
                        const originalMsg = await MailMessage.findByPk(log.messageId);
                        threadId = originalMsg ? originalMsg.threadId : null;
                    } catch (err) {
                        console.error('❌ Failed to load original MailMessage:', err);
                    }

                    if (!threadId) {
                        console.log(`⚠️ No threadId found for ExternalEmailLog.messageId=${log.messageId}, skipping sendMessageInThread`);
                    } else {
                        // check if the sender email maps to a user in the system
                        const user = await findUserByEmail(fromEmailAddr);
                        if (user) {
                            try {
                                // prefer using sendMessageInThread so created message uses user.id as senderId
                                await sendMessageInThread(fromEmailAddr, threadId, replyText);
                                console.log(`✅ Appended reply to thread ${threadId} as user.id=${user.id}`);
                            } catch (err) {
                                console.error('❌ Failed to sendMessageInThread for incoming reply:', err);
                            }
                        } else {
                            console.log(`🔎 Sender ${fromEmailAddr} not found as internal user — skipping sendMessageInThread`);
                        }
                    }

                    // optionally emit to frontend via socket.io using senderEmail room
                    // if (global._io) { ... }
                } else {
                    console.log(`🔎 No ExternalEmailLog found for token ${token} — reply from ${fromHeader}`);
                }
            } catch (err) {
                console.error('❌ Error processing tracked reply:', err);
            }
        }

        newReplies.push({
            id: msg.id,
            threadId: detail.data.threadId,
            snippet: detail.data.snippet,
            from: fromHeader,
            subject
        });
    }

    return newReplies;
}