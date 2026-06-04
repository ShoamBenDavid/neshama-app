const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getPosts,
  createPost,
  getPost,
  toggleLike,
  addComment,
  deletePost,
} = require('../controllers/forumController');
const { protect } = require('../middleware/auth');

// Validation rules
const postValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot be more than 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 10000 })
    .withMessage('Content cannot be more than 10000 characters'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['anxiety', 'depression', 'relationships', 'work-stress', 'success', 'general'])
    .withMessage('Invalid category'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
];

const commentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot be more than 2000 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
];

// All routes are protected
router.use(protect);

// Routes
router.route('/')
  .get(getPosts)
  .post(postValidation, createPost);

router.route('/:id')
  .get(getPost)
  .delete(deletePost);

router.post('/:id/like', toggleLike);
router.post('/:id/comment', commentValidation, addComment);

module.exports = router;

