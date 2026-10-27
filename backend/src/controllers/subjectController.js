const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');

exports.getSubjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Single-roundtrip bulk parallel fetch instead of N+1 database queries
    const [subjects, topics, tasks, sessions] = await Promise.all([
      Subject.find({ userId }).sort({ createdAt: -1 }).lean(),
      Topic.find({ userId }).select('subjectId masteryLevel').lean(),
      Task.find({ userId, status: { $ne: 'completed' } }).select('subjectId').lean(),
      FocusSession.find({ userId, sessionType: 'focus', completed: true }).select('subjectId elapsedMinutes').lean(),
    ]);

    // Fast O(1) in-memory aggregation maps
    const topicsCountMap = {};
    const masteredCountMap = {};
    topics.forEach((t) => {
      const sId = t.subjectId?.toString();
      topicsCountMap[sId] = (topicsCountMap[sId] || 0) + 1;
      if (t.masteryLevel === 'mastered') {
        masteredCountMap[sId] = (masteredCountMap[sId] || 0) + 1;
      }
    });

    const pendingTasksMap = {};
    tasks.forEach((t) => {
      const sId = t.subjectId?.toString();
      pendingTasksMap[sId] = (pendingTasksMap[sId] || 0) + 1;
    });

    const minutesMap = {};
    sessions.forEach((s) => {
      const sId = s.subjectId?.toString();
      minutesMap[sId] = (minutesMap[sId] || 0) + (s.elapsedMinutes || 0);
    });

    const enriched = subjects.map((sub) => {
      const sId = sub._id.toString();
      const topicsCount = topicsCountMap[sId] || 0;
      const masteredTopicsCount = masteredCountMap[sId] || 0;
      const pendingTasksCount = pendingTasksMap[sId] || 0;
      const totalMinutes = minutesMap[sId] || 0;
      const actualHours = Math.round((totalMinutes / 60) * 10) / 10;

      return {
        ...sub,
        topicsCount,
        masteredTopicsCount,
        pendingTasksCount,
        actualHours,
        progressPercentage: sub.targetHours > 0 ? Math.min(100, Math.round((actualHours / sub.targetHours) * 100)) : 0,
      };
    });

    res.status(200).json({
      success: true,
      subjects: enriched,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Parallel lookup for subject, topics, and tasks
    const [subject, topics, tasks] = await Promise.all([
      Subject.findOne({ _id: id, userId }).lean(),
      Topic.find({ subjectId: id, userId }).sort({ createdAt: 1 }).lean(),
      Task.find({ subjectId: id, userId }).sort({ dueAt: 1 }).lean(),
    ]);

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    res.status(200).json({
      success: true,
      subject,
      topics,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, code, color, icon, targetHours, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    const subject = await Subject.create({
      userId,
      name,
      code: code || '',
      color: color || '#FF8B76',
      icon: icon || 'BookOpen',
      targetHours: targetHours || 20,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      subject,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subject = await Subject.findOneAndUpdate({ _id: id, userId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      subject,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const subject = await Subject.findOneAndDelete({ _id: id, userId });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found or unauthorized' });
    }

    // Cascade delete topics for this subject
    await Topic.deleteMany({ subjectId: id });

    res.status(200).json({
      success: true,
      message: 'Subject and its topics deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
