const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Helper function to get Zoho access token
async function getAccessToken() {
  try {
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
      orgId: process.env.ZOHO_ORG_ID
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

    console.log('Token response:', {
      accessToken: response.data.access_token ? 'Received' : 'Missing',
      scope: response.data.scope,
      expiresIn: response.data.expires_in
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Token Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

// Helper function to create or get contact
async function getOrCreateContact(accessToken, email, firstName, lastName, phone) {
  try {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
    if (!email) {
      throw new Error('Email is required');
    }

    console.log('Searching for existing contact:', { email, firstName, lastName });

    // First try to find existing contact
    const searchResponse = await axios.get(`https://desk.zoho.com/api/v1/contacts/search`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID
      },
      params: {
        email: email
      }
    });

    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      console.log('Found existing contact:', {
        id: searchResponse.data.data[0].id,
        email: searchResponse.data.data[0].email
      });
      return searchResponse.data.data[0];
    }

    console.log('No existing contact found, creating new one');

    // If no contact found, create new one
    const contactData = {
      email: email,
      firstName: firstName || 'Unknown',
      lastName: lastName || 'User',
      phone: phone
    };

    console.log('Creating new contact with data:', contactData);

    const createResponse = await axios.post('https://desk.zoho.com/api/v1/contacts', contactData, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    console.log('Contact created successfully:', {
      id: createResponse.data.id,
      email: createResponse.data.email
    });

    return createResponse.data;
  } catch (error) {
    console.error('Error with contact:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    throw new Error(`Contact operation failed: ${error.response?.data?.message || error.message}`);
  }
}

// Helper function to create ticket
async function createTicket(accessToken, ticketData) {
  try {
    // Ensure all required fields are present
    const payload = {
      subject: ticketData.subject,
      description: ticketData.description,
      email: ticketData.email,
      departmentId: ticketData.departmentId,
      contactId: ticketData.contactId,
      priority: ticketData.priority || 'Medium',
      category: ticketData.category || 'General Support',
      channel: 'Web',
      status: 'Open',
      customFields: []
    };

    // Add custom fields if they exist
    if (ticketData.followUpContact) {
      payload.customFields.push({
        value: ticketData.followUpContact,
        cf: {
          cfName: 'Follow-up Contact'
        }
      });
    }

    console.log('Creating ticket with payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post('https://desk.zoho.com/api/v1/tickets', payload, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    console.log('Ticket created successfully:', {
      id: response.data.id,
      ticketNumber: response.data.ticketNumber
    });

    return response.data;
  } catch (error) {
    console.error('Error creating ticket:', {
      message: error.message,
      response: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: JSON.parse(error.config?.data || '{}')
      }
    });
    throw error;
  }
}

// Route to submit a ticket
router.post('/submit-ticket', async (req, res) => {
  try {
    // Log the incoming request for debugging
    console.log('Received ticket submission request:', {
      headers: req.headers,
      body: req.body,
      contentType: req.get('content-type')
    });

    // Validate request content type
    const contentType = req.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported Media Type',
        error: 'Request must be sent with Content-Type: application/json'
      });
    }

    const {
      employeeName,
      email,
      phone,
      serviceType,
      followUpContact,
      issueDescription,
      priority
    } = req.body;

    // Validate required fields
    if (!employeeName || !email || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'employeeName, email, and issueDescription are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'Please provide a valid email address'
      });
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Split employee name into first and last name
    const [firstName = '', lastName = ''] = employeeName.split(' ');

    // Log the request data for debugging
    console.log('Submitting ticket with data:', {
      employeeName,
      email,
      serviceType,
      issueDescription,
      priority,
      departmentId: process.env.ZOHO_DEPARTMENT_ID,
      orgId: process.env.ZOHO_ORG_ID
    });

    // Get or create contact
    const contact = await getOrCreateContact(accessToken, email, firstName, lastName, phone);

    // Create ticket data
    const ticketData = {
      subject: `${serviceType || 'General'} Support Request - ${firstName} ${lastName}`,
      description: `Issue Description: ${issueDescription}\n\nFollow-up Contact: ${followUpContact || 'Not provided'}`,
      email: email,
      departmentId: process.env.ZOHO_DEPARTMENT_ID,
      contactId: contact.id,
      priority: priority || 'Medium',
      category: serviceType || 'General Support',
      followUpContact: followUpContact
    };

    // Create ticket
    const ticket = await createTicket(accessToken, ticketData);

    res.json({
      success: true,
      message: 'Ticket submitted successfully',
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber
    });
  } catch (error) {
    console.error('Error submitting ticket:', {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit ticket',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router; 