// utils.js

// Thêm từ khóa export trực tiếp trước các hàm
export function tokenize(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .filter(token => token.length > 0); // Lọc bỏ khoảng trắng thừa
}

export function textToVector(tokens, vocab) {
    const vector = {};
    for (const word of tokens) {
        if (vocab[word]) {
            vector[word] = (vector[word] || 0) + 1;
        }
    }
    return vector;
}

export function cosineSimilarity(v1, v2) {
    let dot = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (const key in v1) {
        dot += (v1[key] || 0) * (v2[key] || 0);
        mag1 += v1[key] ** 2;
    }

    for (const key in v2) {
        mag2 += v2[key] ** 2;
    }

    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
}