const axios = require('axios');
const logger = require('./logger');

// Zoho API configuration
const ZOHO_API = {
    baseURL: 'https://desk.zoho.com/api/v1',
    tokenURL: 'https://accounts.zoho.com/oauth/v2/token'
};

let accessToken = null;
let tokenExpiry = null;

// Get access token using refresh token
async function getAccessToken() {
    try {
        // Check if we have a valid token
        if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
            return accessToken;
        }

        const response = await axios.post(ZOHO_API.tokenURL, null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);

        return accessToken;
    } catch (error) {
        logger.error('Failed to get Zoho access token:', error);
        throw new Error('Failed to get Zoho access token');
    }
}

// Create a ticket in Zoho Desk
async function createZohoTicket(ticketData) {
    try {
        const token = await getAccessToken();

        const requestData = {
            subject: ticketData.subject,
            description: ticketData.description,
            priority: ticketData.priority,
            category: ticketData.category,
            departmentId: process.env.ZOHO_DEPARTMENT_ID,
            channel: 'System',
            classification: 'System Alert',
            status: 'Open',
            email: process.env.ALERT_EMAIL || 'support@troutmobile.com',
            customFields: {
                cf_environment: process.env.NODE_ENV || 'development',
                cf_server_name: process.env.SERVER_NAME || 'Unknown Server',
                cf_alert_type: ticketData.category
            }
        };

        const response = await axios.post(`${ZOHO_API.baseURL}/tickets`, 
            JSON.stringify(requestData), 
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    'orgId': process.env.ZOHO_ORG_ID
                }
            }
        );

        logger.info('Created Zoho ticket:', {
            ticketId: response.data.id,
            subject: ticketData.subject
        });

        return response.data;
    } catch (error) {
        logger.error('Failed to create Zoho ticket:', error);
        throw new Error('Failed to create Zoho ticket');
    }
}

// Update ticket status
async function updateTicketStatus(ticketId, status) {
    try {
        const token = await getAccessToken();

        const response = await axios.patch(`${ZOHO_API.baseURL}/tickets/${ticketId}`, {
            status
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        logger.info('Updated ticket status:', {
            ticketId,
            status
        });

        return response.data;
    } catch (error) {
        logger.error('Failed to update ticket status:', error);
        throw new Error('Failed to update ticket status');
    }
}

// Add comment to ticket
async function addTicketComment(ticketId, comment, isPublic = false) {
    try {
        const token = await getAccessToken();

        const response = await axios.post(`${ZOHO_API.baseURL}/tickets/${ticketId}/comments`, {
            content: comment,
            isPublic
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`,
                'orgId': process.env.ZOHO_ORG_ID,
                'Content-Type': 'application/json'
            }
        });

        logger.info('Added comment to ticket:', {
            ticketId,
            isPublic
        });

        return response.data;
    } catch (error) {
        logger.error('Failed to add comment to ticket:', error);
        throw new Error('Failed to add comment to ticket');
    }
}

module.exports = {
    createZohoTicket,
    updateTicketStatus,
    addTicketComment
}; 