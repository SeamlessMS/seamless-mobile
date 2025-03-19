const axios = require('axios');
const { resetMetrics } = require('./utils/monitoring');

// Test configuration
const BASE_URL = 'http://localhost:3000';

async function testAlerts() {
    console.log('Starting alert system tests...\n');

    try {
        // Test 1: High Error Rate Alert
        console.log('Test 1: Testing High Error Rate Alert');
        console.log('Making multiple requests to trigger error rate threshold...');
        
        // Make 10 requests with 2 errors (20% error rate)
        for (let i = 0; i < 10; i++) {
            try {
                await axios.get(`${BASE_URL}/api/nonexistent-endpoint`);
            } catch (error) {
                console.log(`Request ${i + 1} failed as expected`);
            }
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('High error rate alert should be triggered\n');

        // Test 2: Slow Response Time Alert
        console.log('Test 2: Testing Slow Response Time Alert');
        console.log('Making a request with artificial delay...');
        
        // Add a delay to the request
        try {
            await axios.get(`${BASE_URL}/api/submit-ticket`, {
                timeout: 2000, // 2 second timeout
                validateStatus: () => true // Don't throw on any status
            });
        } catch (error) {
            console.log('Request failed as expected with timeout');
        }
        console.log('Slow response time alert should be triggered\n');

        // Test 3: Rate Limit Breach Alert
        console.log('Test 3: Testing Rate Limit Breach Alert');
        console.log('Making multiple rapid requests to trigger rate limit...');
        
        // Make 6 rapid requests (exceeding the 5 per hour limit)
        for (let i = 0; i < 6; i++) {
            try {
                await axios.post(`${BASE_URL}/api/submit-ticket`, {
                    fullName: 'Test User',
                    email: 'test@example.com',
                    phone: '1234567890',
                    serviceType: 'Test Service',
                    issueCategory: 'Test Issue',
                    priority: 'Low',
                    description: 'Test Description'
                });
            } catch (error) {
                console.log(`Request ${i + 1} failed as expected`);
            }
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Rate limit breach alert should be triggered\n');

        console.log('All alert tests completed!');
        console.log('Please check your Zoho Desk for new monitoring tickets.');
        console.log('Note: There is a 15-minute cooldown between alerts of the same type.');

    } catch (error) {
        console.error('Error during alert testing:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

// Run the tests
testAlerts(); 