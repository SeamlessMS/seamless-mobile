require('dotenv').config();
const axios = require('axios');

const ZOHO_CLIENT_ID = '1000.I9NDMDUJLLPL5B6E9BDRSVLT6VEIEB';
const ZOHO_CLIENT_SECRET = 'ede0306a021e87a94a2a219e663669c3cbfc882156';
const AUTH_CODE = '1000.c16e25ec596f18ae4f3c75b7ac71ed76.c29bfced9fe53c16afb1afbf7b1101a8';

const SCOPES = [
    'Desk.tickets.READ',
    'Desk.tickets.CREATE',
    'Desk.tickets.UPDATE',
    'Desk.contacts.READ',
    'Desk.contacts.CREATE'
].join(',');

async function getRefreshToken() {
    try {
        console.log('Getting refresh token...');
        console.log('Using client ID:', ZOHO_CLIENT_ID);
        console.log('Using auth code:', AUTH_CODE);
        
        const params = new URLSearchParams();
        params.append('code', AUTH_CODE);
        params.append('client_id', ZOHO_CLIENT_ID);
        params.append('client_secret', ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', 'https://www.seamlessms.net/callback');

        console.log('Making request to Zoho...');
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        
        console.log('\nRaw response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.error) {
            console.error('\nError from Zoho:', response.data.error);
            console.error('Error description:', response.data.error_description);
            return;
        }

        console.log('\nSuccess! Here are your tokens:');
        console.log('\nAccess Token:', response.data.access_token);
        console.log('\nRefresh Token:', response.data.refresh_token);
        console.log('\nExpires In:', response.data.expires_in);
        console.log('\nScope:', response.data.scope);
        
        console.log('\nPlease update your .env file with this new refresh token!');

    } catch (error) {
        console.error('\nDetailed error information:');
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.request) {
            console.error('Request made but no response received');
        }
    }
}

getRefreshToken(); 