// src/commands/whoami.ts
import { getConfig } from '../core/config.js';

export function handleWhoami(): void {
  const config = getConfig();

  if (!config.apiKey || !config.username) {
    console.log(`\n🔒 Local Unpaired Mode`);
    console.log(`   No account linked yet. Run \`anchor pair <api-key>\` to connect your profile.\n`);
    process.exit(0);
  }

  console.log(`\n⚓ AnchorGit Workstation Identity:`);
  console.log(`   ├─ Username:    @${config.username}`);
  console.log(`   ├─ Workstation: ${config.workstationGuid ? config.workstationGuid.substring(0, 12) + '...' : 'Local'}`);
  console.log(`   ├─ Profile:     https://anchorgit.com/p/${config.username}`);
  console.log(`   └─ Paired At:   ${config.pairedAt || 'N/A'}\n`);
  process.exit(0);
}