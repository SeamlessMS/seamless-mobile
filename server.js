require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const app = express();

// Middleware
app.use(cors({
    origin: 'https://www.seamlessms.net'
}));
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

async function createContact(accessToken, contactData) {
    try {
        const response = await axios.post(`${ZOHO_DESK_URL}/api/v1/contacts`, {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            phone: contactData.phone,
            description: `Subject: ${contactData.subject}\n\n${contactData.description}`
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating contact:', error.response?.data || error.message);
        throw error;
    }
}

async function createTicket(accessToken, contactId, ticketData) {
    try {
        const response = await axios.post(`${ZOHO_DESK_URL}/api/v1/tickets`, {
            subject: ticketData.subject,
            description: ticketData.description,
            contactId: contactId,
            departmentId: ticketData.departmentId,
            category: ticketData.category,
            priority: ticketData.priority || 'Medium',
            status: 'Open',
            channel: 'Web'
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating ticket:', error.response?.data || error.message);
        throw error;
    }
}

// Endpoint to handle ticket submission
app.post('/api/submit-ticket', async (req, res) => {
    try {
        const formData = req.body;
        
        // Get access token
        const tokenResponse = await getAccessTokenFromRefreshToken();
        
        // Create contact
        const contact = await createContact(
            tokenResponse.access_token,
            formData
        );
        
        // Create ticket
        const ticket = await createTicket(
            tokenResponse.access_token,
            contact.id,
            formData
        );
        
        res.json({
            success: true,
            message: 'Ticket created successfully',
            ticketId: ticket.id
        });
    } catch (error) {
        console.error('Error processing ticket submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ticket',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 