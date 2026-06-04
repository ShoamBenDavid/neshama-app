process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ML_SERVICE_URL = 'http://localhost:5001';

const request = require('supertest');
const { connectDB, disconnectDB, clearDB } = require('./setup');
const createApp = require('./helpers/testApp');
const JournalEntry = require('../src/models/JournalEntry');
const { createAuthenticatedUser } = require('./helpers/auth');

jest.mock('../src/services/classificationService', () => ({
  classify: jest.fn().mockResolvedValue({
    anxietyLevel: 0.3,
    anxietyLabel: 'low',
  }),
}));

const classificationService = require('../src/services/classificationService');

const app = createApp();

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await clearDB();
  jest.clearAllMocks();
});

describe('POST /api/journal', () => {
  it('should create a journal entry', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mood: 4,
        title: 'Good day',
        content: 'Today was a great day.',
        tags: ['happy', 'grateful'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entry.mood).toBe(4);
    expect(res.body.data.entry.title).toBe('Good day');
    expect(res.body.data.entry.content).toBe('Today was a great day.');
    expect(res.body.data.entry.tags).toEqual(['happy', 'grateful']);
    expect(classificationService.classify).toHaveBeenCalledWith('Today was a great day.');
  });

  it('should reject missing content', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 3 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid mood value', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 10, content: 'Test content' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/journal')
      .send({ mood: 3, content: 'Test' });

    expect(res.status).toBe(401);
  });

  it('should still create entry when classification fails', async () => {
    classificationService.classify.mockResolvedValueOnce(null);
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/journal')
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 3, content: 'Some content' });

    expect(res.status).toBe(201);
    expect(res.body.data.entry.anxietyLevel).toBeNull();
  });
});

describe('GET /api/journal', () => {
  it('should return user entries', async () => {
    const { user, token } = await createAuthenticatedUser();

    await JournalEntry.create([
      { user: user._id, mood: 4, content: 'Entry 1' },
      { user: user._id, mood: 2, content: 'Entry 2' },
    ]);

    const res = await request(app)
      .get('/api/journal')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entries).toHaveLength(2);
    expect(res.body.data.pagination).toBeDefined();
  });

  it('should not return other users entries', async () => {
    const { token } = await createAuthenticatedUser();
    const { user: otherUser } = await createAuthenticatedUser({
      email: 'other@example.com',
    });

    await JournalEntry.create({
      user: otherUser._id,
      mood: 3,
      content: 'Other user entry',
    });

    const res = await request(app)
      .get('/api/journal')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.entries).toHaveLength(0);
  });

  it('should filter by mood', async () => {
    const { user, token } = await createAuthenticatedUser();

    await JournalEntry.create([
      { user: user._id, mood: 4, content: 'Happy' },
      { user: user._id, mood: 2, content: 'Sad' },
    ]);

    const res = await request(app)
      .get('/api/journal?mood=4')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.entries).toHaveLength(1);
    expect(res.body.data.entries[0].mood).toBe(4);
  });

  it('should paginate results', async () => {
    const { user, token } = await createAuthenticatedUser();

    for (let i = 0; i < 5; i++) {
      await JournalEntry.create({
        user: user._id,
        mood: 3,
        content: `Entry ${i}`,
      });
    }

    const res = await request(app)
      .get('/api/journal?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.entries).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(5);
    expect(res.body.data.pagination.pages).toBe(3);
  });
});

describe('GET /api/journal/:id', () => {
  it('should return a single entry', async () => {
    const { user, token } = await createAuthenticatedUser();
    const entry = await JournalEntry.create({
      user: user._id,
      mood: 4,
      content: 'My entry',
    });

    const res = await request(app)
      .get(`/api/journal/${entry._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.entry.content).toBe('My entry');
  });

  it('should return 404 for non-existent entry', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/journal/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should not return another users entry', async () => {
    const { token } = await createAuthenticatedUser();
    const { user: otherUser } = await createAuthenticatedUser({
      email: 'other@example.com',
    });

    const entry = await JournalEntry.create({
      user: otherUser._id,
      mood: 3,
      content: 'Private entry',
    });

    const res = await request(app)
      .get(`/api/journal/${entry._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/journal/:id', () => {
  it('should update an entry', async () => {
    const { user, token } = await createAuthenticatedUser();
    const entry = await JournalEntry.create({
      user: user._id,
      mood: 3,
      content: 'Original content',
    });

    const res = await request(app)
      .put(`/api/journal/${entry._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 5, content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body.data.entry.mood).toBe(5);
    expect(res.body.data.entry.content).toBe('Updated content');
  });

  it('should return 404 for non-existent entry', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/journal/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 4, content: 'Updated' });

    expect(res.status).toBe(404);
  });

  it('should not update another users entry', async () => {
    const { user: owner } = await createAuthenticatedUser();
    const { token: otherToken } = await createAuthenticatedUser({
      email: 'other@example.com',
    });
    const entry = await JournalEntry.create({
      user: owner._id,
      mood: 3,
      content: 'Owner entry',
    });

    const res = await request(app)
      .put(`/api/journal/${entry._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ mood: 5, content: 'Hacked' });

    expect(res.status).toBe(404);
  });

  it('should handle partial update (only mood)', async () => {
    const { user, token } = await createAuthenticatedUser();
    const entry = await JournalEntry.create({
      user: user._id,
      mood: 3,
      content: 'Original content',
    });

    const res = await request(app)
      .put(`/api/journal/${entry._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.entry.mood).toBe(5);
    expect(res.body.data.entry.content).toBe('Original content');
  });

  it('should return 500 for invalid ObjectId format', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/journal/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 4, content: 'Updated' });

    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/journal/:id', () => {
  it('should delete an entry', async () => {
    const { user, token } = await createAuthenticatedUser();
    const entry = await JournalEntry.create({
      user: user._id,
      mood: 3,
      content: 'To be deleted',
    });

    const res = await request(app)
      .delete(`/api/journal/${entry._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await JournalEntry.findById(entry._id);
    expect(deleted).toBeNull();
  });

  it('should return 404 for non-existent entry', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .delete('/api/journal/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should not delete another users entry', async () => {
    const { user: owner } = await createAuthenticatedUser();
    const { token: otherToken } = await createAuthenticatedUser({
      email: 'other@example.com',
    });
    const entry = await JournalEntry.create({
      user: owner._id,
      mood: 3,
      content: 'Not yours',
    });

    const res = await request(app)
      .delete(`/api/journal/${entry._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);

    const stillExists = await JournalEntry.findById(entry._id);
    expect(stillExists).not.toBeNull();
  });

  it('should return 500 for invalid ObjectId', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .delete('/api/journal/invalid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});

describe('GET /api/journal/stats', () => {
  it('should return journal statistics', async () => {
    const { user, token } = await createAuthenticatedUser();

    await JournalEntry.create([
      { user: user._id, mood: 4, content: 'Good day', date: new Date() },
      { user: user._id, mood: 5, content: 'Great day', date: new Date() },
      { user: user._id, mood: 2, content: 'Bad day', date: new Date() },
    ]);

    const res = await request(app)
      .get('/api/journal/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalEntries).toBeDefined();
    expect(res.body.data.progress).toBeDefined();
    expect(res.body.data.chartData).toBeDefined();
  });

  it('should return empty stats for user with no entries', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/journal/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalEntries).toBe(0);
  });

  it('should calculate stats correctly', async () => {
    const { user, token } = await createAuthenticatedUser();

    await JournalEntry.create([
      { user: user._id, mood: 5, content: 'Great', date: new Date() },
      { user: user._id, mood: 4, content: 'Good', date: new Date() },
      { user: user._id, mood: 1, content: 'Bad', date: new Date() },
    ]);

    const res = await request(app)
      .get('/api/journal/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalEntries).toBe(3);
    expect(res.body.data.stats.goodDays).toBe(2);
    expect(res.body.data.chartData.highMood).toBe(5);
    expect(res.body.data.chartData.lowMood).toBe(1);
    expect(parseFloat(res.body.data.chartData.avgMood)).toBeCloseTo(3.3, 1);
  });

  it('should include anxiety stats for classified entries', async () => {
    const { user, token } = await createAuthenticatedUser();

    await JournalEntry.create([
      { user: user._id, mood: 3, content: 'Entry 1', date: new Date(), anxietyLevel: 0.8, anxietyLabel: 'high' },
      { user: user._id, mood: 4, content: 'Entry 2', date: new Date(), anxietyLevel: 0.2, anxietyLabel: 'low' },
    ]);

    const res = await request(app)
      .get('/api/journal/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.anxietyReduction).toBeDefined();
    expect(res.body.data.progress.anxietyLevel).toBeDefined();
  });

  it('should return moodChartData for entries', async () => {
    const { user, token } = await createAuthenticatedUser();

    await JournalEntry.create([
      { user: user._id, mood: 4, content: 'Day 1', date: new Date() },
      { user: user._id, mood: 5, content: 'Day 2', date: new Date() },
    ]);

    const res = await request(app)
      .get('/api/journal/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.chartData.entries).toBeDefined();
    expect(Array.isArray(res.body.data.chartData.entries)).toBe(true);
  });
});
