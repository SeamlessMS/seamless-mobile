require('dotenv').config();
const axios = require('axios');

// Constants for Zoho API
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';

async function exchangeGrantToken(grantToken) {
    try {
        console.log('Exchanging grant token for access and refresh tokens...');
        const tokenUrl = `${ZOHO_ACCOUNTS_URL}/oauth/v2/token`;
        const params = {
            code: grantToken,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:3000/callback'
        };

        console.log('Token request params:', {
            ...params,
            client_secret: '***' // Hide secret in logs
        });
        
        const response = await axios.post(tokenUrl, null, { params });
        console.log('Token exchange response:', response.data);
        
        if (!response.data.access_token || !response.data.refresh_token) {
            throw new Error('Missing access_token or refresh_token in response');
        }

        console.log('\nSuccess! Here are your tokens:\n');
        console.log('Access Token:', response.data.access_token);
        console.log('Refresh Token:', response.data.refresh_token);
        console.log('\nUpdate your .env file with the new refresh token');
        
        return response.data;
    } catch (error) {
        console.error('Error exchanging grant token:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        throw error;
    }
}

// Get grant token from command line argument
const grantToken = process.argv[2];
if (!grantToken) {
    console.error('Please provide a grant token as a command line argument');
    console.error('Usage: node get-tokens.js <grant_token>');
    process.exit(1);
}

exchangeGrantToken(grantToken); 