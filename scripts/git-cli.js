const GitManager = require('./git-manager');
const readline = require('readline');

const git = new GitManager();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log('\nGit Operations Menu:');
    console.log('1. Check Status');
    console.log('2. Add Files');
    console.log('3. Commit Changes');
    console.log('4. Push Changes');
    console.log('5. Pull Changes');
    console.log('6. Create New Branch');
    console.log('7. Switch Branch');
    console.log('8. List Branches');
    console.log('9. Show Remote Info');
    console.log('0. Exit');
}

function handleChoice(choice) {
    switch (choice) {
        case '1':
            const status = git.status();
            console.log(status.success ? status.output : `Error: ${status.error}`);
            break;
        case '2':
            rl.question('Enter files to add (or press Enter for all): ', (files) => {
                const result = git.add(files || '.');
                console.log(result.success ? result.output : `Error: ${result.error}`);
                showMenu();
            });
            return;
        case '3':
            rl.question('Enter commit message: ', (message) => {
                const result = git.commit(message);
                console.log(result.success ? result.output : `Error: ${result.error}`);
                showMenu();
            });
            return;
        case '4':
            rl.question('Enter branch name (or press Enter for master): ', (branch) => {
                const result = git.push(branch || 'master');
                console.log(result.success ? result.output : `Error: ${result.error}`);
                showMenu();
            });
            return;
        case '5':
            rl.question('Enter branch name (or press Enter for master): ', (branch) => {
                const result = git.pull(branch || 'master');
                console.log(result.success ? result.output : `Error: ${result.error}`);
                showMenu();
            });
            return;
        case '6':
            rl.question('Enter new branch name: ', (branchName) => {
                const result = git.createBranch(branchName);
                console.log(result.success ? result.output : `Error: ${result.error}`);
                showMenu();
            });
            return;
        case '7':
            rl.question('Enter branch name to switch to: ', (branchName) => {
                const result = git.checkout(branchName);
                console.log(result.success ? result.output : `Error: ${result.error}`);
                showMenu();
            });
            return;
        case '8':
            const branches = git.listBranches();
            console.log(branches.success ? branches.output : `Error: ${branches.error}`);
            break;
        case '9':
            const remote = git.remoteInfo();
            console.log(remote.success ? remote.output : `Error: ${remote.error}`);
            break;
        case '0':
            console.log('Goodbye!');
            rl.close();
            return;
        default:
            console.log('Invalid choice. Please try again.');
    }
    showMenu();
}

console.log('Welcome to Git CLI Manager!');
showMenu();

rl.on('line', (input) => {
    handleChoice(input.trim());
}); 