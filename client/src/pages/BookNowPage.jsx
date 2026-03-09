import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import PropertyCard from '../components/PropertyCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useChatContext } from '../context/ChatContext';
import { Search, Filter, Calendar, Mail, Home, Utensils, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencySymbol } from '../utils/currencyData';

const BookingModal = ({ property, onClose, onConfirm, user }) => {
    const getInitialRoomType = () => {
        if (!property.roomTypes || property.roomTypes.length === 0) return 'Standard';
        const first = property.roomTypes[0];
        const name = typeof first === 'object' ? first.name : first;
        return String(name).replace(/[\[\]"']/g, '').trim();
    };



    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        email: user?.email || '',
        checkIn: today,
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        rooms: 1,
        roomType: getInitialRoomType(),
        meals: { breakfast: false, lunch: false, dinner: false }
    });

    const { setScreenContext } = useChatContext();

    useEffect(() => {
        // Feed live booking context to the AI
        setScreenContext({
            page: 'book-property',
            property: {
                id: property._id,
                name: property.name,
                location: property.location,
                price: property.price
            },
            formData
        });
    }, [formData, property, setScreenContext]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMealChange = (meal) => {
        setFormData(prev => ({
            ...prev,
            meals: { ...prev.meals, [meal]: !prev.meals[meal] }
        }));
    };

    useEffect(() => {
        const handleAiBookNow = (e) => {
            if (e.detail) {
                const { guests, rooms, startDate, endDate } = e.detail;

                const newFormData = {
                    ...formData,
                    rooms: rooms || guests || formData.rooms,
                    checkIn: startDate || formData.checkIn,
                    checkOut: endDate || formData.checkOut
                };

                setFormData(newFormData);

                // Simulate human review delay before submitting
                setTimeout(() => {
                    onConfirm(newFormData);
                }, 1500);
            }
        };

        window.addEventListener('ai_book_now', handleAiBookNow);
        return () => window.removeEventListener('ai_book_now', handleAiBookNow);
    }, [formData, onConfirm]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="relative h-48 bg-slate-800">
                    <img src={property.images?.[0] ? (property.images[0].startsWith('http') ? property.images[0] : `http://localhost:5000${property.images[0]}`) : ""} alt="" className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    <div className="absolute bottom-6 left-8">
                        <h2 className="text-2xl font-black">{property.name}</h2>
                        <p className="text-slate-400 font-medium">
                            Starting from {getCurrencySymbol(property.currency)}{property.price} / night
                        </p>
                    </div>
                    <div className="absolute top-6 right-8">
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Room Type</label>
                            <div className="relative">
                                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    name="roomType"
                                    value={formData.roomType}
                                    onChange={handleChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-10 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white font-medium"
                                >
                                    {(property.roomTypes && property.roomTypes.length > 0
                                        ? property.roomTypes
                                        : [{ name: 'Standard', price: property.price }]
                                    ).map(rt => {
                                        const rawName = typeof rt === 'object' ? rt.name : rt;
                                        // Clean up brackets, quotes and extra spaces from malformed data
                                        const cleanName = String(rawName).replace(/[\[\]"']/g, '').trim();
                                        return (
                                            <option key={cleanName} value={cleanName} className="bg-slate-900 text-white">
                                                {cleanName} {rt.price ? `(${getCurrencySymbol(property.currency)}${rt.price})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Check In</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input name="checkIn" type="date" required min={today} value={formData.checkIn} onChange={handleChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Check Out</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input name="checkOut" type="date" required min={tomorrow} value={formData.checkOut} onChange={handleChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                            </div>
                        </div>
                    </div>

                    {/* Number of Rooms */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Home className="w-4 h-4" /> Number of Rooms
                        </label>
                        <input
                            name="rooms"
                            type="number"
                            min="1"
                            max={property.availableRooms || 10}
                            required
                            value={formData.rooms}
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-white"
                        />
                        <p className="text-[10px] text-slate-500">{property.availableRooms} room(s) currently available</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Utensils className="w-4 h-4" /> Meal Preferences
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {['breakfast', 'lunch', 'dinner'].map(meal => (
                                <button
                                    key={meal}
                                    type="button"
                                    onClick={() => handleMealChange(meal)}
                                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.meals[meal] ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold' : 'bg-slate-800/30 border-slate-700 text-slate-500'}`}
                                >
                                    {formData.meals[meal] && <Check className="w-3 h-3" />}
                                    <span className="capitalize">{meal}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-800 rounded-2xl font-bold hover:bg-slate-700 transition-all">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Send Booking Request</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const BookNowPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProperty, setSelectedProperty] = useState(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const locQuery = params.get('location');
                if (locQuery) setSearchTerm(locQuery);

                const { data } = await API.get('/properties');
                setProperties(data.properties || []);
            } catch (error) {
                toast.error("Failed to load properties");
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, [location.search]);

    const filteredProperties = properties.filter(p => {
        if (!searchTerm.trim()) return true;
        const keywords = searchTerm.toLowerCase().split(/[,\s]+/).filter(k => k.length > 0);
        const combinedText = `${p.name} ${p.location?.city} ${p.location?.country}`.toLowerCase();

        // Every keyword must be present in the combined text
        return keywords.every(kw => combinedText.includes(kw));
    });

    const handleConfirmBooking = async (formData) => {
        try {
            const nights = Math.max(1, Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24)));
            const selectedRoom = selectedProperty.roomTypes?.find(rt => rt.name === formData.roomType);
            const unitPrice = selectedRoom ? selectedRoom.price : selectedProperty.price;

            const bookingData = {
                propertyId: selectedProperty._id,
                ...formData,
                totalPrice: unitPrice * nights * formData.rooms
            };
            await API.post('/bookings', bookingData);
            toast.success("Booking request sent to owner!");
            setSelectedProperty(null);
            navigate('/my-bookings');
        } catch (error) {
            console.error("BOOKING ERROR:", error.response?.data || error);
            const msg = error.response?.data?.message || "Booking failed. Please try again.";
            toast.error(msg);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">Find Your Stay</h1>
                        <p className="text-slate-400 font-medium italic">Discover hand-picked premium properties for your journey.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                placeholder="Search destination..."
                                className="bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all w-full md:w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"><Filter className="w-6 h-6" /></button>
                    </div>
                </header>

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {filteredProperties.length > 0 ? (
                            filteredProperties.map((property) => (
                                <PropertyCard
                                    key={property._id}
                                    property={property}
                                    onBook={() => setSelectedProperty(property)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-3xl">
                                <p className="text-slate-500 font-medium">No results for "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {selectedProperty && (
                <BookingModal
                    property={selectedProperty}
                    onClose={() => setSelectedProperty(null)}
                    onConfirm={handleConfirmBooking}
                />
            )}
        </div>
    );
};

export default BookNowPage;
