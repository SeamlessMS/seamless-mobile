require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { requestMonitor, errorMonitor, rateLimitMonitor, systemResourceMonitor } = require('./utils/monitoring');
const { APIError, errorHandler } = require('./utils/errorHandler');
const { securityHeaders, createRateLimiter, corsOptions, xss, hpp, mongoSanitize } = require('./utils/security');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Apply security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(xss());
app.use(hpp());
app.use(mongoSanitize());

// Apply monitoring middleware
app.use(requestMonitor);
app.use(rateLimitMonitor);

// Rate limiting
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
app.use(generalLimiter);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Helper function to get Zoho access token
async function getAccessToken() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });
        return response.data;
    } catch (error) {
        logger.error('Error getting access token:', error);
        throw new APIError('Failed to get Zoho access token', 500, error.response?.data);
    }
}

// Helper function to create contact in Zoho
async function createContact(auth, contactData) {
    try {
        const response = await axios.post('https://desk.zoho.com/api/v1/contacts', {
            firstName: contactData.fullName.split(' ')[0],
            lastName: contactData.fullName.split(' ').slice(1).join(' '),
            email: contactData.email,
            phone: contactData.phone,
            description: `Customer submitted ticket through web portal. Preferred contact method: ${contactData.contactMethod}`
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        logger.error('Error creating contact:', error);
        throw new APIError('Failed to create contact in Zoho', 500, error.response?.data);
    }
}

// Helper function to create ticket in Zoho
async function createTicket(auth, ticketData, contactId, departmentId) {
    try {
        const response = await axios.post('https://desk.zoho.com/api/v1/tickets', {
            subject: `${ticketData.serviceType} Support Request - ${ticketData.issueCategory}`,
            description: `Customer submitted ticket through web portal:

Service Details:
- Service Type: ${ticketData.serviceType}
- Account Number: ${ticketData.accountNumber}
- Users Affected: ${ticketData.usersAffected}
- Business Hours: ${ticketData.businessHours}

Issue Details:
- Category: ${ticketData.issueCategory}
- Priority: ${ticketData.priority}
- Description: ${ticketData.description}`,
            priority: ticketData.priority,
            status: 'Open',
            channel: 'Web',
            contactId: contactId,
            departmentId: departmentId,
            category: ticketData.issueCategory,
            customFields: {
                'cf_business_hours': ticketData.businessHours,
                'cf_users_affected': ticketData.usersAffected,
                'cf_account_number': ticketData.accountNumber,
                'cf_service_plan': ticketData.serviceType,
                'cf_preferred_contact': ticketData.contactMethod
            }
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        logger.error('Error creating ticket:', error);
        throw new APIError('Failed to create ticket in Zoho', 500, error.response?.data);
    }
}

// API endpoint to submit ticket
app.post('/api/submit-ticket', upload.array('attachments'), async (req, res, next) => {
    try {
        const ticketData = req.body;
        const attachments = req.files || [];

        // Validate required fields
        const requiredFields = ['fullName', 'email', 'phone', 'serviceType', 'issueCategory', 'priority', 'description'];
        const missingFields = requiredFields.filter(field => !ticketData[field]);
        if (missingFields.length > 0) {
            throw new APIError('Missing required fields', 400, { missingFields });
        }

        // Get Zoho access token
        const auth = await getAccessToken();

        // Get departments
        const departmentsResponse = await axios.get('https://desk.zoho.com/api/v1/departments', {
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });
        const departmentId = departmentsResponse.data.data[0].id;

        // Create contact
        const contact = await createContact(auth, ticketData);

        // Create ticket
        const ticket = await createTicket(auth, ticketData, contact.id, departmentId);

        // Handle attachments if any
        if (attachments.length > 0) {
            logger.info('Processing attachments:', attachments);
            // TODO: Implement attachment upload to Zoho
        }

        // Send confirmation email
        // TODO: Implement email sending

        logger.info('Ticket created successfully', { ticketId: ticket.id, contactId: contact.id });

        res.json({
            success: true,
            message: 'Ticket submitted successfully',
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            ticketUrl: ticket.webUrl
        });
    } catch (error) {
        next(error);
    }
});

// API endpoint to get ticket status
app.get('/api/ticket-status/:ticketId', async (req, res, next) => {
    try {
        const auth = await getAccessToken();
        const response = await axios.get(`https://desk.zoho.com/api/v1/tickets/${req.params.ticketId}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });
        res.json(response.data);
    } catch (error) {
        next(error);
    }
});

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Apply error handling middleware
app.use(errorMonitor);
app.use(errorHandler);

// Start system resource monitoring
setInterval(systemResourceMonitor, 60000); // Check every minute

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
}); 