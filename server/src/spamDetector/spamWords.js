// spamWords.js
export const spamVocab = {
    // Nhóm tài chính/lừa đảo (Trọng số cao)
    "free": 0.9,
    "win": 0.9,
    "prize": 0.85,
    "money": 0.8,
    "cash": 0.8,
    "crypto": 0.75,
    "investment": 0.7,

    // Nhóm giục giã/khẩn cấp
    "urgent": 0.7,
    "immediately": 0.65,
    "action": 0.5,
    "expired": 0.6,

    // Nhóm quảng cáo/bán hàng
    "offer": 0.4,
    "discount": 0.4,
    "buy": 0.3,
    "click": 0.5,
    "subscribe": 0.3,

    // Nhóm nhạy cảm (nếu không nằm trong Rule-based)
    "viagra": 1.0,
    "casino": 0.95
};