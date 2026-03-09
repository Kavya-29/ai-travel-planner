import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Send, MapPin, Calendar, Wallet, CheckCircle, Sparkles, LogOut, Copy, Plane, Camera, ThumbsUp, ThumbsDown, Loader2, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { socket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currencyData';

const SquadRoomPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [squad, setSquad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [analyzingImage, setAnalyzingImage] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const fileInputRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [onlineMembers, setOnlineMembers] = useState([]); // Array of user IDs

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

    // Use current user's ID for presence tracking
    useEffect(() => {
        if (user?._id) {
            socket.io.opts.query = { userId: user._id };
            socket.disconnect().connect();
        }
    }, [user?._id]);

    useEffect(() => {
        const fetchSquad = async () => {
            try {
                const { data } = await API.get(`/squad/${id}`);
                setSquad(data);

                // Immediate room join attempt
                if (user?._id) {
                    socket.emit('join_squad', { roomId: id, userId: user._id });
                } else {
                    socket.emit('join_squad', { roomId: id });
                }
            } catch (error) {
                console.error("Fetch squad error:", error);
                toast.error("Failed to join squad room");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchSquad();

        // Socket Listeners
        const onConnect = () => {
            console.log("📡 [SOCKET] Connected, identifying user...");
            if (user?._id) {
                // First identify, then join room
                socket.emit('identify_user', user._id);
                socket.emit('join_squad', { roomId: id, userId: user._id });
            } else {
                socket.emit('join_squad', { roomId: id });
            }
        };

        const handlePresenceUpdate = (userIds) => {
            console.log("🟢 [SOCKET] Presence Update! Current online IDs:", userIds);
            // Ensure we store as a simple array of strings for easy comparison
            setOnlineMembers(userIds.map(id => String(id)));
        };

        const handleTripUpdate = (updates) => {
            setSquad(prev => {
                if (!prev) return prev;
                return { ...prev, tripData: { ...prev.tripData, ...updates } };
            });
        };

        const handlePlanReceived = (newSquad) => {
            console.log("🤖 [AI] New plan received:", newSquad.tripData?.itinerary);
            setSquad(newSquad);
            setGenerating(false);
            toast.success("AI generated a new shared plan! ✈️");
        };

        const handleVoteUpdate = (newSquad) => {
            setSquad(newSquad);
        };

        const handleGeneratingState = (isGenerating) => {
            setGenerating(isGenerating);
        };

        const handleMemberJoined = ({ updatedSquad }) => {
            if (updatedSquad) {
                setSquad(updatedSquad);
            } else {
                fetchSquad();
            }
        };

        socket.on('connect', onConnect);
        socket.on('squad_trip_updated', handleTripUpdate);
        socket.on('plan_received', handlePlanReceived);
        socket.on('vote_updated', handleVoteUpdate);
        socket.on('squad_generating', handleGeneratingState);
        socket.on('presence_update', handlePresenceUpdate);
        socket.on('member_joined', handleMemberJoined);

        // Check if already saved
        const checkSaved = async () => {
            if (squad?.tripData?.place && squad.tripData.itinerary?.itinerary_days) {
                try {
                    const { data } = await API.post('/travel/check-saved', {
                        place: squad.tripData.place,
                        days: squad.tripData.numberOfDays,
                        travelDate: squad.tripData.travelDate ? new Date(squad.tripData.travelDate) : null
                    });
                    if (data.isSaved) setIsSaved(true);
                } catch (err) { console.error("Saved status check failed"); }
            }
        };
        checkSaved();

        // If already connected, join room now
        if (socket.connected) onConnect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('squad_trip_updated', handleTripUpdate);
            socket.off('plan_received', handlePlanReceived);
            socket.off('vote_updated', handleVoteUpdate);
            socket.off('squad_generating', handleGeneratingState);
            socket.off('presence_update', handlePresenceUpdate);
            socket.off('member_joined', handleMemberJoined);
        };
    }, [id, navigate]);

    // Auto-Currency Effect
    useEffect(() => {
        if (!squad?.tripData?.place || squad.tripData.place.length < 3) return;

        const timeoutId = setTimeout(async () => {
            try {
                const geoRes = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(squad.tripData.place)}&count=1&language=en&format=json`
                );
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results[0]) {
                    const countryCode = geoData.results[0].country_code;
                    const countryName = geoData.results[0].country;
                    const { getCurrencyFromCountry } = await import('../utils/currencyData');
                    const detectedCurrency = getCurrencyFromCountry(countryCode);

                    if (detectedCurrency && detectedCurrency.code !== squad.tripData.currency) {
                        handleUpdateTrip('currency', detectedCurrency.code);
                        toast.success(`Country detected: ${countryName}. Currency set to ${detectedCurrency.code}`);
                    }
                }
            } catch (error) {
                console.error("Auto-currency error:", error);
            }
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [squad?.tripData?.place]);

    const handleUpdateTrip = (field, value) => {
        if (!squad) return;
        const newTripData = { ...squad.tripData, [field]: value };
        setSquad(prev => ({ ...prev, tripData: newTripData }));

        // 1. Emit to socket immediately for instant UI update on other screens
        socket.emit('update_squad_trip', {
            roomId: id,
            updates: { [field]: value }
        });

        // 2. Debounced API sync to persist in database
        if (window.squadSyncTimeout) clearTimeout(window.squadSyncTimeout);
        window.squadSyncTimeout = setTimeout(async () => {
            try {
                await API.patch(`/squad/${id}`, { tripData: newTripData });
            } catch (error) {
                console.error("Sync error:", error);
            }
        }, 1000);
    };

    const handleGeneratePlan = async () => {
        if (!squad.tripData.place) return toast.error("Please set a destination first!");
        if (!squad.tripData.numberOfDays || squad.tripData.numberOfDays <= 0) {
            return toast.error("Please specify the number of days for your trip!");
        }
        if (!squad.tripData.numberOfMembers || squad.tripData.numberOfMembers <= 0) {
            return toast.error("Please specify the number of members for this trip!");
        }
        setGenerating(true);
        socket.emit('squad_generating_started', { roomId: id, isGenerating: true });

        try {
            const { data } = await API.post(`/squad/${id}/generate`);
            setSquad(data);
            // Broadcast the full squad data (with itinerary) to others
            socket.emit('squad_plan_generated', { roomId: id, squad: data });
            toast.success("Squad itinerary generated! 🏮");
        } catch (error) {
            socket.emit('squad_generating_started', { roomId: id, isGenerating: false });
            console.error("Plan generation error:", error);
            if (error.response?.status === 404) {
                toast.error("Endpoint not found. Please restart your server!", { duration: 5000 });
            } else {
                toast.error("AI failed to generate squad plan");
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleVote = async (dayIndex, activityId, isUpvote) => {
        try {
            const { data } = await API.post(`/squad/${id}/vote`, { dayIndex, activityId, isUpvote });
            setSquad(data);
            socket.emit('activity_voted', { roomId: id, squad: data });
        } catch (error) {
            toast.error("Failed to cast vote");
        }
    };

    const getVoteCount = (activityId, isUpvote) => {
        return squad.votes.filter(v => v.activityId === activityId && v.isUpvote === isUpvote).length;
    };

    const handleSaveSquadPlan = async () => {
        if (isSaved) return;
        setSaving(true);
        try {
            await API.post(`/squad/${id}/save`);
            setIsSaved(true);
            toast.success("Squad itinerary saved to your history! 🌟");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save itinerary");
        } finally {
            setSaving(false);
        }
    };

    const hasVoted = (activityId, isUpvote) => {
        return squad.votes.some(v => v.userId === user._id && v.activityId === activityId && v.isUpvote === isUpvote);
    };

    const copyInviteCode = () => {
        navigator.clipboard.writeText(squad.inviteCode);
        toast.success("Invite code copied!");
    };

    const toggleMic = async () => {
        // Voice chat feature disabled
        toast.info("Voice chat has been disabled");
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAnalyzingImage(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            try {
                const base64Image = reader.result.split(',')[1];
                const { data } = await API.post('/travel/analyze-image', { image: base64Image });

                if (data.location) {
                    toast.success(`Destination identified: ${data.location} 📸`);
                    handleUpdateTrip('place', data.location);
                }
            } catch (error) {
                toast.error("Failed to identify location from image.");
            } finally {
                setAnalyzingImage(false);
            }
        };
    };

    if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading Flight Room...</div>;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Sidebar: Squad Info */}
                <div className="lg:col-span-1 space-y-6">
                    <section className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                                <Users className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black">{squad.name}</h1>
                                <p className="text-[10px] text-slate-500 uppercase font-black">Active Squad</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Invite Code</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-mono font-black tracking-widest text-blue-400">{squad.inviteCode}</span>
                                    <button onClick={copyInviteCode} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                                        <Copy className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-4 text-center">Members Online</p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    {squad.members.map(member => (
                                        <div key={member._id} className="group relative flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 text-blue-400 flex items-center justify-center font-black transition-all duration-500 relative">
                                                {typeof member.name === 'string' ? member.name.charAt(0) : '?'}

                                                {/* Presence Green Dot */}
                                                {/* Presence Green Dot */}
                                                {onlineMembers.some(id => String(id) === String(member._id)) && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#020617] flex items-center justify-center z-10">
                                                        <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black text-white/80">{member.name || 'Snyder'}</span>
                                                {onlineMembers.includes(member._id) && (
                                                    <span className="text-[7px] font-black text-green-500 uppercase tracking-tighter">Online</span>
                                                )}
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-700 shadow-2xl pointer-events-none font-bold">
                                                {member.email || member.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Main: Shared Planner */}
                <div className="lg:col-span-3 space-y-8">
                    <section className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />

                        <div className="flex items-center gap-2 text-blue-500 mb-2 font-black uppercase tracking-widest text-xs">
                            <Sparkles className="w-4 h-4" />
                            Live Planning Room
                        </div>
                        <h2 className="text-4xl font-black mb-10 text-white">Your Shared Itinerary</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Destination */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Destination</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 group-hover:scale-110 transition-transform" />
                                    <input
                                        type="text"
                                        placeholder="Where is the squad going?"
                                        value={squad.tripData.place}
                                        onChange={(e) => handleUpdateTrip('place', e.target.value)}
                                        className="w-full bg-slate-800/50 border-2 border-slate-700 p-5 pl-14 pr-14 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-white shadow-xl"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={analyzingImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                        {analyzingImage ? (
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Camera className="w-6 h-6" />
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
                            </div>

                            {/* Budget */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Squad Budget ({getCurrencySymbol(squad.tripData.currency)})</label>
                                    <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Auto-detected</span>
                                </div>
                                <div className="relative group">
                                    <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 text-green-500 group-hover:scale-110 transition-transform" />
                                    <input
                                        type="number"
                                        placeholder="e.g. 1000"
                                        value={squad.tripData.budget}
                                        onChange={(e) => handleUpdateTrip('budget', e.target.value)}
                                        className="w-full bg-slate-800/50 border-2 border-slate-700 p-5 pl-14 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-white shadow-xl"
                                    />
                                </div>
                            </div>

                            {/* Members */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Number of Members</label>
                                <div className="relative group">
                                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500 group-hover:scale-110 transition-transform" />
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="No. of members"
                                        value={squad.tripData.numberOfMembers || ''}
                                        onChange={(e) => handleUpdateTrip('numberOfMembers', e.target.value)}
                                        className="w-full bg-slate-800/50 border-2 border-slate-700 p-5 pl-14 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-white shadow-xl"
                                    />
                                </div>
                            </div>

                            {/* Days */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Number of Days</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 group-hover:scale-110 transition-transform" />
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 3"
                                        value={squad.tripData.numberOfDays || ''}
                                        onChange={(e) => handleUpdateTrip('numberOfDays', e.target.value)}
                                        className="w-full bg-slate-800/50 border-2 border-slate-700 p-5 pl-14 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-white shadow-xl"
                                    />
                                </div>
                            </div>

                            {/* Travel Date */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Travel Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500 group-hover:scale-110 transition-transform" />
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={squad.tripData.travelDate || ''}
                                        onChange={(e) => handleUpdateTrip('travelDate', e.target.value)}
                                        className="w-full bg-slate-800/50 border-2 border-slate-700 p-5 pl-14 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-white shadow-xl"
                                    />
                                </div>
                            </div>

                            {/* Interests */}
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Trip Interests (e.g. Luxury, Food, History)</label>
                                <div className="relative group">
                                    <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500 group-hover:scale-110 transition-transform" />
                                    <input
                                        type="text"
                                        placeholder="What are your interests? (comma separated)"
                                        value={(squad.tripData.interests || []).join(', ')}
                                        onChange={(e) => handleUpdateTrip('interests', e.target.value.split(',').map(s => s.trim()))}
                                        className="w-full bg-slate-800/50 border-2 border-slate-700 p-5 pl-14 rounded-2xl focus:border-blue-500 focus:outline-none transition-all font-bold text-white shadow-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Display */}
                        <div className="mt-12 p-8 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                                    <Plane className="w-8 h-8 text-blue-500 animate-bounce" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white">{squad.tripData.place || 'Choose a Destination'}</h4>
                                    <p className="text-sm text-slate-400 font-medium italic">Shared {squad.tripData.numberOfDays}-day adventure</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-3xl font-black text-blue-400">
                                    {getCurrencySymbol(squad.tripData.currency)}{squad.tripData.budget}
                                </div>
                                {squad.tripData.itinerary?.required_total_for_comfort && (
                                    <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-lg animate-pulse">
                                        Recommended: {getCurrencySymbol(squad.tripData.currency)}{squad.tripData.itinerary.required_total_for_comfort}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={handleGeneratePlan}
                                disabled={generating || !squad.tripData.place}
                                className={`px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-2xl ${generating
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/20 hover:scale-105'
                                    }`}
                            >
                                {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {generating ? 'AI is Crafting...' : 'Generate Squad Itinerary'}
                            </button>
                        </div>

                        {/* Shared Itinerary Display */}
                        {squad.tripData.itinerary?.itinerary_days && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-16 space-y-12"
                            >
                                {/* Save to History Button */}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSaveSquadPlan}
                                        disabled={saving || isSaved}
                                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border ${isSaved
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                                            }`}
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSaved ? <CheckCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                                        {saving ? 'Saving...' : (isSaved ? 'Saved to History' : 'Save Trip to My History')}
                                    </button>
                                </div>
                                {/* Budget Breakdown Card */}
                                {squad.tripData.itinerary.budget_breakdown && (
                                    <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[100px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
                                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                                            <PieChart className="w-6 h-6 text-emerald-500" />
                                            Squad Budget Breakdown
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {squad.tripData.itinerary.budget_breakdown.map((item, idx) => (
                                                <div key={idx} className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group/item">
                                                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">{item.category}</p>
                                                    <p className="text-2xl font-black text-white mb-2">{getCurrencySymbol(squad.tripData.currency)}{item.amount}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold leading-tight line-clamp-2 italic">{item.note}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                                <span className="text-slate-400 font-bold">Total Estimated Budget:</span>
                                            </div>
                                            <span className="text-3xl font-black text-emerald-400">{getCurrencySymbol(squad.tripData.currency)}{squad.tripData.itinerary.total_estimated_cost}</span>
                                        </div>

                                        {/* AI Budget Advisor Message */}
                                        {squad.tripData.itinerary.budget_advisor && (
                                            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                                                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                                <p className="text-xs font-bold text-emerald-100/80 leading-relaxed italic">
                                                    <span className="text-emerald-400 uppercase text-[10px] block mb-1 not-italic">AI Budget Advisor:</span>
                                                    {squad.tripData.itinerary.budget_advisor}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="h-px bg-slate-800 w-full" />

                                {squad.tripData.itinerary.itinerary_days.map((day, dIdx) => (
                                    <div key={dIdx} className="space-y-6">
                                        <h3 className="text-2xl font-black text-blue-400 flex items-center gap-3">
                                            <Calendar className="w-6 h-6" />
                                            Day {day.day}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(day.activities || []).map((act, aIdx) => (
                                                <div key={act.id || aIdx} className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl group/card hover:border-blue-500/30 transition-all">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">{act.time}</span>

                                                        {/* Vote Buttons */}
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleVote(dIdx, act.id, true)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${hasVoted(act.id, true) ? 'bg-green-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                                                    }`}
                                                            >
                                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                                {getVoteCount(act.id, true)}
                                                            </button>
                                                            <button
                                                                onClick={() => handleVote(dIdx, act.id, false)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${hasVoted(act.id, false) ? 'bg-red-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                                                    }`}
                                                            >
                                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                                {getVoteCount(act.id, false)}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-white mb-2">{act.title}</h4>
                                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">{act.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default SquadRoomPage;
