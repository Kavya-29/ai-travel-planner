const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

const run = async () => {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        const db = client.db();
        const properties = db.collection('properties');

        // Fix Paris Properties -> EUR
        const parisResult = await properties.updateMany(
            { 'location.city': /Paris/i },
            { $set: { currency: 'EUR' } }
        );
        console.log(`🇫🇷 Updated ${parisResult.modifiedCount} Paris properties to EUR`);

        // Fix South Korea Properties -> KRW
        const koreaResult = await properties.updateMany(
            { 'location.country': /Korea/i },
            { $set: { currency: 'KRW' } }
        );
        console.log(`🇰🇷 Updated ${koreaResult.modifiedCount} Korea properties to KRW`);

        // Fix India Properties -> INR
        const indiaResult = await properties.updateMany(
            { 'location.country': /India/i },
            { $set: { currency: 'INR' } }
        );
        console.log(`🇮🇳 Updated ${indiaResult.modifiedCount} India properties to INR`);

        console.log('✅ Direct DB Migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.close();
        process.exit(0);
    }
};

run();
