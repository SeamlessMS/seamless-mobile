const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testLiveTicketSubmission() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        protocolTimeout: 120000 // Increase timeout to 120 seconds
    });

    let page;
    try {
        page = await browser.newPage();
        
        // Enable request interception
        await page.setRequestInterception(true);
        page.on('request', request => {
            console.log('Request:', request.method(), request.url());
            request.continue();
        });
        page.on('response', response => {
            console.log('Response:', response.status(), response.url());
        });

        // Navigate to the live site
        console.log('Navigating to ticket submission page...');
        await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for the form to load
        console.log('Waiting for form to load...');
        await page.waitForSelector('form', { timeout: 10000 });

        // Fill in the form fields
        console.log('Filling in form fields...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '1234567890');
        await page.select('#serviceType', 'Apple');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'Medium');

        // Submit the form
        console.log('Submitting form...');
        await page.click('button[type="submit"]');

        // Wait for any response
        console.log('Waiting for response...');
        try {
            const response = await page.waitForResponse(
                response => response.url().includes('/api/submit-ticket'),
                { timeout: 30000 }
            );
            console.log('Got response:', response.status(), response.url());
            const responseData = await response.json();
            console.log('Response data:', JSON.stringify(responseData, null, 2));
        } catch (responseError) {
            console.log('No API response received, checking for success message...');
            // Wait for any success message or error message on the page
            await page.waitForTimeout(5000);
            
            // Check for success message
            const successMessage = await page.evaluate(() => {
                const messages = document.querySelectorAll('.alert, .success-message, .error-message');
                return Array.from(messages).map(msg => msg.textContent);
            });
            
            if (successMessage.length > 0) {
                console.log('Page messages:', successMessage);
            } else {
                console.log('No success/error messages found on page');
            }
        }

        // Wait a bit to see any success/error messages
        await page.waitForTimeout(2000);

        console.log('Test completed');
    } catch (error) {
        console.error('Test failed with error:', JSON.stringify(error, null, 2));
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code
        });

        // Take a screenshot on error if possible
        if (page) {
            try {
                await page.screenshot({
                    path: path.join(__dirname, 'screenshots', 'error.png'),
                    fullPage: true
                });
            } catch (screenshotError) {
                console.error('Failed to take error screenshot:', screenshotError.message);
            }
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

testLiveTicketSubmission(); 