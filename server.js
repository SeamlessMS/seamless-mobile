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
    try {
        const params = new URLSearchParams();
        params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
        params.append('client_id', process.env.ZOHO_CLIENT_ID);
        params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');
        params.append('scope', 'Desk.tickets.CREATE,Desk.contacts.CREATE,Desk.basic.READ');

        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        
        if (!response.data || !response.data.access_token) {
            throw new Error('Failed to get access token from Zoho');
        }
        
        return response.data;
    } catch (error) {
        console.error('OAuth Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error('Failed to authenticate with Zoho: ' + (error.response?.data?.error || error.message));
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
        const tokenData = await getAccessTokenFromRefreshToken();
        if (!tokenData || !tokenData.access_token) {
            throw new Error('Failed to get valid access token');
        }

        const accessToken = tokenData.access_token;
        
        // Create contact first
        const contactResponse = await axios.post(
            `${ZOHO_DESK_URL}/api/v1/contacts`,
            {
                lastName: req.body.name || 'Unknown',
                email: req.body.email,
                phone: req.body.phone
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': ZOHO_DEPARTMENT_ID
                }
            }
        );

        // Then create ticket
        const ticketResponse = await axios.post(
            `${ZOHO_DESK_URL}/api/v1/tickets`,
            {
                departmentId: ZOHO_DEPARTMENT_ID,
                contactId: contactResponse.data.id,
                subject: req.body.subject || 'New Support Request',
                description: req.body.description,
                priority: req.body.priority || 'Medium',
                status: 'Open',
                channel: 'Web'
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': ZOHO_DEPARTMENT_ID
                }
            }
        );

        res.json({ 
            success: true, 
            message: 'Ticket created successfully',
            ticketId: ticketResponse.data.id
        });
    } catch (error) {
        console.error('Ticket submission error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        res.status(error.response?.status || 500).json({
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