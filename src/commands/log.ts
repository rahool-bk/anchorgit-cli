import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const LEDGER_PATH = path.join(os.homedir(), '.anchor', 'ledger.json');

export function handleLog(): void {
  if (!fs.existsSync(LEDGER_PATH)) {
    console.log('\n⚓ No decision history found. Run `anchor decide "..."` to record your first decision.\n');
    return;
  }

  try {
    const raw = fs.readFileSync(LEDGER_PATH, 'utf-8');
    const entries = JSON.parse(raw);

    if (!Array.isArray(entries) || entries.length === 0) {
      console.log('\n⚓ Decision ledger is empty.\n');
      return;
    }

    console.log(`\n⚓ AnchorGit Decision Ledger (${entries.length} entries):`);
    console.log('═'.repeat(70));

    entries.forEach((e: any, idx: number) => {
      const sha = e.commit_sha ? e.commit_sha.substring(0, 7) : 'N/A';
      const date = e.timestamp ? new Date(e.timestamp).toLocaleString() : 'N/A';
      const category = e.category || 'architecture';
      const branch = e.branch || 'unknown';

      console.log(`${idx + 1}. [${sha}] (${branch}) [${category}] - ${date}`);
      console.log(`   Intent:    "${e.decision_summary}"`);
      if (e.hmac_signature) {
        console.log(`   HMAC Sign: ${e.hmac_signature.substring(0, 16)}... [Hardware Bound]`);
      }
      if (e.diff_sha256) {
        console.log(`   Diff Hash: SHA-256 (${e.diff_sha256.substring(0, 12)}...)`);
      }
      console.log('─'.repeat(70));
    });
  } catch (err: any) {
    console.error(`❌ Error reading decision ledger: ${err.message}`);
  }
}
