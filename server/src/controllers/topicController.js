const Topic = require('../models/Topic');

exports.getTopics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, masteryLevel } = req.query;

    const query = { userId };
    if (subjectId) query.subjectId = subjectId;
    if (masteryLevel) query.masteryLevel = masteryLevel;

    const topics = await Topic.find(query)
      .populate('subjectId', 'name color code')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: topics.length,
      topics,
    });
  } catch (error) {
    next(error);
  }
};

exports.createTopic = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId, name, masteryLevel, difficulty, notes, resources } = req.body;

    if (!subjectId || !name) {
      return res.status(400).json({ success: false, message: 'Subject ID and topic name are required' });
    }

    const topic = await Topic.create({
      userId,
      subjectId,
      name,
      masteryLevel: masteryLevel || 'not_started',
      difficulty: difficulty || 'medium',
      notes: notes || '',
      resources: resources || [],
    });

    res.status(201).json({
      success: true,
      topic,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const topic = await Topic.findOne({ _id: id, userId }).populate('subjectId', 'name color code');
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      topic,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const topic = await Topic.findOneAndUpdate({ _id: id, userId }, req.body, {
      new: true,
      runValidators: true,
    }).populate('subjectId', 'name color code');

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      topic,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const topic = await Topic.findOneAndDelete({ _id: id, userId });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
