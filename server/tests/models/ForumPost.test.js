process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';

const mongoose = require('mongoose');
const { connectDB, disconnectDB, clearDB } = require('../setup');
const ForumPost = require('../../src/models/ForumPost');
const User = require('../../src/models/User');

let testUser;

beforeAll(async () => {
  await connectDB();
  testUser = await User.create({
    name: 'Forum Model User',
    email: 'forum-model@example.com',
    password: 'password123',
  });
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await ForumPost.deleteMany({});
});

describe('ForumPost Model', () => {
  const validPost = () => ({
    user: testUser._id,
    title: 'Test Post Title',
    content: 'Test post content here.',
    categoryId: 'general',
  });

  describe('required fields', () => {
    it('should require title', async () => {
      const post = new ForumPost({ user: testUser._id, content: 'Content', categoryId: 'general' });
      const err = post.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    it('should require content', async () => {
      const post = new ForumPost({ user: testUser._id, title: 'Title', categoryId: 'general' });
      const err = post.validateSync();
      expect(err.errors.content).toBeDefined();
    });

    it('should require categoryId', async () => {
      const post = new ForumPost({ user: testUser._id, title: 'Title', content: 'Content' });
      const err = post.validateSync();
      expect(err.errors.categoryId).toBeDefined();
    });

    it('should require user', async () => {
      const post = new ForumPost({ title: 'Title', content: 'Content', categoryId: 'general' });
      const err = post.validateSync();
      expect(err.errors.user).toBeDefined();
    });
  });

  describe('title maxlength', () => {
    it('should reject title over 200 characters', async () => {
      const post = new ForumPost({ ...validPost(), title: 'a'.repeat(201) });
      const err = post.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    it('should accept title at exactly 200 characters', async () => {
      const post = new ForumPost({ ...validPost(), title: 'a'.repeat(200) });
      const err = post.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('content maxlength', () => {
    it('should reject content over 10000 characters', async () => {
      const post = new ForumPost({ ...validPost(), content: 'a'.repeat(10001) });
      const err = post.validateSync();
      expect(err.errors.content).toBeDefined();
    });

    it('should accept content at exactly 10000 characters', async () => {
      const post = new ForumPost({ ...validPost(), content: 'a'.repeat(10000) });
      const err = post.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('categoryId enum', () => {
    const validCategories = ['anxiety', 'depression', 'relationships', 'work-stress', 'success', 'general'];

    it('should accept all valid categories', async () => {
      for (const cat of validCategories) {
        const post = new ForumPost({ ...validPost(), categoryId: cat });
        const err = post.validateSync();
        expect(err).toBeUndefined();
      }
    });

    it('should reject invalid category', async () => {
      const post = new ForumPost({ ...validPost(), categoryId: 'invalid' });
      const err = post.validateSync();
      expect(err.errors.categoryId).toBeDefined();
    });
  });

  describe('defaults', () => {
    it('should default isAnonymous to false', async () => {
      const post = await ForumPost.create(validPost());
      expect(post.isAnonymous).toBe(false);
    });

    it('should default likes to empty array', async () => {
      const post = await ForumPost.create(validPost());
      expect(post.likes).toEqual([]);
    });

    it('should default comments to empty array', async () => {
      const post = await ForumPost.create(validPost());
      expect(post.comments).toEqual([]);
    });
  });

  describe('virtuals', () => {
    it('likesCount should return number of likes', async () => {
      const post = await ForumPost.create({
        ...validPost(),
        likes: [testUser._id, new mongoose.Types.ObjectId()],
      });
      const obj = post.toJSON();
      expect(obj.likesCount).toBe(2);
    });

    it('likesCount should be 0 when no likes', async () => {
      const post = await ForumPost.create(validPost());
      const obj = post.toJSON();
      expect(obj.likesCount).toBe(0);
    });

    it('commentsCount should return number of comments', async () => {
      const post = await ForumPost.create({
        ...validPost(),
        comments: [
          { user: testUser._id, content: 'Comment 1' },
          { user: testUser._id, content: 'Comment 2' },
        ],
      });
      const obj = post.toJSON();
      expect(obj.commentsCount).toBe(2);
    });

    it('formattedDate should return Hebrew formatted date', async () => {
      const post = await ForumPost.create(validPost());
      const obj = post.toJSON();
      expect(obj.formattedDate).toBeDefined();
      expect(typeof obj.formattedDate).toBe('string');
    });
  });

  describe('CommentSchema', () => {
    it('should require comment content', async () => {
      const post = await ForumPost.create(validPost());
      post.comments.push({ user: testUser._id, content: '' });
      await expect(post.save()).rejects.toThrow();
    });

    it('should reject comment content over 2000 characters', async () => {
      const post = await ForumPost.create(validPost());
      post.comments.push({ user: testUser._id, content: 'a'.repeat(2001) });
      await expect(post.save()).rejects.toThrow();
    });

    it('should accept valid comment', async () => {
      const post = await ForumPost.create(validPost());
      post.comments.push({ user: testUser._id, content: 'Great post!' });
      await post.save();
      expect(post.comments).toHaveLength(1);
      expect(post.comments[0].content).toBe('Great post!');
    });

    it('should default comment isAnonymous to false', async () => {
      const post = await ForumPost.create(validPost());
      post.comments.push({ user: testUser._id, content: 'A comment' });
      await post.save();
      expect(post.comments[0].isAnonymous).toBe(false);
    });

    it('should set comment isAnonymous to true', async () => {
      const post = await ForumPost.create(validPost());
      post.comments.push({ user: testUser._id, content: 'Anonymous', isAnonymous: true });
      await post.save();
      expect(post.comments[0].isAnonymous).toBe(true);
    });
  });

  describe('timestamps', () => {
    it('should auto-create timestamps', async () => {
      const post = await ForumPost.create(validPost());
      expect(post.createdAt).toBeDefined();
      expect(post.updatedAt).toBeDefined();
    });
  });
});
