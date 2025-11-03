// javascript
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV = process.env.IV;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('Invalid ENCRYPTION_KEY: Must be 32 bytes long');
}

if (!IV || IV.length !== 16) {
    throw new Error('Invalid IV: Must be 16 bytes long');
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'utf8');
const IV_BUFFER = Buffer.from(IV, 'utf8');

export const encrypt = (text) => {
    if (text === undefined || text === null || text === '') return text;
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY_BUFFER, IV_BUFFER);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

export const decrypt = (encryptedText) => {
    if (encryptedText === undefined || encryptedText === null || encryptedText === '') return encryptedText;
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY_BUFFER, IV_BUFFER);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
