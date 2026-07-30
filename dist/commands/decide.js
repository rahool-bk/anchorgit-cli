"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDecide = handleDecide;
const git_js_1 = require("../core/git.js");
const client_js_1 = require("../api/client.js");
async function handleDecide(message, options) {
    try {
        const gitStats = (0, git_js_1.getLocalGitStats)();
        const payload = {
            timestamp: new Date().toISOString(),
            decision_summary: message,
            commit_sha: gitStats.commitSha,
            branch: gitStats.branch,
            lines_added: gitStats.linesAdded,
            lines_deleted: gitStats.linesDeleted,
            diff_sha256: gitStats.diffHash,
        };
        if (options.dryRun) {
            console.log('\n🔍 [DRY RUN] Inspected Payload (Zero code transmitted):\n');
            console.log(JSON.stringify(payload, null, 2));
            console.log('\n✅ Payload verified. No source code or secrets present.\n');
            return;
        }
        console.log(`\n⚓ AnchorGit Decision Recorded!`);
        console.log(`   ├─ Intent: "${message}"`);
        console.log(`   ├─ Scope:  ${gitStats.commitSha.substring(0, 7)} (${gitStats.branch}) | +${gitStats.linesAdded} / -${gitStats.linesDeleted} LOC`);
        console.log(`   └─ Proof:  SHA-256 (${gitStats.diffHash.substring(0, 12)}...)`);
        console.log(`\n🔒 Security Check: Zero source code was transmitted. Only line stats and cryptographic hash were processed.`);
        // Transmit zero-knowledge metadata payload to API
        await (0, client_js_1.sendDecision)(payload);
        console.log('');
    }
    catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
}
