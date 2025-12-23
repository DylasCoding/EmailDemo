import express from "express";
import { analyzeMessage } from "../controllers/ai_message.controller.js";

const router = express.Router();

router.post("/analyze", analyzeMessage);

export default router;
