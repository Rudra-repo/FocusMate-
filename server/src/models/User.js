const mongoose = require('bcryptjs') ? require('mongoose') : null;
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    },
    dailyGoalMinutes: {
      type: Number,
      default: 120, // 2 hours
      min: 15,
      max: 960,
    },
    preferences: {
      focusDuration: { type: Number, default: 25 },
      breakDuration: { type: Number, default: 5 },
      longBreakDuration: { type: Number, default: 15 },
      sessionsBeforeLongBreak: { type: Number, default: 4 },
      soundEnabled: { type: Boolean, default: true },
      ambientSound: { type: String, default: 'none' }, // 'none', 'whitenoise', 'rain', 'forest', 'cafe'
      theme: { type: String, default: 'pastel' },
      blockedItems: {
        type: [
          {
            id: String,
            name: String,
            icon: String,
            category: String,
          },
        ],
        default: [
          { id: 'telegram', name: 'Telegram', icon: 'telegram', category: 'Chat' },
          { id: 'instagram', name: 'Instagram', icon: 'instagram', category: 'Social' },
          { id: 'x', name: 'X', icon: 'x', category: 'Social' },
        ],
      },
      focusMoodActive: { type: Boolean, default: false },
    },
    streak: {
      current: { type: Number, default: 1 },
      longest: { type: Number, default: 1 },
      lastActiveDate: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static method to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);
