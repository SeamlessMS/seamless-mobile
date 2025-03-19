// API endpoints
const API_BASE_URL = 'http://localhost:3000';
const AUTH_API_URL = 'http://localhost:3001';

// DOM Elements
const loginForm = document.getElementById('loginFormElement');
const ticketSystem = document.getElementById('ticketSystem');
const newTicketForm = document.getElementById('newTicketForm');
const ticketForm = document.getElementById('ticketForm');
const ticketsList = document.getElementById('ticketsList');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
ticketForm.addEventListener('submit', handleNewTicket);

// Login Handler
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            loginForm.style.display = 'none';
            ticketSystem.style.display = 'block';
            loadTickets();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Load Tickets
async function loadTickets() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tickets`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const tickets = await response.json();
        displayTickets(tickets);
    } catch (error) {
        console.error('Error loading tickets:', error);
    }
}

// Display Tickets
function displayTickets(tickets) {
    ticketsList.innerHTML = tickets.map(ticket => `
        <div class="ticket-item priority-${ticket.priority.toLowerCase()}">
            <div class="d-flex justify-content-between align-items-center">
                <h5>${ticket.subject}</h5>
                <span class="ticket-status status-${ticket.status.toLowerCase()}">${ticket.status}</span>
            </div>
            <p class="mb-2">${ticket.description}</p>
            <div class="d-flex justify-content-between align-items-center">
                <small>Created: ${new Date(ticket.createdAt).toLocaleDateString()}</small>
                <div>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="updateTicketStatus('${ticket._id}', 'in-progress')">Start</button>
                    <button class="btn btn-sm btn-outline-success" onclick="updateTicketStatus('${ticket._id}', 'resolved')">Resolve</button>
                </div>
            </div>
        </div>
    `).join('');
}

// New Ticket Form
function showNewTicketForm() {
    newTicketForm.style.display = 'block';
}

function hideNewTicketForm() {
    newTicketForm.style.display = 'none';
}

// Handle New Ticket
async function handleNewTicket(e) {
    e.preventDefault();
    const subject = document.getElementById('subject').value;
    const description = document.getElementById('description').value;
    const priority = document.getElementById('priority').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ subject, description, priority })
        });

        if (response.ok) {
            hideNewTicketForm();
            loadTickets();
            e.target.reset();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to create ticket');
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Failed to create ticket. Please try again.');
    }
}

// Update Ticket Status
async function updateTicketStatus(ticketId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadTickets();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to update ticket status');
        }
    } catch (error) {
        console.error('Error updating ticket status:', error);
        alert('Failed to update ticket status. Please try again.');
    }
}

// Check if user is already logged in
if (localStorage.getItem('token')) {
    loginForm.style.display = 'none';
    ticketSystem.style.display = 'block';
    loadTickets();
} 