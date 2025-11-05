import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

import Register from "./components/Register";
import Login from "./components/Login";
import Inbox from "./components/Inbox";
import SendMail from "./components/SendMail";
import MailDetail from "./components/MailDetail";
import ProtectedRoute from "./routes/ProtectedRoute";

import { initSocket, disconnectSocket } from "./socket";
import { SocketProvider } from "./contexts/SocketContext";

export default function App() {
    const [token, setToken] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem("jwt");
        if (saved) {
            setToken(saved);
            try {
                const decoded = jwtDecode(saved);
                setUser(decoded);
            } catch (e) {
                console.error("Invalid token:", e);
            }
        }
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem("jwt", token);
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
            } catch (e) {
                console.error("Invalid token:", e);
            }
            initSocket(token);
        } else {
            disconnectSocket();
            setUser(null);
            localStorage.removeItem("jwt");
        }
    }, [token]);

    const handleLogout = () => {
        disconnectSocket();
        setToken("");
        setUser(null);
    };

    return (
        <Router>
            <SocketProvider token={token} userEmail={user?.email}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-indigo-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    </div>

                    {/* Premium Navbar */}
                    <header className="relative z-10">
                        <nav className="max-w-6xl mx-auto px-4 py-4">
                            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 flex items-center justify-between">
                                {/* Logo - Gradient Effect */}
                                <Link to="/" className="flex items-center space-x-3 group">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl shadow-xl p-2 group-hover:scale-110 transition-transform duration-300">
                                            <EmailIcon className="text-white" fontSize="large" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                                            BlueMail
                                        </h1>
                                        <p className="text-xs text-gray-500 font-medium">Premium</p>
                                    </div>
                                </Link>

                                {/* User Menu - Elegant */}
                                <div className="flex items-center space-x-4">
                                    {/* User Avatar */}
                                    {user && (
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                                <span className="text-white font-semibold text-sm">
                                                    {user.firstName?.charAt(0) || user.email?.charAt(0)}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 hidden lg:inline">
                                                Xin chào, {user.firstName || user.email}
                                            </span>
                                        </div>
                                    )}

                                    {/* Navigation Buttons - Glassmorphism */}
                                    <div className="flex items-center space-x-2">
                                        {!token ? (
                                            <>
                                                <Link
                                                    to="/register"
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium text-sm"
                                                >
                                                    Đăng ký
                                                </Link>
                                                <Link
                                                    to="/login"
                                                    className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-2xl font-medium hover:bg-blue-50 transition-all duration-200 text-sm"
                                                >
                                                    Đăng nhập
                                                </Link>
                                            </>
                                        ) : (
                                            <>
                                                <Link
                                                    to="/inbox"
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium text-sm relative overflow-hidden"
                                                >
                                                    <span className="relative z-10">Hộp thư</span>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                                </Link>

                                                <Link
                                                    to="/send"
                                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium text-sm"
                                                >
                                                    Soạn thư
                                                </Link>

                                                <button
                                                    onClick={handleLogout}
                                                    className="px-4 py-2 text-gray-600 hover:text-red-500 rounded-2xl font-medium text-sm transition-all duration-200 flex items-center space-x-1 hover:bg-red-50"
                                                >
                                                    <ExitToAppIcon fontSize="small" />
                                                    <span>Thoát</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </nav>
                    </header>

                    {/* Main Content - Premium Container */}
                    <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 min-h-[70vh]">
                            <Routes>
                                <Route path="/" element={<Navigate to={token ? "/inbox" : "/login"} />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/login" element={<Login setToken={setToken} />} />
                                <Route
                                    path="/inbox"
                                    element={
                                        <ProtectedRoute token={token}>
                                            <Inbox token={token} />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/send"
                                    element={
                                        <ProtectedRoute token={token}>
                                            <SendMail token={token} />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/mail/thread/:id"
                                    element={
                                        <ProtectedRoute token={token}>
                                            <MailDetail token={token} />
                                        </ProtectedRoute>
                                    }
                                />
                            </Routes>
                        </div>
                    </main>

                    {/* Footer - Subtle */}
                    <footer className="mt-12 text-center py-8">
                        <p className="text-sm text-gray-500">
                            © 2025 BlueMail. Được thiết kế với ❤️ cho trải nghiệm tốt nhất.
                        </p>
                    </footer>
                </div>
            </SocketProvider>
        </Router>
    );
}