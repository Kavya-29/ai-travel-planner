const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String },
    },
    { timestamps: true }
);

const propertySchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['hotel', 'restaurant', 'resort', 'guesthouse'], default: 'hotel' },
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        location: {
            city: { type: String, required: true },
            country: { type: String, required: true },
            address: { type: String },
        },
        price: { type: Number, required: true }, // base/starting price
        currency: { type: String, default: 'USD', trim: true, uppercase: true },
        availableRooms: { type: Number, default: 1 },
        totalRooms: { type: Number, default: 1 },
        amenities: [{ type: String }],
        roomTypes: [{
            name: { type: String, required: true },
            price: { type: Number, required: true }
        }],
        images: [{ type: String }], // file paths
        reviews: [reviewSchema],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Virtual: average rating
propertySchema.virtual('avgRating').get(function () {
    if (!this.reviews || !this.reviews.length) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / this.reviews.length).toFixed(1);
});

propertySchema.set('toJSON', { virtuals: true });
propertySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Property', propertySchema);
