require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Import routes
const ticketRoutes = require('./server/routes/tickets');

// Middleware
app.use(cors());  // Allow all origins during development

// Configure JSON parsing middleware
app.use(express.json({ limit: '10mb' }));

// Configure URL-encoded body parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
    console.log('=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Working Directory:', process.cwd());
    console.log('__dirname:', __dirname);
    console.log('========================');
    next();
});

// Configure static file serving with absolute path and logging
const publicPath = path.join(__dirname, 'public');
console.log('Static files will be served from:', publicPath);

// Static file middleware with custom logging
app.use(express.static(publicPath, {
    setHeaders: (res, filePath) => {
        // Set caching headers for static files
        if (filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        if (filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        if (filePath.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Add a specific route for ticket-submission.js to debug any issues
app.get('/js/ticket-submission.js', (req, res, next) => {
    const jsPath = path.join(publicPath, 'js', 'ticket-submission.js');
    console.log('Attempting to serve ticket-submission.js from:', jsPath);
    
    // Check if file exists
    if (fs.existsSync(jsPath)) {
        console.log('ticket-submission.js found at path');
        res.sendFile(jsPath);
    } else {
        console.error('ticket-submission.js not found at path:', jsPath);
        res.status(404).send('File not found');
    }
});

// Mount routes
app.use('/api', ticketRoutes);

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
        // Ensure all required fields are present and properly formatted
        const ticketData = {
            subject: `${data.serviceType || 'General'} Support Request - ${data.employeeName}`.trim(),
            description: `Issue Description: ${data.issueDescription || 'No description provided'}\n\nFollow-up Contact: ${data.followUpContact || 'None provided'}`.trim(),
            email: data.email,
            departmentId: ZOHO_DEPARTMENT_ID,
            contactId: contactId,
            priority: data.priority || 'Medium',
            category: data.serviceType || 'General Support', // Ensure this matches a valid Zoho category
            channel: 'Web',
            status: 'Open',
            phone: data.phone || '',
            customFields: []
        };

        // Only add custom fields if they have values
        if (data.followUpContact) {
            ticketData.customFields.push({
                value: data.followUpContact,
                cf: {
                    cfName: 'Follow-up Contact'
                }
            });
        }

        if (process.env.NODE_ENV) {
            ticketData.customFields.push({
                value: process.env.NODE_ENV,
                cf: {
                    cfName: 'Environment'
                }
            });
        }

        if (process.env.SERVER_NAME) {
            ticketData.customFields.push({
                value: process.env.SERVER_NAME,
                cf: {
                    cfName: 'Server'
                }
            });
        }

        console.log('Creating Zoho ticket with data:', JSON.stringify(ticketData, null, 2));

        const response = await axios.post(`${ZOHO_DESK_URL}/api/v1/tickets`, ticketData, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        console.log('Zoho API Response:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data
        });

        return response.data;
    } catch (error) {
        console.error('Error creating Zoho ticket:', {
            message: error.message,
            response: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers,
                data: JSON.parse(error.config?.data || '{}')
            }
        });
        
        if (error.response?.data) {
            throw new Error(`Zoho API Error: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

// API endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Handle 404s
app.use((req, res) => {
    console.log('404 Not Found:', req.path);
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// Only start the server if we're not in a serverless environment
if (process.env.VERCEL_ENV === undefined) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment variables status:');
    console.log('ZOHO_CLIENT_ID:', process.env.ZOHO_CLIENT_ID ? 'Set' : 'Not set');
    console.log('ZOHO_CLIENT_SECRET:', process.env.ZOHO_CLIENT_SECRET ? 'Set' : 'Not set');
    console.log('ZOHO_REFRESH_TOKEN:', process.env.ZOHO_REFRESH_TOKEN ? 'Set' : 'Not set');
    console.log('ZOHO_ORG_ID:', process.env.ZOHO_ORG_ID ? 'Set' : 'Not set');
    console.log('ZOHO_DEPARTMENT_ID:', process.env.ZOHO_DEPARTMENT_ID ? 'Set' : 'Not set');
  });
}

// Export the app for Vercel
module.exports = app; 