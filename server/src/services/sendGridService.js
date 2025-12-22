// javascript
// File: `server/src/services/sendGridService.js`
import sgMail from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/*
  SendGrid sender: generate token, add to subject/headers, but DO NOT write ExternalEmailLog here.
  Return token so caller can create the DB log after message/thread exists.
*/
export async function sendEmailWithSendGrid(senderEmail, receiverEmail, subject, body) {
    const token = uuidv4();
    const subjectWithToken = `${subject || '(No subject)'} [ref:${token}]`;

    const msg = {
        to: receiverEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        replyTo: process.env.SENDGRID_FROM_EMAIL,
        subject: subjectWithToken,
        text: body,
        html: `
            <h3>user: ${senderEmail}</h3>
            <p>${body}</p>
        `,
        headers: { 'X-Tracking-Ref': token }
    };

    try {
        await sgMail.send(msg);
        console.log(`📧 Email sent to ${receiverEmail} via SendGrid with token ${token}`);
        return { success: true, token };
    } catch (error) {
        console.error('❌ Failed to send email via SendGrid:', error);
        return { success: false, error: String(error), token };
    }
}

/**
 * Reply to an existing external email using trackingToken
 *
 * @param {string} senderEmail   email người reply (user trong hệ thống)
 * @param {string} receiverEmail email bên ngoài (gmail/yahoo...)
 * @param {string} originalSubject subject gốc (đã có [ref:xxx])
 * @param {string} trackingToken token đã tồn tại
 * @param {string} body nội dung reply
 */
export async function replyEmailWithSendGrid(
    senderEmail,
    receiverEmail,
    originalSubject,
    trackingToken,
    body
) {
    if (!trackingToken) {
        throw new Error('Missing trackingToken for reply');
    }

    // đảm bảo subject có Re: và token
    let replySubject = originalSubject || '(No subject)';

    if (!replySubject.toLowerCase().startsWith('re:')) {
        replySubject = `Re: ${replySubject}`;
    }

    if (!replySubject.includes(`[ref:${trackingToken}]`)) {
        replySubject += ` [ref:${trackingToken}]`;
    }

    const msg = {
        to: receiverEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        replyTo: process.env.SENDGRID_FROM_EMAIL,
        subject: replySubject,
        text: body,
        html: `
            <p><strong>Reply from:</strong> ${senderEmail}</p>
            <p>${body}</p>
            <hr />
            <p style="font-size:12px;color:#888">
                Ref: ${trackingToken}
            </p>
        `,
        headers: {
            'X-Tracking-Ref': trackingToken
        }
    };

    try {
        await sgMail.send(msg);
        console.log(`↩️ Replied to ${receiverEmail} with token ${trackingToken}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to reply via SendGrid:', error);
        return { success: false, error: String(error) };
    }
}
