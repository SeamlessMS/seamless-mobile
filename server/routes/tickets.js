const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Token cache
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

// Get access token function
async function getAccessToken(retryCount = 0, maxRetries = 3) {
  try {
    // Check if we have a valid cached token
    if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
      console.log('Using cached access token');
      return tokenCache.accessToken;
    }

    console.log('Token cache miss or expired, fetching new token...');

    const params = new URLSearchParams();
    params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
    params.append('client_id', process.env.ZOHO_CLIENT_ID);
    params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');

    console.log('Getting access token...');
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Cache the token with expiration
    tokenCache = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in * 1000) - 300000 // Expire 5 minutes early
    };

    console.log('Access token response:', {
      status: response.status,
      hasAccessToken: !!response.data.access_token,
      scope: response.data.scope,
      expiresAt: new Date(tokenCache.expiresAt).toISOString()
    });

    return tokenCache.accessToken;
  } catch (error) {
    console.error('Error getting access token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Check if we should retry
    if (error.response?.status === 400 && 
        error.response?.data?.error === 'Access Denied' && 
        error.response?.data?.error_description?.includes('too many requests') &&
        retryCount < maxRetries) {
      
      // Calculate delay with exponential backoff (5s, 10s, 20s)
      const delay = Math.pow(2, retryCount) * 5000;
      console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return getAccessToken(retryCount + 1, maxRetries);
    }

    throw error;
  }
}

// Get or create contact function
async function getOrCreateContact(email, contactData) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    const axiosInstance = axios.create({
      baseURL: 'https://desk.zoho.com/api/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID
      }
    });

    // Search for existing contact
    console.log('Searching for existing contact:', email);
    const searchResponse = await axiosInstance.get('/contacts/search', {
      params: {
        email: email
      }
    });

    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      console.log('Found existing contact:', searchResponse.data.data[0]);
      return searchResponse.data.data[0];
    }

    // Create new contact if not found
    console.log('Creating new contact:', contactData);
    const createResponse = await axiosInstance.post('/contacts', contactData);
    console.log('Created new contact:', createResponse.data);
    return createResponse.data;
  } catch (error) {
    console.error('Error in getOrCreateContact:', error);
    throw error;
  }
}

// Create ticket function
async function createTicket(contactId, ticketData) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    const axiosInstance = axios.create({
      baseURL: 'https://desk.zoho.com/api/v1',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    // Create a clean payload with only the required fields
    const payload = {
      contactId: contactId,
      departmentId: process.env.ZOHO_DEPARTMENT_ID,
      subject: `${ticketData.serviceType} Support Request`,
      description: `
        Employee Name: ${ticketData.employeeName}
        Email: ${ticketData.email}
        Phone: ${ticketData.phone}
        Service Type: ${ticketData.serviceType}
        Follow-up Contact: ${ticketData.followUpContact}
        Issue Description: ${ticketData.issueDescription}
      `,
      priority: ticketData.priority || 'Medium',
      status: 'Open'
    };

    // Only add custom fields if they exist in Zoho Desk
    if (process.env.ZOHO_SERVICE_TYPE_FIELD_ID && process.env.ZOHO_FOLLOWUP_FIELD_ID) {
      payload.customFields = [
        {
          id: process.env.ZOHO_SERVICE_TYPE_FIELD_ID,
          value: ticketData.serviceType
        },
        {
          id: process.env.ZOHO_FOLLOWUP_FIELD_ID,
          value: ticketData.followUpContact
        }
      ];
    }

    console.log('Creating ticket with payload:', JSON.stringify(payload, null, 2));
    const response = await axiosInstance.post('/tickets', payload);
    console.log('Ticket created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in createTicket:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw error;
  }
}

// Route to submit a ticket
router.post('/submit-ticket', async (req, res) => {
  console.log('Incoming request details:');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Body:', req.body);
  
  try {
    console.log('Processing ticket submission...');
    const { employeeName, email, phone, serviceType, followUpContact, issueDescription, priority } = req.body;

    // Get or create contact
    const [firstName, lastName] = employeeName.split(' ');
    const contact = await getOrCreateContact(email, {
      firstName,
      lastName,
      email,
      phone
    });

    if (!contact) {
      throw new Error('Failed to create contact');
    }

    // Create ticket
    const ticket = await createTicket(contact.id, {
      employeeName,
      email,
      phone,
      serviceType,
      followUpContact,
      issueDescription,
      priority
    });

    if (!ticket) {
      throw new Error('Failed to create ticket');
    }

    res.json({
      success: true,
      ticketId: ticket.id
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });

    res.status(500).json({
      success: false,
      message: 'Failed to submit ticket',
      error: {
        errorCode: error.response?.data?.errorCode || 'INTERNAL_SERVER_ERROR',
        message: error.response?.data?.message || error.message
      }
    });
  }
});

// Export the functions
module.exports = {
    getAccessToken,
    getOrCreateContact,
    createTicket
}; 