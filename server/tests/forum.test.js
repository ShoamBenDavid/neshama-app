process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRE = '1h';
process.env.OPENAI_API_KEY = 'test-openai-key';

const request = require('supertest');
const { connectDB, disconnectDB, clearDB } = require('./setup');
const createApp = require('./helpers/testApp');
const ForumPost = require('../src/models/ForumPost');
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

describe('POST /api/forum', () => {
  it('should create a forum post', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/forum')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'My First Post',
        content: 'This is my first post content.',
        categoryId: 'general',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.title).toBe('My First Post');
    expect(res.body.data.post.categoryId).toBe('general');
  });

  it('should create an anonymous post', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/forum')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Anonymous Post',
        content: 'Secret content',
        categoryId: 'anxiety',
        isAnonymous: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.post.isAnonymous).toBe(true);
  });

  it('should reject missing title', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/forum')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'No title', categoryId: 'general' });

    expect(res.status).toBe(400);
  });

  it('should reject invalid category', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/forum')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bad Category',
        content: 'Content',
        categoryId: 'invalid-category',
      });

    expect(res.status).toBe(400);
  });

  it('should reject missing content', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/forum')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No Content', categoryId: 'general' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/forum', () => {
  it('should return forum posts', async () => {
    const { user, token } = await createAuthenticatedUser();

    await ForumPost.create({
      user: user._id,
      title: 'Test Post',
      content: 'Test content',
      categoryId: 'general',
    });

    const res = await request(app)
      .get('/api/forum')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.posts).toHaveLength(1);
    expect(res.body.data.posts[0].title).toBe('Test Post');
    expect(res.body.data.pagination).toBeDefined();
  });

  it('should filter by category', async () => {
    const { user, token } = await createAuthenticatedUser();

    await ForumPost.create([
      { user: user._id, title: 'Anxiety Post', content: 'Content', categoryId: 'anxiety' },
      { user: user._id, title: 'General Post', content: 'Content', categoryId: 'general' },
    ]);

    const res = await request(app)
      .get('/api/forum?category=anxiety')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.posts).toHaveLength(1);
    expect(res.body.data.posts[0].categoryId).toBe('anxiety');
  });

  it('should search posts', async () => {
    const { user, token } = await createAuthenticatedUser();

    await ForumPost.create([
      { user: user._id, title: 'Finding Peace', content: 'Meditation', categoryId: 'general' },
      { user: user._id, title: 'Work Stress', content: 'Deadlines', categoryId: 'work-stress' },
    ]);

    const res = await request(app)
      .get('/api/forum?search=Peace')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.posts).toHaveLength(1);
    expect(res.body.data.posts[0].title).toBe('Finding Peace');
  });

  it('should return all posts when category is "all"', async () => {
    const { user, token } = await createAuthenticatedUser();

    await ForumPost.create([
      { user: user._id, title: 'Post 1', content: 'Content', categoryId: 'anxiety' },
      { user: user._id, title: 'Post 2', content: 'Content', categoryId: 'general' },
    ]);

    const res = await request(app)
      .get('/api/forum?category=all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.posts).toHaveLength(2);
  });

  it('should paginate results', async () => {
    const { user, token } = await createAuthenticatedUser();

    for (let i = 0; i < 5; i++) {
      await ForumPost.create({
        user: user._id,
        title: `Post ${i}`,
        content: 'Content',
        categoryId: 'general',
      });
    }

    const res = await request(app)
      .get('/api/forum?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.posts).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(5);
    expect(res.body.data.pagination.pages).toBe(3);
  });

  it('should show isLiked correctly for current user', async () => {
    const { user, token } = await createAuthenticatedUser();

    await ForumPost.create({
      user: user._id,
      title: 'Liked Post',
      content: 'Content',
      categoryId: 'general',
      likes: [user._id],
    });

    const res = await request(app)
      .get('/api/forum')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.posts[0].isLiked).toBe(true);
  });

  it('should show anonymous author as אנונימי', async () => {
    const { user, token } = await createAuthenticatedUser();

    await ForumPost.create({
      user: user._id,
      title: 'Anonymous Post',
      content: 'Content',
      categoryId: 'general',
      isAnonymous: true,
    });

    const res = await request(app)
      .get('/api/forum')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.posts[0].author).toBe('אנונימי');
  });
});

describe('GET /api/forum/:id', () => {
  it('should return a single post with comments', async () => {
    const { user, token } = await createAuthenticatedUser();

    const post = await ForumPost.create({
      user: user._id,
      title: 'Detailed Post',
      content: 'Lots of content here',
      categoryId: 'general',
      comments: [{ user: user._id, content: 'A comment' }],
    });

    const res = await request(app)
      .get(`/api/forum/${post._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.post.title).toBe('Detailed Post');
    expect(res.body.data.post.comments).toHaveLength(1);
  });

  it('should return 404 for non-existent post', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .get('/api/forum/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/forum/:id/like', () => {
  it('should like a post', async () => {
    const { user, token } = await createAuthenticatedUser();

    const post = await ForumPost.create({
      user: user._id,
      title: 'Likeable Post',
      content: 'Content',
      categoryId: 'general',
    });

    const res = await request(app)
      .post(`/api/forum/${post._id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.likes).toBe(1);
    expect(res.body.data.isLiked).toBe(true);
  });

  it('should unlike a post on second call', async () => {
    const { user, token } = await createAuthenticatedUser();

    const post = await ForumPost.create({
      user: user._id,
      title: 'Likeable Post',
      content: 'Content',
      categoryId: 'general',
      likes: [user._id],
    });

    const res = await request(app)
      .post(`/api/forum/${post._id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.likes).toBe(0);
    expect(res.body.data.isLiked).toBe(false);
  });

  it('should return 404 for non-existent post', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/forum/507f1f77bcf86cd799439011/like')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/forum/:id/comment', () => {
  it('should add a comment', async () => {
    const { user, token } = await createAuthenticatedUser();

    const post = await ForumPost.create({
      user: user._id,
      title: 'Commentable Post',
      content: 'Content',
      categoryId: 'general',
    });

    const res = await request(app)
      .post(`/api/forum/${post._id}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Great post!' });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.content).toBe('Great post!');
    expect(res.body.data.commentsCount).toBe(1);
  });

  it('should reject empty comment', async () => {
    const { user, token } = await createAuthenticatedUser();

    const post = await ForumPost.create({
      user: user._id,
      title: 'Post',
      content: 'Content',
      categoryId: 'general',
    });

    const res = await request(app)
      .post(`/api/forum/${post._id}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent post', async () => {
    const { token } = await createAuthenticatedUser();

    const res = await request(app)
      .post('/api/forum/507f1f77bcf86cd799439011/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment' });

    expect(res.status).toBe(404);
  });

  it('should add anonymous comment', async () => {
    const { user, token } = await createAuthenticatedUser();
    const post = await ForumPost.create({
      user: user._id,
      title: 'Post',
      content: 'Content',
      categoryId: 'general',
    });

    const res = await request(app)
      .post(`/api/forum/${post._id}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Anonymous comment', isAnonymous: true });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.author).toBe('אנונימי');
  });
});

describe('DELETE /api/forum/:id', () => {
  it('should delete own post', async () => {
    const { user, token } = await createAuthenticatedUser();

    const post = await ForumPost.create({
      user: user._id,
      title: 'To Delete',
      content: 'Content',
      categoryId: 'general',
    });

    const res = await request(app)
      .delete(`/api/forum/${post._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await ForumPost.findById(post._id);
    expect(deleted).toBeNull();
  });

  it('should not delete another users post', async () => {
    const { user: owner } = await createAuthenticatedUser();
    const { token: otherToken } = await createAuthenticatedUser({
      email: 'other@example.com',
    });

    const post = await ForumPost.create({
      user: owner._id,
      title: 'Not Yours',
      content: 'Content',
      categoryId: 'general',
    });

    const res = await request(app)
      .delete(`/api/forum/${post._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
