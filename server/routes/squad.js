const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createSquad,
    joinSquad,
    getSquadById,
    updateSquadTrip,
    generateSquadPlan,
    toggleVote,
    saveSquadPlan
} = require('../controllers/squadController');

console.log('🛣️ [SQUAD-ROUTES] Registering squad routes...');

// Specific routes first
router.post('/join', protect, joinSquad);
router.post('/:id/generate', protect, generateSquadPlan);
router.post('/:id/vote', protect, toggleVote);
router.post('/:id/save', protect, saveSquadPlan);

// General routes last
router.post('/', protect, createSquad);
router.get('/:id', protect, getSquadById);
router.patch('/:id', protect, updateSquadTrip);

module.exports = router;
