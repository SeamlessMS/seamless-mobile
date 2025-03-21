const axios = require('axios');
require('dotenv').config();

// Temporary access token
const TEMP_ACCESS_TOKEN = '1000.dbd3edddef00214add551675524426a6.85d6d9b2f225dc84f7ebad86b5bb52e0';

async function generateRefreshToken() {
    try {
        const params = new URLSearchParams();
        params.append('code', TEMP_ACCESS_TOKEN);
        params.append('client_id', process.env.ZOHO_CLIENT_ID);
        params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');

        console.log('Generating refresh token with:', {
            clientId: process.env.ZOHO_CLIENT_ID ? 'Set' : 'Not set',
            clientSecret: process.env.ZOHO_CLIENT_SECRET ? 'Set' : 'Not set',
            code: TEMP_ACCESS_TOKEN
        });

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.data || !response.data.refresh_token) {
            console.error('Invalid token response:', response.data);
            throw new Error('Failed to generate refresh token');
        }

        console.log('Refresh token generated successfully:', {
            refreshToken: response.data.refresh_token,
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
            scope: response.data.scope
        });

        return response.data.refresh_token;
    } catch (error) {
        console.error('Error generating refresh token:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
}

// If running from command line
if (require.main === module) {
    (async () => {
        try {
            console.log('Generating refresh token...');
            const refreshToken = await generateRefreshToken();
            console.log('Refresh token generated:', refreshToken);

            // Now use the refresh token to get a new access token
            const params = new URLSearchParams();
            params.append('refresh_token', refreshToken);
            params.append('client_id', process.env.ZOHO_CLIENT_ID);
            params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
            params.append('grant_type', 'refresh_token');

            const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const accessToken = tokenResponse.data.access_token;
            console.log('New access token generated:', accessToken);

            // Create test contact
            const contactData = {
                lastName: 'Test',
                firstName: 'API',
                email: 'test@example.com'
            };

            console.log('Creating test contact...');
            const contact = await axios.post('https://desk.zoho.com/api/v1/contacts', contactData, {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': process.env.ZOHO_ORG_ID,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Test contact created:', contact.data);

            // Create test ticket
            const ticketData = {
                subject: 'Test Ticket',
                description: 'Testing API connection',
                departmentId: process.env.ZOHO_DEPARTMENT_ID,
                contactId: contact.data.id,
                email: 'test@example.com',
                priority: 'Medium',
                category: 'General Support',
                channel: 'Web',
                status: 'Open'
            };

            console.log('Creating test ticket with data:', JSON.stringify(ticketData, null, 2));
            const ticket = await axios.post('https://desk.zoho.com/api/v1/tickets', ticketData, {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': process.env.ZOHO_ORG_ID,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Test ticket created successfully:', ticket.data);
        } catch (error) {
            console.error('Test failed:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        }
    })();
}

// Export for Vercel serverless function
module.exports = async (req, res) => {
    try {
        console.log('Using provided access token');

        const contactData = {
            lastName: 'Test',
            firstName: 'Vercel',
            email: 'test@example.com'
        };

        const contact = await axios.post('https://desk.zoho.com/api/v1/contacts', contactData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${TEMP_ACCESS_TOKEN}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Created test contact:', contact.data);

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
                'Authorization': `Zoho-oauthtoken ${TEMP_ACCESS_TOKEN}`,
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