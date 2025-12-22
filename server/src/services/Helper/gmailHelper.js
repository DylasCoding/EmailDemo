// File: `server/src/services/gmailHelper.js`
import { google } from 'googleapis';

function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/*
  Send a plain-text reply into an existing Gmail thread.
  - `gmail` is a googleapis gmail client (returned by createGmailClient()).
  - `toEmail` is the external recipient (e.g. someone@gmail.com).
  - `subject` should match thread subject (prefixing "Re:" is fine).
  - `body` is plain text reply.
  - `threadId` is the Gmail thread id you previously saved.
  - `fromEmail` optional (falls back to process.env.GMAIL_FROM_EMAIL).
*/
export async function sendReplyViaGmail(
    gmail,
    toEmail,
    subject,
    body,
    threadId,
    fromEmail = process.env.GMAIL_FROM_EMAIL
) {
    if (!gmail) throw new Error('Gmail client required');
    const msgLines = [
        `From: ${fromEmail}`,
        `To: ${toEmail}`,
        `Subject: Re: ${subject || '(No subject)'}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        body || ''
    ];
    const raw = base64UrlEncode(msgLines.join('\r\n'));

    try {
        await gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw,
                threadId
            }
        });
        console.log(`✅ Sent Gmail reply to ${toEmail} in thread ${threadId}`);
        return true;
    } catch (err) {
        console.error('❌ Failed to send Gmail reply:', err);
        throw err;
    }
}
