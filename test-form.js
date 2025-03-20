const puppeteer = require('puppeteer');

async function testTicketForm() {
    console.log('Starting form submission test...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    try {
        // Enable detailed logging
        page.on('console', msg => console.log('Browser Console:', msg.text()));
        page.on('pageerror', err => console.error('Page Error:', err.message));
        page.on('requestfailed', request => 
            console.log('Failed Request:', request.url(), request.failure().errorText)
        );
        page.on('response', response => {
            if (!response.ok()) {
                console.log(`Failed Response: ${response.url()} - Status: ${response.status()}`);
            }
        });

        // Navigate to form
        console.log('Navigating to form...');
        await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Fill out form
        console.log('Filling out form...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '1234567890');
        await page.select('#serviceType', 'Apple');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'Medium');

        // Submit form and wait for response
        console.log('Submitting form...');
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/submit-ticket'),
            { timeout: 30000 }
        );

        await page.evaluate(() => {
            const form = document.querySelector('form');
            const formData = {
                employeeName: document.querySelector('#employeeName').value,
                email: document.querySelector('#email').value,
                phone: document.querySelector('#phone').value,
                serviceType: document.querySelector('#serviceType').value,
                followUpContact: document.querySelector('#followUpContact').value,
                issueDescription: document.querySelector('#issueDescription').value,
                priority: document.querySelector('#priority').value
            };
            console.log('Submitting form data:', formData);
            form.submit();
        });

        // Wait for response and log result
        const response = await responsePromise;
        const responseData = await response.json().catch(e => ({ error: 'Failed to parse JSON response' }));
        
        console.log('Response status:', response.status());
        console.log('Response data:', responseData);

        if (!response.ok()) {
            throw new Error(`Server responded with status ${response.status()}: ${JSON.stringify(responseData)}`);
        }

        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the test
testTicketForm().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
}); 