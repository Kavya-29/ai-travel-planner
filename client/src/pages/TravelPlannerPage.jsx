import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, Wallet, MapPin, Sparkles, Package, Leaf, Smile } from 'lucide-react';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import BudgetPieChart from '../components/BudgetPieChart';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { getAllCurrencies, getCurrencyFromCountry } from '../utils/currencyData';

const TravelPlannerPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        place: '',
        numberOfDays: '',
        budget: '',
        currency: 'USD',
        travelDate: '',
        interests: '',
        preferences: ''
    });
    const [loading, setLoading] = useState(false);
    const [itinerary, setItinerary] = useState(null);
    const [innovationData, setInnovationData] = useState({ mood: null, packing: [], carbon: null });

    // Auto-detect currency when destination changes
    React.useEffect(() => {
        if (!formData.place || formData.place.trim().length < 3) return;

        const detectCurrency = async () => {
            try {
                // Use geocoding to get the country code from the destination name
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(formData.place)}&count=1&language=en&format=json`);
                const data = await res.json();
                if (data.results?.[0]?.country_code) {
                    const countryCode = data.results[0].country_code.toUpperCase();
                    const detected = getCurrencyFromCountry(countryCode);
                    setFormData(prev => ({ ...prev, currency: detected.code }));
                }
            } catch (err) {
                console.error("Currency detection failed", err);
            }
        };

        const timer = setTimeout(detectCurrency, 800);
        return () => clearTimeout(timer);
    }, [formData.place]);

    const handleGenerate = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.travelDate < today) {
            toast.error("Please select today or a future date!");
            return;
        }
        if (parseInt(formData.numberOfDays) === 5) {
            toast.error("Itineraries for exactly 5 days are currently unavailable. Try 4 or 6!");
            return;
        }

        setLoading(true);
        try {
            const { data } = await API.post('/travel/itinerary', formData);

            // Standardize on the new JSON structure
            setItinerary(data.itinerary_days || []);
            setInnovationData({
                mood: data.mood_data?.mood || 'Adventurous',
                carbon: data.carbon_data?.totalCO2kg || '0.45',
                packing: data.packing_data?.items || []
            });

            toast.success("Itinerary generated successfully!");
        } catch (error) {
            toast.error("Failed to generate plan. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 pb-20">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 pt-12">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Form Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-1/3"
                    >
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl sticky top-24">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Sparkles className="text-blue-500" title="AI Magic" />
                                Plan Your Trip
                            </h2>

                            <form onSubmit={handleGenerate} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Where to?</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                        <input
                                            type="text"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                            placeholder="e.g. Dubai, India, Paris"
                                            required
                                            value={formData.place}
                                            onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Departure Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                        <input
                                            type="date"
                                            required
                                            min={today}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white"
                                            value={formData.travelDate}
                                            onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">No. of Days</label>
                                        <input
                                            type="number"
                                            min="1" max="14"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                            placeholder="e.g. 3"
                                            value={formData.numberOfDays}
                                            onChange={(e) => setFormData({ ...formData, numberOfDays: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2 flex justify-between">
                                            <span>Currency</span>
                                            <span className="text-blue-400 text-[9px] uppercase tracking-wider font-bold animate-pulse mt-1 opacity-70">Auto</span>
                                        </label>
                                        <select
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white"
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
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Total Budget</label>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                                            placeholder="e.g. 1000"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Interests & Mood</label>
                                    <textarea
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all h-24 resize-none"
                                        placeholder="e.g. Scuba diving, Shopping, Luxury..."
                                        required
                                        value={formData.interests}
                                        onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                                            <Plane className="w-5 h-5" />
                                        </motion.div>
                                    ) : <Plane className="w-5 h-5" />}
                                    {loading ? "Crafting Itinerary..." : "Generate Magic"}
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Result Side */}
                    <div className="flex-1 min-h-[600px]">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex items-center justify-center"
                                >
                                    <LoadingSpinner />
                                </motion.div>
                            ) : !itinerary ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col space-y-8"
                                >
                                    <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex-1">
                                        <div className="p-6 bg-slate-800/50 rounded-full mb-6 text-slate-600">
                                            <Sparkles size={48} />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Ready to explore?</h3>
                                        <p className="text-slate-500 max-w-sm">
                                            Enter a destination and your preferred dates to generate a customized AI-powered travel itinerary.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-8"
                                >
                                    {/* Innovation Quick Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-4">
                                            <div className="p-3 bg-pink-500/20 rounded-xl text-pink-500"><Smile /></div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-500">Travel Mood</div>
                                                <div className="font-bold text-slate-200 capitalize">{innovationData.mood || '--'}</div>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-4">
                                            <div className="p-3 bg-green-500/20 rounded-xl text-green-500"><Leaf /></div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-500">Carbon Footprint</div>
                                                <div className="font-bold text-slate-200">{innovationData.carbon || '--'} CO₂e</div>
                                            </div>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-4">
                                            <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500"><Package /></div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-slate-500">Items to Pack</div>
                                                <div className="font-bold text-slate-200">{innovationData.packing?.length || 0} Suggestion(s)</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Day-wise Itinerary */}
                                    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8">
                                        <h3 className="text-2xl font-bold mb-8">{t('itinerary')} for {formData.place}</h3>
                                        <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                                            {itinerary.map((day, i) => (
                                                <div key={i} className="relative pl-12">
                                                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                                                        {day.day || i + 1}
                                                    </div>
                                                    <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                                                        <h4 className="font-bold text-blue-400 mb-3">{day.title || `Day ${i + 1}`}</h4>
                                                        <div className="space-y-4 text-slate-300 leading-relaxed">
                                                            <div><span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Morning</span>{day.morning}</div>
                                                            <div><span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Afternoon</span>{day.afternoon}</div>
                                                            <div><span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Evening</span>{day.evening}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Budget Chart */}
                                    <BudgetPieChart
                                        data={[
                                            { name: 'Accommodation', value: formData.budget * 0.4 },
                                            { name: 'Food & Dining', value: formData.budget * 0.25 },
                                            { name: 'Transport', value: formData.budget * 0.15 },
                                            { name: 'Activities', value: formData.budget * 0.15 },
                                            { name: 'Miscellaneous', value: formData.budget * 0.05 },
                                        ]}
                                    />

                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={() => navigate(`/book-now?location=${formData.place}`)}
                                            className="px-12 py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
                                        >
                                            Book Now: Stay in {formData.place}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TravelPlannerPage;
