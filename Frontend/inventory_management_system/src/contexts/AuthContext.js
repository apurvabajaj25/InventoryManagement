import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth-token');
        if (token) {
            // Verify token and get user data
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (token) => {
        try {
            const response = await fetch('http://localhost:3001/getuser', {
                method: 'POST',
                headers: {
                    'auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('auth-token');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            localStorage.removeItem('auth-token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('auth-token', data.authtoken);
                await fetchUser(data.authtoken);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await fetch('http://localhost:3001/createuser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('auth-token', data.authtoken);
                await fetchUser(data.authtoken);
                return { success: true };
            } else {
                return { success: false, error: data.error || data.errors?.[0]?.msg };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('auth-token');
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};