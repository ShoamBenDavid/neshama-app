const jwt = require('jsonwebtoken');
const config = require('../../src/config/config');
const User = require('../../src/models/User');

async function createTestUser(overrides = {}) {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '0501234567',
    ...overrides,
  };
  const user = await User.create(userData);
  return user;
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, config.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
}

async function createAuthenticatedUser(overrides = {}) {
  const user = await createTestUser(overrides);
  const token = generateToken(user._id);
  return { user, token };
}

module.exports = { createTestUser, generateToken, createAuthenticatedUser };
