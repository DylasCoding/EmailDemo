// File: `client/src/components/SendMail.js`
import React, { useState } from "react";
import { sendMail } from "../api";

export default function SendMail({ token }) {
    const [form, setForm] = useState({ to: "", subject: "", body: "" });

    const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isEmail(form.to)) {
            alert("Please enter a valid recipient email (e.g. abc@def.com).");
            return;
        }
        try {
            const res = await sendMail(token, form); // sends { to, subject, body }
            alert("Mail sent!");
            console.log(res.data);
            setForm({ to: "", subject: "", body: "" });
        } catch (err) {
            alert("Send failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Send Mail</h2>
            <input
                placeholder="Recipient email (e.g. abc@def.com)"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
            <input
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
            <textarea
                placeholder="Body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <button type="submit">Send</button>
        </form>
    );
}
