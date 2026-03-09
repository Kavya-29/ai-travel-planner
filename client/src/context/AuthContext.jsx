import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [actingRole, setActingRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedActingRole = localStorage.getItem('actingRole');
        if (token && storedUser) {
            const user = JSON.parse(storedUser);
            setUser(user);
            setActingRole(user.role); // Always derive from user role
        }
        setLoading(false);
    }, []);

    const login = async (email, password, attemptedRole) => {
        const { data } = await API.post('/auth/login', { email, password, role: attemptedRole });
        const { token, ...userData } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('actingRole', userData.role);
        setUser(userData);
        setActingRole(userData.role);
        return userData;
    };

    const register = async (userData) => {
        const { data } = await API.post('/auth/register', userData);
        const { token, ...newUserData } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUserData));
        localStorage.setItem('actingRole', newUserData.role);
        setUser(newUserData);
        setActingRole(newUserData.role);
        return newUserData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('actingRole');
        setUser(null);
        setActingRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, actingRole, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
