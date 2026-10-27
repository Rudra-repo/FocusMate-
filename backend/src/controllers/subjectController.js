const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Task = require('../models/Task');
const FocusSession = require('../models/FocusSession');

exports.getSubjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const subjects = await Subject.find({ userId }).sort({ createdAt: -1 }).lean();

    // Enrich each subject with topics count and completed study hours
    const enriched = await Promise.all(
      subjects.map(async (sub) => {
        const topicsCount = await Topic.countDocuments({ subjectId: sub._id });
        const masteredTopicsCount = await Topic.countDocuments({ subjectId: sub._id, masteryLevel: 'mastered' });
        const pendingTasksCount = await Task.countDocuments({ subjectId: sub._id, status: { $ne: 'completed' } });
        
        // Sum study time
        const sessions = await FocusSession.find({ subjectId: sub._id, sessionType: 'focus', completed: true }).lean();
        const totalMinutes = sessions.reduce((acc, s) => acc + (s.elapsedMinutes || 0), 0);
        const actualHours = Math.round((totalMinutes / 60) * 10) / 10;

        return {
          ...sub,
          topicsCount,
          masteredTopicsCount,
          pendingTasksCount,
          actualHours,
          progressPercentage: sub.targetHours > 0 ? Math.min(100, Math.round((actualHours / sub.targetHours) * 100)) : 0,
        };
      })
    );

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

    const subject = await Subject.findOne({ _id: id, userId });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topics = await Topic.find({ subjectId: id, userId }).sort({ createdAt: 1 });
    const tasks = await Task.find({ subjectId: id, userId }).sort({ dueAt: 1 });

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
