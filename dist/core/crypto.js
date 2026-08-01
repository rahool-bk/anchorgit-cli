"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHardwareDerivedSecret = getHardwareDerivedSecret;
exports.computeHmacSignature = computeHmacSignature;
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_os_1 = __importDefault(require("node:os"));
/**
 * Generates a stable, non-editable 256-bit workstation secret in memory.
 * Combines CPU model, platform, architecture, and physical MAC addresses.
 */
function getHardwareDerivedSecret() {
    const networkInterfaces = node_os_1.default.networkInterfaces();
    const macAddresses = [];
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
    const cpus = node_os_1.default.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'generic-cpu';
    const rawFingerprint = [
        node_os_1.default.hostname(),
        node_os_1.default.platform(),
        node_os_1.default.arch(),
        cpuModel,
        primaryMac,
    ].join('::');
    return node_crypto_1.default
        .createHash('sha256')
        .update(rawFingerprint)
        .digest('hex');
}
/**
 * Computes an immutable SHA-256 HMAC signature bound to the workstation hardware identity.
 */
function computeHmacSignature(payload) {
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
    return node_crypto_1.default
        .createHmac('sha256', hardwareSecret)
        .update(canonicalString)
        .digest('hex');
}
