require('dotenv').config();
const axios = require('axios');

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
    console.error('Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

async function getDepartments(auth) {
  try {
    const response = await axios.get('https://desk.zoho.com/api/v1/departments', {
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'orgId': process.env.ZOHO_ORG_ID
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting departments:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('Getting access token...');
    const auth = await getAccessToken();

    console.log('Getting departments...');
    const departments = await getDepartments(auth);
    
    console.log('\nDepartments:');
    console.log(JSON.stringify(departments, null, 2));
  } catch (error) {
    console.error('Error in main:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
  }
}

main(); 