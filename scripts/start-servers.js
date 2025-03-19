const { spawn } = require('child_process');
const path = require('path');
const logger = require('./utils/logger');

// Configuration
const servers = [
  {
    name: 'Main Server',
    script: 'ticket-api.js',
    port: process.env.PORT || 3000
  },
  {
    name: 'Auth Server',
    script: 'auth-api.js',
    port: process.env.AUTH_PORT || 3001
  },
  {
    name: 'Payment Server',
    script: 'payment-api.js',
    port: process.env.PAYMENT_PORT || 3002
  }
];

// Function to start a server
function startServer(server) {
  const scriptPath = path.join(__dirname, server.script);
  const nodemonPath = path.join(__dirname, '../node_modules/nodemon/bin/nodemon.js');
  const serverProcess = spawn('node', [nodemonPath, scriptPath], {
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: server.port,
      NODE_ENV: 'development'
    }
  });

  // Handle server output
  serverProcess.stdout.on('data', (data) => {
    logger.info(`[${server.name}] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    logger.error(`[${server.name}] ${data.toString().trim()}`);
  });

  // Handle server exit
  serverProcess.on('close', (code) => {
    logger.error(`[${server.name}] Server exited with code ${code}`);
    // Restart server after 5 seconds
    setTimeout(() => startServer(server), 5000);
  });

  return serverProcess;
}

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

// Start all servers
logger.info('Starting all servers...');
const processes = servers.map(server => startServer(server));

// Log server status
setTimeout(() => {
  servers.forEach((server, index) => {
    logger.info(`${server.name} is running on port ${server.port}`);
  });
}, 2000); 