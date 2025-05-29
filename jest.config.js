module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./tests/setup.js']
}; 