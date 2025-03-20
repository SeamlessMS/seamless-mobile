require('dotenv').config();
const axios = require('axios');

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const TEMP_GRANT_TOKEN = '1000.498130da5cf8ad53884e087f69744a6a.76a95ec78151a32e7dd5a521624d52c9';

async function getRefreshToken() {
    try {
        const params = new URLSearchParams();
        params.append('code', TEMP_GRANT_TOKEN);
        params.append('client_id', ZOHO_CLIENT_ID);
        params.append('client_secret', ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('scope', 'Desk.tickets.CREATE,Desk.contacts.CREATE,Desk.basic.READ');

        console.log('Requesting refresh token...');
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        
        console.log('\nSuccess! Here is your permanent refresh token:');
        console.log(response.data.refresh_token);
        console.log('\nMake sure to update this in your Vercel environment variables!');
        
    } catch (error) {
        console.error('Error getting refresh token:', error.response?.data || error.message);
    }
}

getRefreshToken(); 