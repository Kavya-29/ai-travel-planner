import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { Mail, Lock, LogIn, Plane, Globe, MapPin, Star, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

// Floating particle component
const Particle = ({ x, y, size, duration, delay, icon: Icon, color }) => (
    <motion.div
        className="absolute pointer-events-none"
        style={{ left: `${x}%`, top: `${y}%` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0.8],
            y: [0, -60, -120],
            x: [0, Math.random() > 0.5 ? 20 : -20, 0],
        }}
        transition={{
            duration,
            delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
            ease: 'easeInOut',
        }}
    >
        <Icon className={`w-${size} h-${size} ${color}`} />
    </motion.div>
);

// Glowing orb
const Orb = ({ x, y, size, color, duration, delay }) => (
    <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            background: color,
        }}
        animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.35, 0.15],
            x: [0, 30, 0],
            y: [0, -20, 0],
        }}
        transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
);

const particles = [
    { x: 5, y: 15, size: 5, duration: 6, delay: 0, icon: Plane, color: 'text-blue-500/40' },
    { x: 85, y: 20, size: 4, duration: 7, delay: 1, icon: Globe, color: 'text-purple-500/40' },
    { x: 15, y: 70, size: 4, duration: 5, delay: 2, icon: MapPin, color: 'text-cyan-500/40' },
    { x: 80, y: 65, size: 5, duration: 8, delay: 0.5, icon: Star, color: 'text-yellow-500/40' },
    { x: 50, y: 5, size: 3, duration: 6, delay: 1.5, icon: Plane, color: 'text-blue-400/30' },
    { x: 25, y: 40, size: 4, duration: 9, delay: 3, icon: Globe, color: 'text-indigo-500/40' },
    { x: 70, y: 85, size: 4, duration: 7, delay: 2.5, icon: Star, color: 'text-pink-500/40' },
    { x: 90, y: 45, size: 3, duration: 6, delay: 0.8, icon: MapPin, color: 'text-teal-500/40' },
];

const LoginPage = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const { setScreenContext } = useChatContext();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '', role: 'guest' });
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Share current form state with the AI
        setScreenContext({
            page: 'login',
            formData
        });
    }, [formData, setScreenContext]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 40,
                y: (e.clientY / window.innerHeight - 0.5) * 40,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(formData.email, formData.password, formData.role);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(user.role === 'owner' ? '/owner-dashboard' : '/dashboard');
        } catch (error) {
            if (error.response?.data?.unverified) {
                toast.error(error.response.data.message);
                navigate('/verify-otp', { state: { email: formData.email } });
            } else {
                toast.error(error.response?.data?.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 overflow-hidden relative">

            {/* Background animated orbs */}
            <Orb x={-5} y={10} size="400px" color="radial-gradient(circle, rgba(59,130,246,0.4), transparent)" duration={8} delay={0} />
            <Orb x={70} y={60} size="350px" color="radial-gradient(circle, rgba(139,92,246,0.3), transparent)" duration={10} delay={2} />
            <Orb x={30} y={80} size="300px" color="radial-gradient(circle, rgba(6,182,212,0.25), transparent)" duration={7} delay={1} />

            {/* Animated grid background */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
            }} />

            {/* Floating particles */}
            {particles.map((p, i) => (
                <Particle key={i} {...p} />
            ))}

            {/* Animated floating travel words with parallax */}
            {['Paris', 'Dubai', 'Tokyo', 'Bali', 'Rome', 'Maldives'].map((city, i) => (
                <motion.span
                    key={city}
                    className="absolute text-slate-700/40 font-black select-none pointer-events-none tracking-[0.2em] uppercase"
                    style={{
                        fontSize: `${Math.random() * 8 + 14}px`,
                        left: `${(i * 17 + 5) % 95}%`,
                        top: `${(i * 15 + 10) % 90}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.5, 0.2],
                        x: mousePos.x * (i % 2 === 0 ? 1 : -1) * 0.5,
                        rotate: [0, 2, -2, 0]
                    }}
                    transition={{
                        duration: 5 + i,
                        delay: i * 0.7,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    {city}
                </motion.span>
            ))}

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                className="w-full max-w-md z-10"
            >
                <div className="relative bg-slate-900/60 backdrop-blur-2xl border border-slate-700/60 p-8 rounded-3xl shadow-2xl"
                    style={{ boxShadow: '0 0 60px rgba(59,130,246,0.1), 0 25px 50px rgba(0,0,0,0.5)' }}
                >
                    {/* Top glint line */}
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-full" />


                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {/* Header */}
                        <motion.div variants={itemVariants} className="text-center mb-2">
                            <motion.div
                                className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative group"
                                whileHover={{ scale: 1.1, rotate: 10 }}
                            >
                                <Plane className="w-10 h-10 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                <motion.div
                                    className="absolute -top-1 -right-1"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                </motion.div>
                            </motion.div>
                            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                                {formData.role === 'guest' ? 'Welcome Traveler' : 'Host Intelligence'}
                            </h1>
                            <p className="text-slate-400 text-sm font-medium">Your gateway to world-class experiences</p>
                        </motion.div>

                        {/* Role Toggle with sliding background */}
                        <motion.div variants={itemVariants} className="relative flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700/50 overflow-hidden">
                            <motion.div
                                className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-lg shadow-blue-500/20"
                                initial={false}
                                animate={{
                                    left: formData.role === 'guest' ? '4px' : '50%',
                                    right: formData.role === 'guest' ? '50%' : '4px',
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                            {['guest', 'owner'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role })}
                                    className={`relative z-10 flex-1 py-3 rounded-xl text-sm font-black transition-colors duration-300 ${formData.role === role ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {role === 'guest' ? 'GUEST USER' : 'PROPERTY OWNER'}
                                </button>
                            ))}
                        </motion.div>

                        {/* Email */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-slate-600"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </motion.div>

                        {/* Password */}
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-12 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-slate-600"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Submit */}
                        <motion.div variants={itemVariants}>
                            <motion.button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                        <Plane className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                )}
                                {loading ? 'Logging in...' : `Login as ${formData.role === 'guest' ? 'Guest' : 'Owner'}`}
                            </motion.button>
                        </motion.div>

                        {/* Register link */}
                        <motion.div variants={itemVariants} className="text-center text-slate-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                {t('register')}
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Bottom glow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
