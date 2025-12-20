// spamDetector.js
const spamVocab = require("./spamWords");
const { tokenize, textToVector, cosineSimilarity } = require("./utils");

function isSpam(emailContent) {
    const tokens = tokenize(emailContent);

    const emailVector = textToVector(tokens, spamVocab);
    const spamVector = spamVocab; // vector chuẩn spam

    const similarity = cosineSimilarity(emailVector, spamVector);

    // ngưỡng spam (có thể giải thích trong báo cáo)
    return similarity > 0.2;
}

module.exports = isSpam;
