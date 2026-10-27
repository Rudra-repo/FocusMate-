const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
    },
    masteryLevel: {
      type: String,
      enum: ['not_started', 'learning', 'revision', 'mastered'],
      default: 'not_started',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    notes: {
      type: String,
      default: '',
    },
    resources: [
      {
        title: String,
        url: String,
      },
    ],
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    quizAccuracy: {
      type: Number,
      default: null, // null until quizzes attempted
    },
    totalQuizAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

topicSchema.index({ userId: 1, subjectId: 1 });

module.exports = mongoose.model('Topic', topicSchema);
