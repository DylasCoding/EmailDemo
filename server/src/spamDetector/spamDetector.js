// spamDetector.js
import spamVocab from "./spamWords.js";
import { tokenize, textToVector, cosineSimilarity } from "./utils.js";
import { checkSenderReputation, analyzeContext} from "./contextUtils.js";

// Rule-based Layer
function ruleBasedCheck(emailContent) {
    if (emailContent.includes("viagra")) return "FAIL";
    if (emailContent.includes("malware.exe")) return "FAIL";

    return "UNCERTAIN";
}

// Content Analysis Layer
function contentAnalysis(emailContent) {
    const tokens = tokenize(emailContent);
    const emailVector = textToVector(tokens, spamVocab);
    const similarity = cosineSimilarity(emailVector, spamVocab);

    if (similarity > 0.6) return "FAIL";      // rất giống spam
    if (similarity < 0.15) return "PASS";     // rất giống ham
    return "UNCERTAIN";
}

function contentSpamScore(emailContent) {
    const tokens = tokenize(emailContent);
    const emailVector = textToVector(tokens, spamVocab);
    const similarity = cosineSimilarity(emailVector, spamVocab);

    if (similarity > 0.6) return 4;
    if (similarity > 0.3) return 2;
    if (similarity > 0.15) return 1;
    return 0;
}

// Context & Trust Layer
async function contextAndTrustAnalysis(senderEmail, receiverEmail ,emailContent) {
    const senderReputation = await checkSenderReputation(senderEmail, receiverEmail);
    const contextScore = await analyzeContext(senderEmail,receiverEmail, emailContent);

    if (senderReputation > 0.7 && contextScore > 0.7) return false;
    return true;
}

// Multi-layer Spam Detection
export async function isSpam(emailContent, senderEmail, receiverEmail) {

    let spamScore = 0;
    let trustScore = 0;

    // 1. Content-based score
    spamScore += contentSpamScore(emailContent);

    // 2. Sender reputation (trust)
    const reputation = await checkSenderReputation(senderEmail, receiverEmail);
    trustScore += reputation * 2; // scale nhẹ

    // 3. Reply-based trust
    trustScore += await analyzeContext(senderEmail, receiverEmail);

    // 4. Final decision
    const finalScore = spamScore - trustScore;

    console.log({ spamScore, trustScore, finalScore });

    return finalScore > 3;
}



