require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const TravelPlan = require('../models/TravelPlan');
const Squad = require('../models/Squad');

const clearDatabase = async () => {
    try {
        console.log('🔄 Connecting to MongoDB for total wipe...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('⚠️ DELETING ALL DATA ACROSS ALL COLLECTIONS...');

        let userResult = await User.deleteMany({});
        console.log(`✅ Deleted ${userResult.deletedCount} users.`);

        let propResult = await Property.deleteMany({});
        console.log(`✅ Deleted ${propResult.deletedCount} properties.`);

        let bookResult = await Booking.deleteMany({});
        console.log(`✅ Deleted ${bookResult.deletedCount} bookings.`);

        let planResult = await TravelPlan.deleteMany({});
        console.log(`✅ Deleted ${planResult.deletedCount} travel plans.`);

        let squadResult = await Squad.deleteMany({});
        console.log(`✅ Deleted ${squadResult.deletedCount} squads.`);

        console.log('🎉 Database is completely clean!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
        process.exit(1);
    }
};

clearDatabase();
