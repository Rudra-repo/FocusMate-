const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['study_hours', 'tasks_completed', 'quiz_score', 'streak', 'custom'],
      default: 'study_hours',
    },
    target: {
      type: Number,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'hours',
    },
    deadline: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);
