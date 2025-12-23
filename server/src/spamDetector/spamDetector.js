// spamDetector.js
import { spamVocab } from "./spamWords.js";
import {tokenize, textToVector, calculateCosineSimilarity} from "./utils.js";
import { checkSenderReputation, analyzeContext} from "./contextUtils.js";

// Rule-based Layer
function ruleBasedCheck(emailContent) {
    if (emailContent.includes("viagra")) return "FAIL";
    if (emailContent.includes("malware.exe")) return "FAIL";

    return "UNCERTAIN";
}

/// Chuyển đổi độ tương đồng Cosine thành điểm số (Scale 0-5)
function getContentScore(emailContent) {
    const tokens = tokenize(emailContent);
    const emailVector = textToVector(tokens, spamVocab);
    const similarity = calculateCosineSimilarity(emailVector, spamVocab);

    // similarity thường nằm trong khoảng 0 -> 1
    // Nhân 5 để ra thang điểm tối đa là 5 cho phần nội dung
    if (similarity > 0.7) return 5; // Rất giống spam
    if (similarity > 0.4) return 3; // Có dấu hiệu spam
    if (similarity > 0.2) return 1; // Hơi nghi ngờ
    return 0;
}

export async function isSpam(emailContent, senderEmail, receiverEmail) {
    let spamScore = 0;
    let trustScore = 0;

    // 1. Rule-based: Check nhanh các từ cực đoan (Cộng thẳng điểm nặng)
    if (emailContent.toLowerCase().includes("viagra") ||
        emailContent.toLowerCase().includes("malware.exe")) {
        spamScore += 10;
    }

    // 2. Content-based score (Dùng Cosine Similarity)
    const contentScore = getContentScore(emailContent);
    spamScore += contentScore;

    // 3. Sender reputation (Hệ số tin tưởng từ database)
    // Giả sử reputation trả về từ 0 đến 1 (1 là rất uy tín)
    const reputation = await checkSenderReputation(senderEmail, receiverEmail);
    trustScore += reputation * 2;

    // 4. Reply-based trust (Đã từng phản hồi nhau chưa)
    const contextScore = await analyzeContext(senderEmail, receiverEmail);
    trustScore += contextScore;

    // 5. Quyết định cuối cùng
    const finalScore = spamScore - trustScore;

    console.log("--- Spam Check Report ---");
    console.log({
        contentSimilarityScore: contentScore,
        spamScore,
        trustScore,
        finalScore
    });

    // Nếu điểm cuối cùng > 1.5 thì coi là spam
    return finalScore > 1.5;
}


