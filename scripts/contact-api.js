const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to get Zoho access token
async function getZohoAccessToken() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Zoho access token:', error.response?.data || error.message);
        throw error;
    }
}

// Create contact in Zoho
async function createContact(accessToken, contactData) {
    try {
        const response = await axios.post(
            `https://desk.zoho.com/api/v1/contacts`,
            {
                firstName: contactData.contactName.split(' ')[0],
                lastName: contactData.contactName.split(' ').slice(1).join(' '),
                email: contactData.contactEmail,
                phone: contactData.contactPhone,
                title: contactData.contactTitle,
                companyName: contactData.businessName,
                address: contactData.businessAddress,
                description: `New lead from website contact form.\nBusiness Goals: ${contactData.goals}`
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': process.env.ZOHO_ORG_ID,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating contact in Zoho:', error.response?.data || error.message);
        throw error;
    }
}

// Create ticket in Zoho
async function createTicket(accessToken, ticketData, contactId) {
    try {
        const response = await axios.post(
            `https://desk.zoho.com/api/v1/tickets`,
            {
                subject: `New Lead: ${ticketData.businessName}`,
                description: `
Business Information:
- Company: ${ticketData.businessName}
- Address: ${ticketData.businessAddress}
- Contact: ${ticketData.contactName} (${ticketData.contactTitle})
- Email: ${ticketData.contactEmail}
- Phone: ${ticketData.contactPhone}

Current Services:
- Number of Lines: ${ticketData.phoneLines}
- Current Carriers:
  ${Object.entries(ticketData.carriers)
    .filter(([_, value]) => value)
    .map(([carrier]) => `  - ${carrier.toUpperCase()}`)
    .join('\n')}

Current Issues:
${ticketData.currentIssues}

Business Goals:
${ticketData.goals}
                `,
                contactId: contactId,
                departmentId: process.env.ZOHO_DEPARTMENT_ID,
                category: 'New Business',
                priority: 'High',
                status: 'New'
            },
            {
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'orgId': process.env.ZOHO_ORG_ID,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating ticket in Zoho:', error.response?.data || error.message);
        throw error;
    }
}

// Handle contact form submission
app.post('/api/contact/submit', async (req, res) => {
    try {
        const accessToken = await getZohoAccessToken();
        
        // Create contact in Zoho
        const contact = await createContact(accessToken, req.body);
        
        // Create ticket in Zoho
        await createTicket(accessToken, req.body, contact.id);
        
        res.status(200).json({ message: 'Form submitted successfully' });
    } catch (error) {
        console.error('Error processing form submission:', error);
        res.status(500).json({ error: 'Failed to process form submission' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Contact API server running on port ${PORT}`);
}); 