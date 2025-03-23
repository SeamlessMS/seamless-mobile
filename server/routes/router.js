const express = require('express');
const router = express.Router();
const { getAccessToken, getOrCreateContact, createTicket } = require('./tickets');

// Remove the submit-ticket route since we're using Vercel serverless function
// router.post('/submit-ticket', async (req, res) => { ... });

module.exports = router; 