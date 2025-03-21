const express = require('express');
const router = express.Router();
const { getAccessToken, getOrCreateContact, createTicket } = require('./tickets');

// Submit ticket route
router.post('/submit-ticket', async (req, res) => {
    try {
        console.log('Received ticket submission:', req.body);

        const { employeeName, email, phone, serviceType, followUpContact, issueDescription, priority } = req.body;

        // Validate required fields
        if (!employeeName || !email || !issueDescription) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    errorCode: 'MISSING_FIELDS',
                    message: 'Please provide employeeName, email, and issueDescription'
                }
            });
        }

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
        console.error('Error submitting ticket:', error);
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