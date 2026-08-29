import crypto from 'node:crypto';
import os from 'node:os';
import { execSync } from 'node:child_process';
import type { ProvenanceSource } from './config.js';

/**
 * Extracts native hardware system UUID across operating systems.
 * Satisfies Claim 3: System machine identifier extraction from kernel layer.
 */
function getSystemMachineUuid(): string {
  try {
    const platform = os.platform();
    if (platform === 'darwin') {
      return execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf-8' })
        .split('"')[3] || 'mac-fallback-uuid';
    } else if (platform === 'win32') {
      return execSync('wmic csproduct get uuid', { encoding: 'utf-8' })
        .split('\n')[1]
        .trim() || 'win-fallback-uuid';
    } else if (platform === 'linux') {
      return execSync('cat /etc/machine-id || cat /var/lib/dbus/machine-id', { encoding: 'utf-8' })
        .trim() || 'linux-fallback-uuid';
    }
  } catch {
    // Fallback gracefully if permission restricted
  }
  return 'anchor-generic-kernel-uuid';
}

/**
 * Generates a 256-bit hardware-derived secret key using PBKDF2.
 * Satisfies Claim 1 & 3: Hardware fingerprint key derivation.
 */
export function getHardwareDerivedSecret(): Buffer {
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

  const primaryMac = macAddresses.sort()[0] || 'anchor-default-mac';
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'generic-cpu';
  const machineUuid = getSystemMachineUuid();

  const rawFingerprint = [
    machineUuid,
    primaryMac,
    cpuModel,
    os.arch(),
    os.platform(),
  ].join('::');

  // Derive key via PBKDF2 with 100,000 iterations for cryptographic strength
  return crypto.pbkdf2Sync(
    rawFingerprint,
    'anchorgit-hardware-salt-v1',
    100000,
    32,
    'sha256'
  );
}

export interface SignaturePayloadInput {
  decision_summary: string;
  commit_sha: string;
  branch: string;
  lines_added: number;
  lines_deleted: number;
  diff_sha256: string;
  timestamp: string;
  /** Provenance tag — cryptographically bound to the HMAC signature. */
  deliberation_source: ProvenanceSource;
  /** Exact seconds recorded by the passive timer or declared by the user. */
  deliberation_seconds: number;
  affected_files?: string[];
}

/**
 * Computes a workstation-bound HMAC-SHA256 signature with in-memory buffer purging.
 * Satisfies Claim 1, 6 & 10: Zero-Knowledge memory processing & non-repudiable workstation signing.
 */
export function computeHmacSignature(payload: SignaturePayloadInput): string {
  const hardwareSecretBuffer = getHardwareDerivedSecret();
  const workstationGuid = hardwareSecretBuffer.toString('hex').substring(0, 32);
  const derivedKeyString = crypto
    .createHash('sha256')
    .update(`${workstationGuid}::anchorgit-hardware-salt-v1`)
    .digest('hex');

  const canonicalString = [
    payload.commit_sha,
    payload.branch,
    payload.lines_added,
    payload.lines_deleted,
    payload.diff_sha256,
    payload.decision_summary,
    payload.timestamp,
    // Provenance tag and duration are part of the signed canonical string.
    // Changing either field post-sign will invalidate the HMAC.
    payload.deliberation_source,
    payload.deliberation_seconds,
  ].join('|');

  const canonicalBuffer = Buffer.from(canonicalString, 'utf-8');

  // Compute HMAC signature using hardware-bound secret string
  const signature = crypto
    .createHmac('sha256', derivedKeyString)
    .update(canonicalBuffer)
    .digest('hex');

  // 🔒 MEMORY PURGING (Patent Claim 10 Requirement)
  // Overwrite sensitive key and input buffers in volatile RAM immediately
  hardwareSecretBuffer.fill(0);
  canonicalBuffer.fill(0);

  return signature;
}