import {
    detectAppointment,
    detectAppointmentsBatch
} from "../services/ai_appointment.service.js";

export async function analyzeMessage(req, res) {
    const { message } = req.body;

    const aiResult = await detectAppointment(message);

    return res.json({
        message,
        ai: aiResult
    });
}
