document.addEventListener('DOMContentLoaded', function() {
    const ticketForm = document.getElementById('ticketForm');
    const submitButton = ticketForm.querySelector('button[type="submit"]');
    
    // Custom select with icons
    const serviceTypeSelect = document.getElementById('serviceType');
    const serviceOptions = serviceTypeSelect.options;
    
    // Add icons to service type options
    for (let option of serviceOptions) {
        if (option.value) {  // Only add icons to non-empty options
            const icon = document.createElement('img');
            icon.src = `images/${option.value.toLowerCase()}-logo.png`;
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
            
            // Send data to server
            const response = await fetch('https://seamless-mobile.vercel.app/api/submit-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            }).catch(error => {
                console.error('Network error:', error);
                throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
            });
            
            let result;
            try {
                result = await response.json();
                console.log('Server response:', result);
            } catch (jsonError) {
                console.error('Failed to parse response:', jsonError);
                throw new Error('Invalid response from server. Please try again later.');
            }
            
            if (!response.ok) {
                console.error('Server error:', result);
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
}); 