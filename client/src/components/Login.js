import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import LoginIcon from "@mui/icons-material/Login";

export default function Login({ setToken }) {
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(form);
            const token = res.data.token;
            setToken(token);
            localStorage.setItem("jwt", token);
            alert("Đăng nhập thành công!");
            navigate("/inbox");
        } catch (err) {
            alert("Đăng nhập thất bại: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-gradient-to-r from-blue-300/30 to-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 -right-40 w-80 h-80 bg-gradient-to-r from-indigo-300/30 to-blue-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Login Card - Glassmorphism */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl mb-4">
                            <LoginIcon className="text-white text-3xl" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                            Chào mừng trở lại
                        </h1>
                        <p className="text-gray-500 mt-2">Đăng nhập để tiếp tục</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <EmailIcon className="text-blue-500 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LockIcon className="text-blue-500 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="Mật khẩu"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2
                                ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:shadow-xl hover:scale-[1.02] active:scale-100'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <>
                                    <LoginIcon />
                                    <span>Đăng nhập</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Chưa có tài khoản?{" "}
                            <button
                                onClick={() => navigate("/register")}
                                className="font-semibold text-blue-600 hover:text-indigo-600 transition-colors"
                            >
                                Đăng ký ngay
                            </button>
                        </p>
                    </div>
                </div>

                {/* Subtle Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    © 2025 BlueMail. Bảo mật thông tin người dùng.
                </p>
            </div>
        </div>
    );
}