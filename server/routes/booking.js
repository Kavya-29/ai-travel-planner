const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createBooking, getGuestBookings, getOwnerBookings, cancelBooking, getBookingById, confirmBooking, createRazorpayOrder, verifyPayment, deleteBooking, deleteBookingOwner, refundBooking, checkBookingStatus } = require('../controllers/bookingController');

router.post('/', protect, createBooking);
router.get('/guest', protect, getGuestBookings);
router.get('/owner', protect, getOwnerBookings);
router.get('/:id', protect, getBookingById);
router.delete('/:id', protect, deleteBooking);
router.delete('/:id/owner-delete', protect, deleteBookingOwner);
router.patch('/:id/cancel', protect, cancelBooking);
router.patch('/:id/confirm', protect, confirmBooking);
router.patch('/:id/refund', protect, refundBooking);
router.post('/:id/create-order', protect, createRazorpayOrder);
router.post('/:id/verify-payment', protect, verifyPayment);
router.post('/check-status', protect, checkBookingStatus);

module.exports = router;
