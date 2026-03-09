const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatController');

router.post('/message', chat); // open to all (can be used with guest UI)

module.exports = router;
