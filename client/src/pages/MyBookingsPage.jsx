import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { Clock, CreditCard, CheckCircle, XCircle, ChevronRight, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currencyData';

const MyBookingsPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const { data } = await API.get('/bookings/guest');
            setBookings(data);
        } catch (error) {
            toast.error("Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (bookingId, totalPrice) => {
        try {
            setPayingId(bookingId);

            // 1. Create Razorpay order on the backend
            const { data: order } = await API.post(`/bookings/${bookingId}/create-order`);

            // 2. Open Razorpay checkout modal
            const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: 'AI Travel Planner',
                description: 'Room Booking Payment',
                order_id: order.orderId,
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                },
                theme: { color: '#2563EB' },
                handler: async (response) => {
                    try {
                        // 3. Verify payment on backend
                        await API.post(`/bookings/${bookingId}/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        toast.success('🎉 Payment Successful! Your stay is confirmed!');
                        setBookings(prev => prev.map(b =>
                            b._id === bookingId ? { ...b, paymentStatus: 'paid' } : b
                        ));
                    } catch {
                        toast.error('Payment verification failed. Contact support.');
                    }
                },
                modal: {
                    ondismiss: () => toast('Payment cancelled', { icon: '❌' })
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not initiate payment.');
        } finally {
            setPayingId(null);
        }
    };



    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-black mb-10 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-500" />
                    My Bookings
                </h1>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800/50 rounded-3xl animate-pulse"></div>)}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => {
                                const symbol = getCurrencySymbol(booking.property?.currency);

                                let isAutoRefunded = false;
                                if (booking.status === 'cancelled' && booking.paymentStatus === 'paid' && booking.updatedAt) {
                                    let workingDaysCount = 0;
                                    let currDate = new Date(booking.updatedAt);
                                    const currentDate = new Date();

                                    while (currDate <= currentDate) {
                                        const dayOfWeek = currDate.getDay();
                                        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                                            workingDaysCount++;
                                        }
                                        currDate.setDate(currDate.getDate() + 1);
                                    }
                                    if (workingDaysCount >= 7) {
                                        isAutoRefunded = true;
                                    }
                                }

                                const displayPaymentStatus = isAutoRefunded ? 'refunded' : booking.paymentStatus;
                                
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={booking._id}
                                        className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 group hover:border-blue-500/30 transition-all"
                                    >
                                        <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0">
                                            <img
                                                src={booking.property?.images?.[0] ? (booking.property.images[0].startsWith('http') ? booking.property.images[0] : `http://localhost:5000${booking.property.images[0]}`) : ""}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>

                                        <div className="flex-1 w-full space-y-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">{booking.property?.name}</h3>
                                                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                                        <MapPin className="w-3 h-3 text-blue-500" />
                                                        {booking.property?.location?.city}, {booking.property?.location?.country}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                        booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                            'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${displayPaymentStatus === 'paid' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        displayPaymentStatus === 'refunded' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                            'bg-slate-800 text-slate-500 border border-slate-700'
                                                        }`}>
                                                        {displayPaymentStatus === 'paid' ? 'Paid' : displayPaymentStatus === 'refunded' ? 'Refunded' : 'Unpaid'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-y border-slate-800/50">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Check In</p>
                                                    <p className="text-sm font-medium">{booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : 'TBD'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Check Out</p>
                                                    <p className="text-sm font-medium">{booking.checkOut ? new Date(booking.checkOut).toLocaleDateString() : 'TBD'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Room Type</p>
                                                    <p className="text-sm font-medium capitalize">{booking.roomType || 'Standard'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Price</p>
                                                    <p className="text-sm font-bold text-blue-400">{symbol}{booking.totalPrice || 0}</p>
                                                </div>
                                            </div>

                                            {booking.status === 'confirmed' && displayPaymentStatus === 'pending' && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handlePay(booking._id, booking.totalPrice)}
                                                    disabled={payingId === booking._id}
                                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-60"
                                                >
                                                    {payingId === booking._id ? (
                                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                                                            <CreditCard className="w-5 h-5" />
                                                        </motion.div>
                                                    ) : (
                                                        <CreditCard className="w-5 h-5" />
                                                    )}
                                                    {payingId === booking._id ? 'Opening Payment...' : `Pay Now — ${symbol}${booking.totalPrice}`}
                                                </motion.button>
                                            )}
                                            {displayPaymentStatus === 'paid' && booking.status !== 'cancelled' && (
                                                <div className="w-full py-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 font-bold flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                    Payment Successful - Your stay is secured!
                                                </div>
                                            )}
                                            {booking.status === 'cancelled' && displayPaymentStatus === 'paid' && (
                                                <div className="w-full py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400 text-sm font-semibold flex items-center justify-center gap-2">
                                                    🔄 Refund will be initiated within 7 working days
                                                </div>
                                            )}
                                            {displayPaymentStatus === 'refunded' && (
                                                <div className="w-full py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 text-sm font-semibold flex items-center justify-center gap-2">
                                                    ✅ Refund Successful - The amount has been returned
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="p-20 text-center bg-slate-900/30 border border-slate-800 rounded-[3rem] text-slate-500">
                                <Clock className="w-16 h-16 mx-auto mb-6 opacity-20" />
                                <p className="text-xl font-medium">You haven't made any bookings yet.</p>
                                <button onClick={() => navigate('/dashboard')} className="mt-6 text-blue-500 font-bold hover:underline">Explore properties now</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyBookingsPage;
