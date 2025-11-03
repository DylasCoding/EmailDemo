// src/services/userService.js
import { User } from '../../models/index.js';
import { encrypt, comparePassword } from '../utils/crypto.js';

/**
 * Xác thực user qua email và password.
 * Dùng cho POP3 khi client nhập USER / PASS.
 */
export async function authenticateUser(email, password) {
    try {
        // Do email trong DB đã được mã hóa nên phải mã hóa trước khi tìm
        const encryptedEmail = encrypt(email);
        const user = await User.findOne({ where: { email: encryptedEmail } });

        if (!user) {
            console.warn(`⚠️  User not found: ${email}`);
            return false;
        }

        const valid = await comparePassword(password, user.password);
        console.log(valid ? `✅ Auth success for ${email}` : `❌ Wrong password for ${email}`);
        return valid;
    } catch (err) {
        console.error('❌ Auth error:', err);
        return false;
    }
}

/**
 * Đăng ký người dùng mới (nếu bạn muốn thêm tính năng này)
 */
export async function registerUser(firstName, lastName, email, password) {
    try {
        const existing = await User.findOne({ where: { email: encrypt(email) } });
        if (existing) throw new Error('Email already exists');

        const newUser = await User.create({ firstName, lastName, email, password });
        console.log(`👤 Created new user: ${email}`);
        return newUser;
    } catch (err) {
        console.error('❌ Register error:', err);
        throw err;
    }
}
