import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '20px 40px',
                    borderRadius: '10px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                    Loading...
                </div>
            </div>
        );
    }
    
    return user ? children : <Login />;
};

export default ProtectedRoute;