const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }
    req.body = parsed.data;
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request data',
      error: error.message,
    });
  }
};

module.exports = validate;
