const analyticsService = require('../services/analyticsService');

exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const overview = await analyticsService.getOverview(userId);

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};
