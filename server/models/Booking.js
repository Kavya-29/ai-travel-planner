const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        rooms: { type: Number, default: 1, min: 1 },
        totalPrice: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'confirmed',
        },
        roomType: { type: String },
        meals: {
            breakfast: { type: Boolean, default: false },
            lunch: { type: Boolean, default: false },
            dinner: { type: Boolean, default: false },
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        specialRequests: { type: String, default: '' },
        guestDetails: {
            name: String,
            email: String,
            phone: String,
        },
        razorpayPaymentId: { type: String },
        razorpayOrderId: { type: String },
        deletedByGuest: { type: Boolean, default: false },
        deletedByOwner: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Calculate nights
bookingSchema.virtual('nights').get(function () {
    const diff = this.checkOut - this.checkIn;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

bookingSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
