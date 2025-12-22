// File: `server/src/services/Helper/gmailHelper.js`
import { google } from 'googleapis';

function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function sendReplyViaGmail(
    gmail,
    toEmail,
    subject,
    body,
    threadId,
    trackingToken = null,
    originalMessageId = null,
    fromEmail = process.env.GMAIL_FROM_EMAIL
) {
    if (!gmail) throw new Error('Gmail client required');

    // Ensure subject keeps tracking token and Re:
    let subj = subject || '(No subject)';
    if (!/^re:/i.test(subj)) subj = `Re: ${subj}`;
    if (trackingToken && !subj.includes(`[ref:${trackingToken}]`)) {
        subj = `${subj} [ref:${trackingToken}]`;
    }

    const headers = [
        `From: ${fromEmail}`,
        `To: ${toEmail}`,
        `Subject: ${subj}`,
        'Content-Type: text/plain; charset="UTF-8"'
    ];

    // Add In-Reply-To / References when we have the original Message-ID header value
    if (originalMessageId) {
        // ensure angle brackets
        const mid = /^<.*>$/.test(originalMessageId) ? originalMessageId : `<${originalMessageId}>`;
        headers.push(`In-Reply-To: ${mid}`);
        headers.push(`References: ${mid}`);
    }

    // Keep token in headers too (helps match)
    if (trackingToken) {
        headers.push(`X-Tracking-Ref: ${trackingToken}`);
    }

    headers.push('', body || '');

    const raw = base64UrlEncode(headers.join('\r\n'));

    await gmail.users.messages.send({
        userId: 'me',
        resource: { raw, threadId }
    });
    return true;
}

// returns either null or { threadId, messageId }
export async function findGmailThreadIdByToken(gmail, token) {
    if (!gmail || !token) return null;

    const queries = [
        `"${token}"`,
        token,
        `subject:"[ref:${token}]"`,
        `subject:${token}`,
        `header:X-Tracking-Ref ${token}`,
        `in:anywhere "${token}"`
    ];

    for (const q of queries) {
        try {
            console.log(`🔎 Gmail search q=${q}`);
            const res = await gmail.users.messages.list({
                userId: 'me',
                q,
                maxResults: 10,
                includeSpamTrash: true
            });

            const msgs = res?.data?.messages || [];
            console.log(`🔎 Found ${msgs.length} messages for q=${q}`);

            if (msgs.length > 0) {
                const first = msgs[0];
                const threadId = first.threadId || null;
                const messageId = first.id || null;
                if (threadId) {
                    console.log(`✅ Gmail threadId found=${threadId} (messageId=${messageId}) (query=${q})`);
                    return { threadId, messageId };
                }
            }
        } catch (err) {
            console.error(`❌ Gmail search error for q=${q}:`, err);
        }
    }

    console.log('⚠️ No Gmail thread found by token after multiple queries');
    return null;
}
