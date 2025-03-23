const axios = require('axios');

// Version number for deployment tracking
const VERSION = '1.0.2';

// Token cache for the serverless function
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',  // Allow all origins during development
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Api-Version',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'Content-Length, X-API-Version'
};

// Helper function to send CORS response
function sendCorsResponse(res, statusCode, body) {
    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Set API version header
    res.setHeader('X-API-Version', VERSION);

    // Set content type for JSON responses
    if (body) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    if (statusCode === 200 && !body) {
        // Handle OPTIONS request
        res.status(statusCode).end();
    } else {
        // Handle normal response with proper content type
        res.status(statusCode).json(body);
    }
}

// Get access token function
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

// Get or create contact function
async function getOrCreateContact(email, contactData) {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }

        const axiosInstance = axios.create({
            baseURL: 'https://desk.zoho.com/api/v1',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        // Search for existing contact
        console.log('Searching for existing contact:', email);
        const searchResponse = await axiosInstance.get('/contacts/search', {
            params: {
                email: email
            }
        });

        if (searchResponse.data.data && searchResponse.data.data.length > 0) {
            console.log('Found existing contact:', searchResponse.data.data[0]);
            return searchResponse.data.data[0];
        }

        // Create new contact if not found
        console.log('Creating new contact:', contactData);
        const createResponse = await axiosInstance.post('/contacts', contactData);
        console.log('Created new contact:', createResponse.data);
        return createResponse.data;
    } catch (error) {
        console.error('Error in getOrCreateContact:', error);
        throw error;
    }
}

// Create ticket function
async function createTicket(contactId, ticketData) {
    try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }

        const axiosInstance = axios.create({
            baseURL: 'https://desk.zoho.com/api/v1',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        // Create a clean payload with only the required fields
        const payload = {
            subject: `${ticketData.serviceType || 'General'} Support Request - ${ticketData.employeeName}`,
            description: `Issue Description: ${ticketData.issueDescription || 'No description provided'}\n\nFollow-up Contact: ${ticketData.followUpContact || 'None provided'}`,
            email: ticketData.email,
            departmentId: process.env.ZOHO_DEPARTMENT_ID,
            contactId: contactId,
            priority: ticketData.priority || 'Medium',
            category: ticketData.serviceType || 'General Support',
            channel: 'Web',
            status: 'Open',
            phone: ticketData.phone || '',
            customFields: [
                {
                    name: 'cf_service_type',
                    value: ticketData.serviceType || 'General Support'
                },
                {
                    name: 'cf_follow_up_contact',
                    value: ticketData.followUpContact || 'None provided'
                }
            ]
        };

        console.log('Creating ticket with payload:', payload);
        const response = await axiosInstance.post('/tickets', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Ticket created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in createTicket:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    // Log request details for debugging
    console.log('Request details:', {
        method: req.method,
        headers: req.headers,
        url: req.url,
        origin: req.headers.origin,
        body: req.body,
        env: {
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            hasOrgId: !!process.env.ZOHO_ORG_ID,
            hasDepartmentId: !!process.env.ZOHO_DEPARTMENT_ID,
            hasClientId: !!process.env.ZOHO_CLIENT_ID,
            hasClientSecret: !!process.env.ZOHO_CLIENT_SECRET,
            hasRefreshToken: !!process.env.ZOHO_REFRESH_TOKEN
        }
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        sendCorsResponse(res, 200);
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        sendCorsResponse(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        // Validate environment variables
        const requiredEnvVars = [
            'ZOHO_ORG_ID',
            'ZOHO_DEPARTMENT_ID',
            'ZOHO_CLIENT_ID',
            'ZOHO_CLIENT_SECRET',
            'ZOHO_REFRESH_TOKEN'
        ];

        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingEnvVars.length > 0) {
            console.error('Missing required environment variables:', missingEnvVars);
            sendCorsResponse(res, 500, { error: 'Server configuration error' });
            return;
        }

        // Validate request body
        const { employeeName, email, phone, serviceType, followUpContact, issueDescription, priority } = req.body;
        if (!employeeName || !email || !phone || !serviceType || !followUpContact || !issueDescription) {
            sendCorsResponse(res, 400, { error: 'Missing required fields' });
            return;
        }

        // Create or get contact
        const contactData = {
            firstName: employeeName.split(' ')[0],
            lastName: employeeName.split(' ').slice(1).join(' '),
            email: email,
            phone: phone
        };

        const contact = await getOrCreateContact(email, contactData);
        if (!contact || !contact.id) {
            throw new Error('Failed to create or get contact');
        }

        // Create ticket
        const ticket = await createTicket(contact.id, req.body);
        if (!ticket || !ticket.id) {
            throw new Error('Failed to create ticket');
        }

        sendCorsResponse(res, 200, {
            success: true,
            ticketId: ticket.id,
            message: 'Ticket created successfully'
        });
    } catch (error) {
        console.error('Error processing request:', error);
        sendCorsResponse(res, 500, {
            error: 'Internal server error',
            message: error.message
        });
    }
} 