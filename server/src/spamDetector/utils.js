// utils.js

// Thêm từ khóa export trực tiếp trước các hàm
export function tokenize(text) {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .split(/\s+/)
        .filter(token => token.length > 0);
}

export function textToVector(tokens, vocab) {
    const vector = {};
    // Khởi tạo tất cả từ khóa trong từ điển bằng 0
    for (const word in vocab) {
        vector[word] = 0;
    }
    // Đếm tần suất và nhân trọng số của từ trong từ điển
    for (const token of tokens) {
        if (vocab[token] !== undefined) {
            vector[token] += 1;
        }
    }
    return vector;
}

export function calculateCosineSimilarity(emailVector, vocab) {
    let dotProduct = 0;
    let emailMagnitude = 0;
    let vocabMagnitude = 0;

    for (const key in vocab) {
        const v_email = emailVector[key] || 0;
        const v_vocab = vocab[key]; // Trọng số từ điển (ví dụ: 0.9)

        dotProduct += v_email * v_vocab;
        emailMagnitude += v_email ** 2;
        vocabMagnitude += v_vocab ** 2;
    }

    //return similarity
    return dotProduct / (Math.sqrt(emailMagnitude) * Math.sqrt(vocabMagnitude) || 1);
}