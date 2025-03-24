import axios from 'axios';
import { createTicket, getOrCreateContact } from './submit-ticket.js';

const VERSION = '1.0.0';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

// Helper function to send CORS response
function sendCorsResponse(statusCode, body) {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body)
    };
}

export const handler = async (event) => {
    console.log('Job submission request:', {
        method: event.httpMethod,
        path: event.path,
        headers: event.headers,
        body: event.body
    });

    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return sendCorsResponse(204, {});
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return sendCorsResponse(405, { error: 'Method not allowed' });
    }

    try {
        const data = JSON.parse(event.body);

        // Validate required fields
        const requiredFields = ['fullName', 'email', 'phone', 'position', 'experience', 'message'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            return sendCorsResponse(400, {
                error: 'Missing required fields',
                fields: missingFields
            });
        }

        // Create or get contact
        const contact = await getOrCreateContact({
            firstName: data.fullName.split(' ')[0],
            lastName: data.fullName.split(' ').slice(1).join(' '),
            email: data.email,
            phone: data.phone
        });

        // Create ticket with job application details
        const ticket = await createTicket({
            subject: `Job Application: ${data.position}`,
            description: `
                New Job Application Received:
                
                Position: ${data.position}
                Experience: ${data.experience} years
                
                Applicant Information:
                Name: ${data.fullName}
                Email: ${data.email}
                Phone: ${data.phone}
                
                Why Interested:
                ${data.message}
            `,
            priority: 'Medium',
            contactId: contact.id,
            department: 'General',
            category: 'Career Opportunity'
        });

        return sendCorsResponse(200, {
            success: true,
            message: 'Job application submitted successfully',
            ticketId: ticket.id,
            contactId: contact.id,
            version: VERSION
        });

    } catch (error) {
        console.error('Error processing job submission:', error);
        return sendCorsResponse(500, {
            error: 'Failed to process job application',
            details: error.message,
            version: VERSION
        });
    }
}; 