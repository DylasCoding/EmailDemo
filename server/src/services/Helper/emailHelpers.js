// 🔍 Helper: Tìm user theo email
import {
    User,
    MailThread,
    MailMessage,
    MailThreadStatus,
    sequelizeInstance as sequelize,
    ExternalEmailLog
} from '../../../models/index.js';
import { encrypt as encryptFn, decrypt } from '../../utils/crypto.js';
import {sendEmailWithSendGrid} from "../sendGridService.js";
import {isSpam} from "../../spamDetector/spamDetector.js";

export async function findUserByEmail(email, transaction) {
    const user = await User.findOne({
        where: { email: encryptFn(email) },
        transaction
    });
    return user;
}

// 🌐 Helper: Kiểm tra email có phải external không
export function isExternalEmail(email) {
    return email.endsWith('@gmail.com');
}

// 📧 Helper: Gửi email external qua SendGrid và log
export async function sendExternalEmail(senderEmail, receiverEmail, subject, body, senderId, transaction) {
    const sendGridResult = await sendEmailWithSendGrid(senderEmail, receiverEmail, subject, body);

    if (!sendGridResult.success) {
        throw new Error('Failed to send email via SendGrid');
    }
    //kiểm tra receiverEmail có trong hệ thống không nếu không tạo user tạm mới
    let receiver = await findUserByEmail(receiverEmail, transaction);
    if (!receiver) {
        receiver = await User.create({
            // email: encryptFn(receiverEmail),
            email: receiverEmail,
            firstName: 'Hieu',
            lastName: 'Tran',
        }, { transaction });
    }

    // Create thread/message in local DB (receiverId null)
    const thread = await MailThread.create({
        title: subject || '(no subject)',
        class: 'normal',
        senderId: senderId,
        receiverId: receiver.id,
        isExternal: true
    }, { transaction });

    const message = await MailMessage.create({
        threadId: thread.id,
        senderId: senderId,
        body,
    }, { transaction });

    // Log into ExternalEmailLog AFTER message exists, include trackingToken and explicit receiverId null
    await ExternalEmailLog.create({
        messageId: message.id,
        senderEmail: senderEmail,
        receiverEmail: receiverEmail,
        trackingToken: sendGridResult.token || null,
        status: 'sent'
    }, { transaction });

    console.log('Email sent via SendGrid and logged in ExternalEmailLog');
    return {
        thread,
        message,
        isExternal: true
    };
}

// 🧵 Helper: Tạo thread mới
export async function createThread(subject, senderId, receiverId, transaction) {
    return await MailThread.create({
        title: subject || '(no subject)',
        class: 'normal',
        senderId,
        receiverId,
    }, { transaction });
}

// 💬 Helper: Tạo message mới
export async function createMessage(threadId, senderId, body, transaction) {
    return await MailMessage.create({
        threadId,
        senderId,
        body,
    }, { transaction });
}

// 🚫 Helper: Xử lý spam detection và trả về thread class
export async function handleSpamDetection(body, senderEmail, receiverEmail, threadId, receiverId, transaction) {
    if (await isSpam(body, senderEmail, receiverEmail)) {
        await MailThreadStatus.create({
            threadId,
            userId: receiverId,
            class: 'spam'
        }, { transaction });
        return 'spam';
    }
    return 'normal';
}

// 📎 Helper: Xử lý file attachments
export async function handleFileAttachments(files, messageId, transaction) {
    const fileRecords = files.map(file => {
        const originalname = file.originalname || file.name || file.filename || null;
        const filepath = file.path ||
            (file.destination && file.filename ? `${file.destination}/${file.filename}` : null) ||
            file.filepath || null;
        const mimetype = file.mimetype || file.type || null;
        const size = file.size || file.bytes || file.sizeBytes || null;

        return {
            messageId,
            fileName: originalname,
            filePath: filepath,
            fileSize: size,
            mimeType: mimetype
        };
    }).filter(r => r.fileName || r.filePath);

    if (fileRecords.length > 0) {
        await sequelize.models.File.bulkCreate(fileRecords, { transaction });
    }
}

// 🔔 Helper: Emit socket notification cho internal email
export function emitNewThreadNotification(sender, receiver, thread, message, threadClass, body) {
    if (!global._io || !receiver.email) return;

    const senderEmailStr = decrypt(sender.getDataValue('email'));
    const receiverEmailStr = decrypt(receiver.getDataValue('email'));

    const payload = {
        threadId: thread.id,
        id: thread.id,
        title: thread.title || '(Không có tiêu đề)',
        class: threadClass,
        lastMessage: body,
        lastSentAt: message.sentAt,
        senderId: sender.id,
        receiverId: receiver.id,
        senderEmail: senderEmailStr,
        receiverEmail: receiverEmailStr,
        partnerEmail: receiverEmailStr,
    };

    global._io.to(receiverEmailStr).emit('newThread', payload);
    global._io.to(senderEmailStr).emit('newThread', payload);
}

// 📧 Helper: Xử lý internal email (receiver có trong hệ thống)
export async function sendInternalEmail(
    senderEmail,
    receiverEmail,
    subject,
    body,
    files,
    sender,
    transaction
) {
    // Tìm receiver trong hệ thống
    const receiver = await findUserByEmail(receiverEmail, transaction);
    if (!receiver) {
        throw new Error('We could not find the receiver with email: ' + receiverEmail);
    }

    // Tạo thread với cả senderId và receiverId
    const thread = await createThread(subject, sender.id, receiver.id, transaction);
    const message = await createMessage(thread.id, sender.id, body, transaction);

    // Kiểm tra spam
    const threadClass = await handleSpamDetection(
        body,
        senderEmail,
        receiverEmail,
        thread.id,
        receiver.id,
        transaction
    );

    // Xử lý file đính kèm
    await handleFileAttachments(files, message.id, transaction);

    // Gửi notification qua socket
    emitNewThreadNotification(sender, receiver, thread, message, threadClass, body);

    return {
        thread,
        message,
        isExternal: false
    };
}
