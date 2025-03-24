require('dotenv').config();
const { createTicket } = require('./submit-ticket');

module.exports = async (req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const {
            businessName,
            address,
            contactName,
            email,
            phone,
            currentServices,
            businessNeeds
        } = req.body;

        // Validate required fields
        if (!businessName || !contactName || !email || !phone) {
            res.status(400).json({
                error: 'Missing required fields'
            });
            return;
        }

        // Create a ticket using the existing ticket creation logic
        const ticketData = {
            employeeName: contactName,
            email: email,
            phone: phone,
            serviceType: 'Contact Form',
            followUpContact: businessName,
            issueDescription: `Business Contact Request\n\nBusiness Name: ${businessName}\nAddress: ${address}\nContact Name: ${contactName}\nCurrent Services: ${currentServices}\nBusiness Needs: ${businessNeeds}`,
            priority: 'Medium'
        };

        const result = await createTicket(ticketData);

        res.status(200).json({
            success: true,
            message: 'Contact request submitted successfully',
            ticketId: result.ticketId
        });
    } catch (error) {
        console.error('Error processing contact form submission:', error);
        res.status(500).json({
            error: 'Failed to process contact request'
        });
    }
}; 