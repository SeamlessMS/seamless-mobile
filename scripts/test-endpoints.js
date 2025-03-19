require('dotenv').config();
const axios = require('axios');

async function testTicketSubmission() {
  try {
    console.log('\nTesting Ticket Submission...');
    const response = await axios.post('http://localhost:3000/api/submit-ticket', {
      fullName: 'Test User',
      accountName: 'Test Company',
      email: 'test@example.com',
      phone: '3036426337',
      serviceType: 'voip',
      issueCategory: 'technical',
      priority: 'high',
      description: 'Test ticket submission',
      contactMethod: 'email',
      accountNumber: 'TEST123',
      usersAffected: '1',
      businessHours: '9 AM - 5 PM EST'
    });
    console.log('Ticket submission response:', response.data);
  } catch (error) {
    console.error('Ticket submission error:', error.response?.data || error.message);
  }
}

async function testAuthentication() {
  try {
    console.log('\nTesting Authentication...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });
    console.log('Authentication response:', response.data);
    return response.data.token;
  } catch (error) {
    console.error('Authentication error:', error.response?.data || error.message);
  }
}

async function testPayment(authToken) {
  try {
    console.log('\nTesting Payment...');
    const response = await axios.post('http://localhost:3002/api/payment/create-intent', {
      amount: 1000, // $10.00 in cents
      currency: 'usd',
      description: 'Test payment'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('Payment response:', response.data);
  } catch (error) {
    console.error('Payment error:', error.response?.data || error.message);
  }
}

async function main() {
  try {
    // Test ticket submission
    await testTicketSubmission();

    // Test authentication
    const token = await testAuthentication();

    // Test payment with auth token
    if (token) {
      await testPayment(token);
    }

  } catch (error) {
    console.error('Error in main:', error.message);
  }
}

main(); 