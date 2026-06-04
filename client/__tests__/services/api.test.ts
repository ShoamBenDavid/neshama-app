import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStoredToken,
  storeToken,
  storeUser,
  getStoredUser,
  clearAuthData,
  authAPI,
  journalAPI,
  forumAPI,
  contentAPI,
  chatAPI,
} from '../../app/services/api';

jest.mock('../../app/config/api', () => ({
  __esModule: true,
  default: { BASE_URL: 'http://localhost:5000/api', DEV_PORT: 5000 },
}));

// Plain string tokens like 'token' / 'bearer-token' used throughout this file
// are not valid JWTs.  Mock isTokenExpired so the apiRequest middleware never
// throws "Token has expired" during these tests.
jest.mock('../../app/services/sessionManager', () => ({
  isTokenExpired: jest.fn(() => false),
  handleSessionExpired: jest.fn(() => Promise.resolve()),
  onSessionExpired: jest.fn(() => () => {}),
  resetExpirationGuard: jest.fn(),
}));

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: '2024-01-01',
};

function mockFetchResponse(data: any, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  });
}

function mockFetchNetworkError() {
  (global.fetch as jest.Mock).mockRejectedValueOnce(
    new Error('Network request failed'),
  );
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.setItem as jest.Mock).mockReset();
  (AsyncStorage.removeItem as jest.Mock).mockReset();
  (AsyncStorage.removeMany as jest.Mock).mockReset();
});

describe('Token/User Storage Helpers', () => {
  describe('getStoredToken', () => {
    it('should return token from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('my-token');
      const token = await getStoredToken();
      expect(token).toBe('my-token');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('should return null when no token stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const token = await getStoredToken();
      expect(token).toBeNull();
    });

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const token = await getStoredToken();
      expect(token).toBeNull();
    });
  });

  describe('storeToken', () => {
    it('should store token in AsyncStorage', async () => {
      await storeToken('new-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        'new-token',
      );
    });

    it('should handle AsyncStorage error gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      await expect(storeToken('token')).resolves.not.toThrow();
    });
  });

  describe('storeUser', () => {
    it('should store user as JSON in AsyncStorage', async () => {
      await storeUser(mockUser);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockUser),
      );
    });

    it('should handle AsyncStorage error gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      await expect(storeUser(mockUser)).resolves.not.toThrow();
    });
  });

  describe('getStoredUser', () => {
    it('should return parsed user from AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockUser),
      );
      const user = await getStoredUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when no user stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const user = await getStoredUser();
      expect(user).toBeNull();
    });

    it('should return null on AsyncStorage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const user = await getStoredUser();
      expect(user).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    it('should remove token and user from AsyncStorage', async () => {
      await clearAuthData();
      expect(AsyncStorage.removeMany).toHaveBeenCalledWith([
        'auth_token',
        'user_data',
      ]);
    });

    it('should handle AsyncStorage error gracefully', async () => {
      (AsyncStorage.removeMany as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      await expect(clearAuthData()).resolves.not.toThrow();
    });
  });
});

describe('apiRequest (tested through API calls)', () => {
  it('should inject Authorization header when token exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('bearer-token');
    mockFetchResponse({ success: true, data: { user: mockUser } });

    await authAPI.getMe();

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].headers.Authorization).toBe('Bearer bearer-token');
  });

  it('should not inject Authorization header when no token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    mockFetchResponse({ success: true, data: { user: mockUser } });

    await authAPI.getMe();

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].headers.Authorization).toBeUndefined();
  });

  it('should throw on HTTP error with message from response', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    mockFetchResponse({ success: false, message: 'Not Found' }, 404);

    await expect(authAPI.getMe()).rejects.toThrow('Not Found');
  });

  it('should handle validation errors (400 with errors array)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    mockFetchResponse(
      {
        success: false,
        errors: [
          { msg: 'Email is required', path: 'email' },
          { msg: 'Password is required', path: 'password' },
        ],
      },
      400,
    );

    await expect(authAPI.login({ email: '', password: '' })).rejects.toThrow(
      'Email is required, Password is required',
    );
  });

  it('should throw network error with custom message', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    mockFetchNetworkError();

    await expect(authAPI.getMe()).rejects.toThrow(/Cannot connect to server/);
  });
});

describe('authAPI', () => {
  describe('register', () => {
    it('should call POST /auth/register and store token/user on success', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      mockFetchResponse(
        {
          success: true,
          data: { user: mockUser, token: 'new-token' },
        },
        201,
      );

      const response = await authAPI.register({
        name: 'Test',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        'new-token',
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockUser),
      );
    });

    it('should not store token on failed register', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      mockFetchResponse({ success: false, message: 'Already exists' }, 400);

      await expect(
        authAPI.register({
          name: 'T',
          email: 'test@example.com',
          password: '123',
        }),
      ).rejects.toThrow();

      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        'auth_token',
        expect.anything(),
      );
    });
  });

  describe('login', () => {
    it('should call POST /auth/login and store token/user on success', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      mockFetchResponse({
        success: true,
        data: { user: mockUser, token: 'login-token' },
      });

      const response = await authAPI.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        'login-token',
      );
    });
  });

  describe('getMe', () => {
    it('should call GET /auth/me', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('token');
      mockFetchResponse({ success: true, data: { user: mockUser } });

      const response = await authAPI.getMe();
      expect(response.success).toBe(true);
      expect(response.data?.user.name).toBe('Test User');
    });
  });

  describe('updateProfile', () => {
    it('should call PUT /auth/profile', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('token');
      mockFetchResponse({
        success: true,
        data: { user: { ...mockUser, name: 'Updated' } },
      });

      const response = await authAPI.updateProfile({ name: 'Updated' });
      expect(response.success).toBe(true);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].method).toBe('PUT');
    });
  });

  describe('logout', () => {
    it('should clear auth data from storage', async () => {
      await authAPI.logout();
      expect(AsyncStorage.removeMany).toHaveBeenCalledWith([
        'auth_token',
        'user_data',
      ]);
    });
  });

  describe('checkAuthStatus', () => {
    it('should return unauthenticated when no stored token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await authAPI.checkAuthStatus();
      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should verify token with server and return user', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('stored-token')
        .mockResolvedValueOnce(JSON.stringify(mockUser))
        .mockResolvedValueOnce('stored-token');

      mockFetchResponse({ success: true, data: { user: mockUser } });

      const result = await authAPI.checkAuthStatus();
      expect(result.isAuthenticated).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should clear auth data when token is invalid', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('invalid-token')
        .mockResolvedValueOnce(JSON.stringify(mockUser))
        .mockResolvedValueOnce('invalid-token');

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid token'),
      );

      const result = await authAPI.checkAuthStatus();
      expect(result.isAuthenticated).toBe(false);
    });
  });
});

describe('journalAPI', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
  });

  describe('getEntries', () => {
    it('should call GET /journal with no params', async () => {
      mockFetchResponse({
        success: true,
        data: { entries: [], pagination: {} },
      });

      await journalAPI.getEntries();

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/journal');
    });

    it('should append query params', async () => {
      mockFetchResponse({
        success: true,
        data: { entries: [], pagination: {} },
      });

      await journalAPI.getEntries({ page: 2, limit: 10, mood: 4 });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
      expect(url).toContain('mood=4');
    });
  });

  describe('createEntry', () => {
    it('should call POST /journal', async () => {
      mockFetchResponse({
        success: true,
        data: { entry: { id: '1', mood: 4, content: 'Test' } },
      });

      await journalAPI.createEntry({ mood: 4, content: 'Test' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].method).toBe('POST');
    });
  });

  describe('getEntry', () => {
    it('should call GET /journal/:id', async () => {
      mockFetchResponse({ success: true, data: { entry: { id: '1' } } });

      await journalAPI.getEntry('1');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/journal/1');
    });
  });

  describe('updateEntry', () => {
    it('should call PUT /journal/:id', async () => {
      mockFetchResponse({ success: true, data: { entry: { id: '1' } } });

      await journalAPI.updateEntry('1', { mood: 5 });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/journal/1');
      expect(fetchCall[1].method).toBe('PUT');
    });
  });

  describe('deleteEntry', () => {
    it('should call DELETE /journal/:id', async () => {
      mockFetchResponse({ success: true });

      await journalAPI.deleteEntry('1');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/journal/1');
      expect(fetchCall[1].method).toBe('DELETE');
    });
  });

  describe('getStats', () => {
    it('should call GET /journal/stats', async () => {
      mockFetchResponse({
        success: true,
        data: { stats: {}, progress: {}, chartData: {} },
      });

      await journalAPI.getStats();

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/journal/stats');
    });
  });
});

describe('forumAPI', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
  });

  describe('getPosts', () => {
    it('should call GET /forum with query params', async () => {
      mockFetchResponse({ success: true, data: { posts: [], pagination: {} } });

      await forumAPI.getPosts({
        category: 'anxiety',
        sort: 'popular',
        search: 'test',
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('category=anxiety');
      expect(url).toContain('sort=popular');
      expect(url).toContain('search=test');
    });
  });

  describe('createPost', () => {
    it('should call POST /forum', async () => {
      mockFetchResponse({ success: true, data: { post: { id: '1' } } });

      await forumAPI.createPost({
        title: 'T',
        content: 'C',
        categoryId: 'general',
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].method).toBe('POST');
    });
  });

  describe('getPost', () => {
    it('should call GET /forum/:id', async () => {
      mockFetchResponse({ success: true, data: { post: { id: '1' } } });

      await forumAPI.getPost('1');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/forum/1');
    });
  });

  describe('toggleLike', () => {
    it('should call POST /forum/:id/like', async () => {
      mockFetchResponse({ success: true, data: { likes: 1, isLiked: true } });

      await forumAPI.toggleLike('1');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/forum/1/like');
      expect(fetchCall[1].method).toBe('POST');
    });
  });

  describe('addComment', () => {
    it('should call POST /forum/:id/comment with body', async () => {
      mockFetchResponse({
        success: true,
        data: { comment: {}, commentsCount: 1 },
      });

      await forumAPI.addComment('1', 'Nice!', true);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/forum/1/comment');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.content).toBe('Nice!');
      expect(body.isAnonymous).toBe(true);
    });
  });

  describe('deletePost', () => {
    it('should call DELETE /forum/:id', async () => {
      mockFetchResponse({ success: true });

      await forumAPI.deletePost('1');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/forum/1');
      expect(fetchCall[1].method).toBe('DELETE');
    });
  });
});

describe('contentAPI', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
  });

  describe('getContent', () => {
    it('should call GET /content with query params', async () => {
      mockFetchResponse({ success: true, data: { content: [] } });

      await contentAPI.getContent({
        category: 'meditation',
        type: 'breathing',
        search: 'calm',
      });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('category=meditation');
      expect(url).toContain('type=breathing');
      expect(url).toContain('search=calm');
    });

    it('should call GET /content with no params', async () => {
      mockFetchResponse({ success: true, data: { content: [] } });

      await contentAPI.getContent();

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toMatch(/\/content$/);
    });
  });

  describe('getRecommended', () => {
    it('should call GET /content/recommended', async () => {
      mockFetchResponse({ success: true, data: { content: [] } });

      await contentAPI.getRecommended();

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/content/recommended');
    });
  });

  describe('getContentById', () => {
    it('should call GET /content/:id', async () => {
      mockFetchResponse({ success: true, data: { content: { id: '1' } } });

      await contentAPI.getContentById('1');

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/content/1');
    });
  });

  describe('seedContent', () => {
    it('should call POST /content/seed', async () => {
      mockFetchResponse({ success: true, message: 'Seeded' });

      await contentAPI.seedContent();

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/content/seed');
      expect(fetchCall[1].method).toBe('POST');
    });
  });
});

describe('chatAPI', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
  });

  describe('sendMessage', () => {
    it('should call POST /chat/message with message and history', async () => {
      mockFetchResponse({ success: true, data: { message: 'Response' } });

      await chatAPI.sendMessage('Hello', [{ role: 'user', content: 'Hi' }]);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toContain('/chat/message');
      expect(fetchCall[1].method).toBe('POST');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.message).toBe('Hello');
      expect(body.history).toHaveLength(1);
    });

    it('should handle error response', async () => {
      mockFetchResponse({ success: false, message: 'Failed' }, 500);

      await expect(chatAPI.sendMessage('Hello', [])).rejects.toThrow('Failed');
    });
  });
});
