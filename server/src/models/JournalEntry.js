const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    mood: {
      type: Number,
      required: [true, 'Please provide a mood rating'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
      maxlength: [5000, 'Content cannot be more than 5000 characters'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    anxietyLevel: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    anxietyLabel: {
      type: String,
      enum: ['low', 'moderate', 'medium', 'high', null],
      default: null,
    },
    classification: {
      category: {
        type: String,
        enum: ['normal', 'anxiety', 'depression', null],
        default: null,
      },
      probabilities: {
        normal: {
          type: Number,
          min: 0,
          max: 1,
          default: null,
        },
        anxiety: {
          type: Number,
          min: 0,
          max: 1,
          default: null,
        },
        depression: {
          type: Number,
          min: 0,
          max: 1,
          default: null,
        },
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },
      modelVersion: {
        type: String,
        default: null,
      },
      classifiedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for formatted date in Hebrew
JournalEntrySchema.virtual('formattedDate').get(function() {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jerusalem'
  };
  return this.date.toLocaleDateString('he-IL', options);
});

// Virtual for formatted time
JournalEntrySchema.virtual('formattedTime').get(function() {
  const options = { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Jerusalem'
  };
  return this.date.toLocaleTimeString('he-IL', options);
});

// Index for faster queries
JournalEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);

