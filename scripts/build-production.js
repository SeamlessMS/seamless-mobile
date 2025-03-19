const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

// Ensure we're in production mode
process.env.NODE_ENV = 'production';

// Build steps
const steps = [
    {
        name: 'Installing production dependencies',
        command: 'npm ci --only=production'
    },
    {
        name: 'Creating production environment file',
        command: () => {
            const envContent = fs.readFileSync('.env.production', 'utf8');
            fs.writeFileSync('.env', envContent);
        }
    },
    {
        name: 'Building frontend assets',
        command: 'npm run build'
    },
    {
        name: 'Creating deployment package',
        command: () => {
            const deployDir = 'deploy';
            if (fs.existsSync(deployDir)) {
                fs.rmSync(deployDir, { recursive: true });
            }
            fs.mkdirSync(deployDir);
            
            // Copy necessary files
            const filesToCopy = [
                'package.json',
                'package-lock.json',
                '.env',
                'scripts',
                'public',
                'node_modules'
            ];
            
            filesToCopy.forEach(file => {
                if (fs.existsSync(file)) {
                    fs.cpSync(file, path.join(deployDir, file), { recursive: true });
                }
            });
        }
    }
];

// Execute build steps
steps.forEach(step => {
    try {
        logger.info(`Starting: ${step.name}`);
        if (typeof step.command === 'function') {
            step.command();
        } else {
            execSync(step.command, { stdio: 'inherit' });
        }
        logger.info(`Completed: ${step.name}`);
    } catch (error) {
        logger.error(`Failed at step "${step.name}":`, error);
        process.exit(1);
    }
});

logger.info('Production build completed successfully!');
logger.info('Deployment package created in the "deploy" directory.'); 