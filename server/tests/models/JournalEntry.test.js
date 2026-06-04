process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';

const mongoose = require('mongoose');
const { connectDB, disconnectDB, clearDB } = require('../setup');
const JournalEntry = require('../../src/models/JournalEntry');
const User = require('../../src/models/User');

let testUser;

beforeAll(async () => {
  await connectDB();
  testUser = await User.create({
    name: 'Test User',
    email: 'journal-model@example.com',
    password: 'password123',
  });
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await JournalEntry.deleteMany({});
});

describe('JournalEntry Model', () => {
  const validEntry = () => ({
    user: testUser._id,
    mood: 3,
    content: 'Test content for journal entry',
  });

  describe('required fields', () => {
    it('should require mood', async () => {
      const entry = new JournalEntry({ user: testUser._id, content: 'No mood' });
      const err = entry.validateSync();
      expect(err.errors.mood).toBeDefined();
    });

    it('should require content', async () => {
      const entry = new JournalEntry({ user: testUser._id, mood: 3 });
      const err = entry.validateSync();
      expect(err.errors.content).toBeDefined();
    });

    it('should require user', async () => {
      const entry = new JournalEntry({ mood: 3, content: 'No user' });
      const err = entry.validateSync();
      expect(err.errors.user).toBeDefined();
    });
  });

  describe('mood validation', () => {
    it('should reject mood below 1', async () => {
      const entry = new JournalEntry({ ...validEntry(), mood: 0 });
      const err = entry.validateSync();
      expect(err.errors.mood).toBeDefined();
    });

    it('should reject mood above 5', async () => {
      const entry = new JournalEntry({ ...validEntry(), mood: 6 });
      const err = entry.validateSync();
      expect(err.errors.mood).toBeDefined();
    });

    it('should accept mood of 1', async () => {
      const entry = new JournalEntry({ ...validEntry(), mood: 1 });
      const err = entry.validateSync();
      expect(err).toBeUndefined();
    });

    it('should accept mood of 5', async () => {
      const entry = new JournalEntry({ ...validEntry(), mood: 5 });
      const err = entry.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('content maxlength', () => {
    it('should reject content over 5000 characters', async () => {
      const entry = new JournalEntry({
        ...validEntry(),
        content: 'a'.repeat(5001),
      });
      const err = entry.validateSync();
      expect(err.errors.content).toBeDefined();
    });

    it('should accept content at exactly 5000 characters', async () => {
      const entry = new JournalEntry({
        ...validEntry(),
        content: 'a'.repeat(5000),
      });
      const err = entry.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('title maxlength', () => {
    it('should reject title over 100 characters', async () => {
      const entry = new JournalEntry({
        ...validEntry(),
        title: 'a'.repeat(101),
      });
      const err = entry.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    it('should accept title at exactly 100 characters', async () => {
      const entry = new JournalEntry({
        ...validEntry(),
        title: 'a'.repeat(100),
      });
      const err = entry.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('anxietyLevel validation', () => {
    it('should reject anxietyLevel below 0', async () => {
      const entry = new JournalEntry({ ...validEntry(), anxietyLevel: -0.1 });
      const err = entry.validateSync();
      expect(err.errors.anxietyLevel).toBeDefined();
    });

    it('should reject anxietyLevel above 1', async () => {
      const entry = new JournalEntry({ ...validEntry(), anxietyLevel: 1.1 });
      const err = entry.validateSync();
      expect(err.errors.anxietyLevel).toBeDefined();
    });

    it('should accept anxietyLevel of 0', async () => {
      const entry = new JournalEntry({ ...validEntry(), anxietyLevel: 0 });
      const err = entry.validateSync();
      expect(err).toBeUndefined();
    });

    it('should accept anxietyLevel of 1', async () => {
      const entry = new JournalEntry({ ...validEntry(), anxietyLevel: 1 });
      const err = entry.validateSync();
      expect(err).toBeUndefined();
    });

    it('should default anxietyLevel to null', async () => {
      const entry = await JournalEntry.create(validEntry());
      expect(entry.anxietyLevel).toBeNull();
    });
  });

  describe('anxietyLabel enum', () => {
    it('should accept valid labels', async () => {
      for (const label of ['low', 'moderate', 'high', null]) {
        const entry = new JournalEntry({ ...validEntry(), anxietyLabel: label });
        const err = entry.validateSync();
        expect(err).toBeUndefined();
      }
    });

    it('should reject invalid label', async () => {
      const entry = new JournalEntry({ ...validEntry(), anxietyLabel: 'critical' });
      const err = entry.validateSync();
      expect(err.errors.anxietyLabel).toBeDefined();
    });

    it('should default anxietyLabel to null', async () => {
      const entry = await JournalEntry.create(validEntry());
      expect(entry.anxietyLabel).toBeNull();
    });
  });

  describe('defaults', () => {
    it('should default date to now', async () => {
      const before = new Date();
      const entry = await JournalEntry.create(validEntry());
      const after = new Date();
      expect(entry.date.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
      expect(entry.date.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });

    it('should default tags to empty array', async () => {
      const entry = await JournalEntry.create(validEntry());
      expect(entry.tags).toEqual([]);
    });
  });

  describe('tags handling', () => {
    it('should store tags array', async () => {
      const entry = await JournalEntry.create({
        ...validEntry(),
        tags: ['happy', 'grateful'],
      });
      expect(entry.tags).toEqual(['happy', 'grateful']);
    });
  });

  describe('timestamps', () => {
    it('should auto-create timestamps', async () => {
      const entry = await JournalEntry.create(validEntry());
      expect(entry.createdAt).toBeDefined();
      expect(entry.updatedAt).toBeDefined();
    });
  });

  describe('virtuals', () => {
    it('formattedDate should return Hebrew formatted date', async () => {
      const entry = await JournalEntry.create({
        ...validEntry(),
        date: new Date('2024-06-15T10:00:00Z'),
      });
      const obj = entry.toJSON();
      expect(obj.formattedDate).toBeDefined();
      expect(typeof obj.formattedDate).toBe('string');
    });

    it('formattedTime should return time string', async () => {
      const entry = await JournalEntry.create({
        ...validEntry(),
        date: new Date('2024-06-15T10:30:00Z'),
      });
      const obj = entry.toJSON();
      expect(obj.formattedTime).toBeDefined();
      expect(typeof obj.formattedTime).toBe('string');
    });
  });
});
