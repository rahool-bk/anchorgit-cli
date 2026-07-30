# ⚓ AnchorGit CLI (`anchorgit`)

> Cryptographic decision logging, intent notarization, and human steering for Git workflows.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

AnchorGit is a zero-knowledge developer tool that attaches verifiable intent, trade-offs, and human agency context to Git commits. It transforms raw Git commit history into audit-ready decision logs without exposing underlying source code.

---

## 🔒 Enterprise Security & Zero-Knowledge Guarantee

Chief Information Security Officers (CISOs) and security reviewers can audit this open-source repository directly to verify our zero-knowledge architecture.

- **Zero Source Code Ingestion:** AnchorGit **never** reads, transmits, or stores your raw source code, file contents, or environment secrets.
- **Local SHA-256 Hashing:** Raw code diffs are parsed strictly on your local workstation, hashed into SHA-256 strings (`diff_sha256`), and discarded immediately.
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

### 1. Pair Your Workstation

Link your local CLI with your AnchorGit developer dashboard using your personal API key:

```bash
anchor pair <YOUR_API_KEY>
```

This saves your local credentials securely in `~/.anchorgit/config.json`.

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
  "timestamp": "2026-07-31T02:22:18.000Z",
  "decision_summary": "Auditing security payload",
  "commit_sha": "a9c4e23b8f1...",
  "branch": "main",
  "lines_added": 42,
  "lines_deleted": 12,
  "diff_sha256": "e8b8c9d0f1a2b3c4567890abcdef1234567890abcdef1234567890abcdef1234"
}
```

---

### 3. Generate Engineering Impact Standups (`anchor standup`)

Generate a clean summary of recent decision logs and commit history to streamline morning standups and brag docs:

```bash
anchor standup
```

---

## 🛠️ Local Development & Contributing

We welcome community contributions! To set up `anchorgit-cli` locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anchorgit/anchorgit-cli.git
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
