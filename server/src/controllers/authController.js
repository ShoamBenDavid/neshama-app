const User = require('../models/User');
const { validationResult } = require('express-validator');

const serializeAchievement = (achievement) => ({
  id: achievement.id,
  title: achievement.title,
  description: achievement.description,
  icon: achievement.icon,
  unlockedAt: achievement.unlockedAt,
  progress: achievement.progress ?? 0,
  target: achievement.target ?? 1,
  isUnlocked: Boolean(achievement.isUnlocked),
});

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  achievements: (user.achievements || []).map(serializeAchievement),
  createdAt: user.createdAt,
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User does not exist',
        code: 'USER_NOT_FOUND',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
        code: 'INVALID_PASSWORD',
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: serializeUser(user),
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: serializeUser(user),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Get user achievements
// @route   GET /api/auth/achievements
// @access  Private
const getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        achievements: (user.achievements || []).map(serializeAchievement),
      },
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Update or unlock a user achievement
// @route   PUT /api/auth/achievements/:id
// @access  Private
const updateAchievement = async (req, res) => {
  try {
    const { progress, isUnlocked } = req.body;
    const user = await User.findById(req.user.id);
    const achievement = user.achievements.find((item) => item.id === req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found',
      });
    }

    if (progress !== undefined) {
      achievement.progress = Math.max(0, Number(progress) || 0);
    }

    if (isUnlocked !== undefined) {
      achievement.isUnlocked = Boolean(isUnlocked);
      achievement.unlockedAt = achievement.isUnlocked
        ? achievement.unlockedAt || new Date()
        : null;
    } else if (achievement.target > 0 && achievement.progress >= achievement.target) {
      achievement.isUnlocked = true;
      achievement.unlockedAt = achievement.unlockedAt || new Date();
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        achievement: serializeAchievement(achievement),
        achievements: user.achievements.map(serializeAchievement),
      },
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  getAchievements,
  updateAchievement,
};
