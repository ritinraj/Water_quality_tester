/**
 * ProfileSetupPage.jsx
 * ---------------------
 * After a user signs up (or logs in for the first time),
 * they are redirected here to complete their profile.
 *
 * Fields:
 *  - Full Name
 *  - Phone Number
 *  - City
 *  - State
 *
 * On submit → saves to localStorage via AuthContext → redirects to /dashboard
 */

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── List of Indian States ────────────────────────────────────────────────────
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];



// ─── Reusable Input Field ─────────────────────────────────────────────────────
const FormField = ({ label, id, required, error, children }) => (
    <div>
        <label htmlFor={id} className="input-label">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="error-text">{error}</p>}
    </div>
);

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepBadge = ({ step, total }) => (
    <div className="flex items-center gap-1 mb-1">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${i < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
            />
        ))}
    </div>
);

// ─── Main ProfileSetupPage ────────────────────────────────────────────────────
const ProfileSetupPage = () => {
    const { currentUser, isProfileComplete, saveProfile } = useAuth();
    const navigate = useNavigate();

    // Form data state — all fields start empty
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        city: '',
        state: '',
    });

    // Validation errors per field
    const [errors, setErrors] = useState({});

    // Loading state while saving
    const [saving, setSaving] = useState(false);

    // ── Redirect if not logged in ──
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // ── Redirect if profile already complete ──
    if (isProfileComplete) {
        return <Navigate to="/dashboard" replace />;
    }

    // ─── Update a single field ─────────────────────────────────────────────────
    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    // ─── Validate all fields ───────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};

        if (!form.fullName.trim()) {
            newErrors.fullName = 'Full name is required.';
        } else if (form.fullName.trim().length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters.';
        }

        if (!form.phone.trim()) {
            newErrors.phone = 'Phone number is required.';
        } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
            newErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
        }

        if (!form.city.trim()) {
            newErrors.city = 'City is required.';
        }

        if (!form.state) {
            newErrors.state = 'Please select your state.';
        }


        return newErrors;
    };

    // ─── Handle Form Submit ────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        setErrors(validationErrors);

        // If there are errors, stop here
        if (Object.keys(validationErrors).length > 0) return;

        setSaving(true);

        // Simulate a small delay (like an API call)
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Save profile via context (writes to data/users.json via backend)
        await saveProfile({
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            city: form.city.trim(),
            state: form.state,
        });

        setSaving(false);

        // Go to dashboard
        navigate('/dashboard');
    };

    // Count how many fields are filled (for progress bar)
    const filledCount = Object.values(form).filter((v) => v.trim() !== '').length;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-xl mx-auto">

                {/* ── Header ── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Please fill in your details to start using Water Quality Monitor.
                    </p>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Profile completion</span>
                            <span>{Math.round((filledCount / 4) * 100)}%</span>
                        </div>
                        <StepBadge step={filledCount} total={4} />
                    </div>
                </div>

                {/* ── Form Card ── */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-card p-6 sm:p-8">
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* ── Full Name ── */}
                        <FormField label="Full Name" id="fullName" required error={errors.fullName}>
                            <input
                                id="fullName"
                                type="text"
                                value={form.fullName}
                                onChange={handleChange('fullName')}
                                placeholder="e.g. Arjun Sharma"
                                className={`input-field ${errors.fullName ? 'border-red-400' : ''}`}
                            />
                        </FormField>

                        {/* ── Phone Number ── */}
                        <FormField label="Phone Number" id="phone" required error={errors.phone}>
                            <div className="flex">
                                {/* Country code prefix */}
                                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                                    +91
                                </span>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange('phone')}
                                    placeholder="9876543210"
                                    maxLength={10}
                                    className={`input-field rounded-l-none ${errors.phone ? 'border-red-400' : ''}`}
                                />
                            </div>
                        </FormField>

                        {/* ── City & State (side by side on larger screens) ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="City" id="city" required error={errors.city}>
                                <input
                                    id="city"
                                    type="text"
                                    value={form.city}
                                    onChange={handleChange('city')}
                                    placeholder="e.g. Pune"
                                    className={`input-field ${errors.city ? 'border-red-400' : ''}`}
                                />
                            </FormField>

                            <FormField label="State" id="state" required error={errors.state}>
                                <select
                                    id="state"
                                    value={form.state}
                                    onChange={handleChange('state')}
                                    className={`input-field ${errors.state ? 'border-red-400' : ''}`}
                                >
                                    <option value="">Select state</option>
                                    {INDIAN_STATES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>



                        {/* ── Submit Button ── */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary mt-2"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    {/* Spinner */}
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Saving Profile...
                                </span>
                            ) : (
                                'Save & Continue'
                            )}
                        </button>

                    </form>
                </div>

                {/* Note */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    Fields marked with <span className="text-red-500">*</span> are required.
                </p>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
