import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { Home, MapPin, DollarSign, Image as ImageIcon, Plus, Info, ArrowRight, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCurrencyFromCountry, getCurrencySymbol, getAllCurrencies } from '../utils/currencyData';

const EditPropertyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        roomTypes: []
    });

    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const { data } = await API.get(`/properties/${id}`);
                setFormData({
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    city: data.location.city,
                    country: data.location.country,
                    address: data.location.address || '',
                    price: data.price,
                    currency: data.currency || 'USD',
                    totalRooms: data.totalRooms,
                    availableRooms: data.availableRooms,
                    amenities: data.amenities.join(', '),
                    roomTypes: (data.roomTypes && data.roomTypes.length > 0
                        ? data.roomTypes.map(rt => ({
                            name: String(typeof rt === 'object' ? rt.name : rt).replace(/[\[\]"']/g, '').trim(),
                            price: rt.price || data.price
                        }))
                        : [{ name: 'Standard', price: data.price }]
                    )
                });
                setExistingImages(data.images || []);
                setLoading(false);
            } catch (error) {
                toast.error("Failed to load property");
                navigate('/owner-dashboard');
            }
        };
        fetchProperty();
    }, [id]);

    // Auto-detect currency when country changes
    useEffect(() => {
        if (!formData.country || formData.country.trim().length < 3) return;

        const detectCurrency = async () => {
            try {
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

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length + existingImages.length > 5) {
            toast.error("Max 5 images total");
            return;
        }

        setImages([...images, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setImages(updatedImages);
        setPreviews(updatedPreviews);
    };

    const removeExistingImage = (imageUrl) => {
        setExistingImages(existingImages.filter(img => img !== imageUrl));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const minPrice = Math.min(...formData.roomTypes.map(rt => Number(rt.price) || 0));

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'roomTypes') {
                    data.append(key, JSON.stringify(formData[key]));
                } else if (key === 'price') {
                    data.append(key, minPrice);
                } else {
                    data.append(key, formData[key]);
                }
            });

            data.append('existingImages', JSON.stringify(existingImages));
            images.forEach(img => data.append('images', img));

            await API.put(`/properties/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Property updated successfully!");
            navigate('/owner-dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update property");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black tracking-tighter text-4xl animate-pulse">Loading Intelligence...</div>;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 pb-20 font-sans">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 backdrop-blur-xl"
                >
                    <div className="mb-10">
                        <h1 className="text-4xl font-black mb-3 tracking-tight">Edit Property</h1>
                        <p className="text-slate-500 text-lg font-medium opacity-80 uppercase tracking-widest text-xs">Update your exquisite space for elite travelers.</p>
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
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Property Type</label>
                                    <select
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none font-medium text-white"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="hotel">Hotel</option>
                                        <option value="resort">Resort</option>
                                        <option value="guesthouse">Guesthouse</option>
                                        <option value="restaurant">Restaurant</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Location Details */}
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
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Country</label>
                                    <input
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold flex justify-between">
                                        <span>Property Currency</span>
                                        <span className="text-blue-400 text-[10px] uppercase tracking-wider font-bold opacity-60">Auto-Detected</span>
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
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Pricing & Logistics */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                                <DollarSign className="w-5 h-5" /> Pricing & Logistics
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Available Rooms</label>
                                    <input
                                        required type="number" min="0"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.availableRooms}
                                        onChange={(e) => setFormData({ ...formData, availableRooms: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold">Total Rooms</label>
                                    <input
                                        required type="number" min="1"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                        value={formData.totalRooms}
                                        onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-400 mb-2 font-semibold flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Description & Amenities
                                </label>
                                <textarea
                                    required
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all h-32 resize-none font-medium"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                <input
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                                    placeholder="Amenities (comma separated)"
                                    value={formData.amenities}
                                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-xs">Room Types & Rates</span>
                                    <button type="button" onClick={addRoomType} className="text-xs bg-blue-600/20 text-blue-400 py-2 px-4 rounded-xl hover:bg-blue-600/30 transition-all flex items-center gap-2">
                                        <Plus className="w-3 h-3" /> Add Room
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.roomTypes.map((room, index) => (
                                        <div key={index} className="flex gap-4 items-center">
                                            <input required className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm" placeholder="Room Name" value={room.name} onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)} />
                                            <div className="relative w-32">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{getCurrencySymbol(formData.currency)}</span>
                                                <input required type="number" className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-3 pl-8 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-sm" placeholder="Price" value={room.price} onChange={(e) => handleRoomTypeChange(index, 'price', e.target.value)} />
                                            </div>
                                            {formData.roomTypes.length > 1 && (
                                                <button type="button" onClick={() => removeRoomType(index)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Property Gallery */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                                <ImageIcon className="w-5 h-5" /> Property Media
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {existingImages.map((img, i) => (
                                    <div key={`old-${i}`} className="aspect-square bg-slate-800 rounded-2xl relative group overflow-hidden border border-slate-700">
                                        <img src={img.startsWith('http') ? img : `http://localhost:5000${img}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeExistingImage(img)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">Remove</button>
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase text-white pointer-events-none">Live</div>
                                    </div>
                                ))}
                                {previews.map((preview, i) => (
                                    <div key={`new-${i}`} className="aspect-square bg-slate-800 rounded-2xl relative group overflow-hidden border border-blue-500/30">
                                        <img src={preview} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeNewImage(i)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">Cancel</button>
                                        <div className="absolute top-2 left-2 bg-blue-600/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase text-white pointer-events-none">New</div>
                                    </div>
                                ))}
                                {existingImages.length + images.length < 5 && (
                                    <label className="aspect-square bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                                        <Plus className="w-8 h-8 text-slate-500 group-hover:text-blue-500 transition-all" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400">Upload</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                )}
                            </div>
                        </div>



                        <div className="flex gap-4 pt-10">
                            <button type="button" onClick={() => navigate('/owner-dashboard')} className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-[2rem] font-bold transition-all">Cancel Tracking</button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-[2rem] font-bold transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 group text-xl"
                            >
                                {saving ? "Updating..." : "Update Intelligence"}
                                <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default EditPropertyPage;

