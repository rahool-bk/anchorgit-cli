import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Provenance tag describing how deliberation_seconds was captured.
 *
 * - `ide_passive_tracker`  — Set by the VS Code extension; the timer ran
 *   passively while the developer was active in the IDE window.
 * - `cli_user_declared`    — Set when the user invokes `anchor decide`
 *   manually from the terminal and supplies the duration themselves.
 */
export type ProvenanceSource = 'ide_passive_tracker' | 'cli_user_declared';

export interface AnchorConfig {
  apiKey?: string;
  apiUrl?: string;
  username?: string;
  workstationGuid?: string;
  pairedAt?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.anchor');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfig(): AnchorConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      apiUrl: process.env.ANCHORGIT_API_URL || 'https://api.anchorgit.com',
    };
  }

  try {
    const rawData = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(rawData);

    return {
      apiKey: parsed.apiKey,
      apiUrl: process.env.ANCHORGIT_API_URL || parsed.apiUrl || 'https://api.anchorgit.com',
      username: parsed.username || 'developer',
      workstationGuid: parsed.workstationGuid,
      pairedAt: parsed.pairedAt,
    };
  } catch {
    return {
      apiUrl: process.env.ANCHORGIT_API_URL || 'https://api.anchorgit.com',
    };
  }
}

export function getOrGenerateWorkstationGuid(): string {
  const config = getConfig();
  if (config.workstationGuid) {
    return config.workstationGuid;
  }

  // Import dynamically or get hardware secret
  const { getHardwareDerivedSecret } = require('./crypto.js');
  const hardwareSecret = getHardwareDerivedSecret();
  const guid = hardwareSecret.toString('hex').substring(0, 32);
  saveConfig({ workstationGuid: guid });
  return guid;
}

export function saveConfig(newConfig: Partial<AnchorConfig>): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    const currentConfig = getConfig();
    const updatedConfig: AnchorConfig = {
      ...currentConfig,
      ...newConfig,
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updatedConfig, null, 2), 'utf-8');
  } catch (err: any) {
    throw new Error(`Failed to save configuration: ${err.message}`);
  }
}