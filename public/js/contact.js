document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    
    // API endpoint configuration - Use relative URL
    const API_URL = '/api/contact/submit';
    
    console.log('API Endpoint:', API_URL);
    console.log('Current origin:', window.location.origin);
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form data before submission
        const formData = {
            businessName: document.getElementById('businessName').value.trim(),
            address: document.getElementById('address').value.trim(),
            contactName: document.getElementById('contactName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            currentServices: document.getElementById('currentServices').value.trim(),
            businessNeeds: document.getElementById('businessNeeds').value.trim()
        };

        // Basic validation
        if (!formData.businessName || !formData.contactName || !formData.email || !formData.phone) {
            alert('Please fill in all required fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';
        
        try {
            console.log('Submitting form data:', formData);
            console.log('Submitting to URL:', API_URL);
            
            // Send data to server
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                mode: 'cors',
                body: JSON.stringify(formData)
            }).catch(error => {
                console.error('Network error details:', {
                    message: error.message,
                    error: error,
                    url: API_URL,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Origin': window.location.origin
                    },
                    formData: formData
                });
                throw new Error('Unable to connect to the server. Please check your internet connection and try again. Error: ' + error.message);
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            let result;
            try {
                result = await response.json();
                console.log('Server response:', result);
            } catch (jsonError) {
                console.error('Failed to parse response:', {
                    error: jsonError,
                    responseText: await response.text()
                });
                throw new Error('Invalid response from server. Please try again later. Error: ' + jsonError.message);
            }
            
            if (!response.ok) {
                console.error('Server error:', {
                    status: response.status,
                    statusText: response.statusText,
                    result: result
                });
                let errorMessage = 'An error occurred while submitting your contact request. Please try again or contact us at cst@seamlessms.net.';
                
                if (result.error) {
                    if (typeof result.error === 'object') {
                        errorMessage = `Error: ${JSON.stringify(result.error)}. Please try again or contact us at cst@seamlessms.net`;
                    } else {
                        errorMessage = `Error: ${result.error}. Please try again or contact us at cst@seamlessms.net`;
                    }
                }
                
                alert(errorMessage);
                throw new Error(errorMessage);
            }
            
            if (result.success) {
                // Show success message
                const successMessage = 'Contact request submitted successfully!\n\nWe will contact you shortly.';
                alert(successMessage);
                contactForm.reset();
            } else {
                const errorMessage = result.message || 'Failed to submit contact request';
                console.error('Submission failed:', result);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                error: error
            });
            
            let errorMessage = 'An error occurred while submitting your contact request. Please try again or contact us at cst@seamlessms.net.';
            if (error.message) {
                errorMessage = `Error: ${error.message}. Please try again or contact us at cst@seamlessms.net`;
            } else if (error.error) {
                errorMessage = `Error: ${error.error}. Please try again or contact us at cst@seamlessms.net`;
            } else if (typeof error === 'object') {
                errorMessage = `Error: ${JSON.stringify(error)}. Please try again or contact us at cst@seamlessms.net`;
            } else {
                errorMessage = `Error: ${error.toString()}. Please try again or contact us at cst@seamlessms.net`;
            }
            
            alert(errorMessage);
        } finally {
            // Re-enable submit button and restore original text
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Contact Request';
        }
    });
}); 