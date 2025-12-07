export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^../lib/supabaseClient$': '<rootDir>/lib/supabaseClient',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/setupTests.ts'],
};
