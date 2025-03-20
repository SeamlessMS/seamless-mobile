const puppeteer = require('puppeteer');

async function testTicketForm() {
    console.log('Starting form submission test...');
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        // Navigate to the form
        console.log('Navigating to form...');
        await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Fill out the form
        console.log('Filling out form...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '1234567890');
        await page.select('#serviceType', 'Apple');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'Medium');

        // Enable console log in the page
        page.on('console', msg => console.log('Browser Console:', msg.text()));

        // Submit the form and wait for the response
        console.log('Submitting form...');
        const responsePromise = page.waitForResponse(response => 
            response.url().includes('/api/submit-ticket')
        );
        
        await page.click('button[type="submit"]');
        
        const response = await responsePromise;
        const responseData = await response.json();
        
        console.log('Response status:', response.status());
        console.log('Response data:', responseData);

        // Check for success
        if (responseData.success) {
            console.log('✅ Test passed: Ticket submitted successfully');
        } else {
            console.log('❌ Test failed: Server returned error');
            console.log('Error:', responseData.message);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    } finally {
        await browser.close();
    }
}

// First install puppeteer with: npm install puppeteer
testTicketForm(); 