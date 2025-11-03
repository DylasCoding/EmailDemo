// File: client/src/utils/ClientCrypto.js
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
const IV_VALUE = process.env.REACT_APP_IV;

if (!ENCRYPTION_KEY) throw new Error('Missing REACT_APP_ENCRYPTION_KEY (must be 32 chars, raw UTF-8)');
if (!IV_VALUE) throw new Error('Missing REACT_APP_IV (must be 16 chars, raw UTF-8)');
if (ENCRYPTION_KEY.length !== 32) throw new Error(`REACT_APP_ENCRYPTION_KEY must be 32 chars (got ${ENCRYPTION_KEY.length})`);
if (IV_VALUE.length !== 16) throw new Error(`REACT_APP_IV must be 16 chars (got ${IV_VALUE.length})`);

function hexToUint8Array(hex) {
    if (typeof hex !== 'string' || hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
}

function safeBase64ToUint8Array(b64) {
    if (!b64 || typeof b64 !== 'string') return null;
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
    try {
        const binary = atob(padded);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    } catch (e) {
        return null;
    }
}

async function importAesCbcKey(rawKeyBytes) {
    return await window.crypto.subtle.importKey('raw', rawKeyBytes, { name: 'AES-CBC' }, false, ['decrypt']);
}

function extractStringPayload(input) {
    // if server returned an object, try common fields
    if (typeof input === 'object' && input !== null) {
        for (const key of ['data', 'encrypted', 'ciphertext', 'cipher', 'result', 'message']) {
            if (typeof input[key] === 'string') return input[key];
        }
        return null;
    }
    return input;
}

/**
 * Decrypt hex or base64 ciphertext produced by server using AES-256-CBC with raw UTF-8 key/iv.
 */
export async function decrypt(raw) {
    if (raw === undefined || raw === null || raw === '') return raw;

    const extracted = extractStringPayload(raw);
    if (!extracted || typeof extracted !== 'string') {
        console.error('ClientCrypto.decrypt: payload is not a string and no known field found', raw);
        throw new Error('Unsupported encrypted payload format: expected hex string (server AES-CBC output)');
    }

    // clean up common wrappers/quotes and trim
    let encrypted = extracted.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');

    // short preview for logs (avoid leaking full secrets)
    const preview = encrypted.length > 200 ? `${encrypted.slice(0, 200)}...` : encrypted;
    console.debug('ClientCrypto.decrypt input preview:', preview);

    // hex case (server currently uses hex)
    if (/^[0-9a-fA-F]+$/.test(encrypted) && encrypted.length % 2 === 0) {
        const cipherBytes = hexToUint8Array(encrypted);
        const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
        const ivBytes = new TextEncoder().encode(IV_VALUE);

        if (keyBytes.length !== 32) throw new Error(`Imported key must be 32 bytes, got ${keyBytes.length}`);
        if (ivBytes.length !== 16) throw new Error(`Imported IV must be 16 bytes, got ${ivBytes.length}`);

        const key = await importAesCbcKey(keyBytes);
        try {
            const plain = await window.crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBytes }, key, cipherBytes);
            return new TextDecoder().decode(plain);
        } catch (e) {
            console.error('AES-CBC decrypt failed (hex):', e);
            throw e;
        }
    }

    // fallback: try base64 decode (url-safe) and treat as raw ciphertext bytes (still AES-CBC)
    const base64Bytes = safeBase64ToUint8Array(encrypted);
    if (base64Bytes && base64Bytes.length > 0) {
        const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
        const ivBytes = new TextEncoder().encode(IV_VALUE);

        const key = await importAesCbcKey(keyBytes);
        try {
            const plain = await window.crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBytes }, key, base64Bytes);
            return new TextDecoder().decode(plain);
        } catch (e) {
            console.error('AES-CBC decrypt failed (base64):', e);
            throw e;
        }
    }

    // nothing matched — include a short preview to help debugging
    throw new Error(`Unsupported encrypted payload format: expected hex string (server AES-CBC output). Preview: ${preview}`);
}

const ClientCrypto = { decrypt };
export default ClientCrypto;
