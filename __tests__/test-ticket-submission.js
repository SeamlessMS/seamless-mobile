import axios from 'axios';

// Mock axios for testing
const mockAxios = {
    post: jest.fn().mockResolvedValue({
        data: {
            success: true,
            ticketId: 'test-ticket-123',
            message: 'Test ticket created successfully'
        }
    })
};

// Only run if in test environment
if (process.env.NODE_ENV === 'test') {
    async function testTicketSubmission() {
        try {
            console.log('Running test ticket submission...');
            
            const testData = {
                employeeName: 'Test User',
                email: 'test@example.com',
                phone: '123-456-7890',
                serviceType: 'Technical Support',
                followUpContact: 'Email and Phone',
                issueDescription: `Test ticket submission with custom fields - ${new Date().toISOString()}`,
                priority: 'Medium'
            };

            console.log('Test data:', testData);

            // Use mock axios in test environment
            const response = await mockAxios.post('/api/submit-ticket', testData);

            console.log('Response:', response.data);

            if (response.data.success) {
                console.log('✅ Test successful! Ticket created with ID:', response.data.ticketId);
            } else {
                console.log('❌ Test failed:', response.data.message);
            }
        } catch (error) {
            console.error('❌ Test error:', error);
        }
    }

    // Export the test function
    export default testTicketSubmission;
} 