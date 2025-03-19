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

async function createTestInvoice(auth) {
    try {
        // First, get a test contact
        const contactResponse = await axios.get('https://desk.zoho.com/api/v1/contacts/search', {
            params: {
                email: 'john.smith@example.com'
            },
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });

        if (!contactResponse.data.data || contactResponse.data.data.length === 0) {
            console.error('Test contact not found. Please create a contact first.');
            return;
        }

        const contact = contactResponse.data.data[0];

        // Create test invoice
        const invoiceResponse = await axios.post('https://desk.zoho.com/api/v1/invoices', {
            contactId: contact.id,
            invoiceNumber: `TEST-${Date.now()}`,
            date: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            status: 'Pending',
            amount: 99.99,
            description: 'Test Invoice for VoIP Service',
            items: [
                {
                    name: 'VoIP Service - Monthly',
                    quantity: 1,
                    rate: 99.99,
                    amount: 99.99
                }
            ],
            customFields: {
                'cf_service_type': 'VoIP',
                'cf_billing_cycle': 'Monthly'
            }
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Test invoice created successfully!');
        console.log('Invoice details:', invoiceResponse.data);
        console.log('You can view this invoice in the customer portal at:', invoiceResponse.data.webUrl);

        return invoiceResponse.data;
    } catch (error) {
        console.error('Error creating test invoice:', error.response?.data || error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log('Getting access token...');
        const auth = await getAccessToken();

        console.log('Creating test invoice...');
        await createTestInvoice(auth);
    } catch (error) {
        console.error('Error in main:', error.message);
    }
}

main(); 