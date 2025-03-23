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
            option.insertBefore(icon, option.firstChild);
        }
    }

    ticketForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';
        
        try {
            // Create FormData object
            const formData = new FormData();
            
            // Add form fields
            formData.append('employeeName', document.getElementById('employeeName').value.trim());
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('phone', document.getElementById('phone').value.trim());
            formData.append('serviceType', document.getElementById('serviceType').value);
            formData.append('followUpContact', document.getElementById('followUpContact').value.trim());
            formData.append('issueDescription', document.getElementById('issueDescription').value.trim());
            formData.append('priority', document.getElementById('priority').value);

            // Add attachments if any
            const attachments = document.getElementById('attachments').files;
            for (let i = 0; i < attachments.length; i++) {
                formData.append('attachments', attachments[i]);
            }
            
            console.log('Submitting form data...');
            
            // Send data to server
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seamless-mobile.vercel.app/api/submit-ticket';
            console.log('Using API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            let result;
            try {
                result = await response.json();
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