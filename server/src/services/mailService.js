// src/services/mailService.js
import { User, EmailMessage, sequelizeInstance as sequelize } from '../../models/index.js';
import { encrypt as encryptFn, decrypt } from '../utils/crypto.js';
import {Op} from "sequelize";

/**
 * saveEmail(senderEmail, recipientEmail, subject, body, { encrypted })
 * - nếu encrypted === true => subject/body đã mã hóa trên client, lưu trực tiếp bằng setDataValue
 * - nếu encrypted === false => subject/body plaintext, model sẽ mã hóa qua setter mặc định
 */

function isValidId(v) {
    return typeof v === 'number' && Number.isInteger(v) || (typeof v === 'string' && /^\d+$/.test(v));
}

export async function saveEmail(senderIdentifier, recipientIdentifier, subject, body, options = { encrypted: false }) {
    const t = await sequelize.transaction();
    try {
        // resolve sender
        let sender;
        if (isValidId(senderIdentifier)) {
            sender = await User.findByPk(parseInt(senderIdentifier, 10), { transaction: t });
        } else {
            sender = await User.findOne({ where: { email: encryptFn(String(senderIdentifier)) }, transaction: t });
        }

        // resolve recipient
        let recipient;
        if (isValidId(recipientIdentifier)) {
            recipient = await User.findByPk(parseInt(recipientIdentifier, 10), { transaction: t });
        } else {
            recipient = await User.findOne({ where: { email: encryptFn(String(recipientIdentifier)) }, transaction: t });
        }

        if (!sender || !recipient) {
            // throw and let outer catch handle the rollback once
            throw new Error('Sender or recipient not found');
        }

        if (options.encrypted) {
            const msg = EmailMessage.build({
                senderId: sender.id,
                recipientId: recipient.id,
                sentAt: new Date()
            });
            msg.setDataValue('subject', subject); // already encrypted
            msg.setDataValue('body', body);       // already encrypted
            await msg.save({ hooks: false, validate: false, transaction: t });
        } else {
            await EmailMessage.create({
                senderId: sender.id,
                recipientId: recipient.id,
                subject,
                body
            }, { transaction: t });
        }

        await t.commit();

        // 🔥 Emit realtime event nếu recipient đang online
        if (global._io && recipient.email) {
            const payload = {
                id: Date.now(), // tạm id giả, hoặc lấy id thực sau khi lưu
                senderId: sender.id,
                recipientId: recipient.id,
                fromEmail: sender.email,
                toEmail: recipient.email,
                subject,
                body,
                sentAt: new Date(),
            };
            console.log(JSON.stringify(payload));
            const recipientEmailPlain = decrypt(recipient.getDataValue('email'));
            const senderEmailPlain = decrypt(sender.getDataValue('email'));

            payload.fromEmail = senderEmailPlain;
            payload.toEmail = recipientEmailPlain;

            global._io.to(recipientEmailPlain).emit('newMail', payload);
            global._io.to(senderEmailPlain).emit('newMail', payload); // optional: để người gửi cũng update realtime
        }

        return true;
    } catch (err) {
        // rollback only if transaction not already finished
        try {
            if (t && !t.finished) {
                await t.rollback();
            }
        } catch (rbErr) {
            console.error('Transaction rollback failed:', rbErr);
        }
        throw err;
    }
}

/**
 * getInbox(email, { raw = true })
 * - Trả về list messages cho recipient.
 * - IMPORTANT: model getters hiện tại trả về decrypted strings (get subject(), get body()).
 * - Nếu bạn muốn trả về **encrypted** values (để client tự giải mã), set raw = true.
 */
export async function getInbox(email, options = { raw: false }) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return [];

    const messages = await EmailMessage.findAll({
        where: { recipientId: user.id },
        order: [['sentAt', 'DESC']]
    });

    if (options.raw) {
        // trả về giá trị nguyên (đã mã hóa) bằng getDataValue
        return messages.map(m => ({
            id: m.id,
            subject_encrypted: m.getDataValue('subject'),
            body_encrypted: m.getDataValue('body'),
            recipientId: m.recipientId,
            senderId: m.senderId,
            sentAt: m.sentAt
        }));
    }

    // mặc định: trả về decrypted (theo getter trong model)
    return messages.map(m => ({
        id: m.id,
        subject: m.subject,
        body: m.body,
        recipientId: m.recipientId,
        senderId: m.senderId,
        sentAt: m.sentAt
    }));
}

/**
 * getMessageById(email, id, { raw = true })
 */
export async function getMessageById(email, id, options = { raw: false }) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return null;
    const msg = await EmailMessage.findOne({ where: { id, recipientId: user.id } });
    if (!msg) return null;
    if (options.raw) {
        return {
            id: msg.id,
            subject_encrypted: msg.getDataValue('subject'),
            body_encrypted: msg.getDataValue('body'),
            senderId: msg.senderId,
            sentAt: msg.sentAt
        };
    }
    return {
        id: msg.id,
        subject: msg.subject,
        body: msg.body,
        senderId: msg.senderId,
        sentAt: msg.sentAt
    };

}

// 🔹 Lấy danh sách hội thoại (2 chiều)
export async function getConversations(email) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return [];
    console.log("getConversations for user:", user.id);

    const messages = await EmailMessage.findAll({
        where: {
            [Op.or]: [{ senderId: user.id }, { recipientId: user.id }],
        },
        order: [['sentAt', 'DESC']],
    });

    // group by partnerId and keep most recent message per partner
    const convoMap = new Map();
    for (const msg of messages) {
        const partnerId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
        if (!convoMap.has(partnerId)) {
            convoMap.set(partnerId, {
                partnerId,
                lastMessage: msg.body,      // getter -> decrypted
                lastSentAt: msg.sentAt,
            });
        }
    }

    // batch load partner users
    const partnerIds = Array.from(convoMap.keys());
    let partners = [];
    if (partnerIds.length) {
        partners = await User.findAll({
            where: { id: partnerIds },
        });
    }
    const partnerById = new Map(partners.map(p => [p.id, p]));

    // build convo list and sort by lastSentAt desc
    const convos = partnerIds.map(pid => {
        const convo = convoMap.get(pid);
        const partner = partnerById.get(pid);
        return {
            partnerId: pid,
            partnerEmail: partner ? partner.email : 'Unknown', // getter -> decrypted
            lastMessage: convo.lastMessage,
            lastSentAt: convo.lastSentAt,
        };
    }).sort((a, b) => b.lastSentAt - a.lastSentAt);

    return convos;
}

// 🔹 Lấy chi tiết hội thoại giữa 2 người
export async function getConversationMessages(email, partnerId) {
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return [];

    const messages = await EmailMessage.findAll({
        where: {
            [Op.or]: [
                { senderId: user.id, recipientId: partnerId },
                { senderId: partnerId, recipientId: user.id },
            ],
        },
        order: [['sentAt', 'ASC']],
    });

    return messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        subject: m.subject,
        body: m.body,
        sentAt: m.sentAt,
    }));
}