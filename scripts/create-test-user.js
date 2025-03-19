require('dotenv').config();
const axios = require('axios');
const bcrypt = require('bcryptjs');

async function getAccessToken() {
  try {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestContact(auth) {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const response = await axios.post('https://desk.zoho.com/api/v1/contacts', {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '3036426337',
      description: 'Test user account',
      customFields: {
        cf_password: hashedPassword
      }
    }, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    console.log('Test contact created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating test contact:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('Getting access token...');
    const auth = await getAccessToken();

    console.log('Creating test contact...');
    const contact = await createTestContact(auth);
    
    console.log('\nTest user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: test123');
    console.log('Contact ID:', contact.id);
  } catch (error) {
    console.error('Error in main:', error.message);
  }
}

main(); 