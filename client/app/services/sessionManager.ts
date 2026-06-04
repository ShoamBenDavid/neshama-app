import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

type SessionExpiredListener = () => void;

let listeners: SessionExpiredListener[] = [];
let isHandlingExpiration = false;

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );

    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;

  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSec;
}

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export async function handleSessionExpired(): Promise<void> {
  if (isHandlingExpiration) return;
  isHandlingExpiration = true;

  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {}
    });
  } finally {
    isHandlingExpiration = false;
  }
}

export function resetExpirationGuard(): void {
  isHandlingExpiration = false;
}
