import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { BarChart3, Users, Home, TrendingUp, Plus, Search, Filter, Trash2, Edit2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '../utils/currencyData';

const OwnerDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setScreenContext } = useChatContext();
    const [stats, setStats] = useState({
        totalProperties: 0,
        activeBookings: 0,
        totalRevenue: 0,
        growth: '0%',
        monthlyRevenue: []
    });
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Share live screen stats and paths with the Chatbot
        setScreenContext({
            page: 'owner-dashboard',
            stats: {
                totalRevenue: stats.totalRevenue,
                totalProperties: stats.totalProperties,
                activeBookings: stats.activeBookings
            },
            actionPaths: {
                addProperty: '/owner/add-property',
                viewBookings: '/owner/bookings'
            },
            properties: properties.map(p => ({
                id: p._id,
                name: p.name,
                location: p.location,
                availableRooms: p.availableRooms,
                editPath: `/owner/edit-property/${p._id}`
            }))
        });
    }, [stats, properties, setScreenContext]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, propsRes] = await Promise.all([
                    API.get('/dashboard/stats'),
                    API.get('/properties/my')
                ]);
                setStats(statsRes.data);
                setProperties(propsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Owner Dashboard</h1>
                        <p className="text-slate-400">Managing properties for {user?.name}</p>
                    </div>
                    <Link to="/owner/add-property" className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                        <Plus className="w-5 h-5" />
                        Add New Property
                    </Link>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Revenue', value: stats.totalRevenue || 0, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
                        { label: 'Properties', value: stats.totalProperties, icon: Home, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Active Bookings', value: stats.activeBookings, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        { label: 'Growth', value: stats.growth || '0%', icon: BarChart3, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className="text-2xl font-black">{stat.label === 'Total Revenue' ? `$${stat.value}` : stat.value}</div>
                            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Manage Properties Section */}
                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold">Manage Your Properties</h3>
                                <div className="text-sm text-slate-500">{properties.length} Total</div>
                            </div>

                            <div className="space-y-4">
                                {properties.length > 0 ? (
                                    properties.map((prop) => (
                                        <div key={prop._id} className="flex items-center justify-between p-4 bg-slate-800/20 rounded-2xl border border-slate-700/30 group hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 bg-slate-800 rounded-xl overflow-hidden">
                                                    {prop.images?.[0] ? (
                                                        <img src={prop.images[0].startsWith('http') ? prop.images[0] : `http://localhost:5000${prop.images[0]}`} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><Home className="w-6 h-6" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-100">{prop.name}</div>
                                                    <div className="text-[10px] text-slate-500">{prop.location?.city}, {prop.location?.country}</div>
                                                    <div className="text-[10px] uppercase font-bold text-blue-400 mt-1">
                                                        {prop.availableRooms}/{prop.totalRooms} Rooms Available
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link to={`/owner/edit-property/${prop._id}`} className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button onClick={async () => {
                                                    if (window.confirm('Delete this property?')) {
                                                        await API.delete(`/properties/${prop._id}`);
                                                        setProperties(properties.filter(p => p._id !== prop._id));
                                                        toast.success('Property removed');
                                                    }
                                                }} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        <Home className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>No properties found</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold">Property Performance</h3>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 bg-slate-800 rounded-md text-xs font-bold text-slate-400">7 Days</button>
                                    <button className="px-3 py-1 bg-blue-600/20 border border-blue-500/50 rounded-md text-xs font-bold text-blue-400">30 Days</button>
                                </div>
                            </div>
                            <div className="h-[300px] flex items-end gap-3 px-4">
                                {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                                    stats.monthlyRevenue.map((item, i) => {
                                        const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1);
                                        const height = (item.revenue / maxRevenue) * 100;
                                        return (
                                            <div key={i} className="flex-1 h-full bg-blue-600/10 rounded-t-xl group relative">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${Math.max(height, 5)}%` }}
                                                    className="w-full bg-blue-500 rounded-t-lg absolute bottom-0 group-hover:bg-blue-400 transition-colors"
                                                />
                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold whitespace-nowrap">
                                                    {item.month}
                                                </div>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    ${item.revenue}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full text-center text-slate-500 italic pb-20">No revenue data yet</div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                            <h3 className="font-bold mb-6">Recent Bookings</h3>
                            <div className="space-y-4">
                                {stats.recentBookings && stats.recentBookings.length > 0 ? (
                                    stats.recentBookings.map((booking, i) => (
                                        <div key={booking._id} className="flex items-center gap-4 p-4 bg-slate-800/20 rounded-2xl border border-slate-700/30">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                                {booking.guest?.name?.charAt(0) || 'G'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold">{booking.guest?.name || `Guest #${i + 100}`}</div>
                                                <div className="text-[10px] text-slate-500">{new Date(booking.checkIn).toLocaleDateString()} • {getCurrencySymbol(booking.property?.currency)}{booking.totalPrice}</div>
                                            </div>
                                            <div className={`text-[10px] uppercase font-black ${booking.status === 'confirmed' ? 'text-green-500' : 'text-yellow-500'}`}>{booking.status}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500 text-sm">No bookings yet</div>
                                )}
                            </div>
                            <Link to="/owner/bookings" className="block w-full mt-6 py-3 text-sm text-blue-500 font-bold hover:underline">View All Bookings</Link>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
