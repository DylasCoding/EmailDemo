// javascript
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import StarIcon from "@mui/icons-material/Star";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import Register from "./components/Register";
import Login from "./components/Login";
import Inbox from "./components/Inbox";
import SendMail from "./components/SendMail";
import MailDetail from "./components/MailDetail";
import CalendarPlanner from "./components/CalendarPlanner";
import ProtectedRoute from "./routes/ProtectedRoute";

import { initSocket, disconnectSocket } from "./socket";
import { SocketProvider } from "./contexts/SocketContext";

function CurrentTabBadge() {
    const location = useLocation();
    const mapPathToName = (path) => {
        if (path.startsWith("/mail/thread")) return "Chi tiết thư";
        if (path === "/inbox") return "Hộp thư";
        if (path === "/send") return "Soạn thư";
        if (path === "/login") return "Đăng nhập";
        if (path === "/register") return "Đăng ký";
        return "Trang chính";
    };
    const name = mapPathToName(location.pathname);
    return (
        <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-amber-50 text-gray-800 text-sm rounded-full border border-gray-200 shadow-sm">
                {name}
            </span>
        </div>
    );
}

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

    const navItemClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium";
    const activeClasses = "bg-gray-900 text-amber-50 shadow-lg";
    const inactiveClasses = "text-gray-800 hover:bg-amber-50";

    // Subtabs component must be used inside Router so useLocation works
    function InboxSubTabs() {
        const location = useLocation();
        const hash = location.hash || "";
        const starActive = hash === "#starred";
        const spamActive = hash === "#spam";

        return (
            <div className="mt-2 ml-8 flex flex-col space-y-1">
                <Link
                    to="/inbox"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${!starActive && !spamActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-amber-50"}`}
                >
                    <EmailIcon fontSize="small" />
                    <span>All</span>
                </Link>

                <Link
                    to="/inbox#starred"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${starActive ? "bg-gray-900 text-amber-50" : "text-gray-600 hover:bg-amber-50"}`}
                >
                    <StarIcon fontSize="small" />
                    <span>Star</span>
                </Link>

                <Link
                    to="/inbox#spam"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${spamActive ? "bg-gray-900 text-amber-50" : "text-gray-600 hover:bg-amber-50"}`}
                >
                    <WarningAmberIcon fontSize="small" />
                    <span>Spam</span>
                </Link>
            </div>
        );
    }

    return (
        <Router>
            <SocketProvider token={token} userEmail={user?.email}>
                <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50">
                    {/* Sidebar - Left */}
                    <aside className="w-64 min-h-screen sticky top-0 z-20 bg-white/95 backdrop-blur border-r border-gray-200 p-6 flex flex-col">
                        {/* Logo */}
                        <div className="mb-8 flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-black rounded-2xl p-2 flex items-center justify-center shadow-md">
                                    <EmailIcon className="text-white" fontSize="large" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Mail</h1>
                                <p className="text-xs text-gray-500">Premium</p>
                            </div>
                        </div>

                        {/* User Info */}
                        {user && (
                            <div className="mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-gray-800 to-black rounded-full flex items-center justify-center shadow">
                                    <span className="text-amber-50 font-semibold">{user.firstName?.charAt(0) || user.email?.charAt(0)}</span>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{user.firstName || user.email}</div>
                                    <div className="text-xs text-gray-500">Signed in</div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-1">
                            <div className="space-y-2">
                                <div>
                                    <NavLink to="/inbox" className={({ isActive }) => `${navItemClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                                        <EmailIcon fontSize="small" />
                                        <span>Hộp thư</span>
                                    </NavLink>

                                    {/* Subtabs under Hộp thư */}
                                    <InboxSubTabs />
                                </div>

                                <NavLink to="/send" className={({ isActive }) => `${navItemClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                                    <PersonIcon fontSize="small" />
                                    <span>Soạn thư</span>
                                </NavLink>

                                <NavLink to="/calendar" className={({ isActive }) => `${navItemClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                                    <CalendarTodayIcon fontSize="small" />
                                    <span>Calendar</span>
                                </NavLink>

                                {!token ? (
                                    <>
                                        <NavLink to="/login" className={({ isActive }) => `${navItemClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                                            <ExitToAppIcon fontSize="small" />
                                            <span>Đăng nhập</span>
                                        </NavLink>
                                        <NavLink to="/register" className={({ isActive }) => `${navItemClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                                            <span className="ml-1">Đăng ký</span>
                                        </NavLink>
                                    </>
                                ) : (
                                    <button onClick={handleLogout} className={`${navItemClasses} text-gray-700 hover:bg-red-50 w-full text-left`}>
                                        <ExitToAppIcon fontSize="small" />
                                        <span>Thoát</span>
                                    </button>
                                )}
                            </div>
                        </nav>

                        <div className="mt-6 text-xs text-gray-400">© BlueMail</div>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 p-8">
                        <div className="max-w-6xl mx-auto w-full">
                            {/*<CurrentTabBadge />*/}

                            {/* Flat cream background (no rounded card) for consistent app look */}
                            <div className="bg-white border p-4 min-h-[70vh]">
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
                                        path="/calendar"
                                        element={
                                            <ProtectedRoute token={token}>
                                                <CalendarPlanner token={token} />
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
                        </div>
                    </main>
                </div>
            </SocketProvider>
        </Router>
    );
}
