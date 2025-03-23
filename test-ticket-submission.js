const axios = require('axios');

async function testTicketSubmission() {
    try {
        console.log('Sending test ticket submission...');
        
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

        const response = await axios.post('https://www.seamlessms.net/api/submit-ticket', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);

        if (response.data.success) {
            console.log('✅ Test successful! Ticket created with ID:', response.data.ticketId);
        } else {
            console.log('❌ Test failed:', response.data.message);
        }
    } catch (error) {
        console.error('❌ Test error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });
    }
}

console.log('Starting ticket submission test at:', new Date().toISOString());
testTicketSubmission(); 