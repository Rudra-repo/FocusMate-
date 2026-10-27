const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(quizController.getQuizzes)
  .post(quizController.createQuiz);

router.get('/attempts', quizController.getQuizAttempts);
router.get('/:id', quizController.getQuizById);
router.post('/:id/attempts', quizController.submitQuizAttempt);

module.exports = router;
