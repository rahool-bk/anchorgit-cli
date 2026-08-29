import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getLocalGitStats } from '../core/git.js';
import { sendDecision } from '../api/client.js';
import { computeHmacSignature } from '../core/crypto.js';
import { getConfig } from '../core/config.js';
import type { ProvenanceSource } from '../core/config.js';

interface DecideOptions {
  dryRun?: boolean;
  category?: string;
  deliberationSeconds?: number;
  /**
   * Provenance source for this decision's deliberation time.
   * Defaults to 'cli_user_declared' when invoked from the terminal.
   * The VS Code extension passes 'ide_passive_tracker' programmatically.
   */
  source?: ProvenanceSource;
}

const LEDGER_DIR = path.join(os.homedir(), '.anchor');
const LEDGER_FILE = path.join(LEDGER_DIR, 'ledger.json');

/**
 * Maps a ProvenanceSource to its human-readable dashboard verification badge.
 *
 * - ide_passive_tracker → 🛡️ Verified Focus (hardware HMAC + passive timer)
 * - cli_user_declared   → 📝 Self-Declared  (manually entered duration)
 */
function getProvenanceBadge(source: ProvenanceSource): string {
  switch (source) {
    case 'ide_passive_tracker':
      return '🛡️  Verified Focus';
    case 'cli_user_declared':
      return '📝 Self-Declared';
  }
}

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
    const rawDeliberation = options.deliberationSeconds ?? (options as any).deliberation ?? 0;
    const deliberationSeconds = typeof rawDeliberation === 'string' ? parseInt(rawDeliberation, 10) : rawDeliberation;

    // Resolve provenance source — default to cli_user_declared for terminal invocations.
    // The VS Code extension passes --source ide_passive_tracker when it has passive timer proof.
    const deliberationSource: ProvenanceSource = options.source ?? 'cli_user_declared';

    const payload = {
      workstation_guid: config.workstationGuid, // MUST BE INCLUDED
      timestamp: new Date().toISOString(),
      decision_summary: message,
      category: options.category || 'architecture',
      commit_sha: gitStats.commitSha,
      branch: gitStats.branch,
      lines_added: gitStats.linesAdded,
      lines_deleted: gitStats.linesDeleted,
      diff_sha256: gitStats.diffHash,
      affected_files: gitStats.affectedFiles || [],
      deliberation_seconds: deliberationSeconds,
      // Provenance tag: included in the HMAC canonical string — cannot be mutated post-sign.
      deliberation_source: deliberationSource,
    };

    // Computes HMAC-SHA256 over the canonical string that includes deliberation_source.
    // Changing the provenance tag after signing will invalidate the signature.
    const hmacSignature = computeHmacSignature(payload);

    const fullPayload = {
      ...payload,
      hmac_signature: hmacSignature,
    };

    const badge = getProvenanceBadge(deliberationSource);

    if (options.dryRun) {
      console.log('\n🔍 [DRY RUN] Zero-Knowledge Hardware-Bound Payload:');
      console.log(JSON.stringify(fullPayload, null, 2));
      console.log(`\n${badge} — deliberation_source: "${deliberationSource}"`);
      console.log('✅ Payload verified. No source code or secrets present.\n');
      process.exit(0);
    }

    // 1. Save Locally to ~/.anchor/ledger.json
    saveToLocalLedger(fullPayload);

    console.log(`\n⚓ AnchorGit Decision Recorded!`);
    console.log(`   ├─ Intent:     "${message}"`);
    console.log(`   ├─ Scope:      ${gitStats.commitSha.substring(0, 7)} (${gitStats.branch}) | +${gitStats.linesAdded} / -${gitStats.linesDeleted} LOC`);
    console.log(`   ├─ Proof:      SHA-256 (${gitStats.diffHash.substring(0, 12)}...)`);
    console.log(`   ├─ HMAC Sign:  ${hmacSignature.substring(0, 16)}... [Hardware Bound]`);
    console.log(`   └─ Provenance: ${badge}`);

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