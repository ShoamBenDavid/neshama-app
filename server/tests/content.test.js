process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.OPENAI_API_KEY = 'test-openai-key';

const request = require('supertest');
const { connectDB, disconnectDB, clearDB } = require('./setup');
const createApp = require('./helpers/testApp');
const Content = require('../src/models/Content');
const { createAuthenticatedUser } = require('./helpers/auth');

const app = createApp();

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await clearDB();
});

const sampleContent = {
  title: 'מדיטציית הכרת תודה',
  description: 'מדיטציה להתמקדות בדברים הטובים.',
  duration: '10 דקות',
  category: 'מיינדפולנס',
  type: 'meditation',
  gradientColors: ['#10B981', '#34D399'],
  tags: ['מיינדפולנס'],
  isActive: true,
  order: 1,
};

describe('GET /api/content', () => {
  it('should return all active content', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create([
      sampleContent,
      {
        ...sampleContent,
        title: 'נשימת קופסה',
        category: 'הקלה מחרדה',
        type: 'breathing',
        order: 2,
      },
    ]);

    const res = await request(app)
      .get('/api/content')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toHaveLength(2);
  });

  it('should not return inactive content', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create({
      ...sampleContent,
      isActive: false,
    });

    const res = await request(app)
      .get('/api/content')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.content).toHaveLength(0);
  });

  it('should filter by category', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create([
      sampleContent,
      {
        ...sampleContent,
        title: 'Breathing',
        category: 'הקלה מחרדה',
        type: 'breathing',
      },
    ]);

    const res = await request(app)
      .get('/api/content?category=מיינדפולנס')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.content).toHaveLength(1);
    expect(res.body.data.content[0].category).toBe('מיינדפולנס');
  });

  it('should filter by type', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create([
      sampleContent,
      {
        ...sampleContent,
        title: 'Breathing',
        type: 'breathing',
      },
    ]);

    const res = await request(app)
      .get('/api/content?type=breathing')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.content).toHaveLength(1);
    expect(res.body.data.content[0].type).toBe('breathing');
  });

  it('should search by title', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create([
      sampleContent,
      {
        ...sampleContent,
        title: 'נשימת קופסה',
        type: 'breathing',
      },
    ]);

    const res = await request(app)
      .get('/api/content?search=קופסה')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.content).toHaveLength(1);
    expect(res.body.data.content[0].title).toBe('נשימת קופסה');
  });

  it('should search by description', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create([
      sampleContent,
      {
        ...sampleContent,
        title: 'Another content',
        description: 'טכניקה נשימה מהירה להפחתת חרדה',
        type: 'breathing',
      },
    ]);

    const res = await request(app)
      .get('/api/content?search=חרדה')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.content).toHaveLength(1);
    expect(res.body.data.content[0].title).toBe('Another content');
  });

  it('should search by tags', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create([
      sampleContent,
      {
        ...sampleContent,
        title: 'Tagged content',
        tags: ['special-tag'],
        type: 'breathing',
      },
    ]);

    const res = await request(app)
      .get('/api/content?search=special-tag')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.content).toHaveLength(1);
    expect(res.body.data.content[0].title).toBe('Tagged content');
  });

  it('should return all when category is הכל', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create([
      sampleContent,
      {
        ...sampleContent,
        title: 'Breathing',
        category: 'הקלה מחרדה',
        type: 'breathing',
      },
    ]);

    const res = await request(app)
      .get('/api/content?category=הכל')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.content).toHaveLength(2);
  });
});

describe('GET /api/content/:id', () => {
  it('should return a single content item', async () => {
    const { token } = await createAuthenticatedUser();
    const content = await Content.create(sampleContent);

    const res = await request(app)
      .get(`/api/content/${content._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.content.title).toBe(sampleContent.title);
  });

  it('should return 404 for non-existent content', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/content/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/content/seed', () => {
  it('should seed content when empty', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/content/seed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const count = await Content.countDocuments();
    expect(count).toBeGreaterThan(0);
  });

  it('should reject seeding when content already exists', async () => {
    const { token } = await createAuthenticatedUser();
    await Content.create(sampleContent);

    const res = await request(app)
      .post('/api/content/seed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already seeded/i);
  });

  it('should seed exactly 10 content items', async () => {
    const { token } = await createAuthenticatedUser();

    await request(app)
      .post('/api/content/seed')
      .set('Authorization', `Bearer ${token}`);

    const count = await Content.countDocuments();
    expect(count).toBe(10);
  });
});

describe('POST /api/content', () => {
  it('should create a content item', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleContent);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content.title).toBe(sampleContent.title);
  });

  it('should reject content without required fields', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Missing fields' });

    expect(res.status).toBe(500);
  });

  it('should reject content with invalid type', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleContent, type: 'podcast' });

    expect(res.status).toBe(500);
  });

  it('should reject content with fewer than 2 gradient colors', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleContent, gradientColors: ['#10B981'] });

    expect(res.status).toBe(500);
  });
});

describe('GET /api/content/recommended', () => {
  it('should return max 4 items', async () => {
    const { token } = await createAuthenticatedUser();

    for (let i = 0; i < 10; i++) {
      await Content.create({ ...sampleContent, title: `Content ${i}`, order: i });
    }

    const res = await request(app)
      .get('/api/content/recommended')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.content.length).toBeLessThanOrEqual(4);
  });

  it('should return empty array when no active content', async () => {
    const { token } = await createAuthenticatedUser();

    await Content.create({ ...sampleContent, isActive: false });

    const res = await request(app)
      .get('/api/content/recommended')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.content).toHaveLength(0);
  });
});
