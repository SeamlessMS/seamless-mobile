import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only run tests if explicitly enabled
if (process.env.ENABLE_TESTS !== 'true') {
    console.log('Tests are disabled. Set ENABLE_TESTS=true to run tests.');
    process.exit(0);
}

// Import and run tests
const testFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.test.js') || file.startsWith('test-'))
    .filter(file => file !== 'run-tests.js');

console.log('Running tests...');
console.log('Test files found:', testFiles);

for (const file of testFiles) {
    console.log(`\nRunning tests from ${file}...`);
    try {
        const testModule = await import(join(__dirname, file));
        if (typeof testModule.default === 'function') {
            await testModule.default();
        }
    } catch (error) {
        console.error(`Error running tests from ${file}:`, error);
    }
}

console.log('\nAll tests completed.'); 