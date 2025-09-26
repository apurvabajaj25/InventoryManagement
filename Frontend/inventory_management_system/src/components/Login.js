import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                result = await register(formData.name, formData.email, formData.password);
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (error) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({
            name: '',
            email: '',
            password: ''
        });
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
                <p className="login-subtitle">
                    {isLogin ? 'Welcome back to IMS' : 'Create your IMS account'}
                </p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter your email"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Enter your password"
                            minLength={5}
                        />
                    </div>
                    
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>
                
                <div className="toggle-mode">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={toggleMode} className="toggle-button">
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;