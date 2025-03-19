async function createComprehensiveTicket(auth, contactId, departmentId) {
  try {
    const response = await axios.post('https://desk.zoho.com/api/v1/tickets', {
      subject: 'VoIP Service Support Request',
      description: `Customer is experiencing issues with their VoIP service:
      
1. Unable to make outbound calls
2. Call quality issues with incoming calls
3. System shows "No Service" status

Customer Details:
- Contact: ${contactId}
- Service Type: VoIP
- Priority: High
- Impact: Business Operations
- Number of Users Affected: 25
- Business Hours: 9 AM - 5 PM EST
- Preferred Contact Method: Email
- Account Number: ACC-2024-001
- Service Plan: Business VoIP Premium

Technical Details:
- VoIP Provider: Seamless Mobile Services
- Number of Lines: 10
- Last Working: 2 hours ago
- Error Messages: "Connection Failed" on all devices

Please assist with troubleshooting and resolution.`,
      priority: 'High',
      status: 'Open',
      channel: 'Web',
      contactId: contactId,
      departmentId: departmentId,
      category: 'Technical Support',
      subCategory: 'VoIP Issues',
      customFields: {
        'cf_business_hours': '9 AM - 5 PM EST',
        'cf_users_affected': '25',
        'cf_account_number': 'ACC-2024-001',
        'cf_service_plan': 'Business VoIP Premium',
        'cf_preferred_contact': 'Email'
      }
    }, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json'
      }
    });

    console.log('Comprehensive ticket creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating comprehensive ticket:', error.response?.data || error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
}

async function main() {
  try {
    console.log('Getting access token...');
    const auth = await getAccessToken();

    console.log('Getting departments...');
    const departments = await getDepartments(auth);
    const departmentId = departments.data[0].id; // Use the first department

    console.log('Creating contact...');
    const contact = await createContact(auth);

    console.log('Creating comprehensive VoIP support ticket...');
    const ticket = await createComprehensiveTicket(auth, contact.id, departmentId);
    
    console.log('\nTicket created successfully!');
    console.log('Ticket ID:', ticket.id);
    console.log('Ticket Number:', ticket.ticketNumber);
    console.log('You can view the ticket in Zoho Desk at:', ticket.webUrl);
  } catch (error) {
    console.error('Error in main:', error.message);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
  }
} 