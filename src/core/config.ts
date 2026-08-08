import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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