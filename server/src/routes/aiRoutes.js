const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/explain', aiController.explainConcept);
router.post('/practice-questions', aiController.generatePracticeQuestions);
router.post('/arrange-schedule', aiController.arrangeSchedule);

module.exports = router;
