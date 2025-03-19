const axios = require('axios');
require('dotenv').config();

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
        const contactResponse = await axios.post('https://desk.zoho.com/api/v1/contacts', {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            phone: '555-123-4567',
            type: 'Customer',
            description: 'Test contact for VoIP service',
            customFields: {
                'cf_company_name': 'Test Company',
                'cf_service_type': 'VoIP',
                'cf_account_status': 'Active'
            }
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Test contact created successfully!');
        console.log('Contact details:', contactResponse.data);
        return contactResponse.data;
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
        await createTestContact(auth);
    } catch (error) {
        console.error('Error in main:', error.message);
    }
}

main(); 