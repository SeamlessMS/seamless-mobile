document.addEventListener('DOMContentLoaded', function() {
    const ticketForm = document.getElementById('ticketForm');
    const submitButton = ticketForm.querySelector('button[type="submit"]');
    
    // Custom select with icons
    const serviceTypeSelect = document.getElementById('serviceType');
    const serviceOptions = serviceTypeSelect.options;
    
    // Add icons to service type options
    for (let option of serviceOptions) {
        const icon = document.createElement('img');
        icon.src = `images/${option.value}-logo.png`;
        icon.alt = option.text;
        icon.className = 'service-icon me-2';
        icon.style.width = '20px';
        icon.style.height = '20px';
        option.insertBefore(icon, option.firstChild);
    }

    ticketForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...';
        
        try {
            // Get form data
            const formData = {
                subject: `Support Ticket - ${document.getElementById('serviceType').value}`,
                description: `
Employee Name: ${document.getElementById('employeeName').value}
Email: ${document.getElementById('email').value}
Phone: ${document.getElementById('phone').value}
Service Type: ${document.getElementById('serviceType').value}
Follow-up Contact: ${document.getElementById('followUpContact').value}
Priority: ${document.getElementById('priority').value}

Issue Description:
${document.getElementById('issueDescription').value}
                `,
                departmentId: '1097773000000006907',
                channel: 'Web',
                priority: document.getElementById('priority').value,
                status: 'Open'
            };
            
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
                throw new Error(result.error || 'Failed to submit ticket');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to submit ticket. Please try again or contact support.');
        } finally {
            // Re-enable submit button and restore original text
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Ticket';
        }
    });
}); 