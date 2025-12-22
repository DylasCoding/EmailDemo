// javascript
import express from 'express';
import { register, login } from '../controllers/authController.js';
import { google } from 'googleapis';

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "http://localhost:3000/api/auth/google/callback"
);

router.get('/google/login', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/gmail.modify', // read + modify
            'https://www.googleapis.com/auth/gmail.send'    // send
        ]
    });
    res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log("✅ REFRESH TOKEN:");
        console.log(tokens.refresh_token);
        res.json({
            message: "Refresh token retrieved. Copy it from server console.",
            refresh_token: tokens.refresh_token,
            all_tokens: tokens
        });
    } catch (error) {
        console.error("Error getting token:", error);
        res.status(500).send("Failed to get token");
    }
});

router.post('/register', register);
router.post('/login', login);

export default router;
