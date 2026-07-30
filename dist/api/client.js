"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDecision = sendDecision;
const config_js_1 = require("../core/config.js");
async function sendDecision(payload) {
    const config = (0, config_js_1.getConfig)();
    // If no API key is set, stay in local offline mode cleanly without calling fetch
    if (!config.apiKey) {
        console.log('🔒 Local Notary Mode Active: Decision logged locally.');
        console.log('   (To sync with team dashboards in the future, run `anchor pair <key>`)\n');
        return;
    }
    const apiUrl = config.apiUrl || 'https://api.anchorgit.com';
    try {
        const response = await fetch(`${apiUrl}/v1/decide`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
                'User-Agent': 'AnchorGit-CLI/0.1.0',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Synchronized with AnchorGit Cloud:', data.status || 'OK\n');
    }
    catch (error) {
        // Graceful offline fallback without raw stack traces
        console.log('ℹ️  Cloud Sync Skipped: Backend API currently offline or unreachable.');
        console.log('   (Local decision record saved successfully)\n');
    }
}
