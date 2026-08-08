# ⚓ AnchorGit CLI (`anchorgit`)

> **Local-First & Hardware-Signed Decision Notary for Git**  
> AI writes code at lightspeed. AnchorGit proves **why** you built it.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

AnchorGit is a zero-knowledge developer tool that attaches verifiable intent, trade-offs, and human agency context to Git commits. It binds local commit diffs to your physical workstation using **hardware-derived HMAC signatures**, transforming raw Git commit history into audit-ready decision logs without ever exposing underlying source code.

---

## 🔒 Enterprise Security & Zero-Knowledge Guarantee

Chief Information Security Officers (CISOs) and security reviewers can audit this open-source repository directly to verify our zero-knowledge architecture.

- **Zero Source Code Ingestion:** AnchorGit **never** reads, transmits, or stores your raw source code, file contents, or environment secrets.
- **Local SHA-256 Hashing:** Raw code diffs are parsed strictly on your local workstation, hashed into SHA-256 strings (`diff_sha256`), and discarded immediately.
- **Hardware-Bound HMAC Signatures:** Decision payloads are cryptographically signed using a local hardware salt combined with your workstation GUID, preventing commit forgery across machines.
- **Auditable Payloads (`--dry-run`):** Developers and security teams can inspect the exact raw JSON object before any network call occurs.
- **Corporate Proxy Support:** Fully respects standard system proxy configurations (`HTTP_PROXY`, `HTTPS_PROXY`) for outbound network monitoring via Wireshark, Burp Suite, or Zscaler.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Git**: Installed and configured on your local machine

### Installation

Install globally via `npm`:

```bash
npm install -g anchorgit
```

Or run directly without installation using `npx`:

```bash
npx anchorgit --help
```

---

## 💻 Usage & Commands

### 1. Pair Your Workstation (`anchor pair`)

Link your local CLI with your AnchorGit developer dashboard using your personal API key (`ag_live_*`):

```bash
anchor pair <YOUR_API_KEY>
```

This derives your local hardware fingerprint, generates a secure salt, and persists credentials in `~/.anchor/config.json`.

---

### 2. Notarize an Architectural Decision (`anchor decide`)

Log architectural trade-offs, design choices, or AI-steering decisions directly alongside your working directory changes:

```bash
anchor decide "Refactored auth token rotation to use Redis instead of memory"
```

#### Inspect Payload Locally (`--dry-run`)

To verify that zero source code leaves your workstation:

```bash
anchor decide "Auditing security payload" --dry-run
```

**Sample Output Payload:**
```json
{
  "workstation_guid": "7bfd571acc9886bc3fae5a99888bbde8",
  "timestamp": "2026-08-08T11:47:00.926Z",
  "decision_summary": "Auditing security payload",
  "commit_sha": "7f97135c5cc93b9016ebd408a621519b4a312fb8",
  "branch": "main",
  "lines_added": 30,
  "lines_deleted": 24,
  "diff_sha256": "936a849f40f174bc4c28202ecfd37563337148d15c484577649d38d90980efd8",
  "affected_files": ["src/api/client.ts", "src/commands/decide.ts"],
  "hmac_signature": "16abaef5c6a6e3c509f39a5e0d49b518c3379863aef1c0b786bc4d3eb15013c5"
}
```

---

### 3. Recall Recent Context (`anchor context`)

Display recent local architectural decisions to quickly resume work, review branch history, or onboard teammates:

```bash
anchor context
```

---

### 4. Generate Engineering Impact Standups (`anchor standup`)

Generate a clean markdown summary of recent decision logs and commit history to streamline morning standups and brag docs:

```bash
anchor standup
```

---

## ⚙️ Configuration File

Configuration and local decision cache are stored inside your home directory:

- **Config Path:** `~/.anchor/config.json`
- **Local Ledger:** `~/.anchor/ledger.json`

To point the CLI to a custom or self-hosted backend endpoint:

```bash
export ANCHORGIT_API_URL="[https://api.yourdomain.com/api](https://api.yourdomain.com/api)"
```

---

## 🛠️ Local Development & Contributing

We welcome community contributions! To set up `anchorgit-cli` locally:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/anchorgit/anchorgit-cli.git](https://github.com/anchorgit/anchorgit-cli.git)
   cd anchorgit-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the TypeScript source:**
   ```bash
   npm run build
   ```

4. **Link locally for testing:**
   ```bash
   npm link
   node bin/anchor.js decide "Testing local build" --dry-run
   ```

---

## 📄 License

Distributed under the **Apache 2.0 License**. See the [`LICENSE`](./LICENSE) file for details.
