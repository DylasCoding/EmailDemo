import { UserDeleteThread, MailThread, MailMessage, User, MailThreadStatus } from "../../models/index.js";
import { decrypt } from "../utils/crypto.js";
import { Op } from "sequelize";

export async function getAllTrashThreads(userId) {
    try {
        const trashRecords = await UserDeleteThread.findAll({
            where: { userId, isDeleteForever: false },
            include: [{
                model: MailThread,
                as: 'thread',
                required: true,
                include: [
                    // latest message
                    {
                        model: MailMessage,
                        as: 'messages',
                        separate: true,
                        limit: 1,
                        order: [['sentAt', 'DESC']]
                    },
                    // participants
                    { model: User, as: 'sender', required: false },
                    { model: User, as: 'receiver', required: false },
                    // per-user status (for effective class)
                    {
                        model: MailThreadStatus,
                        as: 'statuses',
                        where: { userId },
                        required: false
                    }
                ]
            }],
            order: [['createdAt', 'DESC']]
        });

        const threads = trashRecords
            .map(r => {
                const t = r.thread;
                if (!t) return null;

                const lastMsg = (t.messages && t.messages[0]) || null;
                const effectiveClass = (t.statuses && t.statuses[0] && t.statuses[0].class) || t.class || 'normal';

                // determine partner relative to the requesting user
                const partner = (t.senderId === Number(userId)) ? t.receiver : t.sender;

                let partnerEmail = null;
                try {
                    if (partner && partner.email) {
                        partnerEmail = decrypt(partner.email);
                    }
                } catch (e) {
                    partnerEmail = null;
                }

                let isRead = true;
                let lastSenderId = null;
                if (lastMsg) {
                    lastSenderId = lastMsg.senderId;
                    isRead = false;
                }

                return {
                    threadId: t.id,
                    title: t.title || '(No subject)',
                    class: effectiveClass,
                    partnerId: partner?.id ?? null,
                    partnerEmail,
                    lastMessage: lastMsg ? lastMsg.body : '',
                    lastSentAt: lastMsg ? lastMsg.sentAt : t.updatedAt,
                    isRead,
                    lastSenderId
                };
            })
            .filter(Boolean);

        return threads;
    } catch (error) {
        console.error("Error fetching trash threads:", error);
        throw error;
    }
}

export async function deleteThreadPermanently(userId, threadId) {
    try {
        const result = await UserDeleteThread.update(
            { isDeleteForever: true },
            { where: { userId, threadId } }
        );
        return result;
    } catch (error) {
        console.error("Error deleting thread permanently:", error);
        throw error;
    }
}

export async function restoreThreadFromTrash(userId, threadId) {
    try {
        const result = await UserDeleteThread.destroy({
            where: { userId, threadId }
        });
        return result;
    } catch (error) {
        console.error("Error restoring thread from trash:", error);
        throw error;
    }
}

export async function addToTrash(userId, threadId) {
    try {
        const [trashEntry, created] = await UserDeleteThread.findOrCreate({
            where: { userId, threadId },
            defaults: { isDeleteForever: false }
        });
        if (!created) {
            trashEntry.isDeleteForever = false;
            await trashEntry.save();
        }
        return trashEntry;
    } catch (error) {
        console.error("Error adding thread to trash:", error);
        throw error;
    }
}
