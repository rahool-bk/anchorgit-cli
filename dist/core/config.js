"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), '.anchorgit');
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'config.json');
function getConfig() {
    try {
        if (!fs_1.default.existsSync(CONFIG_FILE)) {
            return { apiUrl: 'https://api.anchorgit.com' };
        }
        const data = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return { apiUrl: 'https://api.anchorgit.com' };
    }
}
function saveConfig(config) {
    try {
        if (!fs_1.default.existsSync(CONFIG_DIR)) {
            fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        const existing = getConfig();
        const updated = { ...existing, ...config };
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    }
    catch (err) {
        throw new Error(`Failed to save config: ${err.message}`);
    }
}
