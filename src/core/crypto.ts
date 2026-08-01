import crypto from 'node:crypto';
import os from 'node:os';

/**
 * Generates a stable, non-editable 256-bit workstation secret in memory.
 * Combines CPU model, platform, architecture, and physical MAC addresses.
 */
export function getHardwareDerivedSecret(): string {
  const networkInterfaces = os.networkInterfaces();
  const macAddresses: string[] = [];

  for (const name of Object.keys(networkInterfaces)) {
    const interfaces = networkInterfaces[name];
    if (interfaces) {
      for (const net of interfaces) {
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          macAddresses.push(net.mac);
        }
      }
    }
  }

  // Fallback if MAC address is masked or virtualized
  const primaryMac = macAddresses.sort()[0] || 'anchor-default-hwid';
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'generic-cpu';

  const rawFingerprint = [
    os.hostname(),
    os.platform(),
    os.arch(),
    cpuModel,
    primaryMac,
  ].join('::');

  return crypto
    .createHash('sha256')
    .update(rawFingerprint)
    .digest('hex');
}

export interface SignaturePayloadInput {
  decision_summary: string;
  commit_sha: string;
  branch: string;
  lines_added: number;
  lines_deleted: number;
  diff_sha256: string;
  timestamp: string;
}

/**
 * Computes an immutable SHA-256 HMAC signature bound to the workstation hardware identity.
 */
export function computeHmacSignature(payload: SignaturePayloadInput): string {
  const hardwareSecret = getHardwareDerivedSecret();

  const canonicalString = [
    payload.commit_sha,
    payload.branch,
    payload.lines_added,
    payload.lines_deleted,
    payload.diff_sha256,
    payload.decision_summary,
    payload.timestamp,
  ].join('|');

  return crypto
    .createHmac('sha256', hardwareSecret)
    .update(canonicalString)
    .digest('hex');
}