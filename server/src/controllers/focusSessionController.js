const FocusSession = require('../models/FocusSession');
const timerService = require('../services/timerService');

exports.saveSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startedAt, endedAt, taskId, subjectId, sessionType, targetMinutes, notes } = req.body;

    if (!startedAt || !endedAt) {
      return res.status(400).json({
        success: false,
        message: 'Both startedAt and endedAt timestamps are required to verify elapsed duration.',
      });
    }

    const session = await timerService.recordSession(userId, {
      startedAt,
      endedAt,
      taskId,
      subjectId,
      sessionType,
      targetMinutes,
      notes,
    });

    const populatedSession = await FocusSession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('taskId', 'title');

    res.status(201).json({
      success: true,
      session: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSessionHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, sessionType } = req.query;

    const query = { userId };
    if (sessionType) query.sessionType = sessionType;

    const sessions = await FocusSession.find(query)
      .populate('subjectId', 'name color')
      .populate('taskId', 'title')
      .sort({ startedAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTimerStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const todaySessions = await FocusSession.find({
      userId,
      sessionType: 'focus',
      startedAt: { $gte: startOfToday },
    });

    const todaySeconds = todaySessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const todayMinutes = Math.round(todaySeconds / 60);

    const allSessions = await FocusSession.find({ userId, sessionType: 'focus', completed: true });
    const totalMinutes = allSessions.reduce((acc, s) => acc + (s.elapsedMinutes || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        todayMinutes,
        todayHours: Math.round((todayMinutes / 60) * 10) / 10,
        todaySessionsCount: todaySessions.length,
        totalCompletedSessions: allSessions.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        streak: req.user.streak,
      },
    });
  } catch (error) {
    next(error);
  }
};
