const axios = require('axios');

// Helper function to get access token
async function getAccessToken() {
    try {
        const params = new URLSearchParams();
        params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
        params.append('client_id', process.env.ZOHO_CLIENT_ID);
        params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');
        params.append('scope', 'Desk.tickets.ALL,Desk.contacts.ALL,Desk.basic.ALL,Desk.search.READ,Desk.settings.ALL');

        console.log('Making OAuth request with:', {
            clientId: process.env.ZOHO_CLIENT_ID ? 'Set' : 'Not set',
            clientSecret: process.env.ZOHO_CLIENT_SECRET ? 'Set' : 'Not set',
            refreshToken: process.env.ZOHO_REFRESH_TOKEN ? 'Set' : 'Not set',
            departmentId: process.env.ZOHO_DEPARTMENT_ID,
            orgId: process.env.ZOHO_ORG_ID,
            requestedScopes: 'Desk.tickets.ALL,Desk.contacts.ALL,Desk.basic.ALL,Desk.search.READ,Desk.settings.ALL'
        });

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.data || !response.data.access_token) {
            console.error('Invalid token response:', response.data);
            throw new Error('Failed to get access token');
        }

        console.log('Token response:', {
            accessToken: response.data.access_token ? 'Received' : 'Missing',
            scope: response.data.scope,
            expiresIn: response.data.expires_in
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Token Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });
        throw new Error(`Failed to get access token: ${error.message}`);
    }
}

module.exports = async (req, res) => {
    try {
        // Get access token
        const accessToken = await getAccessToken();
        console.log('Got access token');

        // Create test contact
        const contactData = {
            lastName: 'Test',
            firstName: 'Vercel',
            email: 'test@example.com'
        };

        const contact = await axios.post('https://desk.zoho.com/api/v1/contacts', contactData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Created test contact:', contact.data);

        // Create test ticket
        const ticketData = {
            subject: 'Vercel Test Ticket',
            description: 'Testing Zoho API from Vercel deployment',
            departmentId: process.env.ZOHO_DEPARTMENT_ID,
            contactId: contact.data.id,
            email: 'test@example.com',
            priority: 'Medium',
            category: 'General Support',
            channel: 'Web',
            status: 'Open'
        };

        const ticket = await axios.post('https://desk.zoho.com/api/v1/tickets', ticketData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Created test ticket:', ticket.data);

        res.json({
            success: true,
            message: 'Test successful',
            contact: contact.data,
            ticket: ticket.data
        });
    } catch (error) {
        console.error('Test failed:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        res.status(500).json({
            success: false,
            error: error.response?.data || error.message,
            message: 'Test failed'
        });
    }
}; 