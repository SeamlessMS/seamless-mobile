const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Token cache
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

// Helper function to get Zoho access token with caching
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

    console.log('Making OAuth request with:', {
      clientId: process.env.ZOHO_CLIENT_ID ? 'Set' : 'Not set',
      clientSecret: process.env.ZOHO_CLIENT_SECRET ? 'Set' : 'Not set',
      refreshToken: process.env.ZOHO_REFRESH_TOKEN ? 'Set' : 'Not set',
      departmentId: process.env.ZOHO_DEPARTMENT_ID,
      orgId: process.env.ZOHO_ORG_ID,
      attempt: retryCount + 1,
      maxRetries: maxRetries
    });

    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.data || !response.data.access_token) {
      console.error('Invalid token response:', response.data);
      throw new Error('Failed to get access token');
    }

    // Cache the token with expiration
    tokenCache = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in * 1000) - 300000 // Expire 5 minutes early
    };

    console.log('Token response:', {
      accessToken: response.data.access_token ? 'Received' : 'Missing',
      scope: response.data.scope,
      expiresIn: response.data.expires_in,
      expiresAt: new Date(tokenCache.expiresAt).toISOString()
    });

    return tokenCache.accessToken;
  } catch (error) {
    console.error('Token Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      attempt: retryCount + 1,
      maxRetries: maxRetries
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

// Helper function to create or get contact
const getOrCreateContact = async (email, contactData) => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // Create axios instance with default config
    const axiosInstance = axios.create({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID
      }
    });

    // First try to find existing contact
    const searchResponse = await axiosInstance.get('https://desk.zoho.com/api/v1/contacts/search', {
      params: {
        email: email
      }
    });

    if (searchResponse.data && searchResponse.data.data && searchResponse.data.data.length > 0) {
      console.log('Found existing contact:', searchResponse.data.data[0]);
      return searchResponse.data.data[0];
    }

    // If no contact found, create new one
    const createResponse = await axiosInstance.post('https://desk.zoho.com/api/v1/contacts', {
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone
    });

    console.log('Created new contact:', createResponse.data);
    return createResponse.data;

  } catch (error) {
    console.error('Error in getOrCreateContact:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
};

// Helper function to create ticket with retry logic
const createTicket = async (contactId, ticketData, retryCount = 0, maxRetries = 3) => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // Create axios instance with default config
    const axiosInstance = axios.create({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID
      }
    });

    // Log request details
    console.log('Creating ticket with data:', {
      contactId,
      departmentId: process.env.ZOHO_DEPARTMENT_ID,
      ticketData
    });

    const payload = {
      contactId: contactId,
      departmentId: process.env.ZOHO_DEPARTMENT_ID,
      subject: `${ticketData.serviceType} Support Request`,
      description: ticketData.issueDescription,
      priority: ticketData.priority,
      status: 'Open',
      customFields: [
        {
          name: 'Employee Name',
          value: ticketData.employeeName
        },
        {
          name: 'Phone Number',
          value: ticketData.phone
        },
        {
          name: 'Follow-up Contact',
          value: ticketData.followUpContact
        }
      ]
    };

    // Log the exact payload being sent
    console.log('Sending ticket payload:', JSON.stringify(payload, null, 2));

    const response = await axiosInstance.post('https://desk.zoho.com/api/v1/tickets', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      transformRequest: [(data) => JSON.stringify(data)]
    });

    console.log('Ticket creation response:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error creating ticket:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        headers: error.config?.headers,
        data: error.config?.data
      }
    });

    // Check if we should retry
    if (retryCount < maxRetries && 
        (error.response?.status === 400 || error.response?.status === 415)) {
      const delay = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
      console.log(`Retrying ticket creation after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return createTicket(contactId, ticketData, retryCount + 1, maxRetries);
    }

    throw error;
  }
}

// Route to submit a ticket
router.post('/submit-ticket', async (req, res) => {
  try {
    console.log('Incoming request details:');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Body:', req.body);

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
    console.error('Error in submit-ticket route:', error);
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

module.exports = router; 