import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currencyData';

const BookingCard = ({ booking }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-colors group"
        >
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600/20 transition-colors">
                    <MapPin className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-100">{booking.property.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {new Date(booking.checkIn).toLocaleDateString()}
                        </span>
                        <span className={`capitalize px-2 py-0.5 rounded text-[10px] font-bold ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                            booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-red-500/10 text-red-500'
                            }`}>
                            {booking.status}
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-xl font-bold text-blue-500">{getCurrencySymbol(booking.property?.currency)}{booking.totalPrice}</div>
                <div className="text-[10px] text-slate-500 uppercase font-black">Total Paid</div>
            </div>
        </motion.div>
    );
};

export default BookingCard;
