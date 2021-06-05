module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(@hexlet/react-todo-app-with-backend)/)',
  ],
};
