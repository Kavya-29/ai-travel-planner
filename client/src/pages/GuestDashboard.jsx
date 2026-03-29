import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import BudgetPieChart from '../components/BudgetPieChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plane, Calendar, Wallet, MapPin, Sparkles, Package, Leaf, Smile, Clock, X, ChevronRight, Trash2, Camera, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencyFromCountry, getCurrencySymbol, getAllCurrencies } from '../utils/currencyData';


const GuestDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setScreenContext } = useChatContext();

    // Auto-refreshing today date — uses LOCAL date (not UTC) so timezone (e.g. IST) works correctly
    const getToday = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const [today, setToday] = useState(getToday);
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        // Calculate ms until next midnight and refresh then
        const msUntilMidnight = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            return midnight - now;
        };
        const timer = setTimeout(() => {
            const newToday = getToday();
            setToday(newToday);
            // Clear selected date if it's now in the past
            setFormData(prev => ({
                ...prev,
                travelDate: prev.travelDate < newToday ? '' : prev.travelDate
            }));
        }, msUntilMidnight());
        return () => clearTimeout(timer);
    }, [today]); // re-schedule each day

    const [formData, setFormData] = useState({
        place: '',
        numberOfDays: 3,
        budget: 1000,
        currency: 'USD',
        travelDate: '',
        interests: '',
        preferences: ''
    });
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [myPlans, setMyPlans] = useState([]);
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        // Feed live dashboard context to the AI (now with plans and bookings)
        setScreenContext({
            page: 'guest-dashboard',
            formData,
            savedPlans: myPlans.map(p => ({ id: p._id, place: p.place, date: p.travelDate })),
            recentBookings: bookings.map(b => ({ id: b._id, hotel: b.property?.name, status: b.status }))
        });
    }, [formData, myPlans, bookings, setScreenContext]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validating file size (max 4MB for AI)
        if (file.size > 4 * 1024 * 1024) {
            toast.error("Image too large. Please use an image under 4MB.");
            return;
        }

        setAnalyzingImage(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64Data = reader.result.split(',')[1];
                const mimeType = file.type;

                const { data } = await API.post('/travel/analyze-image', {
                    image: base64Data,
                    mimeType: mimeType
                });

                if (data.place) {
                    setFormData(prev => ({
                        ...prev,
                        place: data.place,
                        numberOfDays: data.suggestedDays || prev.numberOfDays,
                        budget: data.suggestedBudget === 'Luxury' ? 5000 : data.suggestedBudget === 'Economy' ? 500 : 1500,
                        interests: data.interests ? data.interests.join(', ') : prev.interests
                    }));
                    toast.success(`Identified: ${data.place}! Form updated.`);
                }
            } catch (err) {
                console.error("ANALYSIS FAILED:", err);
                toast.error("Could not identify location in this image.");
            } finally {
                setAnalyzingImage(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
    };

    // Auto-detect currency when destination changes
    useEffect(() => {
        if (!formData.place || formData.place.trim().length < 3) return;

        const detectCurrency = async () => {
            try {
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(formData.place)}&count=1&language=en&format=json`);
                const data = await res.json();
                if (data.results?.[0]?.country_code) {
                    const country = data.results[0].country_code.toUpperCase();
                    const detected = getCurrencyFromCountry(country);
                    setFormData(prev => ({ ...prev, currency: detected.code }));
                }
            } catch (err) {
                console.error("Currency detection failed", err);
            }
        };

        const timer = setTimeout(detectCurrency, 600);
        return () => clearTimeout(timer);
    }, [formData.place]);

    useEffect(() => {
        fetchMyPlans();
        fetchBookings();

        const handleRefresh = () => {
            fetchMyPlans();
            fetchBookings();
        };

        window.addEventListener('refresh_dashboard', handleRefresh);

        return () => {
            window.removeEventListener('refresh_dashboard', handleRefresh);
        };
    }, []);

    const fetchBookings = async () => {
        try {
            const { data } = await API.get('/bookings/guest');
            setBookings(data);
        } catch (error) {
            console.error("Fetch bookings error:", error);
        }
    };

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await API.patch(`/bookings/${id}/cancel`);
            toast.success("Booking cancelled successfully.");
            fetchBookings(); // Refresh list
        } catch (error) {
            toast.error("Failed to cancel booking.");
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm("Are you sure you want to delete this booking from your history?")) return;
        try {
            await API.delete(`/bookings/${id}`);
            toast.success("Booking deleted.");
            fetchBookings();
        } catch (error) {
            toast.error("Delete failed.");
        }
    };

    const fetchMyPlans = async () => {
        try {
            const { data } = await API.get('/travel/my-plans');
            setMyPlans(data);
        } catch (error) {
            console.error("Fetch plans error:", error);
        }
    };

    const handleSavePlan = async () => {
        if (!itinerary) return;
        try {
            const planData = {
                place: formData.place,
                days: formData.numberOfDays || 3,
                budget: formData.budget,
                currency: formData.currency,
                travelDate: formData.travelDate,
                itineraryData: itinerary,
                innovationData
            };
            await API.post('/travel/save-plan', planData);
            toast.success("Trip saved to your history!");
            fetchMyPlans();
        } catch (error) {
            toast.error("Failed to save trip.");
        }
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm("Delete this trip plan?")) return;
        try {
            await API.delete(`/travel/plan/${id}`);
            toast.success("Plan deleted.");
            setMyPlans(prev => prev.filter(p => p._id !== id));
        } catch (error) {
            toast.error("Delete failed.");
        }
    };

    // Levenshtein distance — measures how different two strings are
    const levenshtein = (a, b) => {
        a = a.toLowerCase().trim();
        b = b.toLowerCase().trim();
        const dp = Array.from({ length: a.length + 1 }, (_, i) =>
            Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );
        for (let i = 1; i <= a.length; i++)
            for (let j = 1; j <= b.length; j++)
                dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] :
                    1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        return dp[a.length][b.length];
    };

    const handleGenerate = async (e, overrideData = null) => {
        if (e && e.preventDefault) e.preventDefault();

        const dataToUse = overrideData || formData;

        // --- Validate all required fields ---
        if (!dataToUse.place || dataToUse.place.trim().length < 2)
            return toast.error('⚠️ Please enter a valid destination!');
        if (!dataToUse.travelDate) {
            // If somehow missing, use today as a safe fallback for the API
            dataToUse.travelDate = today;
        }
        if (dataToUse.travelDate < today)
            return toast.error('⚠️ Travel date cannot be in the past!');
        if (!dataToUse.budget || Number(dataToUse.budget) <= 0)
            return toast.error('⚠️ Please enter a valid budget!');
        if (!dataToUse.interests || dataToUse.interests.trim().length < 2)
            return toast.error('⚠️ Please enter your interests (e.g. Food, History)!');
        if (!dataToUse.numberOfDays || Number(dataToUse.numberOfDays) < 1)
            return toast.error('⚠️ Please enter number of days!');

        // --- Validate destination is a real city via Open-Meteo Geocoding API ---
        try {
            // Strip out extra info like "Iceland" if the user entered "Reykjavik,Iceland"
            const sanitizedSearch = dataToUse.place.split(',')[0].trim();
            const geoRes = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sanitizedSearch)}&count=1&language=en&format=json`
            );
            const geoData = await geoRes.json();
            if (!geoData.results || geoData.results.length === 0) {
                console.warn('Geocoding API could not find this spot, but proceeding for AI to handle regional/state planning.');
                // Non-blocking: Allow continuing even if geocoder fails (e.g. for "Karnataka")
            } else {
                const returnedName = (geoData.results[0].name || '').toLowerCase();
                const inputName = dataToUse.place.toLowerCase().trim();
                const sanitizedInput = sanitizedSearch.toLowerCase();

                const dist = levenshtein(sanitizedInput, returnedName);
                const maxLen = Math.max(sanitizedInput.length, returnedName.length);

                const isMatch = sanitizedInput === returnedName ||
                    inputName.includes(returnedName) ||
                    returnedName.includes(sanitizedInput) ||
                    (sanitizedInput[0] === returnedName[0] && dist / maxLen <= 0.3);

                if (!isMatch) {
                    console.warn(`Validation mismatch (${sanitizedInput} vs ${returnedName}), but allowing AI to attempt plan.`);
                }
            }
        } catch {
            // If geocoding fails (network issue), allow continuing
        }

        setLoading(true);
        try {
            const { data: itineraryData } = await API.post('/travel/itinerary', dataToUse);

            // Extract consolidated features from the master response
            const innovationData = {
                mood: itineraryData.mood_data?.mood || 'Adventurous',
                carbon: itineraryData.carbon_data?.totalCO2kg || '0.45',
                packing: itineraryData.packing_data?.items || [],
                emoji: itineraryData.mood_data?.emoji || '✨'
            };

            toast.success("Itinerary generated!");

            // Navigate to the new result page with data
            navigate('/trip-plan', {
                state: {
                    itineraryData,
                    innovationData,
                    meta: {
                        place: dataToUse.place,
                        days: dataToUse.numberOfDays || dataToUse.days || 3,
                        date: dataToUse.travelDate,
                        budget: dataToUse.budget,
                        currency: dataToUse.currency
                    }
                }
            });

        } catch (error) {
            console.error("GENERATION ERROR:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to generate plan.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSquad = async () => {
        if (!joinCode || joinCode.length < 6) {
            return toast.error("Please enter a valid 6-character invite code");
        }
        try {
            const { data } = await API.post('/squad/join', { inviteCode: joinCode.toUpperCase() });
            toast.success("Squad joined! 🚀");
            navigate(`/squad/${data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to join squad");
        }
    };

    const handleCreateSquad = async () => {
        try {
            const squadName = `${user.name}'s Adventure`;
            const { data } = await API.post('/squad', { name: squadName });
            toast.success("Squad room created! 🚀");
            navigate(`/squad/${data._id}`);
        } catch (error) {
            toast.error("Failed to create squad room");
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <header className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-block p-5 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 mb-6 relative group"
                    >
                        <Sparkles className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
                        <motion.div
                            className="absolute -inset-2 bg-blue-500/5 rounded-[2rem] blur-xl -z-10"
                            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white via-blue-200 to-slate-400 bg-clip-text text-transparent"
                    >
                        Plan your next masterpiece
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center justify-center gap-4 mt-8"
                    >
                        <button
                            onClick={handleCreateSquad}
                            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Users className="w-5 h-5" />
                            Invite Squad
                        </button>

                        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 p-1 rounded-2xl">
                            <input
                                type="text"
                                placeholder="INVITE CODE"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="bg-transparent border-none focus:ring-0 text-center font-mono font-black tracking-widest text-blue-400 w-32 placeholder:text-slate-600 text-sm"
                                maxLength={6}
                            />
                            <button
                                onClick={handleJoinSquad}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg active:scale-95"
                            >
                                Join
                            </button>
                        </div>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto font-medium"
                    >
                        Welcome, {user?.name}. Your dashboard is now powered by AI Travel Intelligence to plan your perfect 2026 journey.
                    </motion.p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Planner Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/5 p-8 rounded-[2.5rem] sticky top-24 shadow-2xl relative overflow-hidden group"
                            style={{ boxShadow: '0 0 40px rgba(59,130,246,0.05)' }}
                        >
                            {/* Card Glow */}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 blur-[100px] pointer-events-none group-hover:bg-blue-600/20 transition-colors duration-700" />

                            <h2 className="text-xl font-black mb-8 flex items-center gap-2">
                                <Plane className="w-5 h-5 text-blue-500" />
                                Plan Your Trip
                            </h2>
                            <form onSubmit={handleGenerate} className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Destination</label>
                                    <div className="relative group/input">
                                        <input
                                            type="text" required value={formData.place}
                                            onChange={e => setFormData({ ...formData, place: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all pr-12"
                                            placeholder="Paris, Tokyo, Dubai..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={analyzingImage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                            title="Search via Instagram/Travel Photo"
                                        >
                                            {analyzingImage ? (
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Camera className="w-5 h-5" />
                                            )}
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                                        <span>Pro tip: Upload a photo to identify a destination!</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> From Date
                                        </label>
                                        <input
                                            type="date" required min={today} value={formData.travelDate}
                                            onChange={e => setFormData({ ...formData, travelDate: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> To Date (Calculated)
                                        </label>
                                        <div className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-blue-400 font-bold border-dashed">
                                            {formData.travelDate ? (() => {
                                                const d = new Date(formData.travelDate);
                                                d.setDate(d.getDate() + parseInt(formData.numberOfDays || 0));
                                                return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                            })() : '--/--/----'}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Days</label>
                                        <input
                                            type="number" min="1" max="14" required value={formData.numberOfDays}
                                            onChange={e => setFormData({ ...formData, numberOfDays: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-2 block flex justify-between">
                                            <span>Currency</span>
                                            <span className="text-blue-400 text-[9px] uppercase tracking-wider font-bold animate-pulse mt-0.5 opacity-70">Auto</span>
                                        </label>
                                        <select
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white font-bold"
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        >
                                            {getAllCurrencies().map(curr => (
                                                <option key={curr.code} value={curr.code} className="bg-slate-900">
                                                    {curr.code} ({curr.symbol})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Total Budget</label>
                                    <input
                                        type="number" required min="1" value={formData.budget}
                                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Interests</label>
                                    <input
                                        type="text" required placeholder="e.g. History, Food, Nightlife"
                                        value={formData.interests}
                                        onChange={e => setFormData({ ...formData, interests: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Preferences</label>
                                    <input
                                        type="text" placeholder="e.g. Budget friendly, Luxury, Quiet"
                                        value={formData.preferences}
                                        onChange={e => setFormData({ ...formData, preferences: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white"
                                    />
                                </div>
                                <button
                                    type="submit" disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <LoadingSpinner size="sm" /> : <Plane className="w-5 h-5" />}
                                    {loading ? "Generating..." : "Generate Itinerary"}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Result Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Saved Trips History */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <Clock className="w-6 h-6 text-blue-500" />
                                Your Travel History
                            </h2>
                            {myPlans.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <AnimatePresence mode="popLayout">
                                        {myPlans.map((plan, index) => (
                                            <motion.div
                                                key={plan._id}
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-[2rem] relative group hover:border-blue-500/30 transition-all card-shadow hover:-translate-y-1"
                                            >
                                                <button
                                                    onClick={() => handleDeletePlan(plan._id)}
                                                    className="absolute top-4 right-4 p-2.5 bg-red-600/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white shadow-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 font-bold">
                                                        {plan.place.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg">{plan.place}</h4>
                                                        <p className="text-xs text-slate-500">
                                                            {plan.days} Days • {plan.travelDate ? new Date(plan.travelDate).toLocaleDateString() : 'Explore Anytime'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate('/trip-plan', {
                                                        state: {
                                                            itineraryData: plan.itineraryData,
                                                            innovationData: plan.innovationData,
                                                            meta: plan
                                                        }
                                                    })}
                                                    className="w-full py-3 bg-slate-800 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all"
                                                >
                                                    View Plan
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-3xl text-slate-500 italic">
                                    No saved trips yet.
                                </div>
                            )}
                        </div>

                        {/* Recent Bookings Section */}
                        <div className="space-y-6 pt-12 border-t border-slate-800">
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <Package className="w-6 h-6 text-blue-500" />
                                Your Recent Bookings
                            </h2>
                            {bookings.length > 0 ? (
                                <div className="space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {bookings.slice(0, 3).map((booking, index) => (
                                            <motion.div
                                                key={booking._id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.3 }}
                                                className="bg-slate-900/60 border border-slate-800/50 p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-green-500/20 transition-all hover:bg-slate-800/20"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-12 rounded-xl bg-slate-800 overflow-hidden">
                                                        <img
                                                            src={booking.property?.images?.[0] ? (booking.property.images[0].startsWith('http') ? booking.property.images[0] : `http://localhost:5000${booking.property.images[0]}`) : ""}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold">{booking.property?.name}</h4>
                                                        <p className="text-xs text-slate-500">{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                        {booking.status}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {booking.status !== 'cancelled' ? (
                                                            <button
                                                                onClick={() => handleCancelBooking(booking._id)}
                                                                className="p-2 bg-red-600/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                                                                title="Cancel Booking"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDeleteBooking(booking._id)}
                                                                className="p-2 bg-red-600/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                                                                title="Delete History"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => navigate('/my-bookings')}
                                                            className="p-2 bg-slate-800 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <button
                                        onClick={() => navigate('/my-bookings')}
                                        className="w-full py-4 text-center text-blue-500 font-bold hover:underline"
                                    >
                                        View All Bookings
                                    </button>
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-3xl text-slate-500 italic">
                                    No bookings yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GuestDashboard;
