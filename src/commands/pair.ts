import os from 'node:os';
import { saveConfig, getConfig } from '../core/config.js';
import { getHardwareDerivedSecret } from '../core/crypto.js';

export async function handlePair(token?: string): Promise<void> {
  try {
    const config = getConfig();
    const apiUrl = config.apiUrl || process.env.ANCHORGIT_API_URL || 'https://api.anchorgit.com';

    // 1. Derive workstation GUID from physical hardware
    const hardwareSecret = getHardwareDerivedSecret();
    const workstationGuid = hardwareSecret.toString('hex').substring(0, 32);

    const cleanToken = token?.trim();

    // IF NO TOKEN: Run pure Local Pairing Mode
    if (!cleanToken) {
      const localUser = os.userInfo().username || 'local-developer';

      saveConfig({
        username: localUser,
        workstationGuid: workstationGuid,
        pairedAt: new Date().toISOString(),
      });

      console.log(`\n⚓ Operating in Local Workstation Mode (Web Studio Offline)`);
      console.log(`   ├─ Workstation ID: ${workstationGuid.substring(0, 12)}...`);
      console.log(`   └─ Local User:     @${localUser}`);
      console.log(`\n✅ Workstation Initialized Locally!`);
      console.log(`   Credentials saved to ~/.anchor/config.json`);
      console.log(`   You can now run \`anchor decide "your message"\` to notarize decisions locally.\n`);

      process.exit(0);
    }

    // IF TOKEN PROVIDED: Try cloud pair with fallback catch
    console.log(`\n⚓ Pairing Workstation with AnchorGit Cloud...`);
    console.log(`   ├─ Workstation ID: ${workstationGuid.substring(0, 12)}...`);
    console.log(`   └─ Endpoint:       ${apiUrl}`);

    try {
      const response = await fetch(`${apiUrl}/api/v1/pair`, {
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

      const data = (await response.json()) as { username?: string };
      const username = data.username || 'developer';

      saveConfig({
        apiKey: cleanToken,
        username: username,
        workstationGuid: workstationGuid,
        apiUrl: apiUrl,
        pairedAt: new Date().toISOString(),
      });

      console.log(`\n✅ Workstation Paired Successfully!`);
      console.log(`   Welcome, @${username}! Credentials saved to ~/.anchor/config.json`);
      console.log(`   🌐 View your profile: https://anchorgit.com/p/${username}\n`);

      process.exit(0);
    } catch (networkErr: any) {
      console.warn(`\n⚠️  Could not reach AnchorGit Cloud (${networkErr.message}).`);
      console.log(`   Falling back to Local Workstation Pairing...`);

      // Graceful Fallback: Save key locally anyway
      const localUser = os.userInfo().username || 'developer';
      saveConfig({
        apiKey: cleanToken,
        username: localUser,
        workstationGuid: workstationGuid,
        pairedAt: new Date().toISOString(),
      });

      console.log(`\n✅ Workstation Paired Locally (Pending Cloud Sync)`);
      console.log(`   Saved to ~/.anchor/config.json. Run \`anchor decide\` to proceed offline.\n`);

      process.exit(0);
    }
  } catch (err: any) {
    console.error(`❌ Pairing failed: ${err.message}`);
    process.exit(1);
  }
}