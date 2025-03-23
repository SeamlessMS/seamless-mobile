module.exports = {
    preset: 'jest-puppeteer',
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    testEnvironment: 'node',
    verbose: true,
    collectCoverageFrom: [
        'public/js/**/*.js',
        'api/**/*.js',
        '!**/node_modules/**',
        '!**/vendor/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    testTimeout: 30000
}; 