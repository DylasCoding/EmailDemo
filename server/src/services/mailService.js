// src/services/mailService.js
import { User, MailThread, MailMessage,MailThreadStatus, sequelizeInstance as sequelize } from '../../models/index.js';
import { encrypt as encryptFn, decrypt } from '../utils/crypto.js';
import { Op } from "sequelize";
import fs from 'fs/promises';
import path from 'path';

function isValidId(v) {
    return typeof v === 'number' && Number.isInteger(v) || (typeof v === 'string' && /^\d+$/.test(v));
}

// 📨 1. Soạn thư mới (tạo thread + message)
export async function createNewThreadAndMessage(senderEmail, receiverEmail, subject, body, files = []) {
    const t = await sequelize.transaction();
    try {
        const sender = await User.findOne({ where: { email: encryptFn(senderEmail) }, transaction: t });
        const receiver = await User.findOne({ where: { email: encryptFn(receiverEmail) }, transaction: t });
        if (!sender || !receiver) throw new Error('Sender or receiver not found');

        const thread = await MailThread.create({
            title: subject || '(no subject)',
            class: 'normal',
            senderId: sender.id,
            receiverId: receiver.id,
        }, { transaction: t });

        const message = await MailMessage.create({
            threadId: thread.id,
            senderId: sender.id,
            body,
        }, { transaction: t });

        // Build file records with fallbacks to handle different multer shapes / model column names
        const fileRecords = files.map(file => {
            const originalname = file.originalname || file.name || file.filename || null;
            const filepath = file.path || (file.destination && file.filename ? `${file.destination}/${file.filename}` : null) || file.filepath || null;
            const mimetype = file.mimetype || file.type || null;
            const size = file.size || file.bytes || file.sizeBytes || null;

            return {
                messageId: message.id,
                fileName: originalname,   // match DB column
                filePath: filepath,       // match DB column
                fileSize: size,           // match DB column
                mimeType: mimetype        // match DB column
            };
        }).filter(r => r.fileName || r.filePath);

        // then bulkCreate as before
        if (fileRecords.length > 0) {
            await sequelize.models.File.bulkCreate(fileRecords, { transaction: t });
        }

        await t.commit();

        // --- realtime emit code unchanged ---
        if (global._io && receiver.email) {
            const senderEmailStr = decrypt(sender.getDataValue('email'));
            const receiverEmailStr = decrypt(receiver.getDataValue('email'));

            const payload = {
                threadId: thread.id,
                id: thread.id,
                title: thread.title || '(Không có tiêu đề)',
                class: thread.class || 'normal',
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

        return { thread, message };
    } catch (err) {
        await t.rollback();
        throw err;
    }
}

/// 💬 2. Gửi trong hội thoại đã có
export async function sendMessageInThread(senderEmail, threadId, body, files = []) {
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
            console.log('❌ Invalid threadId, raw value:', threadId);
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


// 📬 Lấy chi tiết 1 thread theo ID (bao gồm danh sách tin nhắn)
export async function getMailById(email, threadId) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) throw new Error('User not found');

    // 🔍 Kiểm tra xem user có nằm trong thread này không
    const thread = await MailThread.findOne({
        where: {
            id: threadId,
            [Op.or]: [
                { senderId: user.id },
                { receiverId: user.id },
            ],
        },
        include: [
            { model: User, as: 'sender' },
            { model: User, as: 'receiver' },
            {
                model: MailMessage,
                as: 'messages',
                order: [['sentAt', 'ASC']],
            },
        ],
    });

    if (!thread) throw new Error('Thread not found or access denied');

    return {
        id: thread.id,
        title: thread.title,
        class: thread.class,
        sender: thread.sender ? decrypt(thread.sender.email) : null,
        receiver: thread.receiver ? decrypt(thread.receiver.email) : null,
        messages: thread.messages.map((m) => ({
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            sentAt: m.sentAt,
        })),
    };
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

        return {
            threadId: t.id,
            title: t.title || '(No subject)',
            class: effectiveClass,
            partnerId: partner?.id ?? null,
            partnerEmail: partner ? decrypt(partner.email) : null,
            lastMessage: lastMsg ? lastMsg.body : '',
            lastSentAt: lastMsg ? lastMsg.sentAt : t.updatedAt
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

    const results = await Promise.all(messages.map(async m => {
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
            } catch (err) {
                // if file missing or unreadable, skip it
                return null;
            }
        }));
        return {
            id: m.id,
            body: m.body,
            senderId: m.senderId,
            sentAt: m.sentAt,
            files: files.filter(Boolean)
        };
    }));

    return results;
}

export async function updateThreadClass(threadId, newClass) {
    if (!threadId || !["normal", "star", "spam"].includes(newClass))
        throw new Error("Invalid threadId or class value");

    const thread = await MailThread.findByPk(threadId);
    if (!thread) throw new Error("Thread not found");

    // Keep this as a global thread-level class change only (do NOT create per-user statuses here)
    thread.class = newClass;
    await thread.save();

    if (global._io) {
        global._io.emit("updateThreadClass", { threadId, newClass });
    }

    return thread;
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

// 📨 Lấy danh sách hội thoại của user kèm class cá nhân
export async function getUserThreadStatuses(userEmail) {
    const user = await User.findOne({ where: { email: encryptFn(userEmail) } });
    if (!user) throw new Error('User not found');

    const threads = await MailThread.findAll({
        include: [
            {
                model: MailThreadStatus,
                as: 'statuses',
                where: { userId: user.id },
                required: false
            }
        ],
        order: [['updatedAt', 'DESC']]
    });

    // Giải mã dữ liệu
    return threads.map(thread => ({
        id: thread.id,
        subject: thread.title ? decrypt(thread.title) : '(Không tiêu đề)',
        senderId: thread.senderId,
        receiverId: thread.receiverId,
        updatedAt: thread.updatedAt,
        class: thread.statuses?.[0]?.class || 'normal'
    }));
}


// ⭐ Cập nhật class cá nhân cho user
export async function setUserThreadStatus(userEmail, threadId, newClass) {
    if (!threadId || !['normal', 'star', 'spam'].includes(newClass))
        throw new Error('Invalid threadId or class');

    const user = await User.findOne({ where: { email: encryptFn(userEmail) } });
    if (!user) throw new Error('User not found');

    await MailThreadStatus.upsert({
        userId: user.id,
        threadId,
        class: newClass
    });

    return { threadId, class: newClass };
}
