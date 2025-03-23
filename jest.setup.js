// Increase timeout for all tests
jest.setTimeout(30000);

// Mock Stripe
global.Stripe = jest.fn(() => ({
    elements: jest.fn(() => ({
        create: jest.fn(() => ({
            mount: jest.fn(),
            unmount: jest.fn()
        }))
    })),
    createToken: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Mock console methods
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}; 