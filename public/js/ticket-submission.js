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
            // Get form values
            const employeeName = document.getElementById('employeeName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const serviceType = document.getElementById('serviceType').value;
            const followUpContact = document.getElementById('followUpContact').value.trim();
            const issueDescription = document.getElementById('issueDescription').value.trim();
            const priority = document.getElementById('priority').value;

            // Validate required fields
            if (!employeeName || !email || !issueDescription) {
                throw new Error('Please fill in all required fields: Employee Name, Email, and Issue Description');
            }

            // Format the data for the server
            const formData = {
                employeeName: employeeName,
                email: email,
                phone: phone,
                serviceType: serviceType,
                followUpContact: followUpContact,
                issueDescription: issueDescription,
                priority: priority
            };
            
            console.log('Submitting form data:', formData);
            
            // Send data to server
            const response = await fetch('/api/submit-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || result.error || 'Failed to submit ticket');
            }
            
            if (result.success) {
                // Show success message with ticket number
                const successMessage = `Ticket submitted successfully!\n\nTicket Number: ${result.ticketNumber}\n\nWe will contact you shortly.`;
                alert(successMessage);
                ticketForm.reset();
            } else {
                throw new Error(result.message || 'Failed to submit ticket');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message + '\n\nIf this issue persists, please contact support at cst@seamlessms.net');
        } finally {
            // Re-enable submit button and restore original text
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Ticket';
        }
    });
}); 