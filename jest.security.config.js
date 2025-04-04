module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.security.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    setupFiles: ['<rootDir>/jest.setup.js'],
    verbose: true,
    testTimeout: 10000
}; 