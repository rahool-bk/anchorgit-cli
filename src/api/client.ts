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

  // If no API key is configured, cleanly exit local mode
  if (!config.apiKey) {
    console.log('\n🔒 Local Notary Mode Active: Decision saved to ~/.anchor/ledger.json');
    console.log('   (Run `anchor pair <key>` when you want to sync with a team dashboard)\n');
    return false;
  }

  const apiUrl = config.apiUrl || 'https://api.anchorgit.com';

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

    console.log('\n✅ Synchronized with AnchorGit Cloud.\n');
    return true;
  } catch (error: any) {
    console.log('\nℹ️  Cloud Sync Skipped: Backend API currently offline or unreachable.');
    console.log('   (Local decision record saved successfully)\n');
    return false;
  }
}