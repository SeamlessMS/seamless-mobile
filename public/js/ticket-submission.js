document.addEventListener('DOMContentLoaded', function() {
    const ticketForm = document.getElementById('ticketForm');
    const submitButton = ticketForm.querySelector('button[type="submit"]');
    
    // API endpoint configuration - Use relative URL
    const API_URL = '/api/submit-ticket';
    
    console.log('API Endpoint:', API_URL);
    console.log('Current origin:', window.location.origin);
    
    // Custom select with icons
    const serviceTypeSelect = document.getElementById('serviceType');
    const serviceOptions = serviceTypeSelect.options;
    
    // Add icons to service type options
    for (let option of serviceOptions) {
        if (option.value) {  // Only add icons to non-empty options
            const icon = document.createElement('img');
            icon.src = `images/services/${option.value.toLowerCase()}.png`;
            icon.alt = option.text;
            icon.className = 'service-icon me-2';
            icon.style.width = '20px';
            icon.style.height = '20px';
            // Add error handling for image loading
            icon.onerror = function() {
                this.style.display = 'none';
            };
            option.insertBefore(icon, option.firstChild);
        }
    }

    ticketForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate form data before submission
        const formData = {
            employeeName: document.getElementById('employeeName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            serviceType: document.getElementById('serviceType').value,
            followUpContact: document.getElementById('followUpContact').value.trim(),
            issueDescription: document.getElementById('issueDescription').value.trim(),
            priority: document.getElementById('priority').value
        };

        // Basic validation
        if (!formData.employeeName || !formData.email || !formData.phone || !formData.serviceType || 
            !formData.followUpContact || !formData.issueDescription) {
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
                let errorMessage = 'An error occurred while submitting your ticket.';
                
                if (result.error) {
                    if (typeof result.error === 'object') {
                        errorMessage = `Error: ${JSON.stringify(result.error)}`;
                    } else {
                        errorMessage = `Error: ${result.error}`;
                    }
                }
                
                alert(errorMessage);
                throw new Error(errorMessage);
            }
            
            if (result.success) {
                // Show success message with ticket number
                const successMessage = `Ticket submitted successfully!\n\nTicket ID: ${result.ticketId}\n\nWe will contact you shortly.`;
                alert(successMessage);
                ticketForm.reset();
            } else {
                const errorMessage = result.message || 'Failed to submit ticket';
                console.error('Submission failed:', result);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                error: error
            });
            
            let errorMessage = 'An error occurred while submitting your ticket.';
            if (error.message) {
                errorMessage = `Error: ${error.message}`;
            } else if (error.error) {
                errorMessage = `Error: ${error.error}`;
            } else if (typeof error === 'object') {
                errorMessage = `Error: ${JSON.stringify(error)}`;
            } else {
                errorMessage = `Error: ${error.toString()}`;
            }
            
            alert(errorMessage);
        } finally {
            // Re-enable submit button and restore original text
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Ticket';
        }
    });

    // Update service type dropdown icon
    document.getElementById('serviceType').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const iconPath = selectedOption.getAttribute('data-icon');
        if (iconPath) {
            this.style.backgroundImage = `url('../images/services/${iconPath}')`;
        } else {
            this.style.backgroundImage = 'none';
        }
    });
}); 