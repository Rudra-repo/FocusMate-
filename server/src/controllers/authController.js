const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'focusmate_jwt_secret_super_secure_key_2026_academic', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      dailyGoalMinutes: user.dailyGoalMinutes,
      preferences: user.preferences,
      streak: user.streak,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with that email already exists.' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        dailyGoalMinutes: user.dailyGoalMinutes,
        preferences: user.preferences,
        streak: user.streak,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { focusDuration, breakDuration, longBreakDuration, blockedItems, focusMoodActive, theme } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (focusDuration !== undefined) user.preferences.focusDuration = focusDuration;
    if (breakDuration !== undefined) user.preferences.breakDuration = breakDuration;
    if (longBreakDuration !== undefined) user.preferences.longBreakDuration = longBreakDuration;
    if (blockedItems !== undefined) user.preferences.blockedItems = blockedItems;
    if (focusMoodActive !== undefined) user.preferences.focusMoodActive = focusMoodActive;
    if (theme !== undefined) user.preferences.theme = theme;

    await user.save();

    res.status(200).json({
      success: true,
      preferences: user.preferences,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, dailyGoalMinutes } = req.body;
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (dailyGoalMinutes) user.dailyGoalMinutes = dailyGoalMinutes;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        dailyGoalMinutes: user.dailyGoalMinutes,
        preferences: user.preferences,
        streak: user.streak,
      },
    });
  } catch (error) {
    next(error);
  }
};
