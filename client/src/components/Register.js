import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import HowToRegIcon from "@mui/icons-material/HowToReg";

export default function Register() {
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await register(form);
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            console.log(res.data);
            navigate("/login");
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-gradient-to-r from-purple-300/30 to-blue-300/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300/30 to-indigo-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Register Card */}
            <div className="relative w-full max-w-lg">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl mb-4">
                            <HowToRegIcon className="text-white text-3xl" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                            Tạo tài khoản mới
                        </h1>
                        <p className="text-gray-500 mt-2">Tham gia BlueMail ngay hôm nay</p>
                    </div>

                    {/* Form Grid */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* First Name */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <PersonIcon className="text-indigo-500 group-focus-within:text-purple-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Tên"
                                    value={form.firstName}
                                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <PersonIcon className="text-indigo-500 group-focus-within:text-purple-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Họ"
                                    value={form.lastName}
                                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <EmailIcon className="text-indigo-500 group-focus-within:text-purple-600 transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LockIcon className="text-indigo-500 group-focus-within:text-purple-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="Mật khẩu"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-800 font-medium"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2
                                ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-xl hover:scale-[1.02] active:scale-100'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang tạo tài khoản...</span>
                                </>
                            ) : (
                                <>
                                    <HowToRegIcon />
                                    <span>Đăng ký ngay</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Đã có tài khoản?{" "}
                            <button
                                onClick={() => navigate("/login")}
                                className="font-semibold text-indigo-600 hover:text-purple-600 transition-colors"
                            >
                                Đăng nhập
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    © 2025 BlueMail. Dẫn đầu tương lai email.
                </p>
            </div>
        </div>
    );
}