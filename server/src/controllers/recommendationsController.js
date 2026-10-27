const adaptivePlannerService = require('../services/adaptivePlannerService');

exports.getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recommendations = await adaptivePlannerService.getRecommendations(userId);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
      formula: 'Priority Score = 0.35 * D (Deadline Urgency) + 0.30 * W (Topic Weakness) + 0.20 * P (Task Importance) + 0.15 * A (Accumulated Delay)',
    });
  } catch (error) {
    next(error);
  }
};
