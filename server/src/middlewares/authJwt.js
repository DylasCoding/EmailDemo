// src/middlewares/authJwt.js
import { verifyToken } from '../services/authService.js';
import { User } from '../../models/index.js';
import { encrypt as encryptFn } from '../utils/crypto.js';

export async function authenticateJWT(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, error: 'No token' });
    const token = auth.split(' ')[1];
    const data = verifyToken(token);
    if (!data) return res.status(401).json({ success: false, error: 'Invalid token' });

    // attach user email to req.user (we stored email in token payload)
    req.user = { id: data.id, email: data.email };
    next();
}
