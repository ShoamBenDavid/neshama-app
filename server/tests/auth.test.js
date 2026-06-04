process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.OPENAI_API_KEY = 'test-openai-key';

const request = require('supertest');
const { connectDB, disconnectDB, clearDB } = require('./setup');
const createApp = require('./helpers/testApp');
const User = require('../src/models/User');
const { createAuthenticatedUser, generateToken } = require('./helpers/auth');

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

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '0501234567',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('John Doe');
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should reject duplicate email', async () => {
    await User.create({
      name: 'Existing',
      email: 'john@example.com',
      password: 'password123',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John Doe' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John',
        email: 'not-an-email',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John',
        email: 'john@example.com',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject deactivated account', async () => {
    await User.findOneAndUpdate(
      { email: 'test@example.com' },
      { isActive: false }
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('should reject missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const { user, token } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.data.user.id).toBeDefined();
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('should return TOKEN_EXPIRED code for expired token', async () => {
    const jwt = require('jsonwebtoken');
    const config = require('../src/config/config');
    const user = await User.create({
      name: 'Expired User',
      email: 'expired@example.com',
      password: 'password123',
    });

    const expiredToken = jwt.sign(
      { id: user._id },
      config.JWT_SECRET || 'test-secret',
      { expiresIn: '-10s' },
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
    expect(res.body.message).toBe('Token has expired');
  });

  it('should return NO_TOKEN code when no token provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NO_TOKEN');
  });
});

describe('PUT /api/auth/profile', () => {
  it('should update user profile', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', phone: '0509999999' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Updated Name');
    expect(res.body.data.user.phone).toBe('0509999999');
  });

  it('should reject profile update without auth', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(401);
  });

  it('should update only name (partial update)', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Only Name Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Only Name Updated');
  });

  it('should update only phone (partial update)', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '0521111111' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.phone).toBe('0521111111');
  });

  it('should handle empty body update without error', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
