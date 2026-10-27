const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(goalController.getGoals)
  .post(goalController.createGoal);

router.route('/:id')
  .patch(goalController.updateGoal)
  .delete(goalController.deleteGoal);

module.exports = router;
