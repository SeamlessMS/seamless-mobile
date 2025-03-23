const axios = require('axios');

// Token cache for the serverless function
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

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

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check content type
    const contentType = req.headers['content-type'] || req.headers['Content-Type'];
    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
        return res.status(415).json({
            success: false,
            message: 'Unsupported media type',
            error: {
                errorCode: 'UNSUPPORTED_MEDIA_TYPE',
                message: 'The given content type is not supported. Please provide the input Content-Type as application/json'
            }
        });
    }

    try {
        console.log('Incoming request details:');
        console.log('Headers:', req.headers);
        console.log('Content-Type:', contentType);
        console.log('Body:', req.body);

        // Parse JSON body if it's a string
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid JSON format',
                    error: {
                        errorCode: 'INVALID_JSON',
                        message: 'The request body must be valid JSON'
                    }
                });
            }
        }

        // Ensure body is an object
        if (!body || typeof body !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request body',
                error: {
                    errorCode: 'INVALID_BODY',
                    message: 'The request body must be a valid JSON object'
                }
            });
        }

        const { employeeName, email, phone, serviceType, followUpContact, issueDescription, priority } = body;

        // Validate required fields
        if (!employeeName || !email || !issueDescription) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    errorCode: 'MISSING_FIELDS',
                    message: 'Please provide employeeName, email, and issueDescription'
                }
            });
        }

        // Get or create contact with retry logic
        let contact;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const [firstName, lastName] = employeeName.split(' ');
                contact = await getOrCreateContact(email, {
                    firstName,
                    lastName,
                    email,
                    phone
                });
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }

        if (!contact) {
            throw new Error('Failed to create contact');
        }

        // Create ticket with retry logic
        let ticket;
        retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                ticket = await createTicket(contact.id, {
                    employeeName,
                    email,
                    phone,
                    serviceType,
                    followUpContact,
                    issueDescription,
                    priority
                });
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }

        if (!ticket) {
            throw new Error('Failed to create ticket');
        }

        return res.status(200).json({
            success: true,
            ticketId: ticket.id
        });

    } catch (error) {
        console.error('Error in submit-ticket function:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to submit ticket',
            error: {
                errorCode: error.response?.data?.errorCode || 'INTERNAL_SERVER_ERROR',
                message: error.response?.data?.message || error.message
            }
        });
    }
}; 