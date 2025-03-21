const axios = require('axios');
const logger = require('./logger');

// Zoho API configuration
const config = {
    baseURL: 'https://desk.zoho.com/api/v1',
    tokenURL: 'https://accounts.zoho.com/oauth/v2/token'
};

// Get access token using refresh token
async function getAccessToken() {
    try {
        // Check if we have a valid token in memory
        if (global.zohoAccessToken && global.zohoTokenExpiry && Date.now() < global.zohoTokenExpiry) {
            return global.zohoAccessToken;
        }

        // Get new token using form-urlencoded format
        const response = await axios.post(config.tokenURL, 
            `refresh_token=${process.env.ZOHO_REFRESH_TOKEN}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token&scope=Desk.tickets.CREATE,Desk.tickets.READ,Desk.tickets.UPDATE,Desk.contacts.CREATE,Desk.contacts.READ,Desk.contacts.UPDATE`,
            { 
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // Store token and expiry (subtract 5 minutes for safety)
        global.zohoAccessToken = response.data.access_token;
        global.zohoTokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

        return global.zohoAccessToken;
    } catch (error) {
        logger.error('Error getting Zoho access token:', error.message);
        if (error.response) {
            logger.error('Zoho token error details:', error.response.data);
            throw new Error(`Failed to get Zoho access token: ${error.response.data.message || error.message}`);
        }
        throw error;
    }
}

// Create a ticket in Zoho Desk
async function createZohoTicket(ticketData) {
    try {
        const accessToken = await getAccessToken();
        
        // Prepare ticket data with all required fields
        const requestData = {
            subject: ticketData.subject,
            description: ticketData.description,
            priority: ticketData.priority,
            category: ticketData.category, // Add category from service type
            departmentId: process.env.ZOHO_DEPARTMENT_ID,
            channel: 'Web', // Set channel explicitly
            status: 'Open', // Set status explicitly
            email: ticketData.email,
            contactId: ticketData.contactId,
            customFields: [
                {
                    value: ticketData.followUpContact,
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

        // Log the request data for debugging
        logger.info('Creating Zoho ticket with data:', requestData);

        // Create ticket
        const response = await axios.post(`${config.baseURL}/tickets`, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });

        logger.info('Created Zoho ticket:', {
            ticketId: response.data.id,
            subject: ticketData.subject
        });

        return response.data;
    } catch (error) {
        logger.error('Error creating Zoho ticket:', error.message);
        if (error.response) {
            logger.error('Zoho API error details:', error.response.data);
            throw new Error(`Failed to create Zoho ticket: ${error.response.data.message || error.message}`);
        }
        throw error;
    }
}

// Update ticket status
async function updateTicketStatus(ticketId, status) {
    try {
        const token = await getAccessToken();

        const response = await axios.patch(`${config.baseURL}/tickets/${ticketId}`, {
            status
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Zoho-oauthtoken ${token}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });

        logger.info('Updated Zoho ticket status:', {
            ticketId,
            status
        });

        return response.data;
    } catch (error) {
        logger.error('Error updating Zoho ticket status:', error.message);
        if (error.response) {
            logger.error('Zoho API error details:', error.response.data);
            throw new Error(`Failed to update ticket status: ${error.response.data.message || error.message}`);
        }
        throw error;
    }
}

// Add comment to ticket
async function addTicketComment(ticketId, comment, isPublic = true) {
    try {
        const token = await getAccessToken();

        const response = await axios.post(`${config.baseURL}/tickets/${ticketId}/comments`, {
            content: comment,
            isPublic
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Zoho-oauthtoken ${token}`,
                'orgId': process.env.ZOHO_ORG_ID
            }
        });

        logger.info('Added comment to Zoho ticket:', {
            ticketId,
            commentLength: comment.length,
            isPublic
        });

        return response.data;
    } catch (error) {
        logger.error('Error adding comment to Zoho ticket:', error.message);
        if (error.response) {
            logger.error('Zoho API error details:', error.response.data);
            throw new Error(`Failed to add comment: ${error.response.data.message || error.message}`);
        }
        throw error;
    }
}

module.exports = {
    createZohoTicket,
    updateTicketStatus,
    addTicketComment
}; 