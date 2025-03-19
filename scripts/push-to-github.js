const { execSync } = require('child_process');

console.log('🚀 Starting GitHub push process...\n');

try {
    // Initialize Git if not already initialized
    console.log('Checking Git initialization...');
    execSync('git status', { stdio: 'ignore' });
} catch (error) {
    console.log('Initializing Git repository...');
    execSync('git init', { stdio: 'inherit' });
}

// Add all files
console.log('\nAdding files to Git...');
execSync('git add .', { stdio: 'inherit' });

// Create initial commit
console.log('\nCreating initial commit...');
execSync('git commit -m "Initial commit: Seamless Mobile Services"', { stdio: 'inherit' });

// Add remote repository
console.log('\nAdding remote repository...');
execSync('git remote add origin https://github.com/SeamlessMS/seamless-mobile.git', { stdio: 'ignore' });

// Push to GitHub
console.log('\nPushing to GitHub...');
execSync('git push -u origin main', { stdio: 'inherit' });

console.log('\n✅ Successfully pushed to GitHub!');
console.log('\nYou can view your repository at:');
console.log('https://github.com/SeamlessMS/seamless-mobile'); 