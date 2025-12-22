// contextUtils.js
import { User, MailThread, MailThreadStatus, MailMessage } from '../../models/index.js';
import { encrypt as encryptFn, decrypt } from '../utils/crypto.js';

export async function checkSenderReputation(senderEmail, receiverEmail) {
    // 1. Lấy thông tin cả 2 user
    const sender = await User.findOne({ where: { email: encryptFn(senderEmail) }});
    console.log(sender.id);
    const receiver = await User.findOne({ where: { email: encryptFn(receiverEmail) }});
    console.log(receiver.id);

    if (!sender || !receiver) return 1;

    // 2. Tổng số thread mà Sender đã gửi cho Receiver này
    const totalThreads = await MailThread.count({
        where: {
            senderId: sender.id,
            receiverId: receiver.id
        }
    });

    if (totalThreads === 0) return 1;

    // 3. Đếm số thread mà Receiver đã đánh dấu là spam
    // Lưu ý: userId ở MailThreadStatus chính là id của Receiver
    const spamThreads = await MailThreadStatus.count({
        where: {
            class: 'spam',
            userId: receiver.id
        },
        include: [{
            model: MailThread,
            as: 'thread', // THỬ NGHIỆM: Nếu vẫn lỗi, hãy đổi thành 'thread'
            where: {
                senderId: sender.id,
                receiverId: receiver.id
            }
        }]
    });

    // 4. Tính tỉ lệ
    return 1 - (spamThreads / totalThreads);
}

export async function analyzeContext(senderEmail, receiverEmail) {
    const sender = await User.findOne({ where: { email: encryptFn(senderEmail) } });
    const receiver = await User.findOne({ where: { email: encryptFn(receiverEmail) } });

    if (!sender || !receiver) return 0;

    const thread = await MailThread.findOne({
        where: {
            senderId: sender.id,
            receiverId: receiver.id
        }
    });

    if (!thread) return 0;

    const replyCount = await MailMessage.count({
        where: { threadId: thread.id }
    });

    // Reply score có giới hạn
    return Math.min(3, Math.log2(replyCount + 1));
}

