const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(topicController.getTopics)
  .post(topicController.createTopic);

router.route('/:id')
  .patch(topicController.updateTopic)
  .delete(topicController.deleteTopic);

module.exports = router;
