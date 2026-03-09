const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getOwnerStats } = require('../controllers/dashboardController');

router.get('/stats', protect, authorize('owner'), getOwnerStats);

module.exports = router;
