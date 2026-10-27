const Task = require('../models/Task');

exports.getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, priority, subjectId, taskType, search, sortBy = 'dueAt', order = 'asc' } = req.query;

    const query = { userId };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (subjectId && subjectId !== 'all') {
      query.subjectId = subjectId;
    }
    if (taskType && taskType !== 'all') {
      query.taskType = taskType;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;

    const tasks = await Task.find(query)
      .populate('subjectId', 'name color code')
      .populate('topicId', 'name masteryLevel')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, subjectId, topicId, dueAt, priority, estimatedMinutes, taskType, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const task = await Task.create({
      userId,
      title,
      description: description || '',
      subjectId: subjectId || null,
      topicId: topicId || null,
      dueAt: dueAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: priority || 'medium',
      estimatedMinutes: estimatedMinutes || 30,
      taskType: taskType || 'study',
      status: status || 'pending',
    });

    const populatedTask = await Task.findById(task._id).populate('subjectId', 'name color code');

    res.status(201).json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let task = await Task.findOne({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    const updates = { ...req.body };
    if (updates.status === 'completed' && task.status !== 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== 'completed') {
      updates.completedAt = null;
    }

    task = await Task.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('subjectId', 'name color code')
      .populate('topicId', 'name masteryLevel');

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findOneAndDelete({ _id: id, userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
