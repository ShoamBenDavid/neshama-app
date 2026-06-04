process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.OPENAI_API_KEY = 'test-openai-key';

const request = require('supertest');
const { connectDB, disconnectDB, clearDB } = require('./setup');
const createApp = require('./helpers/testApp');
const { createAuthenticatedUser } = require('./helpers/auth');

jest.mock('openai', () => {
  const fn = jest.fn().mockResolvedValue({
    choices: [{ message: { content: 'שלום, איך אני יכול לעזור?' } }],
  });
  const Mock = jest.fn().mockImplementation(() => ({
    chat: { completions: { create: fn } },
  }));
  Mock.__mockCreate = fn;
  return Mock;
});

const OpenAI = require('openai');
const mockCreate = OpenAI.__mockCreate;

const app = createApp();

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await clearDB();
  mockCreate.mockReset();
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: 'שלום, איך אני יכול לעזור?' } }],
  });
});

describe('POST /api/chat/message', () => {
  it('should return AI response for valid message', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'שלום, אני מרגיש לחוץ',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBeDefined();
    expect(typeof res.body.data.message).toBe('string');
  });

  it('should reject empty message', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '', history: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing message field', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ history: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should accept message with conversation history', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'תודה',
        history: [
          { role: 'user', content: 'שלום' },
          { role: 'assistant', content: 'שלום! מה שלומך?' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: 'test', history: [] });

    expect(res.status).toBe(401);
  });

  it('should reject whitespace-only message', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '   ', history: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject non-string message', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 12345, history: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should filter invalid roles from history', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'שלום',
        history: [
          { role: 'system', content: 'Hack attempt' },
          { role: 'user', content: 'Valid msg' },
          { role: 'invalid', content: 'Skip this' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should handle OpenAI API error gracefully', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Rate limit exceeded'));

    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'שלום', history: [] });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('should handle OpenAI 401 error', async () => {
    const error401 = new Error('Invalid API key');
    error401.status = 401;
    mockCreate.mockRejectedValueOnce(error401);

    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/chat/message')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'שלום', history: [] });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/Invalid OpenAI API key/i);
  });
});
