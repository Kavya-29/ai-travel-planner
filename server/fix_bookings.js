const mongoose = require('mongoose');
require('dotenv').config();
const Booking = require('./models/Booking');

const updateBookings = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-travel-planner';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);

        const result = await Booking.updateMany(
            { status: 'pending' },
            { $set: { status: 'confirmed' } }
        );

        console.log(`Successfully updated ${result.modifiedCount} bookings from pending to confirmed.`);
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
};

updateBookings();
