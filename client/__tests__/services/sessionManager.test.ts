// Restore the real sessionManager module – the global jest.setup.js mock is
// too broad and would break tests that exercise the actual implementation.
jest.unmock('../../app/services/sessionManager');

import {
  isTokenExpired,
  onSessionExpired,
  handleSessionExpired,
  resetExpirationGuard,
} from '../../app/services/sessionManager';

function createFakeJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${header}.${payloadStr}.fake-sig`;
}

beforeEach(() => {
  resetExpirationGuard();
});

describe('isTokenExpired', () => {
  it('should return false for a token with future exp', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = createFakeJwt({ id: '1', exp: futureExp });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('should return true for a token with past exp', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const token = createFakeJwt({ id: '1', exp: pastExp });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for a token without exp claim', () => {
    const token = createFakeJwt({ id: '1' });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for a malformed token', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
  });

  it('should return true for a token expiring exactly now', () => {
    const nowExp = Math.floor(Date.now() / 1000);
    const token = createFakeJwt({ id: '1', exp: nowExp });
    expect(isTokenExpired(token)).toBe(true);
  });
});

describe('onSessionExpired', () => {
  it('should call registered listeners on session expiration', async () => {
    const listener = jest.fn();
    onSessionExpired(listener);

    await handleSessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should return an unsubscribe function that removes the listener', async () => {
    const listener = jest.fn();
    const unsubscribe = onSessionExpired(listener);

    unsubscribe();
    await handleSessionExpired();

    expect(listener).not.toHaveBeenCalled();
  });

  it('should support multiple listeners', async () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    onSessionExpired(listener1);
    onSessionExpired(listener2);

    await handleSessionExpired();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });
});

describe('handleSessionExpired', () => {
  it('should prevent duplicate handling via guard', async () => {
    const listener = jest.fn();
    onSessionExpired(listener);

    const p1 = handleSessionExpired();
    const p2 = handleSessionExpired();
    await Promise.all([p1, p2]);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should allow re-handling after guard is reset', async () => {
    const listener = jest.fn();
    onSessionExpired(listener);

    await handleSessionExpired();
    expect(listener).toHaveBeenCalledTimes(1);

    resetExpirationGuard();
    await handleSessionExpired();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('should clear auth data from storage', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    await handleSessionExpired();

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'user_data']);
  });
});
