import axios from 'axios';
import { getOrCreateContact, createTicket } from './submit-ticket.js';

// Re-export the getOrCreateContact function
export { getOrCreateContact };

// Version number for deployment tracking
const API_VERSION = '1.0.1';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',  // Allow all origins during development
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Api-Version',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': 'Content-Length, X-API-Version'
};

// Helper function to send CORS response
function sendCorsResponse(res, statusCode, body) {
    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Set API version header
    res.setHeader('X-API-Version', API_VERSION);

    // Set content type for JSON responses
    if (body) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    if (statusCode === 200 && !body) {
        // Handle OPTIONS request
        res.status(statusCode).end();
    } else {
        // Handle normal response with proper content type
        res.status(statusCode).json(body);
    }
}

export default async function handler(req, res) {
    // Log request details for debugging
    console.log('Request details:', {
        method: req.method,
        headers: req.headers,
        url: req.url,
        origin: req.headers.origin,
        body: req.body,
        env: {
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            hasOrgId: !!process.env.ZOHO_ORG_ID,
            hasDepartmentId: !!process.env.ZOHO_DEPARTMENT_ID,
            hasClientId: !!process.env.ZOHO_CLIENT_ID,
            hasClientSecret: !!process.env.ZOHO_CLIENT_SECRET,
            hasRefreshToken: !!process.env.ZOHO_REFRESH_TOKEN
        }
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        sendCorsResponse(res, 200);
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        sendCorsResponse(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        // Validate environment variables
        const requiredEnvVars = [
            'ZOHO_ORG_ID',
            'ZOHO_DEPARTMENT_ID',
            'ZOHO_CLIENT_ID',
            'ZOHO_CLIENT_SECRET',
            'ZOHO_REFRESH_TOKEN'
        ];

        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingEnvVars.length > 0) {
            console.error('Missing required environment variables:', missingEnvVars);
            sendCorsResponse(res, 500, { error: 'Server configuration error' });
            return;
        }

        // Validate required fields
        const { businessName, contactName, email, phone } = req.body;
        if (!businessName || !contactName || !email || !phone) {
            sendCorsResponse(res, 400, { 
                error: 'Missing required fields',
                details: {
                    businessName: !businessName,
                    contactName: !contactName,
                    email: !email,
                    phone: !phone
                }
            });
            return;
        }

        // Create or get contact
        const contactData = {
            firstName: contactName.trim().split(/\s+/)[0] || 'Unknown',
            lastName: contactName.trim().split(/\s+/).slice(1).join(' ') || 'User',
            email: email,
            phone: phone,
            description: `Business Name: ${businessName}`
        };

        console.log('Creating/getting contact with data:', {
            originalName: contactName,
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            phone: contactData.phone,
            description: contactData.description
        });
        const contact = await getOrCreateContact(email, contactData);
        console.log('Contact result:', contact);

        // Create ticket
        const ticketData = {
            employeeName: contactName,
            email: email,
            phone: phone,
            serviceType: 'General Inquiry',
            followUpContact: businessName,
            issueDescription: `Business: ${businessName}\nContact: ${contactName}\nEmail: ${email}\nPhone: ${phone}`,
            priority: 'Medium'
        };

        console.log('Creating ticket with data:', {
            employeeName: ticketData.employeeName,
            email: ticketData.email,
            phone: ticketData.phone,
            serviceType: ticketData.serviceType,
            followUpContact: ticketData.followUpContact,
            priority: ticketData.priority
        });
        const ticket = await createTicket(contact.id, ticketData);
        console.log('Ticket created:', ticket);

        // Send success response
        sendCorsResponse(res, 200, {
            success: true,
            message: 'Contact form submitted successfully',
            ticketId: ticket.id,
            contactId: contact.id
        });

    } catch (error) {
        console.error('Error processing contact form submission:', error);
        sendCorsResponse(res, 500, {
            error: 'Error processing contact form submission',
            message: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
} 