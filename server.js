require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const app = express();

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
const ZOHO_ORG_ID = 'troutmobile';  // Your organization ID

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
            subject: `Support Request - ${data.serviceType}`,
            description: `
Employee Name: ${data.employeeName}
Email: ${data.email}
Phone: ${data.phone}
Service Type: ${data.serviceType}
Follow-up Contact: ${data.followUpContact}

Issue Description:
${data.issueDescription}`,
            departmentId: ZOHO_DEPARTMENT_ID,
            contactId: contactId,
            priority: data.priority,
            status: 'Open',
            channel: 'Web'
        };

        console.log('Sending ticket data:', ticketData);

        const response = await axios.post(`${ZOHO_DESK_URL}/api/v1/tickets`, ticketData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });
        console.log('Ticket creation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating ticket:', error.response?.data || error.message);
        throw error;
    }
}

// API endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/submit-ticket', async (req, res) => {
    try {
        console.log('Received ticket submission:', req.body);

        // Validate required fields
        if (!req.body.employeeName || !req.body.email || !req.body.issueDescription) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: employeeName, email, and issueDescription are required'
            });
        }

        // Get access token
        console.log('Getting access token...');
        const tokenData = await getAccessTokenFromRefreshToken();
        console.log('Access token received:', tokenData.access_token ? '✓' : '✗');
        const accessToken = tokenData.access_token;

        // Split name into first and last name
        const nameParts = req.body.employeeName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : req.body.employeeName;

        // Create contact
        console.log('Creating contact...');
        const contactResponse = await axios.post(
            `${ZOHO_DESK_URL}/api/v1/contacts`,
            {
                firstName: firstName,
                lastName: lastName,
                email: req.body.email,
                phone: req.body.phone || ''
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': ZOHO_ORG_ID,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Contact created:', contactResponse.data.id);

        // Create ticket
        console.log('Creating ticket...');
        const ticketResponse = await axios.post(
            `${ZOHO_DESK_URL}/api/v1/tickets`,
            {
                subject: `Support Request - ${req.body.serviceType}`,
                description: `
Employee Name: ${req.body.employeeName}
Email: ${req.body.email}
Phone: ${req.body.phone || 'Not provided'}
Service Type: ${req.body.serviceType}
Follow-up Contact: ${req.body.followUpContact || 'Not provided'}

Issue Description:
${req.body.issueDescription}`,
                departmentId: ZOHO_DEPARTMENT_ID,
                contactId: contactResponse.data.id,
                priority: req.body.priority || 'Medium',
                status: 'Open',
                channel: 'Web'
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': ZOHO_ORG_ID,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Ticket created:', ticketResponse.data.id);

        res.json({
            success: true,
            message: 'Ticket created successfully',
            ticketId: ticketResponse.data.id
        });

    } catch (error) {
        console.error('Detailed error in ticket submission:', {
            message: error.message,
            response: {
                data: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            },
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'Failed to create ticket: ' + (error.response?.data?.message || error.message)
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Client ID length:', ZOHO_CLIENT_ID?.length);
    console.log('- Client Secret length:', ZOHO_CLIENT_SECRET?.length);
    console.log('- Refresh Token length:', ZOHO_REFRESH_TOKEN?.length);
    console.log('- Department ID:', ZOHO_DEPARTMENT_ID);
}); 