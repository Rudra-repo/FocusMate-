const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(subjectController.getSubjects)
  .post(subjectController.createSubject);

router.route('/:id')
  .get(subjectController.getSubjectById)
  .patch(subjectController.updateSubject)
  .delete(subjectController.deleteSubject);

module.exports = router;
