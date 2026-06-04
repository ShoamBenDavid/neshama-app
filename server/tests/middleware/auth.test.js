process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';

const jwt = require('jsonwebtoken');
const { connectDB, disconnectDB, clearDB } = require('../setup');
const User = require('../../src/models/User');
const { protect } = require('../../src/middleware/auth');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

afterEach(async () => {
  await clearDB();
});

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe('Auth Middleware - protect', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should call next() with valid token', async () => {
    const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(testUser._id.toString());
  });

  it('should reject missing token', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid token', async () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should reject expired token', async () => {
    const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
      expiresIn: '0s',
    });

    await new Promise((r) => setTimeout(r, 1000));

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should reject token for non-existent user', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const token = jwt.sign({ id: fakeId }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should reject authorization header without Bearer prefix', async () => {
    const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    const req = { headers: { authorization: token } };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should reject Bearer with no token after it', async () => {
    const req = { headers: { authorization: 'Bearer ' } };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should reject token signed with wrong secret', async () => {
    const token = jwt.sign({ id: testUser._id }, 'wrong-secret-key', {
      expiresIn: '1h',
    });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});
