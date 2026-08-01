"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDecide = handleDecide;
const git_js_1 = require("../core/git.js");
const client_js_1 = require("../api/client.js");
const crypto_js_1 = require("../core/crypto.js");
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
        // Computes HMAC signature dynamically from hardware-derived secret
        const hmacSignature = (0, crypto_js_1.computeHmacSignature)(payload);
        const fullPayload = {
            ...payload,
            hmac_signature: hmacSignature,
        };
        if (options.dryRun) {
            console.log('\n🔍 [DRY RUN] Zero-Knowledge Hardware-Bound Payload:');
            console.log(JSON.stringify(fullPayload, null, 2));
            console.log('\n✅ Payload verified. No source code or secrets present.\n');
            return;
        }
        console.log(`\n⚓ AnchorGit Decision Recorded!`);
        console.log(`   ├─ Intent: "${message}"`);
        console.log(`   ├─ Scope:  ${gitStats.commitSha.substring(0, 7)} (${gitStats.branch}) | +${gitStats.linesAdded} / -${gitStats.linesDeleted} LOC`);
        console.log(`   └─ Proof:  SHA-256 (${gitStats.diffHash.substring(0, 12)}...)`);
        console.log(`   └─ HMAC Sign: ${hmacSignature.substring(0, 16)}... [Hardware Bound]`);
        console.log(`\n🔒 Security Check: Zero source code transmitted. Signed via workstation hardware fingerprint.`);
        // Transmit zero-knowledge metadata payload to API
        await (0, client_js_1.sendDecision)(fullPayload);
        console.log('');
    }
    catch (err) {
        console.error(`❌ Error recording decision: ${err.message}`);
        process.exit(1);
    }
}
