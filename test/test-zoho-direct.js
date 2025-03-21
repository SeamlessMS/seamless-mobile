const axios = require('axios');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'ZOHO_REFRESH_TOKEN',
  'ZOHO_CLIENT_ID',
  'ZOHO_CLIENT_SECRET',
  'ZOHO_ORG_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

const ZOHO_DESK_API = {
  baseURL: 'https://desk.zoho.com/api/v1',
  tokenURL: 'https://accounts.zoho.com/oauth/v2/token',
};

const getAccessToken = async () => {
  const params = {
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    scope: 'Desk.tickets.READ,Desk.tickets.CREATE,Desk.tickets.UPDATE,Desk.contacts.READ,Desk.contacts.CREATE,Desk.settings.READ,Desk.basic.READ'
  };

  console.log('Requesting token with params:', {
    refresh_token: params.refresh_token?.substring(0, 10) + '...',
    client_id: params.client_id?.substring(0, 10) + '...',
    client_secret: params.client_secret?.substring(0, 10) + '...',
    scope: params.scope
  });

  try {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token?grant_type=refresh_token', null, {
      params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Token response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
};

const getOrganizations = async (accessToken) => {
  if (!accessToken) {
    throw new Error('No access token provided');
  }
  console.log('Fetching organizations with token:', accessToken.substring(0, 10) + '...');
  
  try {
    const response = await axios.get('https://desk.zoho.com/api/v1/organizations', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID
      }
    });
    
    console.log('Organizations fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error response:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please check your credentials and token.');
    }
    throw error;
  }
};

const testToken = async (accessToken) => {
  try {
    if (!accessToken) {
      throw new Error('No access token provided');
    }

    console.log('Testing token with basic endpoint...');
    
    const response = await axios.get(`${ZOHO_DESK_API.baseURL}/tickets`, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Token test response:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('Token authentication failed. Token may be invalid or expired.');
      console.error('Error details:', error.response?.data || error.message);
    } else {
      console.error('Error testing token:', error.response?.data || error.message);
    }
    throw error;
  }
};

async function getDepartments(accessToken) {
  try {
    const response = await axios.get('https://desk.zoho.com/api/v1/departments', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error.response?.data || error.message);
    throw error;
  }
}

async function createContact(accessToken, email) {
  try {
    const contactData = {
      email: email,
      firstName: 'Test',
      lastName: 'User'
    };
    
    console.log('Creating contact with data:', contactData);
    
    const response = await axios.post('https://desk.zoho.com/api/v1/contacts', contactData, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Contact created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error.response?.data || error.message);
    throw error;
  }
}

async function createTicket() {
  try {
    console.log('Creating a test ticket...');
    
    // Get access token
    const tokenData = await getAccessToken();
    const accessToken = tokenData.access_token;
    
    // Get departments first
    console.log('Fetching departments...');
    const departmentsResponse = await getDepartments(accessToken);
    console.log('Available departments:', departmentsResponse);
    
    if (!departmentsResponse.data || !departmentsResponse.data.length) {
      throw new Error('No departments found');
    }
    
    // Use the first department's ID
    const departmentId = departmentsResponse.data[0].id;
    
    // Create contact first
    const email = 'test@example.com';
    const contactResponse = await createContact(accessToken, email);
    const contactId = contactResponse.id;
    
    // Create ticket data
    const ticketData = {
      subject: 'Test Ticket',
      description: 'This is a test ticket.',
      email: email,
      departmentId: departmentId,
      contactId: contactId
    };
    
    console.log('Creating ticket with data:', ticketData);
    console.log('Using organization ID:', process.env.ZOHO_ORG_ID);
    
    // Create ticket
    const response = await axios.post('https://desk.zoho.com/api/v1/tickets', ticketData, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Ticket created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

async function convertToRefreshToken(tempToken) {
  console.log('Converting temporary token to refresh token...');
  const params = {
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    code: tempToken,
    grant_type: 'authorization_code',
    scope: 'Desk.tickets.READ,Desk.tickets.CREATE,Desk.tickets.UPDATE,Desk.contacts.READ,Desk.contacts.CREATE,Desk.settings.READ,Desk.basic.READ'
  };

  try {
    const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: params
    });
    console.log('Refresh token response:', {
      refresh_token: response.data.refresh_token?.substring(0, 10) + '...',
      access_token: response.data.access_token?.substring(0, 10) + '...',
      expires_in: response.data.expires_in
    });
    return response.data;
  } catch (error) {
    console.error('Error converting to refresh token:', error.response?.data || error.message);
    throw new Error('Failed to convert temporary token to refresh token');
  }
}

async function main() {
  try {
    console.log('Creating a test ticket...');
    await createTicket();
  } catch (error) {
    console.error('Main error:', error);
    process.exit(1);
  }
}

main();