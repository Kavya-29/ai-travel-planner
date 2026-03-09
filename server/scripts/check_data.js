const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const properties = await db.collection('properties').find({}).toArray();
        console.log('--- ALL PROPERTIES ---');
        properties.forEach(p => {
            console.log(`- Name: ${p.name}, City: ${p.location?.city}, Country: ${p.location?.country}, Currency: ${p.currency}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
        process.exit(0);
    }
};

run();
