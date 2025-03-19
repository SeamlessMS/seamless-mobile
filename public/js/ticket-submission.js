document.addEventListener('DOMContentLoaded', function() {
    const ticketForm = document.getElementById('ticketForm');
    
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

    ticketForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(ticketForm);
        const ticketData = {
            employeeName: formData.get('employeeName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            serviceType: formData.get('serviceType'),
            followUpContact: formData.get('followUpContact'),
            issueDescription: formData.get('issueDescription'),
            priority: formData.get('priority'),
            attachments: formData.getAll('attachments')
        };

        // Here you would typically send the data to your backend
        console.log('Ticket Data:', ticketData);
        
        // Show success message
        alert('Ticket submitted successfully! We will contact you shortly.');
        ticketForm.reset();
    });
}); 