import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { useChatContext } from '../context/ChatContext';
import { Home, MapPin, DollarSign, Image as ImageIcon, Plus, Info, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencyFromCountry, getCurrencySymbol, getAllCurrencies } from '../utils/currencyData';

const AddPropertyPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        city: '',
        country: '',
        address: '',
        price: '',
        currency: 'USD',
        type: 'hotel',
        availableRooms: 1,
        totalRooms: 1,
        amenities: '',
        roomTypes: [
            { name: 'Standard', price: '' },
            { name: 'Deluxe', price: '' },
            { name: 'Suite', price: '' }
        ]
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const { setScreenContext } = useChatContext();

    useEffect(() => {
        // Feed live form context to the AI
        setScreenContext({
            page: 'add-property',
            formData
        });
    }, [formData, setScreenContext]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            toast.error("Maximum 5 images allowed");
            return;
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const handleRoomTypeChange = (index, field, value) => {
        const newRoomTypes = [...formData.roomTypes];
        newRoomTypes[index][field] = value;
        setFormData({ ...formData, roomTypes: newRoomTypes });
    };

    const addRoomType = () => {
        setFormData({
            ...formData,
            roomTypes: [...formData.roomTypes, { name: '', price: '' }]
        });
    };

    const removeRoomType = (index) => {
        setFormData({
            ...formData,
            roomTypes: formData.roomTypes.filter((_, i) => i !== index)
        });
    };

    // Auto-detect currency when country changes
    React.useEffect(() => {
        if (!formData.country || formData.country.trim().length < 3) return;

        const detectCurrency = async () => {
            try {
                // We use geocoding to get the country code from the country name the owner types
                const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(formData.country)}&count=1&language=en&format=json`);
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
    }, [formData.country]);

    const handleSubmit = async (e, overrideData = null) => {
        e.preventDefault();
        setLoading(true);

        const dataToSubmit = overrideData || formData;
        const minPrice = Math.min(...dataToSubmit.roomTypes.map(rt => Number(rt.price) || 0));

        const data = new FormData();
        Object.keys(dataToSubmit).forEach(key => {
            if (key === 'roomTypes') {
                data.append(key, JSON.stringify(dataToSubmit[key]));
            } else if (key === 'price') {
                data.append(key, minPrice);
            } else {
                data.append(key, dataToSubmit[key]);
            }
        });
        images.forEach(image => data.append('images', image));

        try {
            await API.post('/properties', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Property listed successfully!");
            navigate('/owner-dashboard');
        } catch (error) {
            console.error("ADD PROPERTY ERROR:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to add property");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 pb-20">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 backdrop-blur-xl"
                >
                    <div className="mb-10">
                        <h1 className="text-4xl font-black mb-3 tracking-tight">List Your Property</h1>
                        <p className="text-slate-500 text-lg">Share your exquisite space with elite travelers.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                                <Home className="w-5 h-5" /> Basic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Property Name</label>
                                    <input
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        placeholder="Grand Pinachio Resort"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Property Type</label>
                                    <select
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none font-medium"
                                        value={formData.type}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            let newRooms = [];
                                            if (newType === 'restaurant') {
                                                newRooms = [{ name: 'Standard Table', price: '' }, { name: 'Private Room', price: '' }];
                                            } else if (newType === 'resort') {
                                                newRooms = [{ name: 'Villa', price: '' }, { name: 'Suite', price: '' }, { name: 'Cottage', price: '' }];
                                            } else {
                                                newRooms = [{ name: 'Standard', price: '' }, { name: 'Deluxe', price: '' }, { name: 'Suite', price: '' }];
                                            }
                                            setFormData({ ...formData, type: newType, roomTypes: newRooms });
                                        }}
                                    >
                                        <option value="hotel">Hotel</option>
                                        <option value="resort">Resort</option>
                                        <option value="guesthouse">Guesthouse</option>
                                        <option value="restaurant">Restaurant (Dining Space)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Location */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                                <MapPin className="w-5 h-5" /> Location Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">City</label>
                                    <input
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        placeholder="Dubai"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Country</label>
                                    <input
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        placeholder="United Arab Emirates"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold flex justify-between">
                                        <span>Property Currency</span>
                                        <span className="text-blue-400 text-[10px] uppercase tracking-wider font-bold animate-pulse">Auto-Detected</span>
                                    </label>
                                    <select
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium appearance-none text-white"
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
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">
                                        Full Address (Optional)
                                    </label>
                                    <input
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        placeholder="123 Palm Jumeirah, Sector 4..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Pricing & Capacity */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                                <DollarSign className="w-5 h-5" /> Pricing & Logistics
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Available Rooms</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.availableRooms}
                                        onChange={(e) => setFormData({ ...formData, availableRooms: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Total Rooms</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.totalRooms}
                                        onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold flex items-center gap-2">
                                <Info className="w-4 h-4" /> Description & Amenities
                            </label>
                            <textarea
                                required
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all h-32 resize-none font-medium mb-4"
                                placeholder="Describe the luxury and comfort..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <input
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium mb-4"
                                placeholder="Amenities (e.g. WiFi, Pool, Gym - comma separated)"
                                value={formData.amenities}
                                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                            />
                            <label className="block text-sm font-medium text-slate-400 mb-4 font-semibold flex justify-between items-center">
                                <span>Room Types & Pricing</span>
                                <button
                                    type="button"
                                    onClick={addRoomType}
                                    className="text-xs bg-blue-600/20 text-blue-400 py-1 px-3 rounded-lg hover:bg-blue-600/30 transition-all flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Type
                                </button>
                            </label>
                            <div className="space-y-4">
                                {formData.roomTypes.map((room, index) => (
                                    <div className="flex gap-4 items-center animate-in fade-in slide-in-from-left-2 transition-all">
                                        <div className="flex-1">
                                            <input
                                                required
                                                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm"
                                                placeholder="e.g. Deluxe Ocean View"
                                                value={room.name}
                                                onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-32">
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                                                    {getCurrencySymbol(formData.currency)}
                                                </span>
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3 pl-8 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm"
                                                    placeholder="Price"
                                                    value={room.price}
                                                    onChange={(e) => handleRoomTypeChange(index, 'price', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {formData.roomTypes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeRoomType(index)}
                                                className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 4: Property Images */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                                <ImageIcon className="w-5 h-5" /> Property Gallery
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {previews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-800 group">
                                        <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                                        <Plus className="w-8 h-8 text-slate-500 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-xs text-slate-500 mt-2">Add Photo</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">Upload up to 5 high-quality images of your property. (JPG, PNG, WebP)</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-[2rem] font-bold transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 group text-xl"
                        >
                            {loading ? "Publishing to World..." : "Publish Property"}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default AddPropertyPage;
