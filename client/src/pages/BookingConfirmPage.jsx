import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CheckCircle, ArrowRight, Home, Calendar } from 'lucide-react';

const BookingConfirmPage = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Navbar />
            <main className="max-w-xl mx-auto px-4 py-24 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900/50 border border-slate-800 p-12 rounded-[40px] shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>

                    <h1 className="text-4xl font-bold mb-4">Booking Requested!</h1>
                    <p className="text-slate-400 mb-10 leading-relaxed">
                        Your reservation request has been sent to the property owner. You'll receive a notification once they confirm your stay.
                    </p>

                    <div className="space-y-4">
                        <Link to="/dashboard" className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 group">
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/book-now" className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all border border-slate-700">
                            Explore More
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default BookingConfirmPage;
