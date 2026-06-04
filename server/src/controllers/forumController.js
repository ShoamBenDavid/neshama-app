const ForumPost = require('../models/ForumPost');
const { validationResult } = require('express-validator');

// @desc    Get all forum posts
// @route   GET /api/forum
// @access  Private
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sort = 'recent', search } = req.query;
    
    const query = {};
    if (category && category !== 'all') {
      query.categoryId = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { 'likes': -1, createdAt: -1 };
    }

    const posts = await ForumPost.find(query)
      .populate('user', 'name avatar')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ForumPost.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        posts: posts.map(post => ({
          id: post._id,
          author: post.isAnonymous ? 'אנונימי' : post.user?.name || 'Unknown',
          isAnonymous: post.isAnonymous,
          date: post.formattedDate,
          title: post.title,
          content: post.content,
          categoryId: post.categoryId,
          likes: post.likesCount,
          comments: post.commentsCount,
          isLiked: post.likes.includes(req.user.id),
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Create new forum post
// @route   POST /api/forum
// @access  Private
const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { title, content, categoryId, isAnonymous } = req.body;

    const post = await ForumPost.create({
      user: req.user.id,
      title,
      content,
      categoryId,
      isAnonymous: isAnonymous || false,
    });

    await post.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: {
          id: post._id,
          author: post.isAnonymous ? 'אנונימי' : post.user?.name,
          isAnonymous: post.isAnonymous,
          date: post.formattedDate,
          title: post.title,
          content: post.content,
          categoryId: post.categoryId,
          likes: 0,
          comments: 0,
        },
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get single forum post
// @route   GET /api/forum/:id
// @access  Private
const getPost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        post: {
          id: post._id,
          author: post.isAnonymous ? 'אנונימי' : post.user?.name,
          isAnonymous: post.isAnonymous,
          date: post.formattedDate,
          title: post.title,
          content: post.content,
          categoryId: post.categoryId,
          likes: post.likesCount,
          comments: post.comments.map(c => ({
            id: c._id,
            author: c.isAnonymous ? 'אנונימי' : c.user?.name,
            content: c.content,
            createdAt: c.createdAt,
          })),
          isLiked: post.likes.includes(req.user.id),
        },
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Like/Unlike a post
// @route   POST /api/forum/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const likeIndex = post.likes.indexOf(req.user.id);
    
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: {
        likes: post.likesCount,
        isLiked: likeIndex === -1,
      },
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/forum/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { content, isAnonymous } = req.body;

    const post = await ForumPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.comments.push({
      user: req.user.id,
      content,
      isAnonymous: isAnonymous || false,
    });

    await post.save();
    await post.populate('comments.user', 'name avatar');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: {
          id: newComment._id,
          author: newComment.isAnonymous ? 'אנונימי' : newComment.user?.name,
          content: newComment.content,
          createdAt: newComment.createdAt,
        },
        commentsCount: post.commentsCount,
      },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Delete forum post
// @route   DELETE /api/forum/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await ForumPost.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or not authorized',
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getPosts,
  createPost,
  getPost,
  toggleLike,
  addComment,
  deletePost,
};

