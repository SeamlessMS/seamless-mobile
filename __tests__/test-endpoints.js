import axios from 'axios';

const BASE_URL = 'https://seamless-mobile.vercel.app';

async function testContactSubmission() {
    try {
        const response = await axios.post(`${BASE_URL}/api/contact/submit`, {
            businessName: 'Test Company LLC',
            contactName: 'John Smith',
            email: 'test@example.com',
            phone: '720-555-0123'
        });
        console.log('Contact Submission Response:', response.data);
    } catch (error) {
        console.error('Contact Submission Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function testJobSubmission() {
    try {
        const response = await axios.post(`${BASE_URL}/api/job-submit`, {
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            phone: '720-555-0124',
            position: 'Software Engineer',
            experience: '3-5 years',
            message: 'I am interested in joining your team.'
        });
        console.log('Job Submission Response:', response.data);
    } catch (error) {
        console.error('Job Submission Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function runTests() {
    console.log('Testing Contact Submission...');
    await testContactSubmission();
    
    console.log('\nTesting Job Submission...');
    await testJobSubmission();
}

runTests(); 