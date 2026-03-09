const Property = require('../models/Property');
const path = require('path');

// @desc  Add new property (owner only)
// @route POST /api/properties
const addProperty = async (req, res) => {
    try {
        let { name, description, type, city, country, address, location, price, currency, availableRooms, totalRooms, amenities, roomTypes } = req.body;
        const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

        let processedRoomTypes = [];
        if (roomTypes) {
            try {
                processedRoomTypes = typeof roomTypes === 'string' ? JSON.parse(roomTypes) : roomTypes;
            } catch (e) {
                // Fallback for simple comma separated strings
                processedRoomTypes = roomTypes.split(',').map(name => ({
                    name: name.trim(),
                    price: Number(price || 0)
                }));
            }
        } else {
            processedRoomTypes = [
                { name: 'Standard', price: Number(price || 0) },
                { name: 'Deluxe', price: Number(price || 0) * 1.5 },
                { name: 'Suite', price: Number(price || 0) * 2.5 }
            ];
        }

        // Clean room type names (strip brackets, quotes)
        processedRoomTypes = processedRoomTypes.map(rt => ({
            name: String(rt.name || rt).replace(/[\[\]"']/g, '').trim(),
            price: Number(rt.price || price || 0)
        })).filter(rt => rt.name.length > 0);

        // Fallback for location structure if sent as a single string
        let finalLocation = { city, country, address };
        if (!city && location) {
            const parts = location.split(',').map(s => s.trim());
            finalLocation = {
                city: parts[0] || 'Unknown',
                country: parts[1] || 'Unknown',
                address: parts.slice(2).join(', ') || ''
            };
        }

        const property = await Property.create({
            owner: req.user._id,
            name, description, type,
            location: finalLocation,
            price: Number(price),
            currency: currency || 'USD',
            availableRooms: Number(availableRooms) || 1,
            totalRooms: Number(totalRooms) || 1,
            amenities: amenities ? (Array.isArray(amenities) ? amenities : amenities.split(',').map(a => a.trim())) : [],
            roomTypes: processedRoomTypes,
            images,
        });
        res.status(201).json(property);
    } catch (err) {
        console.error('ADD PROPERTY ERROR:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all properties (with optional filters)
// @route GET /api/properties
const getProperties = async (req, res) => {
    try {
        const { type, city, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
        const filter = { isActive: true };
        if (type) filter.type = type;
        if (city) {
            const keywords = city.split(/[,\s]+/).filter(k => k.length > 2);
            if (keywords.length > 0) {
                filter.$and = keywords.map(kw => ({
                    $or: [
                        { 'location.city': new RegExp(kw, 'i') },
                        { 'location.country': new RegExp(kw, 'i') },
                        { 'name': new RegExp(kw, 'i') }
                    ]
                }));
            } else {
                filter['location.city'] = new RegExp(city, 'i');
            }
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        const skip = (page - 1) * limit;
        const [properties, total] = await Promise.all([
            Property.find(filter).populate('owner', 'name').skip(skip).limit(Number(limit)).sort('-createdAt'),
            Property.countDocuments(filter),
        ]);
        res.json({ properties, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single property
// @route GET /api/properties/:id
const getPropertyById = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('owner', 'name email').populate('reviews.user', 'name');
        if (!property) return res.status(404).json({ message: 'Property not found' });
        res.json(property);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update property (owner only)
// @route PUT /api/properties/:id
const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        if (property.owner.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });

        const updates = { ...req.body };

        // Handle location updates robustly
        if (updates.city || updates.country || updates.location) {
            if (!updates.city && updates.location) {
                const parts = updates.location.split(',').map(s => s.trim());
                updates.location = {
                    city: parts[0] || property.location.city,
                    country: parts[1] || property.location.country,
                    address: parts.slice(2).join(', ') || property.location.address
                };
            } else {
                updates.location = {
                    city: updates.city || property.location.city,
                    country: updates.country || property.location.country,
                    address: updates.address || property.location.address
                };
            }
        }

        if (updates.roomTypes) {
            try {
                updates.roomTypes = typeof updates.roomTypes === 'string' ? JSON.parse(updates.roomTypes) : updates.roomTypes;
            } catch (e) {
                updates.roomTypes = updates.roomTypes.split(',').map(r => ({
                    name: r.trim(),
                    price: Number(updates.price || property.price)
                }));
            }
            // Final sanitization
            updates.roomTypes = updates.roomTypes.map(rt => ({
                name: String(rt.name || rt).replace(/[\[\]"']/g, '').trim(),
                price: Number(rt.price || updates.price || property.price)
            })).filter(rt => rt.name.length > 0);
        }

        if (req.files?.length || req.body.existingImages) {
            let images = [];
            if (req.body.existingImages) {
                try {
                    images = JSON.parse(req.body.existingImages);
                } catch (e) {
                    images = [];
                }
            }
            if (req.files?.length) {
                const newImages = req.files.map(f => `/uploads/${f.filename}`);
                images = [...images, ...newImages];
            }
            updates.images = images.slice(0, 5); // Max 5 total
        }



        // Clean up fields that shouldn't be updated directly via spread
        delete updates.city;
        delete updates.country;
        delete updates.address;

        const updated = await Property.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(updated);
    } catch (err) {
        console.error('UPDATE PROPERTY ERROR:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete property (owner only)
// @route DELETE /api/properties/:id
const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        if (property.owner.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        await property.deleteOne();
        res.json({ message: 'Property removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get owner's properties
// @route GET /api/properties/my
const getMyProperties = async (req, res) => {
    try {
        const properties = await Property.find({ owner: req.user._id }).sort('-createdAt');
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Add review
// @route POST /api/properties/:id/reviews
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });
        const alreadyReviewed = property.reviews.find(r => r.user.toString() === req.user._id.toString());
        if (alreadyReviewed) return res.status(400).json({ message: 'Already reviewed this property' });
        property.reviews.push({ user: req.user._id, rating: Number(rating), comment });
        await property.save();
        res.status(201).json({ message: 'Review added' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { addProperty, getProperties, getPropertyById, updateProperty, deleteProperty, getMyProperties, addReview };
