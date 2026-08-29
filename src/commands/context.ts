import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { ProvenanceSource } from '../core/config.js';

const LEDGER_PATH = path.join(os.homedir(), '.anchor', 'ledger.json');

interface LedgerEntry {
  decision_summary: string;
  commit_sha: string;
  branch: string;
  lines_added: number;
  lines_deleted: number;
  diff_sha256: string;
  hmac_signature: string;
  timestamp: string;
  affected_files?: string[];
  /**
   * Provenance tag — present on entries written after the provenance flag
   * feature was introduced. Older entries will have this as undefined.
   */
  deliberation_source?: ProvenanceSource;
}

/**
 * Returns the dashboard verification badge for a provenance source value.
 * Handles undefined gracefully for ledger entries written before this feature.
 */
function getProvenanceBadge(source?: ProvenanceSource): string {
  switch (source) {
    case 'ide_passive_tracker':
      return '🛡️  Verified Focus';
    case 'cli_user_declared':
      return '📝 Self-Declared';
    default:
      return '🔹 Unknown';
  }
}

export async function handleContext(targetPath?: string) {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      console.log('\n⚓ No local decision history found in ~/.anchor/ledger.json.');
      console.log('   Run `anchor decide "..."` to notarize your first architectural trade-off!');
      return;
    }

    const rawData = fs.readFileSync(LEDGER_PATH, 'utf-8');
    const entries: LedgerEntry[] = JSON.parse(rawData);

    if (entries.length === 0) {
      console.log('\n⚓ Decision ledger is empty.');
      return;
    }

    const filtered = targetPath
      ? entries.filter(e => e.affected_files?.some(f => f.includes(targetPath)))
      : entries;

    console.log(`\n⚓ AnchorGit Decision Context ${targetPath ? `for [${targetPath}]` : '(All Projects)'}:`);
    console.log('─'.repeat(65));

    if (filtered.length === 0) {
      console.log(`   No signed architectural decisions recorded specifically for "${targetPath}".`);
      return;
    }

    filtered.slice(-5).reverse().forEach(entry => {
      const badge = getProvenanceBadge(entry.deliberation_source);
      console.log(`   • [${entry.commit_sha.substring(0, 7)}] (${entry.branch}) - ${new Date(entry.timestamp).toLocaleString()}`);
      console.log(`     Intent:    "${entry.decision_summary}"`);
      console.log(`     Provenance: ${badge}`);
      console.log(`     HMAC Sign: ${entry.hmac_signature.substring(0, 16)}... [Hardware Verified]`);
      console.log(`     Scope:     +${entry.lines_added} / -${entry.lines_deleted} LOC`);
      console.log('─'.repeat(65));
    });

  } catch (error: any) {
    console.error(`❌ Error reading decision context: ${error.message}`);
  }
}