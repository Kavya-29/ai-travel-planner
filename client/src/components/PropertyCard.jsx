import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Hotel } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currencyData';

const PropertyCard = ({ property, onBook }) => {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden group"
        >
            <div className="aspect-video bg-slate-800 relative overflow-hidden">
                {property.images?.[0] ? (
                    <img src={property.images[0].startsWith('http') ? property.images[0] : `http://localhost:5000${property.images[0]}`} alt={property.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Hotel className="w-12 h-12" />
                    </div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> 4.8
                </div>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold mb-1">{property.name}</h3>
                        <div className="flex items-center gap-1 text-slate-500 text-sm">
                            <MapPin className="w-4 h-4" /> {property.location?.city}, {property.location?.country}
                        </div>
                        <div className={`text-[10px] font-bold uppercase mt-2 ${property.availableRooms > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {property.availableRooms > 0 ? `${property.availableRooms} Rooms Left` : 'Sold Out'}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-blue-500 font-bold text-lg leading-none">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">from</span>
                            {getCurrencySymbol(property.currency)}{property.price}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">per night</div>
                    </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 mb-6">{property.description}</p>
                <button
                    disabled={property.availableRooms <= 0}
                    onClick={() => onBook(property._id)}
                    className={`w-full py-4 rounded-2xl font-bold transition-all border ${property.availableRooms <= 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700' : 'bg-slate-800 hover:bg-blue-600 text-white border-slate-700 group-hover:border-blue-500/50'}`}
                >
                    {property.availableRooms > 0 ? 'Book This Stay' : 'Sold Out'}
                </button>
            </div>
        </motion.div>
    );
};

export default PropertyCard;
