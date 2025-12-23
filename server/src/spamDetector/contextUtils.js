// contextUtils.js
import { User, MailThread, MailThreadStatus, MailMessage } from '../../models/index.js';
import { encrypt as encryptFn, decrypt } from '../utils/crypto.js';

export async function checkSenderReputation(senderEmail, receiverEmail) {
    const sender = await User.findOne({ where: { email: encryptFn(senderEmail) }});
    const receiver = await User.findOne({ where: { email: encryptFn(receiverEmail) }});

    if (!sender || !receiver) return 0.1;

    const totalThreads = await MailThread.count({
        where: { senderId: sender.id, receiverId: receiver.id }
    });

    if (totalThreads === 0) return 0.1;

    // Đếm số thread mà Receiver thực sự có tương tác (phản hồi lại)
    //Đây là chìa khóa để chặn bot spam liên tục
    const interactedThreads = await MailThread.count({
        where: {
            senderId: sender.id,
            receiverId: receiver.id
        },
        include: [{
            model: MailMessage,
            as: 'messages',
            where: { senderId: receiver.id }
        }]
    });

    const spamThreads = await MailThreadStatus.count({
        where: { class: 'spam', userId: receiver.id },
        include: [{
            model: MailThread,
            as: 'thread',
            where: { senderId: sender.id, receiverId: receiver.id }
        }]
    });

    // Tính tỉ lệ tin tưởng dựa trên tương tác thực tế thay vì tổng số mail gửi đi
    // Nếu gửi 100 mail mà không ai trả lời, tỉ lệ này sẽ tiến về 0
    const interactionRatio = interactedThreads / totalThreads;
    const spamRatio = spamThreads / totalThreads;

    let reputation = (interactionRatio * 2) - (spamRatio * 5);

    // Giới hạn trong khoảng [0, 1]
    return Math.max(0, Math.min(1, reputation));
}

export async function analyzeContext(senderEmail, receiverEmail) {
    const sender = await User.findOne({ where: { email: encryptFn(senderEmail) } });
    const receiver = await User.findOne({ where: { email: encryptFn(receiverEmail) } });

    if (!sender || !receiver) return 0;

    const thread = await MailThread.findOne({
        where: { senderId: sender.id, receiverId: receiver.id }
    });

    if (!thread) return 0;

    // CHỈ đếm những tin nhắn mà Receiver (người nhận) phản hồi lại
    const replyFromReceiver = await MailMessage.count({
        where: {
            threadId: thread.id,
            senderId: receiver.id // Quan trọng: Phải là người nhận phản hồi
        }
    });

    if (replyFromReceiver === 0) return -1; // Phạt điểm nếu gửi mà không ai thèm trả lời

    // Điểm thưởng tăng rất chậm theo số lần phản hồi
    return Math.min(2, Math.log10(replyFromReceiver + 1) * 2);
}
