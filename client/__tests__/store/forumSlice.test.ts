import { configureStore } from '@reduxjs/toolkit';
import forumReducer, {
  fetchForumPosts,
  createForumPost,
  fetchForumPost,
  togglePostLike,
  addPostComment,
  deleteForumPost,
  clearError,
  clearSelectedPost,
} from '../../app/store/slices/forumSlice';

jest.mock('../../app/config/api', () => ({
  __esModule: true,
  default: { BASE_URL: 'http://localhost:5000/api', DEV_PORT: 5000 },
}));

function createTestStore() {
  return configureStore({
    reducer: { forum: forumReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
}

function mockFetchResponse(data: any, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

const samplePost = {
  id: 'post-1',
  author: 'Test User',
  isAnonymous: false,
  date: '1 January 2024',
  title: 'Test Post',
  content: 'Test content',
  categoryId: 'general',
  likes: 0,
  comments: 0,
  isLiked: false,
};

describe('forumSlice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().forum;

      expect(state.posts).toEqual([]);
      expect(state.selectedPost).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isCreating).toBe(false);
      expect(state.error).toBeNull();
      expect(state.pagination).toBeNull();
    });
  });

  describe('reducers', () => {
    it('clearError should clear error', () => {
      const store = createTestStore();
      store.dispatch(clearError());
      expect(store.getState().forum.error).toBeNull();
    });

    it('clearSelectedPost should clear selected post', () => {
      const store = createTestStore();
      store.dispatch(clearSelectedPost());
      expect(store.getState().forum.selectedPost).toBeNull();
    });
  });

  describe('fetchForumPosts', () => {
    it('should set posts on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: {
          posts: [samplePost],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      });

      await store.dispatch(fetchForumPosts({}));

      const state = store.getState().forum;
      expect(state.posts).toHaveLength(1);
      expect(state.posts[0].title).toBe('Test Post');
      expect(state.isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false }, 500);

      await store.dispatch(fetchForumPosts({}));

      expect(store.getState().forum.error).toBeDefined();
    });
  });

  describe('createForumPost', () => {
    it('should prepend new post on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { post: samplePost },
      });

      await store.dispatch(
        createForumPost({
          title: 'Test Post',
          content: 'Test content',
          categoryId: 'general',
        })
      );

      const state = store.getState().forum;
      expect(state.posts).toHaveLength(1);
      expect(state.isCreating).toBe(false);
    });
  });

  describe('fetchForumPost', () => {
    it('should set selectedPost on success', async () => {
      const store = createTestStore();
      const postWithComments = {
        ...samplePost,
        comments: [{ id: 'c1', author: 'User', content: 'Nice!' }],
      };
      mockFetchResponse({
        success: true,
        data: { post: postWithComments },
      });

      await store.dispatch(fetchForumPost('post-1'));

      const state = store.getState().forum;
      expect(state.selectedPost).toBeDefined();
      expect(state.selectedPost?.title).toBe('Test Post');
    });
  });

  describe('togglePostLike', () => {
    it('should update likes and isLiked', async () => {
      const store = createTestStore();

      // First add a post
      mockFetchResponse({
        success: true,
        data: {
          posts: [samplePost],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      });
      await store.dispatch(fetchForumPosts({}));

      // Then like it
      mockFetchResponse({
        success: true,
        data: { likes: 1, isLiked: true },
      });
      await store.dispatch(togglePostLike('post-1'));

      const state = store.getState().forum;
      const post = state.posts.find((p) => p.id === 'post-1');
      expect(post?.likes).toBe(1);
      expect(post?.isLiked).toBe(true);
    });
  });

  describe('addPostComment', () => {
    it('should update comments count', async () => {
      const store = createTestStore();

      // First add a post
      mockFetchResponse({
        success: true,
        data: {
          posts: [samplePost],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      });
      await store.dispatch(fetchForumPosts({}));

      // Then add a comment
      mockFetchResponse({
        success: true,
        data: {
          comment: { id: 'c1', author: 'User', content: 'Nice!' },
          commentsCount: 1,
        },
      });
      await store.dispatch(
        addPostComment({ id: 'post-1', content: 'Nice!' })
      );

      const state = store.getState().forum;
      const post = state.posts.find((p) => p.id === 'post-1');
      expect(post?.comments).toBe(1);
    });
  });

  describe('deleteForumPost', () => {
    it('should remove post from list', async () => {
      const store = createTestStore();

      // First add posts
      mockFetchResponse({
        success: true,
        data: {
          posts: [samplePost],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      });
      await store.dispatch(fetchForumPosts({}));
      expect(store.getState().forum.posts).toHaveLength(1);

      // Then delete
      mockFetchResponse({ success: true });
      await store.dispatch(deleteForumPost('post-1'));

      expect(store.getState().forum.posts).toHaveLength(0);
    });
  });

  describe('rejected states', () => {
    it('createForumPost should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Validation error' }, 400);

      await store.dispatch(
        createForumPost({ title: '', content: '', categoryId: 'general' })
      );

      expect(store.getState().forum.isCreating).toBe(false);
      expect(store.getState().forum.error).toBeDefined();
    });

    it('fetchForumPost should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Not found' }, 404);

      await store.dispatch(fetchForumPost('nonexistent'));

      expect(store.getState().forum.isLoading).toBe(false);
      expect(store.getState().forum.error).toBeDefined();
    });

    it('togglePostLike should handle failure gracefully', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Not found' }, 404);

      const result = await store.dispatch(togglePostLike('nonexistent'));
      expect(result.type).toContain('rejected');
    });

    it('addPostComment should handle failure gracefully', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Not found' }, 404);

      const result = await store.dispatch(
        addPostComment({ id: 'nonexistent', content: 'test' })
      );
      expect(result.type).toContain('rejected');
    });

    it('deleteForumPost should handle failure gracefully', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Not found' }, 404);

      const result = await store.dispatch(deleteForumPost('nonexistent'));
      expect(result.type).toContain('rejected');
    });
  });

  describe('pending states', () => {
    it('fetchForumPosts pending then fulfilled should toggle isLoading', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { posts: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
      });

      await store.dispatch(fetchForumPosts({}));
      expect(store.getState().forum.isLoading).toBe(false);
    });

    it('createForumPost pending then fulfilled should toggle isCreating', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: true, data: { post: samplePost } });

      await store.dispatch(
        createForumPost({ title: 'T', content: 'C', categoryId: 'general' })
      );
      expect(store.getState().forum.isCreating).toBe(false);
    });
  });

  describe('togglePostLike on selectedPost', () => {
    it('should update selectedPost likes when it matches', async () => {
      const store = createTestStore();

      // Load selected post
      const postWithComments = { ...samplePost, comments: [] };
      mockFetchResponse({ success: true, data: { post: postWithComments } });
      await store.dispatch(fetchForumPost('post-1'));

      // Also load into posts list
      mockFetchResponse({
        success: true,
        data: { posts: [samplePost], pagination: { page: 1, limit: 20, total: 1, pages: 1 } },
      });
      await store.dispatch(fetchForumPosts({}));

      // Toggle like
      mockFetchResponse({ success: true, data: { likes: 1, isLiked: true } });
      await store.dispatch(togglePostLike('post-1'));

      const state = store.getState().forum;
      expect(state.selectedPost?.likes).toBe(1);
      expect(state.selectedPost?.isLiked).toBe(true);
    });
  });

  describe('addPostComment on selectedPost', () => {
    it('should push comment to selectedPost.comments', async () => {
      const store = createTestStore();

      // Load selected post
      const postWithComments = { ...samplePost, comments: [] };
      mockFetchResponse({ success: true, data: { post: postWithComments } });
      await store.dispatch(fetchForumPost('post-1'));

      // Also load into posts list
      mockFetchResponse({
        success: true,
        data: { posts: [samplePost], pagination: { page: 1, limit: 20, total: 1, pages: 1 } },
      });
      await store.dispatch(fetchForumPosts({}));

      // Add comment
      mockFetchResponse({
        success: true,
        data: { comment: { id: 'c1', author: 'User', content: 'Nice!' }, commentsCount: 1 },
      });
      await store.dispatch(addPostComment({ id: 'post-1', content: 'Nice!' }));

      const state = store.getState().forum;
      expect(state.selectedPost?.comments).toHaveLength(1);
      expect(state.posts.find((p) => p.id === 'post-1')?.comments).toBe(1);
    });
  });
});
