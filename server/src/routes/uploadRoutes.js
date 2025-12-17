// File: `server/src/controllers/uploadRoutes.js`
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../../models/index.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${unique}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// POST /api/files/upload
// form-data: files: <file1>, files: <file2>, ..., messageId: <number>
router.post('/upload', upload.array('files', 5), async (req, res) => {
    try {
        const { messageId } = req.body;
        if (!messageId) return res.status(400).json({ error: 'messageId is required' });
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'files are required' });

        const files = req.files;
        const created = await Promise.all(files.map(file =>
            db.File.create({
                messageId: parseInt(messageId, 10),
                fileName: file.originalname,
                filePath: `/uploads/${file.filename}`,
                fileSize: file.size,
                mimeType: file.mimetype
            })
        ));

        return res.status(201).json(created);
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Failed to save files' });
    }
});

export default router;
