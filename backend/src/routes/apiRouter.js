const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const taskRoutes = require('./taskRoutes');
const subjectRoutes = require('./subjectRoutes');
const topicRoutes = require('./topicRoutes');
const focusSessionRoutes = require('./focusSessionRoutes');
const quizRoutes = require('./quizRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const goalRoutes = require('./goalRoutes');
const aiRoutes = require('./aiRoutes');
const uploadRoutes = require('./uploadRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tasks', taskRoutes);
router.use('/subjects', subjectRoutes);
router.use('/topics', topicRoutes);
router.use('/focus-sessions', focusSessionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/goals', goalRoutes);
router.use('/ai', aiRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
