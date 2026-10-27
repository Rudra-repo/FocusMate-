const Goal = require('../models/Goal');

exports.getGoals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      goals,
    });
  } catch (error) {
    next(error);
  }
};

exports.createGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, category, target, unit, deadline } = req.body;

    if (!title || !target) {
      return res.status(400).json({ success: false, message: 'Goal title and target are required' });
    }

    const goal = await Goal.create({
      userId,
      title,
      category: category || 'study_hours',
      target: Number(target),
      unit: unit || 'hours',
      deadline: deadline || null,
    });

    res.status(201).json({
      success: true,
      goal,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await Goal.findOneAndUpdate({ _id: id, userId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      goal,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
