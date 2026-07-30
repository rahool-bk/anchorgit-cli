"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalGitStats = getLocalGitStats;
const child_process_1 = require("child_process");
const crypto_1 = __importDefault(require("crypto"));
function safeExec(command) {
    try {
        return (0, child_process_1.execSync)(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    }
    catch {
        return '';
    }
}
function getLocalGitStats() {
    // 1. Check if we are inside a Git repository
    const isInsideGitRepo = safeExec('git rev-parse --is-inside-work-tree');
    if (isInsideGitRepo !== 'true') {
        throw new Error('Not inside a Git repository. Please run `git init` first.');
    }
    // 2. Get current branch name
    let branch = safeExec('git rev-parse --abbrev-ref HEAD');
    if (!branch || branch === 'HEAD') {
        branch = safeExec('git branch --show-current') || 'main';
    }
    // 3. Get commit SHA (or 'UNCOMMITTED' if repo has 0 commits)
    const commitSha = safeExec('git rev-parse HEAD') || 'UNCOMMITTED';
    // 4. Capture diff content safely
    let rawDiff = '';
    if (commitSha !== 'UNCOMMITTED') {
        rawDiff = safeExec('git show HEAD');
    }
    else {
        // Check staged changes first, then unstaged working directory changes
        rawDiff = safeExec('git diff --cached') || safeExec('git diff') || safeExec('git status --short');
    }
    // 5. Compute lines added / deleted
    let linesAdded = 0;
    let linesDeleted = 0;
    if (rawDiff) {
        const diffLines = rawDiff.split('\n');
        for (const line of diffLines) {
            if (line.startsWith('+') && !line.startsWith('+++'))
                linesAdded++;
            if (line.startsWith('-') && !line.startsWith('---'))
                linesDeleted++;
        }
    }
    // 6. Compute sha256 hash of the diff locally
    const diffHash = crypto_1.default.createHash('sha256').update(rawDiff || 'empty-diff').digest('hex');
    return { commitSha, branch, linesAdded, linesDeleted, diffHash };
}
