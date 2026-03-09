const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    addProperty, getProperties, getPropertyById,
    updateProperty, deleteProperty, getMyProperties, addReview
} = require('../controllers/propertyController');

router.get('/', getProperties);
router.get('/my', protect, authorize('owner'), getMyProperties);
router.get('/:id', getPropertyById);
router.post('/', protect, authorize('owner'), upload.array('images', 5), addProperty);
router.put('/:id', protect, authorize('owner'), upload.array('images', 5), updateProperty);
router.delete('/:id', protect, authorize('owner'), deleteProperty);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
