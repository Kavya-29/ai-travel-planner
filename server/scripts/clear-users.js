require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const clearUsers = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('⚠️ Deleting all users...');
        const result = await User.deleteMany({});
        console.log(`✅ Success! Deleted ${result.deletedCount} users.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing users:', error.message);
        process.exit(1);
    }
};

clearUsers();
