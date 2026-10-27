const Task = require('../models/Task');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const FocusSession = require('../models/FocusSession');
const analyticsService = require('../services/analyticsService');
const adaptivePlannerService = require('../services/adaptivePlannerService');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // 1. Fetch Analytics & Weekly Trend
    const analytics = await analyticsService.getOverview(userId);

    // 2. Fetch Today's Tasks
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Fetch tasks due today or pending
    const todayTasks = await Task.find({
      userId,
      $or: [
        { dueAt: { $gte: startOfToday, $lte: endOfToday } },
        { status: { $in: ['pending', 'in_progress'] } }
      ]
    })
      .populate('subjectId', 'name color code')
      .sort({ dueAt: 1 })
      .limit(10)
      .lean();

    // 3. User Subjects for quick Pomodoro selector
    const subjects = await Subject.find({ userId }).select('name color code').lean();

    // 4. Adaptive Recommendations (top 3)
    const recommendations = await adaptivePlannerService.getRecommendations(userId);
    const topRecommendation = recommendations[0] || null;

    // 5. Calendar task dates for this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthTasks = await Task.find({
      userId,
      dueAt: { $gte: startOfMonth, $lte: endOfMonth },
    }).select('dueAt status priority taskType').lean();

    const calendarDatesWithTasks = monthTasks.map(t => {
      const d = new Date(t.dueAt);
      return {
        day: d.getDate(),
        priority: t.priority,
        status: t.status,
        taskType: t.taskType,
      };
    });

    // Determine greeting based on current local hour
    const hour = now.getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    const pendingTodayCount = todayTasks.filter(t => t.status !== 'completed').length;

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          preferences: req.user.preferences,
          dailyGoalMinutes: req.user.dailyGoalMinutes,
          streak: req.user.streak,
        },
        greeting: {
          text: `${greeting}, ${req.user.name.split(' ')[0]}!`,
          subtitle: `You have ${pendingTodayCount} ${pendingTodayCount === 1 ? 'task' : 'tasks'} for today`,
          todayDate: now.toISOString(),
          currentDayNumber: now.getDate(),
        },
        todayTasks: todayTasks.map(t => ({
          _id: t._id,
          title: t.title,
          subject: t.subjectId ? { id: t.subjectId._id, name: t.subjectId.name, color: t.subjectId.color } : { name: 'Work', color: '#FF8B76' },
          dueAt: t.dueAt,
          priority: t.priority,
          status: t.status,
          taskType: t.taskType,
          estimatedMinutes: t.estimatedMinutes,
        })),
        calendar: {
          currentYear: now.getFullYear(),
          currentMonth: now.getMonth(),
          currentDay: now.getDate(),
          tasks: calendarDatesWithTasks,
        },
        weeklyProductivity: analytics.weeklyTrends,
        taskPerformance: {
          percentage: analytics.todayTasksSummary.performanceRate,
          label: 'Productive Hours',
          todayMinutes: analytics.todayProductiveMinutes,
          targetMinutes: req.user.dailyGoalMinutes || 120,
          completedCount: analytics.todayTasksSummary.completed,
          totalCount: analytics.todayTasksSummary.total,
        },
        blockList: req.user.preferences?.blockedItems || [
          { id: 'telegram', name: 'Telegram', icon: 'telegram', category: 'Chat' },
          { id: 'instagram', name: 'Instagram', icon: 'instagram', category: 'Social' },
          { id: 'x', name: 'X', icon: 'x', category: 'Social' },
        ],
        timerConfig: {
          defaultDuration: (req.user.preferences?.focusDuration || 25) * 60,
          subjects: subjects.length > 0 ? subjects : [{ _id: 'default', name: 'Math practice', color: '#FF9856' }],
          focusMoodActive: req.user.preferences?.focusMoodActive || false,
        },
        topRecommendation,
      },
    });
  } catch (error) {
    next(error);
  }
};
