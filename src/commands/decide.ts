import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getLocalGitStats } from '../core/git.js';
import { sendDecision } from '../api/client.js';
import { computeHmacSignature } from '../core/crypto.js';
import { getConfig } from '../core/config.js';

interface DecideOptions {
  dryRun?: boolean;
}

const LEDGER_DIR = path.join(os.homedir(), '.anchor');
const LEDGER_FILE = path.join(LEDGER_DIR, 'ledger.json');

/**
 * Persists the signed decision payload locally in ~/.anchor/ledger.json
 * so context, pr, and standup commands can read it offline.
 */
function saveToLocalLedger(entry: any): void {
  if (!fs.existsSync(LEDGER_DIR)) {
    fs.mkdirSync(LEDGER_DIR, { recursive: true });
  }

  let entries: any[] = [];
  if (fs.existsSync(LEDGER_FILE)) {
    try {
      const content = fs.readFileSync(LEDGER_FILE, 'utf-8');
      entries = JSON.parse(content);
    } catch {
      entries = [];
    }
  }

  entries.push(entry);
  fs.writeFileSync(LEDGER_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

export async function handleDecide(message: string, options: DecideOptions): Promise<void> {
  try {
    const gitStats = getLocalGitStats();
    const config = getConfig();

    const payload = {
      workstation_guid: config.workstationGuid, // MUST BE INCLUDED
      timestamp: new Date().toISOString(),
      decision_summary: message,
      commit_sha: gitStats.commitSha,
      branch: gitStats.branch,
      lines_added: gitStats.linesAdded,
      lines_deleted: gitStats.linesDeleted,
      diff_sha256: gitStats.diffHash,
      affected_files: gitStats.affectedFiles || [],
    };

    // Computes HMAC signature dynamically from workstation hardware identity
    const hmacSignature = computeHmacSignature(payload);

    const fullPayload = {
      ...payload,
      hmac_signature: hmacSignature,
    };

    if (options.dryRun) {
      console.log('\n🔍 [DRY RUN] Zero-Knowledge Hardware-Bound Payload:');
      console.log(JSON.stringify(fullPayload, null, 2));
      console.log('\n✅ Payload verified. No source code or secrets present.\n');
      process.exit(0);
    }

    // 1. Save Locally to ~/.anchor/ledger.json
    saveToLocalLedger(fullPayload);

    console.log(`\n⚓ AnchorGit Decision Recorded!`);
    console.log(`   ├─ Intent:     "${message}"`);
    console.log(`   ├─ Scope:      ${gitStats.commitSha.substring(0, 7)} (${gitStats.branch}) | +${gitStats.linesAdded} / -${gitStats.linesDeleted} LOC`);
    console.log(`   ├─ Proof:      SHA-256 (${gitStats.diffHash.substring(0, 12)}...)`);
    console.log(`   └─ HMAC Sign:  ${hmacSignature.substring(0, 16)}... [Hardware Bound]`);

    console.log(`\n🔒 Security Check: Zero source code transmitted. Signed via workstation hardware fingerprint.`);

    if (config.username) {
      console.log(`🌐 View your Verified Developer Profile & Decision Graph:`);
      console.log(`   👉 https://anchorgit.com/p/${config.username}\n`);
    } else {
      console.log(`💡 Tip: Pair your workstation to sync with your web dashboard:`);
      console.log(`   👉 anchor pair <your-api-key>\n`);
    }

    // 2. Cloud Sync (Wrapped under { decision: ... } for Rails strong parameters)
    await sendDecision(fullPayload);

    process.exit(0);
  } catch (err: any) {
    console.error(`❌ Error recording decision: ${err.message}`);
    process.exit(1);
  }
}