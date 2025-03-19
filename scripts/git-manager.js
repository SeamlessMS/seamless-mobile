const { execSync } = require('child_process');
const path = require('path');

class GitManager {
    constructor() {
        this.gitPath = 'C:\\Program Files\\Git\\cmd\\git.exe';
    }

    executeGitCommand(command) {
        try {
            const fullCommand = `"${this.gitPath}" ${command}`;
            const result = execSync(fullCommand, { encoding: 'utf8' });
            return { success: true, output: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Git status
    status() {
        return this.executeGitCommand('status');
    }

    // Add files
    add(files = '.') {
        return this.executeGitCommand(`add ${files}`);
    }

    // Commit changes
    commit(message) {
        return this.executeGitCommand(`commit -m "${message}"`);
    }

    // Push changes
    push(branch = 'master') {
        return this.executeGitCommand(`push -u origin ${branch}`);
    }

    // Pull changes
    pull(branch = 'master') {
        return this.executeGitCommand(`pull origin ${branch}`);
    }

    // Create new branch
    createBranch(branchName) {
        return this.executeGitCommand(`checkout -b ${branchName}`);
    }

    // Switch branch
    checkout(branchName) {
        return this.executeGitCommand(`checkout ${branchName}`);
    }

    // List branches
    listBranches() {
        return this.executeGitCommand('branch -a');
    }

    // Get remote info
    remoteInfo() {
        return this.executeGitCommand('remote -v');
    }
}

// Export the GitManager class
module.exports = GitManager; 