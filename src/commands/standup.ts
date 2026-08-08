import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const LEDGER_PATH = path.join(os.homedir(), '.anchor', 'ledger.json');

export async function handleStandup() {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      console.log('\n⚓ No decision history found. Run `anchor decide "..."` to start recording.');
      return;
    }

    const rawData = fs.readFileSync(LEDGER_PATH, 'utf-8');
    const entries = JSON.parse(rawData);

    // Filter decisions made in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = entries.filter((e: any) => new Date(e.timestamp) >= oneDayAgo);

    console.log(`\n📊 Yesterday's Signed Engineering Impact & Decisions:`);
    console.log('═'.repeat(60));

    if (recent.length === 0) {
      console.log('   No architectural decisions notarized in the last 24 hours.');
      console.log('   Showing last 3 overall decisions:\n');
      entries.slice(-3).forEach((e: any) => {
        console.log(`   • [${e.commit_sha.substring(0, 7)}] ${e.decision_summary} (+${e.lines_added}/-${e.lines_deleted} LOC)`);
      });
      return;
    }

    recent.forEach((e: any) => {
      console.log(`   • [${e.commit_sha.substring(0, 7)}] ${e.decision_summary}`);
      console.log(`     └─ Scope: +${e.lines_added} / -${e.lines_deleted} LOC | HMAC: ${e.hmac_signature.substring(0, 12)}...`);
    });

    console.log('═'.repeat(60));
    console.log(`✨ Total Impact: ${recent.length} Notarized Architectural Decisions.`);

  } catch (error: any) {
    console.error(`❌ Error generating standup: ${error.message}`);
  }
}