// Form validation and submission
(function () {
    'use strict'
    
    // Get the form element
    const form = document.getElementById('jobInquiryForm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Add loading state to button
    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.innerHTML = isLoading ? 
            '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...' : 
            'Submit Application';
    }

    // Show success message
    function showSuccess() {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success mt-3';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Thank you for your application! We will review your information and contact you soon.
        `;
        form.insertAdjacentElement('afterend', alert);
        setTimeout(() => alert.remove(), 5000);
    }

    // Show error message
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger mt-3';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
        `;
        form.insertAdjacentElement('afterend', alert);
        setTimeout(() => alert.remove(), 5000);
    }

    // Handle form submission
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData(form);
            const data = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                position: formData.get('position'),
                experience: formData.get('experience'),
                message: formData.get('message')
            };

            const response = await fetch(`${window.CONFIG.apiBaseUrl}/api/job-submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit application');
            }

            const result = await response.json();
            showSuccess();
            form.reset();
            form.classList.remove('was-validated');
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'There was an error submitting your application. Please try again later.');
        } finally {
            setLoading(false);
        }
    });
})(); 