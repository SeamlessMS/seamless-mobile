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
    const params = new URLSearchParams();
    params.append('refresh_token', ZOHO_REFRESH_TOKEN);
    params.append('client_id', ZOHO_CLIENT_ID);
    params.append('client_secret', ZOHO_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('scope', 'Desk.tickets.CREATE,Desk.contacts.CREATE');

    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);
        return response.data;
    } catch (error) {
        console.error('Error getting access token:', error.response?.data || error.message);
        throw error;
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
        
        // Basic validation
        if (!req.body.employeeName || !req.body.email || !req.body.phone || !req.body.serviceType || !req.body.issueDescription) {
            return res.status(400).json({
                success: false,
                message: 'Please fill in all required fields'
            });
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address'
            });
        }

        // Get access token
        const tokenResponse = await getAccessTokenFromRefreshToken();
        console.log('Got access token:', tokenResponse.access_token);
        
        // Create contact
        const contactResponse = await createContact(req.body, tokenResponse.access_token);
        console.log('Created contact:', contactResponse);
        
        // Create ticket
        const ticketResponse = await createTicket(req.body, contactResponse.id, tokenResponse.access_token);
        console.log('Created ticket:', ticketResponse);
        
        res.json({ success: true, ticketId: ticketResponse.id });
    } catch (error) {
        console.error('Error in ticket submission:', error);
        res.status(500).json({ 
            success: false, 
            message: error.response?.data?.message || error.message || 'Failed to submit ticket',
            error: error.response?.data || error.message
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
}); 