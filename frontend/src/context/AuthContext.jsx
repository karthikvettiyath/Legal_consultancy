import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to decode JWT payload safely
    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUsername = localStorage.getItem('adminUser');

        if (token) {
            const decoded = parseJwt(token);
            if (decoded && decoded.exp * 1000 > Date.now()) {
                setUser({
                    username: savedUsername || decoded.username,
                    role: decoded.role
                });
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('adminUser');
            }
        }
        setLoading(false);
    }, []);

    const login = (token, username, role) => {
        localStorage.setItem('token', token);
        localStorage.setItem('adminUser', username);
        setUser({ username, role });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
