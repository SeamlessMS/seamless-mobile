const { getAccessToken, getOrCreateContact, createTicket } = require('../server/routes/tickets');

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

  try {
    console.log('Incoming request details:');
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);

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