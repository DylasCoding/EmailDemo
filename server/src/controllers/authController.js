// src/controllers/authController.js
import { registerUser, authenticateUser } from '../services/userService.js';
import { loginUser } from '../services/authService.js';

export async function register(req, res) {
    try {
        const { firstName, lastName, email, password } = req.body;
        const user = await registerUser(firstName, lastName, email, password);
        res.json({ success: true, user: { id: user.id, email } });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        if (!result) return res.status(401).json({ success: false, error: 'Invalid credentials' });
        res.json({ success: true, token: result.token });
        console.log(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
