// src/services/mailService.js
import {
    User,
    MailThread,
    MailMessage,
    MailThreadStatus,
    sequelizeInstance as sequelize,
    ExternalEmailLog
} from '../../models/index.js';
import { encrypt as encryptFn, decrypt } from '../utils/crypto.js';
import { Op } from "sequelize";
import fs from 'fs/promises';
import path from 'path';
import {isSpam} from '../spamDetector/spamDetector.js';
import {sendEmailWithSendGrid} from "./sendGridService.js";
import {findUserByEmail, isExternalEmail, sendExternalEmail, sendInternalEmail} from './Helper/emailHelpers.js';
import {findGmailThreadIdByToken, sendReplyViaGmail} from "./Helper/gmailHelper.js";
import {detectAppointmentsBatch} from "./ai_appointment.service.js";

// 📨1 Main Function: Soạn thư mới (tạo thread + message)
export async function createNewThreadAndMessage(
    senderEmail,
    receiverEmail,
    subject,
    body,
    files = []
) {
    const t = await sequelize.transaction();
    console.log(body, senderEmail, receiverEmail);

    try {
        // Tìm sender trong hệ thống (sender luôn phải có trong CSDL)
        const sender = await findUserByEmail(senderEmail, t);
        if (!sender) {
            throw new Error('Sender not found with email: ' + senderEmail);
        }

        let result;

        // Kiểm tra email đích có phải external không
        if (isExternalEmail(receiverEmail)) {
            // Gửi external email: không tìm receiver, chỉ gửi qua SendGrid và log
            result = await sendExternalEmail(
                senderEmail,
                receiverEmail,
                subject,
                body,
                sender.id,
                t
            );
        } else {
            // Gửi internal email: tìm receiver trong CSDL, xử lý đầy đủ
            result = await sendInternalEmail(
                senderEmail,
                receiverEmail,
                subject,
                body,
                files,
                sender,
                t
            );
        }

        await t.commit();
        return result;

    } catch (err) {
        await t.rollback();
        throw err;
    }
}

/// 💬 2. Gửi trong hội thoại đã có
export async function sendMessageInThread(senderEmail, threadId, body, files = []) {
    console.log(body);
    const t = await sequelize.transaction();
    try {
        const sender = await User.findOne({
            where: { email: encryptFn(senderEmail) },
            transaction: t
        });

        const realThreadId =
            typeof threadId === 'object'
                ? threadId.id || threadId.threadId
                : threadId;

        if (!realThreadId || isNaN(realThreadId)) {
            console.log('Invalid threadId, raw value:', threadId);
            throw new Error('Invalid threadId');
        }

        const thread = await MailThread.findByPk(Number(realThreadId), { transaction: t });
        if (!sender || !thread) throw new Error('Invalid sender or thread');

        const message = await MailMessage.create({
            threadId: thread.id,
            senderId: sender.id,
            body,
        }, { transaction: t });

        // Build file records with same fallback logic as createNewThreadAndMessage
        const fileRecords = (files || []).map(file => {
            const originalname = file.originalname || file.name || file.filename || null;
            const filepath = file.path || (file.destination && file.filename ? `${file.destination}/${file.filename}` : null) || file.filepath || null;
            const mimetype = file.mimetype || file.type || null;
            const size = file.size || file.bytes || file.sizeBytes || null;

            return {
                messageId: message.id,
                fileName: originalname,
                filePath: filepath,
                fileSize: size,
                mimeType: mimetype
            };
        }).filter(r => r.fileName || r.filePath);

        if (fileRecords.length > 0) {
            await sequelize.models.File.bulkCreate(fileRecords, { transaction: t });
        }

        await thread.update({ updatedAt: new Date() }, { transaction: t });
        await t.commit();

        // Determine the other participant (the "recipient" relative to sender)
        const receiverId = thread.senderId === sender.id ? thread.receiverId : thread.senderId;
        const receiver = await User.findByPk(receiverId);
        if (!receiver) return message;

        // Decrypted emails
        const senderEmailStr = decrypt(sender.getDataValue('email'));
        const receiverEmailStr = decrypt(receiver.getDataValue('email'));

        // Core payload fields shared
        const base = {
            id: message.id,
            threadId: thread.id,
            senderId: sender.id,
            receiverId,
            body,
            sentAt: message.sentAt,
            lastMessage: body,
            lastSentAt: message.sentAt,
            title: thread.title || '(No subject)',
            class: thread.class || 'normal'
        };

        const payloadForReceiver = {
            ...base,
            fromEmail: senderEmailStr,
            toEmail: receiverEmailStr,
            partnerEmail: senderEmailStr,
            partnerId: sender.id
        };

        const payloadForSender = {
            ...base,
            fromEmail: senderEmailStr,
            toEmail: receiverEmailStr,
            partnerEmail: receiverEmailStr,
            partnerId: receiver.id
        };

        if (global._io) {
            global._io.to(receiverEmailStr).emit('newMail', payloadForReceiver);
            global._io.to(senderEmailStr).emit('newMail', payloadForSender);
        }
        // If recipient is external Gmail, try to append this reply into the Gmail conversation
        try {
            if (isExternalEmail(receiverEmailStr)) {
                // Find ExternalEmailLog linked to this thread (initial external outgoing message)
                const extLog = await ExternalEmailLog.findOne({
                    where: { threadId: thread.id }
                });
                if (extLog && extLog.trackingToken) {
                    // existing logic: findGmailThreadIdByToken(...) and sendReplyViaGmail(...)
                }

                if (extLog && extLog.trackingToken) {
                    try {
                        // search Gmail for the token to obtain provider thread id and one message id
                        const provider = await findGmailThreadIdByToken(global.gmailClient, extLog.trackingToken);
                        if (provider && provider.threadId) {
                            // try to read original Message-ID header to set In-Reply-To/References
                            let originalMessageId = null;
                            try {
                                const msgDetail = await global.gmailClient.users.messages.get({
                                    userId: 'me',
                                    id: provider.messageId,
                                    format: 'metadata',
                                    metadataHeaders: ['Message-ID']
                                });
                                originalMessageId = msgDetail?.data?.payload?.headers?.find(h => h.name.toLowerCase() === 'message-id')?.value || null;
                            } catch (e) {
                                // continue even if we cannot fetch the full metadata
                                console.warn('Could not fetch original Message-ID header:', e?.message || e);
                            }

                            await sendReplyViaGmail(
                                global.gmailClient,
                                receiverEmailStr,
                                thread.title || '(No subject)',
                                body,
                                provider.threadId,
                                extLog.trackingToken,
                                originalMessageId
                            );
                            console.log(`✅ Gmail reply sent to ${receiverEmailStr} in thread ${provider.threadId} (found by trackingToken)`);
                        } else {
                            console.log('⚠️ No Gmail thread found by trackingToken — cannot append to Gmail conversation.');
                        }
                    } catch (gErr) {
                        console.error('❌ sendReplyViaGmail (via token search) failed:', gErr);
                    }
                } else {
                    console.log('⚠️ No ExternalEmailLog with trackingToken found for this thread — cannot append to Gmail conversation.');
                }
            }
        } catch (err) {
            console.error('❌ Error while attempting Gmail reply flow:', err);
        }

        return message;
    } catch (err) {
        await t.rollback();
        throw err;
    }
}

// 🧭 Hộp thư đến (Inbox)
export async function getInbox(email) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return [];

    const threads = await MailThread.findAll({
        where: { receiverId: user.id },
        include: [{ model: User, as: 'sender' }],
        order: [['updatedAt', 'DESC']]
    });

    return threads.map(t => ({
        id: t.id,
        title: t.title,
        classType: t.classType,
        senderEmail: t.sender ? t.sender.email : null,
        updatedAt: t.updatedAt
    }));
}

// 🧾 Danh sách hội thoại
export async function getConversations(email) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return [];

    // Include statuses for the current user (if any) and pick class from there first
    const threads = await MailThread.findAll({
        where: {
            [Op.or]: [{ senderId: user.id }, { receiverId: user.id }]
        },
        include: [
            {
                model: MailMessage,
                as: 'messages',
                limit: 1,
                separate: true,
                order: [['sentAt', 'DESC']]
            },
            { model: User, as: 'sender' },
            { model: User, as: 'receiver' },
            {
                model: MailThreadStatus,
                as: 'statuses',
                where: { userId: user.id },
                required: false
            }
        ],
        order: [['updatedAt', 'DESC']]
    });

    return threads.map(t => {
        const partner = (t.senderId === user.id) ? t.receiver : t.sender;
        const lastMsg = t.messages?.[0];

        // Prefer per-user status, then thread-level class, then fallback to 'normal'
        const effectiveClass = t.statuses?.[0]?.class || t.class || 'normal';

        let isRead = true;
        let lastSenderId = null;

        if (lastMsg) {
            lastSenderId = lastMsg.senderId;
            isRead = false;

            // if (lastMsg.senderId === user.id) {
            //     // Tin nhắn do chính user gửi → luôn coi là đã đọc
            //     isRead = true;
            // } else {
            //     // Tin nhắn từ người khác → lấy theo DB
            //     isRead = lastMsg.isRead;
            // }
        }

        return {
            threadId: t.id,
            title: t.title || '(No subject)',
            class: effectiveClass,
            partnerId: partner?.id ?? null,
            partnerEmail: partner ? decrypt(partner.email) : null,
            lastMessage: lastMsg ? lastMsg.body : '',
            lastSentAt: lastMsg ? lastMsg.sentAt : t.updatedAt,
            isRead,
            lastSenderId,
        };
    });
}

// 💬 Chi tiết hội thoại
export async function getConversationMessagesByThread(email, threadId) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return [];

    const thread = await MailThread.findOne({
        where: { id: threadId, [Op.or]: [{ senderId: user.id }, { receiverId: user.id }] }
    });

    if (!thread) return [];

    const messages = await MailMessage.findAll({
        where: { threadId: thread.id },
        order: [['sentAt', 'ASC']],
        include: [{ model: sequelize.models.File, as: 'files', required: false }]
    });

    // 1. Chuẩn bị danh sách body đã decrypt để gửi cho AI
    const decryptedTexts = messages.map(m => decrypt(m.body));

    // 2. Gọi AI để kiểm tra lịch hẹn hàng loạt
    let aiResults = [];
    try {
        aiResults = await detectAppointmentsBatch(decryptedTexts);
    } catch (error) {
        console.error("AI Service Error:", error);
        // Nếu AI lỗi, vẫn tiếp tục trả về tin nhắn nhưng không có thông tin lịch hẹn
    }

    // 3. Xử lý tin nhắn và đính kèm file + dữ liệu AI
    const results = await Promise.all(messages.map(async (m, index) => {
        // Xử lý tệp đính kèm
        const files = await Promise.all((m.files || []).map(async f => {
            if (!f.filePath) return null;
            try {
                const abs = path.resolve(f.filePath);
                const buf = await fs.readFile(abs);
                return {
                    id: f.id,
                    fileName: f.fileName,
                    mimeType: f.mimeType,
                    fileSize: f.fileSize,
                    dataBase64: buf.toString('base64')
                };
            } catch (err) { return null; }
        }));

        // Lấy kết quả AI tương ứng với vị trí (index) của tin nhắn
        const aiInfo = aiResults[index];

        return {
            id: m.id,
            body: m.body, // Giữ nguyên nội dung cũ (mã hóa hoặc gốc) theo yêu cầu
            senderId: m.senderId,
            sentAt: m.sentAt,
            files: files.filter(Boolean),
            // Chỉ thêm trường appointment nếu AI phát hiện là cuộc hẹn
            appointment: (aiInfo && aiInfo.isAppointment) ? {
                start: aiInfo.details.startTime,
                end: aiInfo.details.endTime,
                title: aiInfo.details.title,
                date: aiInfo.details.date
            } : null
        };
    }));

    return results;
}

export async function updateUserThreadStatus(threadId, userId, newClass) {
    if (!threadId || !userId || !["normal", "star", "spam"].includes(newClass))
        throw new Error("Invalid parameters");

    const thread = await MailThread.findByPk(threadId);
    if (!thread) throw new Error("Thread not found");

    const [status, created] = await MailThreadStatus.findOrCreate({
        where: { threadId, userId },
        defaults: { class: newClass }
    });

    if (!created) {
        // overwrite existing per-user status
        status.class = newClass;
        await status.save();
    }
    return status;
}