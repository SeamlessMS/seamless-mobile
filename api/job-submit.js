import axios from 'axios';
import { createTicket, getOrCreateContact } from './submit-ticket.js';

const VERSION = '1.0.0';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Window': '60'
};

// Helper function to send CORS response
function sendCorsResponse(res, statusCode, body) {
    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    // Set API version header
    res.setHeader('X-API-Version', VERSION);

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
    console.log('Job submission request:', {
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body
    });

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        sendCorsResponse(res, 204);
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        sendCorsResponse(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        const data = req.body;

        // Validate required fields
        const requiredFields = ['fullName', 'email', 'phone', 'position', 'experience', 'message'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            sendCorsResponse(res, 400, {
                error: 'Missing required fields',
                fields: missingFields
            });
            return;
        }

        // Create or get contact
        const contactData = {
            firstName: data.fullName.split(' ')[0] || 'Unknown',
            lastName: data.fullName.split(' ').slice(1).join(' ') || 'User',
            email: data.email,
            phone: data.phone,
            description: `Position Applied: ${data.position}\nExperience: ${data.experience}`
        };

        console.log('Creating/getting contact with data:', contactData);
        const contact = await getOrCreateContact(data.email, contactData);

        // Create ticket with job application details
        const ticketData = {
            employeeName: data.fullName,
            email: data.email,
            phone: data.phone,
            serviceType: 'Job Application',
            followUpContact: data.position,
            issueDescription: `
Position: ${data.position}
Experience: ${data.experience}

Why Interested:
${data.message}`,
            priority: 'Medium'
        };

        console.log('Creating ticket with data:', ticketData);
        const ticket = await createTicket(contact.id, ticketData);

        sendCorsResponse(res, 200, {
            success: true,
            message: 'Job application submitted successfully',
            ticketId: ticket.id,
            contactId: contact.id,
            version: VERSION
        });

    } catch (error) {
        console.error('Error processing job submission:', error);
        sendCorsResponse(res, 500, {
            error: 'Failed to process job application',
            details: error.message,
            version: VERSION
        });
    }
} 