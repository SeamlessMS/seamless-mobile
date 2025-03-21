const { getAccessToken, getOrCreateContact, createTicket } = require('../server/routes/tickets');

// Token cache for the serverless function
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check content type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
        return res.status(415).json({
            success: false,
            message: 'Unsupported media type',
            error: {
                errorCode: 'UNSUPPORTED_MEDIA_TYPE',
                message: 'The given content type is not supported. Please provide the input Content-Type as application/json'
            }
        });
    }

    try {
        console.log('Incoming request details:');
        console.log('Headers:', req.headers);
        console.log('Content-Type:', contentType);
        console.log('Body:', req.body);

        // Parse JSON body if it's a string
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid JSON format',
                    error: {
                        errorCode: 'INVALID_JSON',
                        message: 'The request body must be valid JSON'
                    }
                });
            }
        }

        const { employeeName, email, phone, serviceType, followUpContact, issueDescription, priority } = body;

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

        // Get or create contact with retry logic
        let contact;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const [firstName, lastName] = employeeName.split(' ');
                contact = await getOrCreateContact(email, {
                    firstName,
                    lastName,
                    email,
                    phone
                });
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }

        if (!contact) {
            throw new Error('Failed to create contact');
        }

        // Create ticket with retry logic
        let ticket;
        retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                ticket = await createTicket(contact.id, {
                    employeeName,
                    email,
                    phone,
                    serviceType,
                    followUpContact,
                    issueDescription,
                    priority
                });
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }

        if (!ticket) {
            throw new Error('Failed to create ticket');
        }

        return res.status(200).json({
            success: true,
            ticketId: ticket.id
        });

    } catch (error) {
        console.error('Error in submit-ticket function:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });

        return res.status(500).json({
            success: false,
            message: 'Failed to submit ticket',
            error: {
                errorCode: error.response?.data?.errorCode || 'INTERNAL_SERVER_ERROR',
                message: error.response?.data?.message || error.message
            }
        });
    }
}; 