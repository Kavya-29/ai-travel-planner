const Booking = require('../models/Booking');
const Property = require('../models/Property');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Lazy Razorpay instance — created on first use so missing keys don't crash startup
const getRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are not set in .env (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

// @desc  Create booking
// @route POST /api/bookings
const createBooking = async (req, res) => {
    try {
        console.error('--- CREATE BOOKING REQUEST ---');
        console.error('Body:', req.body);

        const { propertyId, checkIn, checkOut, rooms, guestDetails, specialRequests, roomType, meals } = req.body;

        const d1 = new Date(checkIn);
        const d2 = new Date(checkOut);
        const nights = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));

        const property = await Property.findById(propertyId);
        if (!property) {
            console.error('Property not found for ID:', propertyId);
            return res.status(404).json({ message: 'Property not found' });
        }
        console.error('Property found:', property.name);

        const requestedRooms = Number(rooms) || 1;
        if (property.availableRooms < requestedRooms)
            return res.status(400).json({ message: 'Not enough rooms available' });

        // Calculate price based on specific room type if selected
        let unitPrice = property.price;
        if (roomType && property.roomTypes && property.roomTypes.length > 0) {
            const selectedType = property.roomTypes.find(rt => rt.name === roomType);
            if (selectedType) unitPrice = selectedType.price;
        }

        const totalPrice = unitPrice * nights * requestedRooms;

        const booking = await Booking.create({
            guest: req.user._id,
            property: propertyId,
            checkIn: d1,
            checkOut: d2,
            rooms: requestedRooms,
            totalPrice,
            status: 'confirmed', // Instant booking
            guestDetails,
            specialRequests,
            roomType,
            meals: meals || { breakfast: false, lunch: false, dinner: false },
        });

        // Reduce available rooms
        property.availableRooms -= requestedRooms;
        await property.save();

        await booking.populate('property', 'name location images price');
        res.status(201).json(booking);
    } catch (err) {
        console.error('CREATE BOOKING ERROR STACK:', err.stack);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get guest bookings
// @route GET /api/bookings/guest
const getGuestBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ guest: req.user._id, deletedByGuest: { $ne: true } })
            .populate('property', 'name location images price type currency')
            .sort('-createdAt');

        // Self-healing: Auto-confirm any legacy pending bookings
        const pendingIds = bookings.filter(b => b.status === 'pending').map(b => b._id);
        if (pendingIds.length > 0) {
            await Booking.updateMany({ _id: { $in: pendingIds } }, { $set: { status: 'confirmed' } });
            bookings.forEach(b => { if (b.status === 'pending') b.status = 'confirmed'; });
        }

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get owner's property bookings
// @route GET /api/bookings/owner
const getOwnerBookings = async (req, res) => {
    try {
        // Get owner's properties
        const properties = await Property.find({ owner: req.user._id }).select('_id');
        const propertyIds = properties.map(p => p._id);

        const bookings = await Booking.find({ property: { $in: propertyIds }, deletedByOwner: { $ne: true } })
            .populate('guest', 'name email')
            .populate('property', 'name location price currency')
            .sort('-createdAt');

        // Self-healing: Auto-confirm any legacy pending bookings
        const pendingIds = bookings.filter(b => b.status === 'pending').map(b => b._id);
        if (pendingIds.length > 0) {
            await Booking.updateMany({ _id: { $in: pendingIds } }, { $set: { status: 'confirmed' } });
            bookings.forEach(b => { if (b.status === 'pending') b.status = 'confirmed'; });
        }

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Cancel booking
// @route PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('property');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const isGuest = booking.guest.toString() === req.user._id.toString();
        const isOwner = booking.property?.owner?.toString() === req.user._id.toString();
        if (!isGuest && !isOwner) return res.status(403).json({ message: 'Not authorized' });

        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        booking.status = 'cancelled';
        await booking.save();

        // Restore available rooms
        if (booking.property) {
            booking.property.availableRooms += booking.rooms;
            await booking.property.save();
        }

        res.json({ message: 'Booking cancelled', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single booking
// @route GET /api/bookings/:id
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('property', 'name location images price amenities')
            .populate('guest', 'name email');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Confirm booking
// @route PATCH /api/bookings/:id/confirm
const confirmBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('property');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending bookings can be confirmed' });
        }

        booking.status = 'confirmed';
        await booking.save();

        res.json({ message: 'Booking confirmed', booking });
    } catch (err) {
        console.error('CONFIRM BOOKING ERROR STACK:', err.stack);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Create Razorpay Order for a booking
// @route POST /api/bookings/:id/create-order
const createRazorpayOrder = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.params.id, guest: req.user._id }).populate('property', 'currency');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' });

        // Razorpay International Support Fallback:
        // If the property currency is NOT INR, we convert to INR to ensure the payment goes through.
        // Most Razorpay accounts only support INR by default.
        const currencyRates = {
            'USD': 83,
            'EUR': 90,
            'GBP': 105,
            'AED': 22.6,
            'SAR': 22.1,
            'QAR': 22.8,
            'KRW': 0.063,
            'JPY': 0.55,
            'CAD': 61,
            'AUD': 54,
            'SGD': 62,
            'MYR': 17.5,
            'THB': 2.3,
            'CNY': 11.5,
            'CHF': 94,
            'SEK': 8,
            'INR': 1
        };

        const propertyCurrency = booking.property?.currency || 'INR';
        const rate = currencyRates[propertyCurrency] || 83; // Fallback to 83 (approx USD-like) if unknown
        const totalInINR = booking.totalPrice * rate;

        const amountInPaise = Math.round(totalInINR * 100); // Razorpay uses smallest currency unit (paise for INR)

        const order = await getRazorpay().orders.create({
            amount: amountInPaise,
            currency: 'INR', // Force INR for maximum compatibility
            receipt: `booking_${booking._id}`,
            notes: {
                bookingId: booking._id.toString(),
                originalAmount: booking.totalPrice,
                originalCurrency: propertyCurrency
            }
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('RAZORPAY ORDER ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Verify Razorpay Payment signature and mark booking as paid
// @route POST /api/bookings/:id/verify-payment
const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed! Invalid signature.' });
        }

        // Mark booking as paid
        const booking = await Booking.findOne({ _id: req.params.id, guest: req.user._id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.paymentStatus = 'paid';
        booking.status = 'confirmed'; // Ensure confirmed on payment
        booking.razorpayPaymentId = razorpay_payment_id;
        booking.razorpayOrderId = razorpay_order_id;
        await booking.save();

        res.json({ message: 'Payment verified and booking confirmed!', booking });
    } catch (err) {
        console.error('PAYMENT VERIFY ERROR:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Guest soft-deletes booking from their view (owner still sees it)
// @route DELETE /api/bookings/:id
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.guest.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });

        booking.deletedByGuest = true;
        await booking.save();
        res.json({ message: 'Booking removed from your view' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Owner hard-deletes booking from their view
// @route DELETE /api/bookings/:id/owner-delete
const deleteBookingOwner = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('property');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const isOwner = booking.property?.owner?.toString() === req.user._id.toString();
        if (!isOwner) return res.status(403).json({ message: 'Not authorized' });

        booking.deletedByOwner = true;
        await booking.save();
        res.json({ message: 'Booking removed from owner view' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Owner marks booking as refunded
// @route PATCH /api/bookings/:id/refund
const refundBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('property');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const isOwner = booking.property?.owner?.toString() === req.user._id.toString();
        if (!isOwner) return res.status(403).json({ message: 'Not authorized' });

        if (booking.status !== 'cancelled') {
            return res.status(400).json({ message: 'Only cancelled bookings can be refunded' });
        }
        if (booking.paymentStatus !== 'paid') {
            return res.status(400).json({ message: 'Only paid bookings can be refunded' });
        }

        booking.paymentStatus = 'refunded';
        await booking.save();
        res.json({ message: 'Booking marked as refunded', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Check if user has already booked at a location
// @route POST /api/bookings/check-status
const checkBookingStatus = async (req, res) => {
    try {
        const { place } = req.body;
        if (!place) return res.status(400).json({ message: "Place is required" });

        // Search for any active booking where the property location matches the place
        // We populate property to check its location
        const bookings = await Booking.find({
            guest: req.user._id,
            status: { $ne: 'cancelled' }
        }).populate('property', 'location');

        const isBooked = bookings.some(b => {
            const loc = b.property?.location;
            if (!loc) return false;

            const city = loc.city?.toLowerCase() || '';
            const country = loc.country?.toLowerCase() || '';
            const searchPlace = place.toLowerCase();

            return searchPlace.includes(city) || searchPlace.includes(country) || city.includes(searchPlace) || country.includes(searchPlace);
        });

        res.json({ isBooked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createBooking, getGuestBookings, getOwnerBookings, cancelBooking, getBookingById, confirmBooking, createRazorpayOrder, verifyPayment, deleteBooking, deleteBookingOwner, refundBooking, checkBookingStatus };
