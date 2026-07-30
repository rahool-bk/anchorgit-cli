"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStandup = handleStandup;
const child_process_1 = require("child_process");
function safeExec(command) {
    try {
        return (0, child_process_1.execSync)(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    }
    catch {
        return '';
    }
}
async function handleStandup() {
    try {
        console.log('\n⚓ AnchorGit - Recent Engineering Impact & Decisions:\n');
        // 1. Check if git repo exists
        const isGitRepo = safeExec('git rev-parse --is-inside-work-tree');
        if (isGitRepo !== 'true') {
            console.log('   ❌ Not inside a Git repository. Run `git init` first.\n');
            return;
        }
        // 2. Fetch commit log safely
        const log = safeExec('git log -n 5 --oneline');
        if (log) {
            const lines = log.split('\n');
            lines.forEach((line) => {
                console.log(`   • ${line}`);
            });
        }
        else {
            // Handle empty repo with zero commits
            console.log('   🌱 Brand new repository (0 commits yet).');
            const status = safeExec('git status --short');
            if (status) {
                console.log('\n   Uncommitted working directory changes:');
                status.split('\n').forEach((file) => console.log(`     ${file}`));
            }
        }
        console.log('\n💡 Tip: Run `anchor decide "your trade-off"` to attach signed architectural context.\n');
    }
    catch (err) {
        console.error(`❌ Error fetching standup log: ${err.message}`);
    }
}
