jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  const multiRemoveFn = jest.fn((keys) => {
    keys.forEach((key) => delete store[key]);
    return Promise.resolve();
  });
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
        return Promise.resolve();
      }),
      // Both `multiRemove` (v1 API) and `removeMany` (v2 API alias) are exposed
      // so tests can reference whichever name they prefer.
      multiRemove: multiRemoveFn,
      removeMany: multiRemoveFn,
      clear: jest.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
        return Promise.resolve();
      }),
    },
  };
});

global.fetch = jest.fn();
global.__DEV__ = true;
