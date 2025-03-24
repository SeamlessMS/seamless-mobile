import axios from 'axios';

async function testContactForm() {
    try {
        const testData = {
            businessName: "Test Business",
            contactName: "John Doe",
            email: "test@example.com",
            phone: "555-123-4567"
        };

        console.log('Sending test contact form submission...');
        const response = await axios.post('https://seamless-mobile.vercel.app/api/contact/submit', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers
        });

        if (response.data.success) {
            console.log('✅ Contact form submission successful!');
            console.log('Ticket ID:', response.data.ticketId);
            console.log('Contact ID:', response.data.contactId);
        } else {
            console.error('❌ Contact form submission failed:', response.data);
        }
    } catch (error) {
        console.error('❌ Error testing contact form:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });
    }
}

// Run the test
testContactForm(); 