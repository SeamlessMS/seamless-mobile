const axios = require('axios');
require('dotenv').config();

async function getRefreshToken() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                code: '1000.591582f2f460ea0a47d1339efdf3a93c.2627111b83bd2b134f7496e03c224bff',
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'authorization_code'
            }
        });
        
        console.log('Refresh Token:', response.data.refresh_token);
        console.log('Access Token:', response.data.access_token);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

getRefreshToken(); 