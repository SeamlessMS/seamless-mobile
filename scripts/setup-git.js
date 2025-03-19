const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupGit() {
  try {
    console.log('🚀 Setting up Git and GitHub...\n');

    // Initialize Git repository
    console.log('Initializing Git repository...');
    execSync('git init', { stdio: 'inherit' });

    // Get GitHub repository URL
    const repoUrl = await question('Enter your GitHub repository URL (e.g., https://github.com/username/seamless-mobile.git): ');

    // Add remote repository
    console.log('\nAdding remote repository...');
    execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });

    // Add all files
    console.log('\nAdding files to Git...');
    execSync('git add .', { stdio: 'inherit' });

    // Create initial commit
    console.log('\nCreating initial commit...');
    execSync('git commit -m "Initial commit"', { stdio: 'inherit' });

    // Push to GitHub
    console.log('\nPushing to GitHub...');
    execSync('git push -u origin main', { stdio: 'inherit' });

    console.log('\n✅ Git and GitHub setup complete!');
    console.log('\nNext steps:');
    console.log('1. Verify your repository on GitHub');
    console.log('2. Set up branch protection rules');
    console.log('3. Add collaborators if needed');
  } catch (error) {
    console.error('❌ Error setting up Git:', error.message);
  } finally {
    rl.close();
  }
}

setupGit(); 