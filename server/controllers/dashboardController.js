const Booking = require('../models/Booking');
const Property = require('../models/Property');

// @desc  Get owner dashboard stats
// @route GET /api/dashboard/stats
const getOwnerStats = async (req, res) => {
    try {
        console.error('--- FETCHING OWNER STATS ---');
        console.error('User ID:', req.user._id);

        const properties = await Property.find({ owner: req.user._id }).select('_id name');
        console.error('Properties found:', properties.length);

        const propertyIds = properties.map(p => p._id);

        const bookings = await Booking.find({ property: { $in: propertyIds } })
            .populate('property', 'name currency')
            .populate('guest', 'name email')
            .sort('-createdAt');

        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const activeBookings = confirmedBookings.length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        // Monthly revenue & Growth calculation
        const monthlyRevenue = {};
        const now = new Date();
        const formatKey = (date) => date.toLocaleString('en-US', { month: 'short', year: '2-digit' });

        const currentMonthKey = formatKey(now);
        const lastMonthKey = formatKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = formatKey(d);
            monthlyRevenue[key] = 0;
        }

        bookings.filter(b => b.status === 'confirmed').forEach(b => {
            const d = new Date(b.createdAt);
            const key = formatKey(d);
            if (monthlyRevenue[key] !== undefined) {
                monthlyRevenue[key] += Math.round(b.totalPrice || 0);
            }
        });

        const currentMonthRev = monthlyRevenue[currentMonthKey] || 0;
        const lastMonthRev = monthlyRevenue[lastMonthKey] || 0;
        let growth = 0;
        if (lastMonthRev > 0) {
            growth = ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100;
        } else if (currentMonthRev > 0) {
            growth = 100;
        }

        // Top performing property
        const propRevenue = {};
        bookings.filter(b => b.status === 'confirmed').forEach(b => {
            const id = b.property?._id?.toString();
            const name = b.property?.name || 'Unknown';
            if (!propRevenue[id]) propRevenue[id] = { name, revenue: 0, bookings: 0 };
            propRevenue[id].revenue += b.totalPrice || 0;
            propRevenue[id].bookings += 1;
        });
        const topProperty = Object.values(propRevenue).sort((a, b) => b.revenue - a.revenue)[0] || null;

        res.json({
            totalProperties: properties.length,
            totalBookings,
            activeBookings,
            cancelledBookings,
            totalRevenue: totalRevenue || 0,
            growth: growth.toFixed(1) + '%',
            monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
            topProperty,
            recentBookings: bookings.slice(0, 5),
        });
    } catch (err) {
        console.error('DASHBOARD ERROR STACK:', err.stack);
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getOwnerStats };
