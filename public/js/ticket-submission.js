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
            // Get form data
            const formData = {
                employeeName: document.getElementById('employeeName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                serviceType: document.getElementById('serviceType').value,
                followUpContact: document.getElementById('followUpContact').value,
                issueDescription: document.getElementById('issueDescription').value,
                priority: document.getElementById('priority').value
            };
            
            // Validate required fields
            if (!formData.employeeName || !formData.email || !formData.phone || !formData.serviceType || !formData.issueDescription) {
                throw new Error('Please fill in all required fields');
            }
            
            console.log('Submitting form data:', formData);
            
            // Send data to server
            const response = await fetch('/api/submit-ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message
                alert('Ticket submitted successfully! We will contact you shortly.');
                ticketForm.reset();
            } else {
                // Show error message
                console.error('Server error:', result.error);
                alert(`Failed to submit ticket: ${result.message}\n\nPlease try again or contact support at cst@seamlessms.net`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Failed to submit ticket. Please try again or contact support at cst@seamlessms.net');
        } finally {
            // Re-enable submit button and restore original text
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Ticket';
        }
    });
}); 