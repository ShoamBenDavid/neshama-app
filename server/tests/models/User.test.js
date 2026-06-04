process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';

const jwt = require('jsonwebtoken');
const { connectDB, disconnectDB, clearDB } = require('../setup');
const User = require('../../src/models/User');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await clearDB();
});

describe('User Model', () => {
  describe('password hashing', () => {
    it('should hash password on create', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'plaintext123',
      });

      const savedUser = await User.findById(user._id).select('+password');
      expect(savedUser.password).not.toBe('plaintext123');
      expect(savedUser.password.startsWith('$2a$') || savedUser.password.startsWith('$2b$')).toBe(true);
    });

    it('should not rehash password when other fields update', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await User.findById(user._id).select('+password');
      const originalHash = savedUser.password;

      savedUser.name = 'Updated Name';
      await savedUser.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).toBe(originalHash);
    });
  });

  describe('matchPassword', () => {
    it('should return true for correct password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await User.findById(user._id).select('+password');
      const isMatch = await savedUser.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const savedUser = await User.findById(user._id).select('+password');
      const isMatch = await savedUser.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('getSignedJwtToken', () => {
    it('should return a valid JWT token', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const token = user.getSignedJwtToken();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(user._id.toString());
    });
  });

  describe('schema validation', () => {
    it('should require name', async () => {
      await expect(
        User.create({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow();
    });

    it('should require email', async () => {
      await expect(
        User.create({ name: 'Test', password: 'password123' })
      ).rejects.toThrow();
    });

    it('should require valid email format', async () => {
      await expect(
        User.create({
          name: 'Test',
          email: 'invalid-email',
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      await User.create({
        name: 'User 1',
        email: 'test@example.com',
        password: 'password123',
      });

      await expect(
        User.create({
          name: 'User 2',
          email: 'test@example.com',
          password: 'password456',
        })
      ).rejects.toThrow();
    });

    it('should require minimum password length', async () => {
      await expect(
        User.create({
          name: 'Test',
          email: 'test@example.com',
          password: '123',
        })
      ).rejects.toThrow();
    });

    it('should default isActive to true', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.isActive).toBe(true);
    });

    it('should enforce name maxlength of 50', async () => {
      await expect(
        User.create({
          name: 'a'.repeat(51),
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(user.email).toBe('test@example.com');
    });

    it('should not return password by default (select: false)', async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.password).toBeUndefined();
    });

    it('should return password when explicitly selected', async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const user = await User.findOne({ email: 'test@example.com' }).select('+password');
      expect(user.password).toBeDefined();
    });

    it('should default avatar to empty string', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.avatar).toBe('');
    });

    it('phone should be optional', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.phone).toBeUndefined();
    });

    it('should auto-create timestamps', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });
  });
});
