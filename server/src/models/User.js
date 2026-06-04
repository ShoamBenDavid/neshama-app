const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [20, 'Name cannot be more than 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    achievements: {
      type: [
        {
          _id: false,
          id: {
            type: String,
            required: true,
            trim: true,
          },
          title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [80, 'Achievement title cannot be more than 80 characters'],
          },
          description: {
            type: String,
            required: true,
            trim: true,
            maxlength: [240, 'Achievement description cannot be more than 240 characters'],
          },
          icon: {
            type: String,
            trim: true,
            default: '',
          },
          unlockedAt: {
            type: Date,
            default: null,
          },
          progress: {
            type: Number,
            min: 0,
            default: 0,
          },
          target: {
            type: Number,
            min: 1,
            default: 1,
          },
          isUnlocked: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return;
  }
  
  const rounds = process.env.NODE_ENV === 'test' ? 1 : 10;
  const salt = await bcrypt.genSalt(rounds);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

// Match entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

