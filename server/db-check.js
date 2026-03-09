const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Property = require('./models/Property');
const User = require('./models/User');

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- DB CHECK ---');

        const properties = await Property.find().populate('owner', 'name role email');
        console.log('Total Properties:', properties.length);

        properties.forEach((p, i) => {
            console.log(`\nProperty ${i + 1}: ${p.name}`);
            console.log(`Owner ID: ${p.owner?._id}`);
            console.log(`Owner Name: ${p.owner?.name}`);
            console.log(`Owner Role: ${p.owner?.role}`);
        });

        const owners = await User.find({ role: 'owner' });
        console.log('\nTotal Owners in System:', owners.length);
        owners.forEach(o => {
            console.log(`Owner: ${o.name} (${o._id})`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
