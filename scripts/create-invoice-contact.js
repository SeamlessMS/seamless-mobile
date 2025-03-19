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

async function createInvoiceContact(auth) {
    try {
        const contactResponse = await axios.post('https://books.zoho.com/api/v3/contacts', {
            contact_name: 'John Smith',
            company_name: 'Test Company',
            email: 'john.smith@example.com',
            phone: '555-123-4567',
            contact_type: 'customer',
            billing_address: {
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zip: '12345',
                country: 'United States'
            },
            custom_fields: [
                {
                    label: 'Service Type',
                    value: 'VoIP'
                }
            ]
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'organization-id': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Test contact created successfully in Zoho Invoice!');
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

        console.log('Creating test contact in Zoho Invoice...');
        await createInvoiceContact(auth);
    } catch (error) {
        console.error('Error in main:', error.message);
    }
}

main(); 