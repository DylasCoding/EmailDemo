import { aiClient } from "../utils/ai_httpClient.js";

/**
 * Check 1 đoạn text có phải cuộc hẹn không
 * @param {string} text
 */
export async function detectAppointment(text) {
    if (!text || typeof text !== "string") {
        return { isAppointment: false, confidence: 0 };
    }

    const res = await aiClient.post("/predict", { text });

    return {
        isAppointment: res.data.isAppointment,
        confidence: res.data.confidence
    };
}

/**
 * Check nhiều đoạn text cùng lúc
 * @param {string[]} texts
 */
export async function detectAppointmentsBatch(texts = []) {
    if (!Array.isArray(texts) || texts.length === 0) {
        return [];
    }

    const res = await aiClient.post("/predict/batch", { texts });

    return res.data.results;
}
