const { execSync } = require('child_process');

console.log('🔧 Configuring Git...\n');

try {
    // Set user name
    console.log('Setting Git username...');
    execSync('git config --global user.name "SeamlessMS"', { stdio: 'inherit' });

    // Set user email
    console.log('\nSetting Git email...');
    execSync('git config --global user.email "matt@seamlessms.net"', { stdio: 'inherit' });

    // Set default branch name
    console.log('\nSetting default branch name...');
    execSync('git config --global init.defaultBranch main', { stdio: 'inherit' });

    console.log('\n✅ Git configuration complete!');
    console.log('\nYou can now run: npm run push-github');
} catch (error) {
    console.error('❌ Error configuring Git:', error.message);
    console.log('\nPlease make sure Git is installed and try again.');
} 