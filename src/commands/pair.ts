import os from 'node:os';
import { saveConfig, getConfig } from '../core/config.js';
import { getHardwareDerivedSecret } from '../core/crypto.js';

export async function handlePair(token: string): Promise<void> {
  try {
    if (!token || token.trim().length === 0) {
      console.error('❌ Error: Token is required. Run `anchor pair <your-api-key>`');
      process.exit(1);
    }

    const cleanToken = token.trim();
    const config = getConfig();
    const apiUrl = config.apiUrl || process.env.ANCHORGIT_API_URL || 'https://api.anchorgit.com';

    // 1. Derive workstation GUID from physical hardware
    const hardwareSecret = getHardwareDerivedSecret();
    const workstationGuid = hardwareSecret.toString('hex').substring(0, 32);

    console.log(`\n⚓ Pairing Workstation with AnchorGit Cloud...`);
    console.log(`   ├─ Workstation ID: ${workstationGuid.substring(0, 12)}...`);
    console.log(`   └─ Endpoint:       ${apiUrl}`);

    // 2. Call Rails Backend API
    const response = await fetch(`${apiUrl}/v1/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({
        workstation_guid: workstationGuid,
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const username = data.username || 'developer';

    // 3. Persist pairing state locally using saveConfig
    saveConfig({
      apiKey: cleanToken,
      username: username,
      workstationGuid: workstationGuid,
      apiUrl: apiUrl,
      pairedAt: new Date().toISOString(),
    });

    console.log(`\n✅ Workstation Paired Successfully!`);
    console.log(`   Welcome, @${username}! Credentials saved to ~/.anchor/config.json`);
    console.log(`   🌐 View your public profile: https://anchorgit.com/p/${username}`);
    console.log(`   You can now run \`anchor decide "your message"\` to notarize decisions.\n`);

    process.exit(0);
  } catch (err: any) {
    console.error(`❌ Pairing failed: ${err.message}`);
    process.exit(1);
  }
}