process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';

const { connectDB, disconnectDB, clearDB } = require('../setup');
const Content = require('../../src/models/Content');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await Content.deleteMany({});
});

describe('Content Model', () => {
  const validContent = () => ({
    title: 'Test Content',
    description: 'A test content description',
    duration: '10 minutes',
    category: 'meditation',
    type: 'meditation',
    gradientColors: ['#10B981', '#34D399'],
  });

  describe('required fields', () => {
    it('should require title', async () => {
      const { title, ...rest } = validContent();
      const content = new Content(rest);
      const err = content.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    it('should require description', async () => {
      const { description, ...rest } = validContent();
      const content = new Content(rest);
      const err = content.validateSync();
      expect(err.errors.description).toBeDefined();
    });

    it('should require duration', async () => {
      const { duration, ...rest } = validContent();
      const content = new Content(rest);
      const err = content.validateSync();
      expect(err.errors.duration).toBeDefined();
    });

    it('should require category', async () => {
      const { category, ...rest } = validContent();
      const content = new Content(rest);
      const err = content.validateSync();
      expect(err.errors.category).toBeDefined();
    });

    it('should require type', async () => {
      const { type, ...rest } = validContent();
      const content = new Content(rest);
      const err = content.validateSync();
      expect(err.errors.type).toBeDefined();
    });

    it('should require gradientColors', async () => {
      const { gradientColors, ...rest } = validContent();
      const content = new Content(rest);
      const err = content.validateSync();
      expect(err.errors.gradientColors).toBeDefined();
    });
  });

  describe('title validation', () => {
    it('should reject title over 200 characters', async () => {
      const content = new Content({ ...validContent(), title: 'a'.repeat(201) });
      const err = content.validateSync();
      expect(err.errors.title).toBeDefined();
    });

    it('should accept title at exactly 200 characters', async () => {
      const content = new Content({ ...validContent(), title: 'a'.repeat(200) });
      const err = content.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('description validation', () => {
    it('should reject description over 1000 characters', async () => {
      const content = new Content({ ...validContent(), description: 'a'.repeat(1001) });
      const err = content.validateSync();
      expect(err.errors.description).toBeDefined();
    });

    it('should accept description at exactly 1000 characters', async () => {
      const content = new Content({ ...validContent(), description: 'a'.repeat(1000) });
      const err = content.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('type enum', () => {
    const validTypes = ['meditation', 'breathing', 'yoga', 'article', 'video', 'audio'];

    it('should accept all valid types', async () => {
      for (const t of validTypes) {
        const content = new Content({ ...validContent(), type: t });
        const err = content.validateSync();
        expect(err).toBeUndefined();
      }
    });

    it('should reject invalid type', async () => {
      const content = new Content({ ...validContent(), type: 'podcast' });
      const err = content.validateSync();
      expect(err.errors.type).toBeDefined();
    });
  });

  describe('gradientColors validator', () => {
    it('should reject fewer than 2 colors', async () => {
      const content = new Content({ ...validContent(), gradientColors: ['#10B981'] });
      const err = content.validateSync();
      expect(err.errors.gradientColors).toBeDefined();
    });

    it('should accept exactly 2 colors', async () => {
      const content = new Content({ ...validContent(), gradientColors: ['#10B981', '#34D399'] });
      const err = content.validateSync();
      expect(err).toBeUndefined();
    });

    it('should accept more than 2 colors', async () => {
      const content = new Content({ ...validContent(), gradientColors: ['#10B981', '#34D399', '#FF0000'] });
      const err = content.validateSync();
      expect(err).toBeUndefined();
    });

    it('should reject empty colors array', async () => {
      const content = new Content({ ...validContent(), gradientColors: [] });
      const err = content.validateSync();
      expect(err.errors.gradientColors).toBeDefined();
    });
  });

  describe('defaults', () => {
    it('should default isActive to true', async () => {
      const content = await Content.create(validContent());
      expect(content.isActive).toBe(true);
    });

    it('should default order to 0', async () => {
      const content = await Content.create(validContent());
      expect(content.order).toBe(0);
    });

    it('should default tags to empty array', async () => {
      const content = await Content.create(validContent());
      expect(content.tags).toEqual([]);
    });
  });

  describe('timestamps', () => {
    it('should auto-create timestamps', async () => {
      const content = await Content.create(validContent());
      expect(content.createdAt).toBeDefined();
      expect(content.updatedAt).toBeDefined();
    });
  });

  describe('optional fields', () => {
    it('should accept imageUrl', async () => {
      const content = await Content.create({ ...validContent(), imageUrl: 'https://example.com/img.jpg' });
      expect(content.imageUrl).toBe('https://example.com/img.jpg');
    });

    it('should accept mediaUrl', async () => {
      const content = await Content.create({ ...validContent(), mediaUrl: 'https://example.com/media.mp3' });
      expect(content.mediaUrl).toBe('https://example.com/media.mp3');
    });

    it('should accept tags', async () => {
      const content = await Content.create({ ...validContent(), tags: ['relax', 'calm'] });
      expect(content.tags).toEqual(['relax', 'calm']);
    });
  });
});
