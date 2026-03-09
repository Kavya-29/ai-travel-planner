import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../api/axios';
import {
    Plane, Calendar, Wallet, MapPin, Sparkles,
    Package, Leaf, Smile, Star, ArrowLeft,
    CheckCircle2, Info, AlertTriangle, Coffee,
    Sun, Moon, Utensils, Heart, DollarSign,
    History, Trash2, Camera, UserPlus, LogIn,
    Share2, Download, Printer, Map as MapIcon, Clock, ThumbsUp, ThumbsDown, Bot
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { getCurrencySymbol } from '../utils/currencyData';
import { useChatContext } from '../context/ChatContext';


const TripResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [fetchedData, setFetchedData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);
    const [isBooked, setIsBooked] = React.useState(false);
    const { setScreenContext, setIsAdvisorOpen } = useChatContext();

    // Support both location state (immediate) and ID-based loading (from AI/Deep Links)
    const { itineraryData: stateItinerary, innovationData: stateInnovation, meta: stateMeta } = location.state || {};

    // Final data to display (prefer state, fallback to fetched)
    const itineraryData = stateItinerary || fetchedData?.itineraryData;
    const innovationData = stateInnovation || fetchedData?.innovationData;
    const meta = stateMeta || fetchedData?.meta;

    // 1. If meta has an _id, it's definitely already saved in history
    useEffect(() => {
        if (meta?._id || meta?.id) {
            setIsSaved(true);
        }
    }, [meta]);

    // 1. Fetch by ID if missing state
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const planId = queryParams.get('id');

        if (!stateItinerary && planId) {
            const fetchPlan = async () => {
                setLoading(true);
                try {
                    const { data } = await API.get(`/travel/plan/${planId}`);
                    const metaData = { ...data, place: data.place, days: data.days };
                    setFetchedData({
                        itineraryData: data.itineraryData,
                        innovationData: data.innovationData,
                        meta: metaData
                    });
                    checkSavedStatus(data.place, data.days, data.travelDate);
                    checkBookingStatus(data.place);
                } catch (err) {
                    toast.error("Could not load plan details.");
                    navigate('/dashboard');
                } finally {
                    setLoading(false);
                }
            };
            fetchPlan();
        } else if (!stateItinerary && !planId) {
            navigate('/dashboard');
        }
    }, [stateItinerary, location.search, navigate]);

    const checkSavedStatus = async (place, days, travelDate) => {
        try {
            const { data } = await API.post('/travel/check-saved', {
                place, days, travelDate: travelDate || null
            });
            if (data.isSaved) setIsSaved(true);
        } catch (err) { console.error("Saved status check failed"); }
    };

    const checkBookingStatus = async (place) => {
        try {
            const { data } = await API.post('/bookings/check-status', { place });
            if (data.isBooked) setIsBooked(true);
        } catch (err) { console.error("Booking status check failed"); }
    };

    // 2. Check if already saved/booked (only if not already confirmed by ID)
    useEffect(() => {
        if (meta?.place && !loading && itineraryData) {
            if (!isSaved) checkSavedStatus(meta.place, meta.days, meta.date || meta.travelDate);
            if (!isBooked) checkBookingStatus(meta.place);

            // Update chat context so the advisor knows about the trip
            setScreenContext({
                topic: 'Trip Planning',
                destination: meta.place,
                days: meta.days,
                budget: `${meta.budget} ${meta.currency}`,
                itinerary_summary: itineraryData.introduction
            });
        }
    }, [meta, loading, isSaved, isBooked, itineraryData, setScreenContext]);

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!itineraryData || !meta) return null;

    const handleSavePlan = async () => {
        if (isSaved) return;
        try {
            const planData = {
                place: meta.place,
                days: meta.days,
                budget: meta.budget,
                currency: meta.currency,
                travelDate: meta.date || meta.travelDate || null,
                itineraryData: itineraryData,
                innovationData: innovationData
            };
            await API.post('/travel/save-plan', planData);
            setIsSaved(true);
            toast.success("Trip saved to your history!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save trip.");
        }
    };

    const {
        introduction,
        rating,
        itinerary_days,
        travel_tips,
        safety_awareness,
        budget_breakdown
    } = itineraryData;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 pb-20 selection:bg-blue-500/30">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 pt-12">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Planner
                </button>

                {/* Hero Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-16"
                >
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest">
                                    AI Generated Plan
                                </span>
                                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span>{rating || '4.8'}/5.0</span>
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                                {meta.place} <span className="text-blue-600">Journey</span>
                            </h1>
                            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed mb-8">
                                {introduction}
                            </p>

                            <div className="inline-flex items-center gap-6 bg-slate-900/50 backdrop-blur-xl border border-white/5 p-4 rounded-3xl">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-black text-slate-500 mb-1 tracking-widest">Duration</p>
                                    <p className="text-xl font-bold">{meta.days} Days</p>
                                </div>
                                <div className="w-px h-10 bg-slate-800"></div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-black text-slate-500 mb-1 tracking-widest">Budget</p>
                                    <p className="text-xl font-bold">{meta.budget} {meta.currency}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </motion.header>

                {/* Innovation Grid - Hidden for Squad Plans */}
                {!itineraryData.isSquadPlan && (
                    <motion.section
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                    >
                        <motion.div variants={itemVariants} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-pink-500/30 transition-colors">
                            <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 mb-4 group-hover:scale-110 transition-transform">
                                <Smile className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Traveler Mood</p>
                            <h3 className="text-2xl font-black flex items-center gap-2">
                                {innovationData?.mood || 'Adventurous'} {innovationData?.emoji || '✨'}
                            </h3>
                        </motion.div>

                        <motion.div variants={itemVariants} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-green-500/30 transition-colors">
                            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-4 group-hover:scale-110 transition-transform">
                                <Leaf className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Eco Footprint</p>
                            <h3 className="text-2xl font-black">{innovationData?.carbon || '0.42'} CO₂e</h3>
                        </motion.div>

                        <motion.div variants={itemVariants} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-yellow-500/30 transition-colors">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 mb-4 group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Items to Pack</p>
                            <h3 className="text-2xl font-black">{innovationData?.packing?.length || 5} Essentials</h3>
                        </motion.div>
                    </motion.section>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Itinerary Column */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* New AI Advisor Section - God-Tier Redesign */}
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative overflow-hidden p-8 bg-emerald-950/20 border border-emerald-500/30 rounded-[2.5rem] backdrop-blur-xl group shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                                <div className="p-4 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
                                    <Sparkles className="w-8 h-8 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="flex items-center gap-2 text-[11px] uppercase font-black text-emerald-400 tracking-[0.2em] mb-3">
                                        <Sparkles className="w-3 h-3" />
                                        AI Advisor Wisdom
                                    </h4>
                                    <h2 className="text-2xl font-black text-white mb-5 tracking-tight">Expert Local Insight for {meta.place}</h2>

                                    <div className="p-6 bg-emerald-400/5 rounded-3xl border border-emerald-500/10 mb-6 font-serif">
                                        <p className="text-emerald-50 leading-relaxed italic text-xl font-medium pr-4">
                                            "{itineraryData.ai_advisor || `To make the most of your ${meta.days}-day journey, always keep a local offline map ready and start your days early to witness the sunrise at ${meta.place}'s most iconic spots.`}"
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 items-center">
                                        <button
                                            onClick={() => setIsAdvisorOpen(true)}
                                            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-black transition-all flex items-center gap-3 shadow-xl shadow-emerald-900/40 active:scale-95 border-b-4 border-emerald-800"
                                        >
                                            <Bot className="w-5 h-5 text-emerald-100" />
                                            CONSULT AI ADVISOR
                                        </button>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500/60 px-5 py-2.5 bg-emerald-950/40 rounded-2xl border border-emerald-500/10 tracking-widest leading-none">
                                            <Info className="w-3.5 h-3.5" />
                                            AI TRAVEL INTELLIGENCE
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        <section>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <h2 className="text-3xl font-black flex items-center gap-3">
                                    <Calendar className="text-blue-500" />
                                    Daily Schedule
                                </h2>
                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-xl animate-pulse">
                                    <MapPin className="w-4 h-4" />
                                    <span>Click on any Day Number or View Map to explore locations</span>
                                </div>
                            </div>
                            <div className="space-y-16 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                                {itinerary_days?.map((day, i) => (
                                    <motion.div
                                        key={day.day}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        className="relative pl-16 group"
                                    >
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(day.map_query || `${meta.place} ${day.title}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute left-0 top-0 w-12 h-12 bg-slate-900 border-4 border-slate-800 rounded-2xl flex items-center justify-center font-black text-blue-500 z-10 group-hover:border-blue-500/50 group-hover:bg-blue-600/10 group-hover:scale-110 transition-all shadow-lg cursor-pointer"
                                            title="View Day Plan on Google Maps"
                                        >
                                            {day.day}
                                        </a>
                                        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] hover:bg-slate-900/60 transition-all">
                                            <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
                                                <h3 className="text-2xl font-bold text-white">{day.title}</h3>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(day.map_query || `${meta.place} ${day.title}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors text-sm font-bold"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                    View Map
                                                </a>
                                            </div>


                                            <div className="space-y-6">
                                                {day.activities ? (
                                                    // Squad Format: List of distinct activities
                                                    day.activities.map((act, aIdx) => (
                                                        <div key={act.id || aIdx} className="flex gap-4">
                                                            <div className="w-10 h-10 shrink-0 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 h-fit">
                                                                <Clock className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-start">
                                                                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">{act.time || 'Activity'}</p>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="flex items-center gap-1 text-[10px] font-black text-green-500">
                                                                            <ThumbsUp className="w-3 h-3" /> {act.likes || 0}
                                                                        </span>
                                                                        <span className="flex items-center gap-1 text-[10px] font-black text-red-500">
                                                                            <ThumbsDown className="w-3 h-3" /> {act.dislikes || 0}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-white font-bold mb-1">{act.title}</p>
                                                                <p className="text-slate-300 leading-relaxed text-sm">{act.description}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    // Standard Format: Morning/Afternoon/Evening slots
                                                    <>
                                                        <div className="flex gap-4">
                                                            <div className="w-10 h-10 shrink-0 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 h-fit">
                                                                <Sun className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Morning Activities</p>
                                                                <p className="text-slate-300 leading-relaxed">{day.morning}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4">
                                                            <div className="w-10 h-10 shrink-0 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 h-fit">
                                                                <Utensils className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Afternoon Adventure</p>
                                                                <p className="text-slate-300 leading-relaxed">{day.afternoon}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4">
                                                            <div className="w-10 h-10 shrink-0 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 h-fit">
                                                                <Moon className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-1">Evening Leisure</p>
                                                                <p className="text-slate-300 leading-relaxed">{day.evening}</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-12">
                        {/* Budget Breakdown */}
                        <section>
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                                <Wallet className="text-blue-500" />
                                Budget Allocation
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {Array.isArray(budget_breakdown) ? (
                                    // Squad Format: Array of objects
                                    budget_breakdown.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{item.category}</p>
                                            <p className="text-lg font-black text-white">{getCurrencySymbol(meta.currency)}{item.amount}</p>
                                        </div>
                                    ))
                                ) : (
                                    // Standard Format: Object
                                    Object.entries(budget_breakdown || {}).map(([key, val]) => (
                                        key !== 'total' && (
                                            <div key={key} className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">{key}</p>
                                                <p className="text-lg font-black text-white">{getCurrencySymbol(meta.currency)}{val}</p>
                                            </div>
                                        )
                                    ))
                                )}
                                <div className="col-span-2 p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex justify-between items-center">
                                    <p className="font-bold text-blue-400">Total Estimate</p>
                                    <p className="text-xl font-black text-blue-400">
                                        {getCurrencySymbol(meta.currency)}
                                        {Array.isArray(budget_breakdown) ? itineraryData.total_estimated_cost : (budget_breakdown?.total || meta.budget)}
                                    </p>
                                </div>
                                {itineraryData.budget_advisor && (
                                    <div className="col-span-2 p-6 bg-emerald-950/30 border border-emerald-500/20 rounded-3xl flex items-start gap-4 shadow-lg shadow-emerald-900/20">
                                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                                            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] uppercase font-black text-emerald-400 tracking-[0.2em] mb-2">AI Budget Advisor</h5>
                                            <p className="text-emerald-50 italic text-[15px] font-medium leading-relaxed">
                                                {itineraryData.budget_advisor}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Tips Box */}
                        <section>
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                                <Sparkles className="text-blue-500" />
                                Travel Insights
                            </h2>
                            <div className="space-y-4">
                                {travel_tips?.map((tip, i) => (
                                    <div key={i} className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-4">
                                        <div className="w-8 h-8 shrink-0 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-blue-500 tracking-widest mb-1">{tip.category}</p>
                                            <p className="text-sm text-slate-400 leading-relaxed">{tip.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                                    <div className="w-8 h-8 shrink-0 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-red-500 tracking-widest mb-1">Safety First</p>
                                        <p className="text-sm text-slate-400 leading-relaxed">{safety_awareness}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Book CTA */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2rem] text-center shadow-2xl shadow-blue-500/20"
                        >
                            <Heart className="w-10 h-10 text-white/30 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-white mb-2">Love this plan?</h3>
                            <p className="text-blue-100 mb-8">Secure your preferred accommodation and activities today.</p>
                            <div className="space-y-4">
                                <button
                                    onClick={() => !isBooked && navigate(`/book-now?location=${meta.place}`)}
                                    disabled={isBooked}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${isBooked
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                                        : 'bg-white text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    <CheckCircle2 className={`w-5 h-5 ${isBooked ? 'text-green-400' : ''}`} />
                                    {isBooked ? 'Booked This Trip' : 'Book This Trip Now'}
                                </button>
                                <button
                                    onClick={handleSavePlan}
                                    disabled={isSaved}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSaved
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                        : 'bg-blue-500/20 text-white border border-blue-400/30 hover:bg-blue-500/30'
                                        }`}
                                >
                                    {isSaved ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            Already Saved to History
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 text-blue-400" />
                                            Save Trip to History
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TripResultPage;
