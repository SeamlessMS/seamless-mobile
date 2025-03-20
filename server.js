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
        const params = new URLSearchParams();
        params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
        params.append('client_id', process.env.ZOHO_CLIENT_ID);
        params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');

        console.log('Making OAuth request with:');
        console.log('- Client ID:', process.env.ZOHO_CLIENT_ID);
        console.log('- Refresh Token:', process.env.ZOHO_REFRESH_TOKEN.substring(0, 10) + '...');

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        
        if (!response.data || !response.data.access_token) {
            console.error('Invalid response from Zoho:', response.data);
            throw new Error('Zoho did not return an access token');
        }
        
        return response.data;
    } catch (error) {
        // Log the full error for debugging
        console.error('Detailed OAuth Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
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
            departmentId: process.env.ZOHO_DEPARTMENT_ID,
            contactId: contactId,
            priority: data.priority,
            status: 'Open',
            channel: 'Web'
        };

        console.log('Sending ticket data:', ticketData);

        const response = await axios.post(`${ZOHO_DESK_URL}/api/v1/tickets`, ticketData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
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
        const tokenData = await getAccessTokenFromRefreshToken();
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
                    'orgId': process.env.ZOHO_DEPARTMENT_ID,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Contact created:', contactResponse.data);

        // Create ticket
        console.log('Creating ticket...');
        const ticketResponse = await axios.post(
            `${ZOHO_DESK_URL}/api/v1/tickets`,
            {
                departmentId: process.env.ZOHO_DEPARTMENT_ID,
                contactId: contactResponse.data.id,
                subject: `Support Request - ${req.body.serviceType || 'General'}`,
                description: `
Employee Name: ${req.body.employeeName}
Email: ${req.body.email}
Phone: ${req.body.phone || 'Not provided'}
Service Type: ${req.body.serviceType || 'Not specified'}
Follow-up Contact: ${req.body.followUpContact || 'Not provided'}

Issue Description:
${req.body.issueDescription}`,
                priority: req.body.priority || 'Medium',
                status: 'Open',
                channel: 'Web',
                classification: 'Request'
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': process.env.ZOHO_DEPARTMENT_ID,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Ticket created:', ticketResponse.data);

        res.json({
            success: true,
            message: 'Ticket created successfully',
            ticketId: ticketResponse.data.id
        });

    } catch (error) {
        console.error('Error in ticket submission:', error);
        
        // Check for specific error types
        if (error.response?.data) {
            console.error('API Error Response:', error.response.data);
        }

        // Send appropriate error response
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