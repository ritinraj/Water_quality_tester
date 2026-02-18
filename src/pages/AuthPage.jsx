/**
 * AuthPage.jsx
 * -------------
 * Combined Login + Signup page.
 * Users can toggle between Login and Signup using tabs.
 *
 * Features:
 *  - Email / Password login
 *  - Email / Password / Confirm Password signup
 *  - Google Sign-in button (UI only — no real OAuth)
 *  - Form validation with inline error messages
 *  - Redirects to /setup or /dashboard after auth
 */

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

// ─── Google Icon SVG ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

// ─── Divider with text ────────────────────────────────────────────────────────
const Divider = ({ text }) => (
    <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400 uppercase tracking-wide">{text}</span>
        </div>
    </div>
);

// ─── Input Field Component ────────────────────────────────────────────────────
const FormInput = ({ label, id, type = 'text', value, onChange, placeholder, error }) => (
    <div>
        <label htmlFor={id} className="input-label">{label}</label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`input-field ${error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
            autoComplete="off"
        />
        {error && <p className="error-text">{error}</p>}
    </div>
);

// ─── Main AuthPage Component ──────────────────────────────────────────────────
const AuthPage = () => {
    const { currentUser, isProfileComplete, login, signup, googleLogin } = useAuth();
    const navigate = useNavigate();

    // Which tab is active: 'login' or 'signup'
    const [activeTab, setActiveTab] = useState('login');

    // ── Login form state ──
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginErrors, setLoginErrors] = useState({});
    const [loginApiError, setLoginApiError] = useState('');

    // ── Signup form state ──
    const [signupForm, setSignupForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [signupErrors, setSignupErrors] = useState({});
    const [signupApiError, setSignupApiError] = useState('');

    // ── If already logged in, redirect appropriately ──
    if (currentUser) {
        return <Navigate to={isProfileComplete ? '/dashboard' : '/setup'} replace />;
    }

    // ─── Login Validation ──────────────────────────────────────────────────────
    const validateLogin = () => {
        const errors = {};
        if (!loginForm.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
            errors.email = 'Please enter a valid email address.';
        }
        if (!loginForm.password) {
            errors.password = 'Password is required.';
        }
        return errors;
    };

    // ─── Signup Validation ─────────────────────────────────────────────────────
    const validateSignup = () => {
        const errors = {};
        if (!signupForm.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email)) {
            errors.email = 'Please enter a valid email address.';
        }
        if (!signupForm.password) {
            errors.password = 'Password is required.';
        } else if (signupForm.password.length < 6) {
            errors.password = 'Password must be at least 6 characters.';
        }
        if (!signupForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password.';
        } else if (signupForm.password !== signupForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }
        return errors;
    };

    // ─── Handle Login Submit ───────────────────────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginApiError('');

        const errors = validateLogin();
        setLoginErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const error = await login(loginForm.email.trim(), loginForm.password);
        if (error) {
            setLoginApiError(error);
        } else {
            // Navigate based on profile status (context updates after await)
            navigate('/setup'); // AuthContext will redirect to dashboard if profile exists
        }
    };

    // ─── Handle Signup Submit ──────────────────────────────────────────────────
    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupApiError('');

        const errors = validateSignup();
        setSignupErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const error = await signup(signupForm.email.trim(), signupForm.password);
        if (error) {
            setSignupApiError(error);
        } else {
            navigate('/setup'); // New users always go to profile setup
        }
    };

    // ─── Google Sign-in Handler ────────────────────────────────────────────────
    const handleGoogleSuccess = async (credentialResponse) => {
        const error = await googleLogin(credentialResponse.credential);
        if (error) {
            if (activeTab === 'login') setLoginApiError(error);
            else setSignupApiError(error);
        } else {
            navigate('/setup');
        }
    };

    const handleGoogleError = () => {
        const msg = 'Google Sign-In failed. Please try again.';
        if (activeTab === 'login') setLoginApiError(msg);
        else setSignupApiError(msg);
    };

    // ─── Tab switch helper ─────────────────────────────────────────────────────
    const switchTab = (tab) => {
        setActiveTab(tab);
        setLoginErrors({});
        setSignupErrors({});
        setLoginApiError('');
        setSignupApiError('');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">

            {/* ── Page Header ── */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
                {/* Water drop icon */}
                <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="white"
                            className="w-7 h-7"
                        >
                            <path d="M12 2.25a.75.75 0 01.612.317l6.75 9a.75.75 0 01.138.433v.75a6.75 6.75 0 01-13.5 0V12a.75.75 0 01.138-.433l6.75-9A.75.75 0 0112 2.25z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Water Quality Monitor</h1>

            </div>

            {/* ── Auth Card ── */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white border border-gray-200 rounded-xl shadow-card px-6 py-8 sm:px-8">

                    {/* ── Tabs ── */}
                    <div className="flex border border-gray-200 rounded-lg p-1 mb-6 bg-gray-50">
                        <button
                            onClick={() => switchTab('login')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'login'
                                ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => switchTab('signup')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'signup'
                                ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* ══════════════════ LOGIN FORM ══════════════════ */}
                    {activeTab === 'login' && (
                        <form onSubmit={handleLogin} noValidate className="space-y-4">

                            {/* API-level error (e.g., wrong password) */}
                            {loginApiError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                                    {loginApiError}
                                </div>
                            )}

                            <FormInput
                                label="Email Address"
                                id="login-email"
                                type="email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                placeholder="you@example.com"
                                error={loginErrors.email}
                            />

                            <FormInput
                                label="Password"
                                id="login-password"
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                placeholder="Enter your password"
                                error={loginErrors.password}
                            />

                            {/* Forgot password (UI only) */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:underline"
                                    onClick={() => alert('Password reset is not available.')}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button type="submit" className="btn-primary mt-2">
                                Login
                            </button>

                            <Divider text="or continue with" />

                            {/* Google Sign-in */}
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    useOneTap
                                    shape="rectangular"
                                    theme="outline"
                                    text="signin_with"
                                    width="100%"
                                />
                            </div>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchTab('signup')}
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    Sign up
                                </button>
                            </p>
                        </form>
                    )}

                    {/* ══════════════════ SIGNUP FORM ══════════════════ */}
                    {activeTab === 'signup' && (
                        <form onSubmit={handleSignup} noValidate className="space-y-4">

                            {/* API-level error (e.g., email already exists) */}
                            {signupApiError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                                    {signupApiError}
                                </div>
                            )}

                            <FormInput
                                label="Email Address"
                                id="signup-email"
                                type="email"
                                value={signupForm.email}
                                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                placeholder="you@example.com"
                                error={signupErrors.email}
                            />

                            <FormInput
                                label="Password"
                                id="signup-password"
                                type="password"
                                value={signupForm.password}
                                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                placeholder="Minimum 6 characters"
                                error={signupErrors.password}
                            />

                            <FormInput
                                label="Confirm Password"
                                id="signup-confirm"
                                type="password"
                                value={signupForm.confirmPassword}
                                onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                                placeholder="Re-enter your password"
                                error={signupErrors.confirmPassword}
                            />

                            <button type="submit" className="btn-primary mt-2">
                                Create Account
                            </button>

                            <Divider text="or continue with" />

                            {/* Google Sign-up */}
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleError}
                                    shape="rectangular"
                                    theme="outline"
                                    text="signup_with"
                                    width="100%"
                                />
                            </div>

                            <p className="text-center text-xs text-gray-500 mt-4">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchTab('login')}
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    Login
                                </button>
                            </p>
                        </form>
                    )}
                </div>


            </div>
        </div>
    );
};

export default AuthPage;
