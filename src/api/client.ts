import { getConfig } from '../core/config.js';

export interface DecisionPayload {
  timestamp: string;
  decision_summary: string;
  commit_sha: string;
  branch: string;
  lines_added: number;
  lines_deleted: number;
  diff_sha256: string;
  affected_files?: string[];
}

export async function sendDecision(payload: DecisionPayload): Promise<boolean> {
  const config = getConfig();

  // If the user hasn't run `anchor pair <api-key>`, skip cloud sync silently
  if (!config.apiKey) {
    console.log(`🔒 Local Notary Mode Active: Decision saved to ~/.anchor/ledger.json`);
    console.log(`💡 Tip: Pair your workstation to sync with your web dashboard:`);
    console.log(`   👉 anchor pair <your-api-key>\n`);
    return false;
  }

  const apiUrl = config.apiUrl || process.env.ANCHORGIT_API_URL || 'https://api.anchorgit.com';

  try {
    const response = await fetch(`${apiUrl}/v1/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'User-Agent': 'AnchorGit-CLI/0.1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    console.log(`🌐 Cloud Sync Active: Decision notarized and synced with @${config.username || 'developer'}`);
    console.log(`   👉 https://anchorgit.com/p/${config.username || 'developer'}\n`);
    return true;
  } catch (error: any) {
    console.log('\nℹ️  Cloud Sync Skipped: Backend API currently offline or unreachable.');
    console.log('   (Local decision record saved successfully)\n');
    return false;
  }
}