import axios from "axios";

export const aiClient = axios.create({
    baseURL: process.env.AI_SERVICE_URL || "http://127.0.0.1:8001",
    timeout: 5000,
    headers: {
        "Content-Type": "application/json"
    }
});
