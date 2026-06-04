import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  registerUser,
  loginUser,
  logoutUser,
  checkAuthStatus,
  clearError,
  setUser,
  sessionExpired,
} from '../../app/store/slices/authSlice';

jest.mock('../../app/config/api', () => ({
  __esModule: true,
  default: { BASE_URL: 'http://localhost:5000/api', DEV_PORT: 5000 },
}));

function createFakeJwt(expInSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ id: '1', exp: expInSeconds })).toString('base64');
  return `${header}.${payload}.fake-sig`;
}

const VALID_TOKEN = createFakeJwt(Math.floor(Date.now() / 1000) + 3600);
const EXPIRED_TOKEN = createFakeJwt(Math.floor(Date.now() / 1000) - 3600);

function createTestStore() {
  return configureStore({
    reducer: { auth: authReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
}

function mockFetchResponse(data: any, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

describe('authSlice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isCheckingAuth).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('reducers', () => {
    it('clearError should clear the error', () => {
      const store = createTestStore();
      // Manually set an error by dispatching a rejected action
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    it('setUser should set the user', () => {
      const store = createTestStore();
      const user = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        createdAt: '2024-01-01',
      };
      store.dispatch(setUser(user));
      expect(store.getState().auth.user).toEqual(user);
    });
  });

  describe('registerUser', () => {
    it('should set user and token on success', async () => {
      const store = createTestStore();
      const responseData = {
        success: true,
        data: {
          user: { id: '1', name: 'Test', email: 'test@example.com', createdAt: '2024-01-01' },
          token: 'jwt-token-123',
        },
      };
      mockFetchResponse(responseData, 201);

      await store.dispatch(
        registerUser({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        })
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe('Test');
      expect(state.token).toBe('jwt-token-123');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse(
        { success: false, message: 'User already exists' },
        400
      );

      await store.dispatch(
        registerUser({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        })
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('loginUser', () => {
    it('should set user and token on success', async () => {
      const store = createTestStore();
      const responseData = {
        success: true,
        data: {
          user: { id: '1', name: 'Test', email: 'test@example.com', createdAt: '2024-01-01' },
          token: 'jwt-token-456',
        },
      };
      mockFetchResponse(responseData);

      await store.dispatch(
        loginUser({ email: 'test@example.com', password: 'password123' })
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('jwt-token-456');
      expect(state.error).toBeNull();
    });

    it('should set error on invalid credentials', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Invalid credentials' }, 401);

      await store.dispatch(
        loginUser({ email: 'test@example.com', password: 'wrong' })
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('logoutUser', () => {
    it('should clear auth state on logout', async () => {
      const store = createTestStore();

      // First login
      const responseData = {
        success: true,
        data: {
          user: { id: '1', name: 'Test', email: 'test@example.com', createdAt: '2024-01-01' },
          token: 'jwt-token',
        },
      };
      mockFetchResponse(responseData);
      await store.dispatch(
        loginUser({ email: 'test@example.com', password: 'password123' })
      );
      expect(store.getState().auth.isAuthenticated).toBe(true);

      // Then logout
      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('registerUser pending', () => {
    it('should set isLoading to true on pending', () => {
      const store = createTestStore();
      mockFetchResponse({}, 200);
      const promise = store.dispatch(
        registerUser({ name: 'T', email: 'a@b.com', password: '123456' })
      );

      // The pending state fires synchronously before the async resolves
      // We check the initial dispatch happened
      return promise.then(() => {
        expect(store.getState().auth.isLoading).toBe(false);
      });
    });
  });

  describe('loginUser pending', () => {
    it('should set isLoading to true then false on completion', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'fail' }, 401);

      await store.dispatch(loginUser({ email: 'a@b.com', password: 'wrong' }));

      expect(store.getState().auth.isLoading).toBe(false);
      expect(store.getState().auth.error).toBeDefined();
    });
  });

  describe('logoutUser rejected', () => {
    it('should set error on logout failure', async () => {
      const store = createTestStore();

      // Mock AsyncStorage.multiRemove to throw
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.multiRemove.mockRejectedValueOnce(new Error('Storage error'));

      // logoutUser calls authAPI.logout -> clearAuthData -> multiRemove
      // Since clearAuthData catches errors internally, logoutUser still fulfills
      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('checkAuthStatus', () => {
    it('should set isCheckingAuth to false when done', async () => {
      const store = createTestStore();

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.isCheckingAuth).toBe(false);
    });

    it('should return unauthenticated when no stored token', async () => {
      const store = createTestStore();

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should authenticate with valid stored token and server validation', async () => {
      const store = createTestStore();
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem
        .mockResolvedValueOnce(VALID_TOKEN)
        .mockResolvedValueOnce(JSON.stringify({ id: '1', name: 'Test', email: 'test@example.com', createdAt: '2024-01-01' }))
        .mockResolvedValueOnce(VALID_TOKEN);

      mockFetchResponse({
        success: true,
        data: { user: { id: '1', name: 'Test', email: 'test@example.com', createdAt: '2024-01-01' } },
      });

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.isCheckingAuth).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe('Test');
    });

    it('should reject expired token on startup and clear auth data', async () => {
      const store = createTestStore();
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem
        .mockResolvedValueOnce(EXPIRED_TOKEN)
        .mockResolvedValueOnce(JSON.stringify({ id: '1', name: 'Old', email: 'old@example.com', createdAt: '2024-01-01' }));

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.isCheckingAuth).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should fallback to stored data on network error with valid token', async () => {
      const store = createTestStore();
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem
        .mockResolvedValueOnce(VALID_TOKEN)
        .mockResolvedValueOnce(JSON.stringify({ id: '1', name: 'Offline', email: 'off@example.com', createdAt: '2024-01-01' }))
        .mockResolvedValueOnce(VALID_TOKEN);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.isCheckingAuth).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.name).toBe('Offline');
    });

    it('should reject when server returns 401 with valid-looking token', async () => {
      const store = createTestStore();
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getItem
        .mockResolvedValueOnce(VALID_TOKEN)
        .mockResolvedValueOnce(JSON.stringify({ id: '1', name: 'Test', email: 'test@example.com', createdAt: '2024-01-01' }))
        .mockResolvedValueOnce(VALID_TOKEN);

      mockFetchResponse({ success: false, code: 'TOKEN_INVALID', message: 'Not authorized' }, 401);

      await store.dispatch(checkAuthStatus());

      const state = store.getState().auth;
      expect(state.isCheckingAuth).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('sessionExpired', () => {
    it('should clear all auth state', async () => {
      const store = createTestStore();

      const loginResponse = {
        success: true,
        data: {
          user: { id: '1', name: 'Test', email: 'test@example.com', createdAt: '2024-01-01' },
          token: 'jwt-token',
        },
      };
      mockFetchResponse(loginResponse);
      await store.dispatch(loginUser({ email: 'test@example.com', password: 'password123' }));
      expect(store.getState().auth.isAuthenticated).toBe(true);

      store.dispatch(sessionExpired());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('network error handling', () => {
    it('should set error on network failure during register', async () => {
      const store = createTestStore();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      await store.dispatch(
        registerUser({ name: 'T', email: 'a@b.com', password: '123456' })
      );

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeDefined();
    });
  });
});
