require('dotenv').config();
const axios = require('axios');

// Constants for Zoho API
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';
const ZOHO_DESK_URL = 'https://desk.zoho.com';
const scope = 'Desk.tickets.READ Desk.tickets.CREATE Desk.tickets.UPDATE Desk.contacts.READ Desk.contacts.CREATE Desk.settings.READ Desk.basic.READ';

async function getAccessTokenFromRefreshToken() {
    const params = new URLSearchParams();
    params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
    params.append('client_id', process.env.ZOHO_CLIENT_ID);
    params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('scope', 'Desk.tickets.CREATE,Desk.contacts.CREATE');

    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        return response.data;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
    }
}

async function getOrganizations(accessToken, apiDomain) {
    console.log('Getting organizations...');
    try {
        const response = await axios.get(`${apiDomain}/desk/api/v1/organizations`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Zoho-oauthtoken ${accessToken}`
            }
        });
        console.log('Organizations response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error getting organizations:', error.response?.data || error.message);
        throw error;
    }
}

async function createContact(accessToken, contactData) {
    try {
        const response = await axios.post('https://desk.zoho.com/api/v1/contacts', {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            phone: contactData.phone,
            description: `Subject: ${contactData.subject}\n\n${contactData.description}`
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating contact:', error.response?.data || error.message);
        throw error;
    }
}

async function createTicket(accessToken, contactId, ticketData) {
    try {
        const response = await axios.post('https://desk.zoho.com/api/v1/tickets', {
            subject: ticketData.subject,
            description: ticketData.description,
            contactId: contactId,
            departmentId: ticketData.departmentId,
            category: ticketData.category,
            priority: ticketData.priority || 'Medium',
            status: 'Open',
            channel: 'Web'
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating ticket:', error.response?.data || error.message);
        throw error;
    }
}

async function test() {
    try {
        console.log('Starting Zoho Desk integration test...');
        
        // Test data
        const testData = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '555-555-5555',
            subject: 'Test Ticket',
            description: 'This is a test ticket created via API',
            category: 'Technical',
            priority: 'Medium',
            departmentId: process.env.ZOHO_DEPARTMENT_ID
        };

        // Get access token
        console.log('Getting access token...');
        const tokenResponse = await getAccessTokenFromRefreshToken();
        console.log('Successfully obtained access token');
        
        // Create contact
        console.log('Creating contact...');
        const contact = await createContact(tokenResponse.access_token, testData);
        console.log('Contact created successfully:', contact.id);
        
        // Create ticket
        console.log('Creating ticket...');
        const ticket = await createTicket(tokenResponse.access_token, contact.id, testData);
        console.log('Ticket created successfully:', ticket.id);
        
        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();