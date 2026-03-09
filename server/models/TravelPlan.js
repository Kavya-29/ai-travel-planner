const mongoose = require('mongoose');

const travelPlanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    place: { type: String, required: true },
    days: { type: Number, required: true },
    budget: { type: Number },
    currency: { type: String },
    itineraryData: { type: Object, required: true },
    innovationData: { type: Object },
    travelDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('TravelPlan', travelPlanSchema);
