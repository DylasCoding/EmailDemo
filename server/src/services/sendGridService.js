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
