const puppeteer = require('puppeteer');

async function testFormSubmission() {
    console.log('Starting form submission test...');
    let browser;
    
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Enable more verbose logging
        page.on('console', msg => console.log('Browser console:', msg.text()));
        page.on('pageerror', err => console.error('Browser page error:', err));
        
        // Navigate to the form page
        console.log('Navigating to form page...');
        const response = await page.goto('https://www.seamlessms.net/ticket-submission.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        if (!response.ok()) {
            throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
        }
        
        // Fill out the form
        console.log('Filling out form...');
        await page.type('#employeeName', 'Test User');
        await page.type('#email', 'test@example.com');
        await page.type('#phone', '555-555-5555');
        await page.select('#serviceType', 'VoIP');
        await page.type('#followUpContact', 'Test Contact');
        await page.type('#issueDescription', 'This is a test ticket submission');
        await page.select('#priority', 'Medium');
        
        // Enable request interception to log network requests
        await page.setRequestInterception(true);
        page.on('request', request => {
            const data = request.postData();
            console.log(`Outgoing request: ${request.method()} ${request.url()}`);
            if (data) {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Request payload:', jsonData);
                } catch (e) {
                    console.log('Request data:', data);
                }
            }
            request.continue();
        });
        
        // Listen for network responses
        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/submit-ticket')) {
                const headers = response.headers();
                const status = response.status();
                console.log(`Response from ${url}:`, {
                    status,
                    headers
                });
                
                try {
                    const responseData = await response.json();
                    console.log('Response data:', responseData);
                    
                    if (!responseData.success && responseData.error) {
                        console.error('Server error:', responseData.error);
                    }
                } catch (e) {
                    console.log('Could not parse response as JSON:', e.message);
                    try {
                        const text = await response.text();
                        console.log('Response text:', text);
                    } catch (textError) {
                        console.log('Could not get response text:', textError.message);
                    }
                }
            }
        });
        
        // Submit the form and wait for the response
        console.log('Submitting form...');
        const [submitResponse] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/api/submit-ticket')),
            page.click('button[type="submit"]')
        ]);
        
        // Check response status
        if (!submitResponse.ok()) {
            throw new Error(`Form submission failed with status ${submitResponse.status()}`);
        }
        
        // Wait for any UI updates
        await page.evaluate(() => new Promise(resolve => {
            const maxAttempts = 10;
            let attempts = 0;
            
            function checkForAlerts() {
                const alerts = document.querySelectorAll('.alert');
                if (alerts.length > 0 || attempts >= maxAttempts) {
                    resolve();
                } else {
                    attempts++;
                    requestAnimationFrame(checkForAlerts);
                }
            }
            
            requestAnimationFrame(checkForAlerts);
        }));
        
        // Check for any error messages or success alerts
        const alertText = await page.evaluate(() => {
            const alerts = Array.from(document.querySelectorAll('.alert'));
            return alerts.map(alert => ({
                text: alert.textContent,
                type: alert.className
            }));
        });
        
        if (alertText.length > 0) {
            console.log('Alert messages found:', alertText);
        }
        
        console.log('Form submission test completed successfully');
        
    } catch (error) {
        console.error('Test failed:', error);
        if (error.response) {
            console.error('Error response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        }
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testFormSubmission()
    .then(() => {
        console.log('Test completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Test failed with error:', error);
        process.exit(1);
    }); 