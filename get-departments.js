const axios = require('axios');
require('dotenv').config();

async function getDepartments() {
    try {
        // First get an access token
        const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Now get departments using the US domain
        const response = await axios.get('https://desk.zoho.com/api/v1/departments', {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': 'troutmobile',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Full Response:', response.data);
        
        if (response.data && response.data.data) {
            response.data.data.forEach(dept => {
                console.log(`Department: ${dept.name}`);
                console.log(`ID: ${dept.id}`);
                console.log('---');
            });
        }
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

getDepartments(); 