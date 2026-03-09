import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const VerifyOTPPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setUser, setActingRole } = useAuth();
    const email = location.state?.email || '';
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
        // Focus next input
        if (element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            return toast.error("Please enter a 6-digit code");
        }

        setLoading(true);
        try {
            const { data } = await API.post('/auth/verify-otp', { email, otp: otpCode });
            const { token, ...userData } = data;

            // Auto login after verification
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('actingRole', userData.role);

            // These would normally be in AuthContext, we call them if they are exposed
            // If they aren't exposed, we just navigate to login
            toast.success("Email verified! Welcome aboard.");
            window.location.href = userData.role === 'owner' ? '/owner-dashboard' : '/dashboard';
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Invalid Access</h2>
                    <button onClick={() => navigate('/register')} className="text-blue-400 hover:underline">
                        Return to Registration
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-blue-600/5 blur-[120px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl shadow-2xl text-center">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                        <ShieldCheck className="w-10 h-10 text-blue-500" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
                    <p className="text-slate-400 mb-8">
                        We've sent a 6-digit code to <br />
                        <span className="text-blue-400 font-medium">{email}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-center gap-2">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    className="w-12 h-14 bg-slate-800/50 border border-slate-700 rounded-xl text-center text-xl font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={data}
                                    onChange={e => handleChange(e.target, index)}
                                    onFocus={e => e.target.select()}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify & Continue"}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <p className="mt-8 text-slate-500 text-sm">
                        Didn't receive the code?{' '}
                        <button className="text-blue-400 hover:underline font-medium">Resend Code</button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyOTPPage;
