import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WorldGlobe from '../components/WorldGlobe';
import { Map, Hotel, Shield, Zap, PlaneTakeoff, LogIn, LayoutDashboard, Plus, Clock, ShoppingBag, Leaf, BarChart3, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
    const { t } = useTranslation();
    const { user, actingRole } = useAuth();

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 overflow-x-hidden">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 flex flex-col items-center">
                {/* Animated Background Gradients */}
                <div className="absolute top-0 -left-48 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute top-40 -right-48 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-700"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl px-4 z-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                        <Zap className="w-4 h-4" />
                        <span>{actingRole === 'owner' ? "AI-Powered Business Intelligence" : "AI-Powered Travel Intelligence"}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                        {(actingRole === 'owner' ? t('hero_title_owner') : t('hero_title')).split(' ').map((word, i) => (
                            <span key={i} className={word === 'AI' || word === 'Dream' || word === 'Business' ? "text-blue-500" : ""}>
                                {word}{' '}
                            </span>
                        ))}
                    </h1>

                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        {actingRole === 'owner' ? t('hero_subtitle_owner') : t('hero_subtitle')}
                    </p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-8"
                    >
                        {user ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Link
                                        to={actingRole === 'owner' ? "/owner-dashboard" : "/dashboard"}
                                        className="group px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-xl flex items-center gap-4 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 hover:scale-105"
                                    >
                                        <LayoutDashboard className="w-8 h-8" />
                                        {actingRole === 'owner' ? "Open Owner Dashboard" : "Open My Trips Dashboard"}
                                    </Link>
                                    {actingRole === 'owner' && (
                                        <Link to="/owner/add-property" className="group px-8 py-4 bg-slate-800 text-slate-100 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-slate-700 transition-all border border-slate-700/50 hover:scale-105">
                                            <Plus className="w-6 h-6 text-blue-400" />
                                            List New Property
                                        </Link>
                                    )}
                                </div>
                                <p className="text-slate-500 font-medium font-mono uppercase tracking-tighter">
                                    Welcome back, <span className="text-blue-400">{user.name}</span>!
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <p className="text-slate-400 font-medium text-lg italic">Login to use the advanced AI features and book your stay</p>
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Link to="/login" className="group px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 hover:scale-105">
                                        <LogIn className="w-6 h-6" />
                                        Login to Start Journey
                                    </Link>
                                    <Link to="/register" className="group px-10 py-4 bg-slate-800 text-slate-100 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700/50 hover:scale-105">
                                        Create Account
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>

                {/* Managed Portfolio / Trending Destinations Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="mt-20 w-full max-w-6xl px-4 z-10"
                >
                    <div className="text-center mb-12">
                        <span className="text-blue-500 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
                            {actingRole === 'owner' ? "Launch Your Hosting Journey" : t('adventure_awaits')}
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black">
                            {actingRole === 'owner' ? "Global Inspiration for Your Next Listing" : t('trending_destinations')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {actingRole === 'owner' ? (
                            // Owner Property Portfolio
                            <>
                                {[
                                    { name: "Modern Coastal Villa", category: "Property Inspiration", price: "High Demand Aesthetic", img: "/properties/beach-house.png" },
                                    { name: "Tropical Oasis Suite", category: "Property Inspiration", price: "Eco-Friendly Design", img: "/properties/tropical-villa.png" },
                                    { name: "Luxury Peak Chalet", category: "Property Inspiration", price: "Premium Seasonal Spot", img: "/properties/mountain-resort.png" }
                                ].map((prop, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -15 }}
                                        className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900 shadow-2xl transition-all duration-500"
                                    >
                                        <img src={prop.img} alt={prop.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent"></div>

                                        <div className="absolute bottom-8 left-8 right-8">
                                            <div className="px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest w-fit mb-3">
                                                {prop.category}
                                            </div>
                                            <h3 className="text-2xl font-bold mb-1">{prop.name}</h3>
                                            <p className="text-slate-400 text-sm font-medium mb-4">{prop.price}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        ) : (
                            // Guest Trending Destinations
                            <>
                                {[
                                    { name: "Bali, Indonesia", category: "Tropical Paradise", price: "Starting from IDR 2.8M", img: "/destinations/bali.png" },
                                    { name: "Santorini, Greece", category: "Iconic Views", price: "Starting from €299", img: "/destinations/santorini.png" },
                                    { name: "Tokyo, Japan", category: "Neo-Futurism", price: "Starting from ¥22,000", img: "/destinations/tokyo.png" }
                                ].map((dest, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ y: -15 }}
                                        className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900 shadow-2xl transition-all duration-500"
                                    >
                                        <img src={dest.img} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent"></div>

                                        <div className="absolute bottom-8 left-8 right-8">
                                            <div className="px-3 py-1 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest w-fit mb-3">
                                                {dest.category}
                                            </div>
                                            <h3 className="text-2xl font-bold mb-1">{dest.name}</h3>
                                            <p className="text-slate-400 text-sm font-medium">{dest.price}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        )}
                    </div>
                </motion.div>

                {/* AI Technology Highlight Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-32 w-full max-w-7xl px-4 z-10"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black leading-tight">
                                {actingRole === 'owner' ? "Next-Gen" : "Travel Smarter with"} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                                    {actingRole === 'owner' ? "Business Intelligence" : "Next-Gen Travel AI"}
                                </span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                {actingRole === 'owner'
                                    ? "Our AI doesn't just manage bookings; it predicts your success. Using advanced neural modeling to optimize your property performance globally."
                                    : "Our platform doesn't just book rooms; it understands your journey. Powered by advanced neural networks, we provide insights you won't find anywhere else."
                                }
                            </p>

                            <div className="grid grid-cols-1 gap-6">
                                {actingRole === 'owner' ? (
                                    <>
                                        {[
                                            { icon: TrendingUp, title: "Global Reach Monitoring", desc: "Track where your bookings come from across the planet in real-time." },
                                            { icon: Users, title: "Occupancy AI", desc: "Predict high-traffic seasons using our advanced neural engine." },
                                            { icon: Shield, title: "Owner Trust Protection", desc: "Premium guest screening and secure transaction management for peace of mind." }
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ x: 10 }}
                                                className="flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                                    <item.icon className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {[
                                            { icon: Shield, title: "Mood-Based Intelligence", desc: "Our AI analyzes your interests to suggest destinations that match your current vibe." },
                                            { icon: Leaf, title: "Eco-Conscious Travel", desc: "Automated carbon footprint estimation for every itinerary generated." },
                                            { icon: ShoppingBag, title: "Smart Packing Assistant", desc: "Get tailored packing lists based on 2026 weather forecasts and local events." }
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ x: 10 }}
                                                className="flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-default"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                                    <item.icon className="w-6 h-6 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="relative">
                            <WorldGlobe />
                            <div className="absolute bottom-10 left-10 right-10 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 z-20">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                        {actingRole === 'owner' ? "Portfolio Performance Active" : "AI Global Engine Active"}
                                    </span>
                                </div>
                                <p className="text-xl font-bold italic">
                                    {actingRole === 'owner'
                                        ? "Monitoring your property network across the globe."
                                        : "Connected intelligence, planning your world."}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Stats/Features Section */}
            <section className="py-24 px-4 bg-slate-900/50 border-y border-slate-800">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    {[
                        { icon: Map, title: "Smart Planning", desc: "Day-wise customized itineraries" },
                        { icon: Hotel, title: "Direct Booking", desc: "Reserve rooms seamlessly" },
                        { icon: Shield, title: "Safe & Secure", desc: "Verified owners only" },
                        { icon: Zap, title: "Instant AI", desc: "Powered by Advanced AI" },
                    ].map((feature, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-6 text-blue-500">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomePage;
