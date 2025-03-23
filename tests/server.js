const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});

// Export server for testing
module.exports = server; 