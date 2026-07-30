import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.anchorgit');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface AnchorConfig {
  apiKey?: string;
  apiUrl?: string;
}

export function getConfig(): AnchorConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { apiUrl: 'https://api.anchorgit.com' };
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { apiUrl: 'https://api.anchorgit.com' };
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