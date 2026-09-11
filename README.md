# ⚓ AnchorGit CLI (`anchorgit`)

<p align="center">
  <b>Local-first, zero-knowledge decision notary and human intent engine for Git workflows.</b>
</p>

<p align="center">
  <a href="https://opensource.org/licenses/Apache-2.0"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License"></a>
  <a href="https://www.npmjs.com/package/anchorgit"><img src="https://img.shields.io/badge/npm-v1.0.0-emerald.svg" alt="npm version"></a>
  <a href="https://node.js.org"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node.js"></a>
</p>

---

## 💡 Why AnchorGit?

AI writes code at lightspeed. **AnchorGit proves why you built it.**

Git records *what* changed in your source code. AnchorGit notarizes *why* it changed—attaching verifiable trade-off rationale, architectural intent, and hardware-bound HMAC signatures to your commits **without ever exposing your raw source code**.

```
   ┌────────────────┐       ┌────────────────────┐       ┌──────────────────────┐
   │ Local Git Diff │ ───►  │ Local SHA-256 Hash │ ───►  │ Hardware HMAC Sign   │
   └────────────────┘       └────────────────────┘       └──────────┬───────────┘
                                                                    │
                                   Zero Source Code Transmitted     ▼
                                                         ┌──────────────────────┐
                                                         │ Cloud Decision Log   │
                                                         └──────────────────────┘
```

---

## ⚡ Quickstart

### 1. Installation

Install globally using `npm`:

```bash
npm install -g anchorgit
```

Or run directly with `npx`:

```bash
npx anchorgit --help
```

### 2. Pair Your Workstation

Authenticate your local CLI with your AnchorGit developer dashboard using your personal API key:

```bash
anchor pair <YOUR_API_KEY>
```

This derives a local hardware fingerprint, generates a secure salt, and persists config locally to `~/.anchor/config.json`.

### 3. Record an Architectural Decision

Log architectural trade-offs or steering decisions directly alongside your working directory changes:

```bash
anchor decide "Refactored auth token rotation to use Redis instead of in-memory store"
```

---

### 💡 When to Notarize (`anchor decide`)

Reserve `anchor decide` for high-leverage inflection points:

* **🟢 Do Notarize:** Architectural trade-offs, AI course corrections, security shifts, breaking schema changes.
* **🔴 Skip:** Typo fixes, CSS tweaks, linting, or routine dependency bumps.

## 💻 Command Reference

| Command | Usage | Description |
| :--- | :--- | :--- |
| **`pair`** | `anchor pair <api-key>` | Binds workstation hardware fingerprint & persists API credentials. |
| **`decide`** | `anchor decide "<message>"` | Hashes local diffs, signs payload via hardware HMAC, and syncs log. |
| **`log`** | `anchor log` | Displays formatted local decision ledger history. |
| **`context`** | `anchor context [path]` | Displays recent architectural decisions for a file or project. |
| **`pr`** | `anchor pr` | Generates a Markdown Pull Request Decision Brief for reviewers. |
| **`standup`** | `anchor standup` | Compiles recent decisions into a clean daily standup report. |
| **`whoami`** | `anchor whoami` | Displays currently paired developer identity and public profile link. |

---

### 🎛️ `anchor decide` Options

* `-c, --category <type>` — Category of decision (e.g. `architecture`, `ai-steering`, `security`; default: `architecture`).
* `-d, --deliberation <seconds>` — Deliberation focus time in seconds (default: `0`).
* `--dry-run` — Print the exact zero-knowledge JSON payload to stdout without sending.

---

## 🛡️ Enterprise Security & Zero-Knowledge Guarantee

Built for security-conscious teams, CISOs, and enterprise compliance:

* **Zero Source Code Ingestion:** AnchorGit **never** reads, transmits, or stores raw source code or environment secrets.
* **Local SHA-256 Hashing:** Diffs are parsed strictly on your local machine, hashed into `diff_sha256`, and discarded immediately.
* **Hardware HMAC Signatures:** Decision payloads are cryptographically signed using your workstation CPU/board identity and salt to prevent machine impersonation.
* **Inspect Payloads (`--dry-run`):** Inspect the exact JSON output before any network call occurs:

```bash
anchor decide "Auditing security payload" --dry-run
```

```json
{
  "id": "4a4303c8-925d-4206-a691-1194ea140874",
  "workstation_guid": "7bfd571acc9886bc3fae5a99888bbde8",
  "timestamp": "2026-09-11T06:51:11.439Z",
  "decision_summary": "Auditing security payload",
  "category": "architecture",
  "commit_sha": "7f97135c5cc93b9016ebd408a621519b4a312fb8",
  "branch": "main",
  "lines_added": 30,
  "lines_deleted": 24,
  "diff_sha256": "936a849f40f174bc4c28202ecfd37563337148d15c484577649d38d90980efd8",
  "affected_files": [
    "src/index.ts"
  ],
  "deliberation_seconds": 0,
  "deliberation_source": "cli_user_declared",
  "hmac_signature": "16abaef5c6a6e3c509f39a5e0d49b518c3379863aef1c0b786bc4d3eb15013c5"
}
```

---

## 📄 License

Distributed under the **Apache 2.0 License**. See [`LICENSE`](./LICENSE) for details.
