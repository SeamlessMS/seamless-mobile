require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const app = express();

// Import routes
const ticketRoutes = require('./server/routes/tickets');

// Middleware
app.use(cors());  // Allow all origins during development
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Zoho Desk API configuration
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_DESK_URL = 'https://desk.zoho.com';
const ZOHO_DEPARTMENT_ID = process.env.ZOHO_DEPARTMENT_ID;

// Extract numeric org ID if URL-style format is provided
let ZOHO_ORG_ID = process.env.ZOHO_ORG_ID;
if (ZOHO_ORG_ID) {
    const match = ZOHO_ORG_ID.match(/\d+/);
    if (match) {
        ZOHO_ORG_ID = match[0];
    }
}

// Validate required environment variables
if (!ZOHO_CLIENT_ID) throw new Error('ZOHO_CLIENT_ID environment variable is required');
if (!ZOHO_CLIENT_SECRET) throw new Error('ZOHO_CLIENT_SECRET environment variable is required');
if (!ZOHO_REFRESH_TOKEN) throw new Error('ZOHO_REFRESH_TOKEN environment variable is required');
if (!ZOHO_DEPARTMENT_ID) throw new Error('ZOHO_DEPARTMENT_ID environment variable is required');
if (!ZOHO_ORG_ID) throw new Error('ZOHO_ORG_ID environment variable is required');

// Add at the top after imports
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'services.html'));
});

app.get('/ticket-submission', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ticket-submission.html'));
});

// Zoho Desk API functions
async function getAccessTokenFromRefreshToken() {
    // Validate environment variables first
    if (!process.env.ZOHO_CLIENT_ID) {
        throw new Error('ZOHO_CLIENT_ID is not set in environment variables');
    }
    if (!process.env.ZOHO_CLIENT_SECRET) {
        throw new Error('ZOHO_CLIENT_SECRET is not set in environment variables');
    }
    if (!process.env.ZOHO_REFRESH_TOKEN) {
        throw new Error('ZOHO_REFRESH_TOKEN is not set in environment variables');
    }

    try {
        console.log('Environment variables present:');
        console.log('- ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? 'Set' : 'Not set');
        console.log('- ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? 'Set' : 'Not set');
        console.log('- ZOHO_REFRESH_TOKEN:', process.env.ZOHO_REFRESH_TOKEN ? 'Set' : 'Not set');
        console.log('- ZOHO_DEPARTMENT_ID:', process.env.ZOHO_DEPARTMENT_ID ? 'Set' : 'Not set');

        const params = new URLSearchParams();
        params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
        params.append('client_id', process.env.ZOHO_CLIENT_ID);
        params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');

        console.log('Making OAuth request to:', 'https://accounts.zoho.com/oauth/v2/token');
        console.log('Request parameters:', {
            refresh_token: process.env.ZOHO_REFRESH_TOKEN.substring(0, 10) + '...',
            client_id: process.env.ZOHO_CLIENT_ID,
            grant_type: 'refresh_token'
        });

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        
        console.log('Zoho OAuth response:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data
        });

        if (!response.data) {
            throw new Error('No response data received from Zoho');
        }

        if (!response.data.access_token) {
            console.error('Invalid response from Zoho:', response.data);
            throw new Error('Access token not found in Zoho response: ' + JSON.stringify(response.data));
        }
        
        return response.data;
    } catch (error) {
        console.error('Detailed OAuth Error:', {
            message: error.message,
            response: {
                data: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                headers: error.response?.headers
            },
            config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers,
                data: error.config?.data
            }
        });

        // Handle specific error cases
        if (error.response?.data?.error === 'invalid_code') {
            throw new Error('The refresh token is invalid or expired. Please generate a new one.');
        } else if (error.response?.data?.error === 'invalid_client') {
            throw new Error('The client ID or secret is invalid. Please check your Zoho credentials.');
        } else if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please check your Zoho credentials.');
        }
        
        throw new Error('Failed to get access token: ' + (error.response?.data?.error_description || error.message));
    }
}

async function createContact(data, accessToken) {
    try {
        console.log('Creating contact with data:', data);
        // Extract name parts
        const nameParts = data.employeeName.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

        const contactData = {
            lastName: lastName,
            firstName: firstName,
            email: data.email,
            phone: data.phone
        };

        console.log('Sending contact data:', contactData);
        console.log('Using org ID:', ZOHO_ORG_ID);

        const response = await axios.post(`${ZOHO_DESK_URL}/api/v1/contacts`, contactData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });
        console.log('Contact creation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating contact:', error.response?.data || error.message);
        throw error;
    }
}

async function createTicket(data, contactId, accessToken) {
    try {
        const ticketData = {
            subject: `${data.serviceType} Support Request - ${data.employeeName}`,
            description: `Issue Description: ${data.issueDescription}\n\nFollow-up Contact: ${data.followUpContact}`,
            priority: data.priority,
            category: data.serviceType,
            departmentId: ZOHO_DEPARTMENT_ID,
            channel: 'Web',
            status: 'Open',
            email: data.email,
            contactId: contactId,
            customFields: [
                {
                    value: data.followUpContact,
                    cf: {
                        cfName: 'Follow-up Contact'
                    }
                },
                {
                    value: process.env.NODE_ENV,
                    cf: {
                        cfName: 'Environment'
                    }
                },
                {
                    value: process.env.SERVER_NAME || 'Unknown',
                    cf: {
                        cfName: 'Server'
                    }
                }
            ]
        };

        console.log('Creating Zoho ticket with data:', ticketData);

        const response = await axios.post(`${ZOHO_DESK_URL}/api/v1/tickets`, ticketData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Created Zoho ticket:', {
            ticketId: response.data.id,
            subject: ticketData.subject
        });

        return response.data;
    } catch (error) {
        console.error('Error creating Zoho ticket:', error.message);
        if (error.response) {
            console.error('Zoho API error details:', error.response.data);
            throw new Error(`Failed to create Zoho ticket: ${error.response.data.message || error.message}`);
        }
        throw error;
    }
}

// API endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Use ticket routes
app.use('/api', ticketRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Client ID length:', ZOHO_CLIENT_ID?.length);
    console.log('- Client Secret length:', ZOHO_CLIENT_SECRET?.length);
    console.log('- Refresh Token length:', ZOHO_REFRESH_TOKEN?.length);
    console.log('- Department ID:', ZOHO_DEPARTMENT_ID);
}); 