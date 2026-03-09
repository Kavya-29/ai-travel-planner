const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    generateItinerary,
    detectMood,
    estimateCarbon,
    optimizeBudget,
    generatePackingList,
    savePlan,
    getMyPlans,
    deletePlan,
    getPlanById,
    analyzeTravelImage,
    checkSavedStatus
} = require('../controllers/travelController');

router.post('/itinerary', protect, generateItinerary);
router.post('/save-plan', protect, savePlan);
router.post('/check-saved', protect, checkSavedStatus);
router.get('/my-plans', protect, getMyPlans);
router.delete('/plan/:id', protect, deletePlan);
router.post('/mood', protect, detectMood);
router.post('/carbon', protect, estimateCarbon);
router.post('/budget-optimize', protect, optimizeBudget);
router.post('/packing', protect, generatePackingList);
router.get('/plan/:id', protect, getPlanById);
router.post('/analyze-image', protect, analyzeTravelImage);

module.exports = router;