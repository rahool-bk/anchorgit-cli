"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePair = handlePair;
const config_js_1 = require("../core/config.js");
async function handlePair(token) {
    try {
        if (!token || token.trim().length === 0) {
            console.error('❌ Error: Token is required. Run `anchor pair <your-api-key>`');
            process.exit(1);
        }
        (0, config_js_1.saveConfig)({ apiKey: token.trim() });
        console.log('\n⚓ AnchorGit Paired Successfully!');
        console.log('   Device credentials stored locally in ~/.anchorgit/config.json');
        console.log('   You can now run `anchor decide "your message"` to notarize commits.\n');
    }
    catch (err) {
        console.error(`❌ Pairing failed: ${err.message}`);
        process.exit(1);
    }
}
