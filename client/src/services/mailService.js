import axios from 'axios';
import { decrypt } from '../utils/ClientCrypto';

const API_URL = 'http://localhost:3000/api';

const isHexString = (s) => typeof s === 'string' && /^[0-9a-fA-F]+$/.test(s);

const tryDecryptString = (s) => {
    try {
        const dec = decrypt(s);
        return dec === '' || dec ? dec : s;
    } catch {
        return s;
    }
};

const deepDecrypt = (value) => {
    if (Array.isArray(value)) return value.map(deepDecrypt);
    if (value && typeof value === 'object') {
        const out = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                out[key] = deepDecrypt(value[key]);
            }
        }
        return out;
    }
    if (typeof value === 'string') {
        if (isHexString(value)) {
            const decrypted = tryDecryptString(value);
            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        }
        return value;
    }
    return value;
};

const register = async (userData) => {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    return deepDecrypt(response.data);
};

const login = async (credentials) => {
    const response = await axios.post(`${API_URL}/users/login`, credentials);
    return deepDecrypt(response.data);
};

const sendEmail = async (emailData) => {
    const response = await axios.post(`${API_URL}/emails`, emailData);
    return deepDecrypt(response.data);
};

const getSentEmails = async (userId) => {
    const response = await axios.get(`${API_URL}/emails/sent?userId=${userId}`);
    return deepDecrypt(response.data);
};

const getReceivedEmails = async (userId) => {
    const response = await axios.get(`${API_URL}/emails/received?userId=${userId}`);
    return deepDecrypt(response.data);
};

export default {
    register,
    login,
    sendEmail,
    getSentEmails,
    getReceivedEmails
};