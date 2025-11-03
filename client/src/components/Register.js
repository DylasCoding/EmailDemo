import React, { useState } from "react";
import { register } from "../api";

export default function Register() {
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await register(form);
            alert("Registered successfully!");
            console.log(res.data);
        } catch (err) {
            alert("Error: " + err.response?.data?.message || err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            <input placeholder="First Name" onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <input placeholder="Last Name" onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="submit">Register</button>
        </form>
    );
}
