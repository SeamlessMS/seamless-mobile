const axios = require('axios');
require('dotenv').config();

async function testTicketSubmission() {
    try {
        // Verify environment variables
        console.log('Checking environment variables...');
        console.log('ZOHO_ORG_ID:', process.env.ZOHO_ORG_ID);
        console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID);
        console.log('ZOHO_REFRESH_TOKEN:', process.env.ZOHO_REFRESH_TOKEN ? 'Present' : 'Missing');

        // First get an access token
        console.log('\nGetting access token...');
        const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });

        const accessToken = tokenResponse.data.access_token;
        console.log('Access token obtained successfully');

        // Create a minimal ticket
        console.log('\nCreating test ticket...');
        const ticketData = {
            subject: 'Test Ticket',
            description: 'This is a test ticket',
            departmentId: '1097773000000006907',
            channel: 'Web'
        };

        console.log('Sending ticket data:', JSON.stringify(ticketData, null, 2));

        const response = await axios({
            method: 'post',
            url: 'https://desk.zoho.com/api/v1/tickets',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            },
            data: ticketData
        });

        console.log('Test ticket created successfully!');
        console.log('Ticket ID:', response.data.id);
        console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testTicketSubmission();