import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.anchorgit');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface AnchorConfig {
  apiKey?: string;
  apiUrl?: string;
  username?: string;
  workstationGuid?: string;
  pairedAt?: string;
}

const CONFIG_PATH = path.join(os.homedir(), '.anchor', 'config.json');

export function getConfig(): AnchorConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    return {
      apiUrl: process.env.ANCHORGIT_API_URL || 'https://api.anchorgit.com',
    };
  }

  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
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

export function saveConfig(config: Partial<AnchorConfig>): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const existing = getConfig();
    const updated = { ...existing, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err: any) {
    throw new Error(`Failed to save config: ${err.message}`);
  }
}