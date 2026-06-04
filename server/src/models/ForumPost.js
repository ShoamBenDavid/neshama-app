const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide comment content'],
      maxlength: [2000, 'Comment cannot be more than 2000 characters'],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ForumPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
      maxlength: [10000, 'Content cannot be more than 10000 characters'],
    },
    categoryId: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['anxiety', 'depression', 'relationships', 'work-stress', 'success', 'general'],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [CommentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for likes count
ForumPostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comments count
ForumPostSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Virtual for formatted date in Hebrew
ForumPostSchema.virtual('formattedDate').get(function() {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jerusalem'
  };
  return this.createdAt.toLocaleDateString('he-IL', options);
});

// Index for faster queries
ForumPostSchema.index({ categoryId: 1, createdAt: -1 });
ForumPostSchema.index({ user: 1 });

module.exports = mongoose.model('ForumPost', ForumPostSchema);

