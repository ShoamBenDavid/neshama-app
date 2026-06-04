module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|@reduxjs|immer|reselect|redux|react-redux|react-native-svg|nativewind|react-native-css-interop)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native-css-interop$': '<rootDir>/__tests__/mocks/reactNativeCssInteropMock.js',
    '^react-native-css-interop/(.*)$': '<rootDir>/__tests__/mocks/reactNativeCssInteropMock.js',
  },
};
