const axios = require('axios');
require('dotenv').config();

// Token cache
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

async function getAccessToken(retryCount = 0, maxRetries = 3) {
    try {
        // Check if we have a valid cached token
        if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
            console.log('Using cached access token');
            return tokenCache.accessToken;
        }

        console.log('Token cache miss or expired, fetching new token...');

        const params = new URLSearchParams();
        params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
        params.append('client_id', process.env.ZOHO_CLIENT_ID);
        params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');

        console.log('Getting access token...');
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Cache the token with expiration
        tokenCache = {
            accessToken: response.data.access_token,
            expiresAt: Date.now() + (response.data.expires_in * 1000) - 300000 // Expire 5 minutes early
        };

        console.log('Access token response:', {
            status: response.status,
            hasAccessToken: !!response.data.access_token,
            scope: response.data.scope,
            expiresAt: new Date(tokenCache.expiresAt).toISOString()
        });

        return tokenCache.accessToken;
    } catch (error) {
        console.error('Error getting access token:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        // Check if we should retry
        if (error.response?.status === 400 && 
            error.response?.data?.error === 'Access Denied' && 
            error.response?.data?.error_description?.includes('too many requests') &&
            retryCount < maxRetries) {
            
            // Calculate delay with exponential backoff (5s, 10s, 20s)
            const delay = Math.pow(2, retryCount) * 5000;
            console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return getAccessToken(retryCount + 1, maxRetries);
        }

        throw error;
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testTicketSubmission(retryCount = 0, maxRetries = 3) {
    try {
        // First get an access token
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }

        // Wait for 5 seconds before making the next request
        console.log('Waiting 5 seconds before submitting ticket...');
        await delay(5000);

        console.log('Testing ticket submission...');
        const data = {
            employeeName: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            serviceType: 'VoIP',
            followUpContact: 'Test Contact',
            issueDescription: 'Test issue',
            priority: 'Medium'
        };

        console.log('Sending request with data:', data);
        console.log('Content-Type:', 'application/json');

        const response = await axios.post('https://seamless-mobile11.vercel.app/api/submit-ticket', data, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 500; // Accept any status code less than 500
            }
        });

        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });

        // Check if we should retry
        if (error.response?.status === 400 && retryCount < maxRetries) {
            // Calculate delay with exponential backoff (5s, 10s, 20s)
            const delay = Math.pow(2, retryCount) * 5000;
            console.log(`Request failed. Retrying in ${delay/1000} seconds...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return testTicketSubmission(retryCount + 1, maxRetries);
        }

        throw error;
    }
}

// Add a delay before starting the test
console.log('Waiting 5 seconds before starting test...');
delay(5000).then(() => testTicketSubmission()); 