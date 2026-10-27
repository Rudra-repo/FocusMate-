const express = require('express');
const router = express.Router();
const focusSessionController = require('../controllers/focusSessionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', focusSessionController.saveSession);
router.get('/history', focusSessionController.getSessionHistory);
router.get('/stats', focusSessionController.getTimerStats);

module.exports = router;
