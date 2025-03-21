const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Helper function to get Zoho access token
async function getAccessToken() {
  const params = {
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    scope: 'Desk.tickets.READ,Desk.tickets.CREATE,Desk.tickets.UPDATE,Desk.contacts.READ,Desk.contacts.CREATE,Desk.settings.READ,Desk.basic.READ'
  };

  try {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token?grant_type=refresh_token', null, {
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create or get contact
async function getOrCreateContact(accessToken, email, firstName, lastName, phone) {
  try {
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
      return searchResponse.data.data[0];
    }

    // If no contact found, create new one
    const contactData = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      phone: phone
    };

    const createResponse = await axios.post('https://desk.zoho.com/api/v1/contacts', contactData, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    return createResponse.data;
  } catch (error) {
    console.error('Error with contact:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create ticket
async function createTicket(accessToken, ticketData) {
  try {
    const response = await axios.post('https://desk.zoho.com/api/v1/tickets', JSON.stringify(ticketData), {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating ticket:', error.response?.data || error.message);
    throw error;
  }
}

// Route to submit a ticket
router.post('/submit-ticket', async (req, res) => {
  try {
    const {
      employeeName,
      email,
      phone,
      serviceType,
      followUpContact,
      issueDescription,
      priority
    } = req.body;

    // Get access token
    const accessToken = await getAccessToken();

    // Split employee name into first and last name
    const [firstName = '', lastName = ''] = employeeName.split(' ');

    // Get or create contact
    const contact = await getOrCreateContact(accessToken, email, firstName, lastName, phone);

    // Create ticket data
    const ticketData = {
      subject: `${serviceType} Support Request - ${firstName} ${lastName}`,
      description: `Issue Description: ${issueDescription}\n\nFollow-up Contact: ${followUpContact}`,
      email: email,
      departmentId: process.env.ZOHO_DEPARTMENT_ID,
      contactId: contact.id,
      priority: priority
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
    console.error('Error submitting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit ticket',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router; 