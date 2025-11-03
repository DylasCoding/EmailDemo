// src/services/authService.js
import jwt from 'jsonwebtoken';
import { User } from '../../models/index.js';
import { encrypt as encryptFn } from '../utils/crypto.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = '7d';

export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

export async function loginUser(email, password) {
    // your user model has comparePassword method
    const user = await User.findOne({ where: { email: encryptFn(email) } });
    if (!user) return null;
    const ok = await user.comparePassword(password);
    if (!ok) return null;
    const token = generateToken({ id: user.id, email: email });
    return { user, token };
}
