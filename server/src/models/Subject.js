const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      default: '#FF8B76', // warm coral
    },
    icon: {
      type: String,
      default: 'BookOpen',
    },
    targetHours: {
      type: Number,
      default: 20,
      min: 1,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
