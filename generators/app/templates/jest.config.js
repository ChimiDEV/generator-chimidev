// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  coverageDirectory: 'coverage',
  coverageReporters: ['text'],
  collectCoverageFrom: [
    './src/**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The root directory that Jest should scan for tests and modules within
  rootDir: 'test',
};
