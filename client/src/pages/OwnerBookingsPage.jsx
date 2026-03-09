import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { Check, X, Clock, User, Home, Trash2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '../utils/currencyData';

const OwnerBookingsPage = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await API.get('/bookings/owner');
                setBookings(data);
            } catch (error) {
                toast.error("Failed to load bookings");
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleStatus = async (bookingId, status) => {
        try {
            const endpoint = status === 'confirmed' ? 'confirm' : 'cancel';
            await API.patch(`/bookings/${bookingId}/${endpoint}`);
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, status } : b));
            toast.success(`Booking ${status}`);
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const handleRefund = async (bookingId) => {
        if (!window.confirm('Mark this booking as refunded? This will notify the guest.')) return;
        try {
            await API.patch(`/bookings/${bookingId}/refund`);
            setBookings(bookings.map(b => b._id === bookingId ? { ...b, paymentStatus: 'refunded' } : b));
            toast.success('Booking marked as refunded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Refund action failed');
        }
    };

    const handleOwnerDelete = async (bookingId) => {
        if (!window.confirm('Remove this booking from your view?')) return;
        try {
            await API.delete(`/bookings/${bookingId}/owner-delete`);
            setBookings(bookings.filter(b => b._id !== bookingId));
            toast.success('Booking removed from your dashboard');
        } catch (error) {
            toast.error('Failed to delete booking');
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-10">Manage Bookings</h1>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-2xl animate-pulse"></div>)}
                    </div>
                ) : (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-800/50 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-6">Guest</th>
                                    <th className="px-8 py-6">Details</th>
                                    <th className="px-8 py-6">Dates</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 hover:[&>tr]:bg-slate-800/10">
                                {bookings.map((booking, index) => (
                                    <motion.tr
                                        key={booking._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-800/20 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold group-hover:scale-110 transition-transform">{booking.guest?.name?.charAt(0) || 'G'}</div>
                                                <div>
                                                    <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{booking.guest?.name || 'Guest'}</div>
                                                    <div className="text-[10px] text-slate-500 font-medium lowercase italic">{booking.guestDetails?.email || booking.guest?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-sm font-bold text-slate-200">{booking.property?.name}</div>
                                                <div className="text-[11px] text-slate-400 capitalize bg-slate-800/50 px-2 py-0.5 rounded-md inline-block">
                                                    {booking.roomType || 'Standard'} • {Object.entries(booking.meals || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'Room Only'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs space-y-1">
                                                <div className="text-slate-200 font-medium">{new Date(booking.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(booking.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                <div className="text-[10px] text-slate-500">Total: {
                                                    booking.property?.currency === 'EUR' ? '€' :
                                                        booking.property?.currency === 'KRW' ? '₩' :
                                                            getCurrencySymbol(booking.property?.currency)
                                                }{booking.totalPrice}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                                                booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                                                    'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {booking.status === 'confirmed' ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleStatus(booking._id, 'cancelled')}
                                                            className="p-2 bg-red-600/10 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                                                            title="Cancel this booking"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOwnerDelete(booking._id)}
                                                            className="p-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                                                            title="Delete from my view"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {booking.paymentStatus === 'paid' ? (
                                                        <span className="text-[10px] bg-green-500/20 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                                                            ✅ Payment Successful
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg font-bold">
                                                            ⏳ Awaiting Payment
                                                        </span>
                                                    )}
                                                </div>
                                            ) : booking.status === 'cancelled' ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex gap-2">
                                                        {booking.paymentStatus === 'paid' && (
                                                            <button
                                                                onClick={() => handleRefund(booking._id)}
                                                                className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                                                                title="Mark as Refunded"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOwnerDelete(booking._id)}
                                                            className="p-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                                                            title="Delete from my view"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    {booking.paymentStatus === 'refunded' ? (
                                                        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg font-bold">
                                                            🔄 Refunded
                                                        </span>
                                                    ) : booking.paymentStatus === 'paid' ? (
                                                        <motion.span
                                                            animate={{ opacity: [1, 0.5, 1], scale: [1, 1.05, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1.5 rounded-lg font-bold"
                                                        >
                                                            ⚠️ Refund Required
                                                        </motion.span>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleOwnerDelete(booking._id)}
                                                    className="p-2 bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
                                                    title="Delete from my view"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        {bookings.length === 0 && (
                            <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4">
                                <Clock className="w-12 h-12 opacity-20" />
                                <p>No booking requests yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default OwnerBookingsPage;
