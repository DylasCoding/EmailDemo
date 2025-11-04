// javascript
// File: client/src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

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

    // initialize / re-init socket when token changes
    useEffect(() => {
        if (token) {
            localStorage.setItem("jwt", token);
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
            } catch (e) {
                console.error("Invalid token:", e);
            }
            // initialize socket with token so server can auth
            initSocket(token);
            console.log("Socket initialized:");
            console.log(token);
        } else {
            // no token: ensure socket disconnected
            disconnectSocket();
            setUser(null);
            localStorage.removeItem("jwt");
        }
    }, [token]);

    const handleLogout = () => {
        // disconnect socket when logging out
        disconnectSocket();
        setToken("");
        setUser(null);
    };

    return (
        <Router>
            <SocketProvider token={token} userEmail={user?.email}>
                <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
                    {user && <span>Welcome, {user.firstName || user.email}</span>}
                {!token && (
                    <>
                        <Link to="/register">Register</Link>
                        <Link to="/login">Login</Link>
                    </>
                )}
                {token && (
                    <>
                        <Link to="/inbox">Inbox</Link>
                        <Link to="/send">Send</Link>
                        <button onClick={handleLogout}>Logout</button>
                    </>
                )}
            </nav>

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
                    path="/mail/:id"
                    element={
                        <ProtectedRoute token={token}>
                            <MailDetail token={token} />
                        </ProtectedRoute>
                    }
                />
            </Routes>
            </SocketProvider>
        </Router>
    );
}
