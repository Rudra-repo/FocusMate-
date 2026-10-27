const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendationsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', recommendationsController.getRecommendations);

module.exports = router;
