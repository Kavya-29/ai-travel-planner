const mongoose = require('mongoose');
require('dotenv').config();
const Property = require('./models/Property');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const properties = await Property.find({}, 'name availableRooms totalRooms');
        console.log('--- PROPERTIES ---');
        console.log(JSON.stringify(properties, null, 2));
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
