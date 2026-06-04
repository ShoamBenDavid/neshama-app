const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    duration: {
      type: String,
      required: [true, 'Please provide duration'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
    },
    type: {
      type: String,
      required: [true, 'Please provide content type'],
      enum: ['meditation', 'breathing', 'yoga', 'article', 'video', 'audio'],
    },
    gradientColors: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          return v.length >= 2;
        },
        message: 'At least 2 gradient colors are required',
      },
    },
    imageUrl: {
      type: String,
    },
    mediaUrl: {
      type: String,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ContentSchema.index({ category: 1, type: 1, isActive: 1 });

module.exports = mongoose.model('Content', ContentSchema);

