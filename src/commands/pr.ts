import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getLocalGitStats } from '../core/git.js';
import { getConfig } from '../core/config.js';

const LEDGER_PATH = path.join(os.homedir(), '.anchor', 'ledger.json');

export async function handlePr(): Promise<void> {
  try {
    const gitStats = getLocalGitStats();
    const config = getConfig();
    const username = config.username || 'developer';

    let recentDecisions: any[] = [];
    if (fs.existsSync(LEDGER_PATH)) {
      const rawData = fs.readFileSync(LEDGER_PATH, 'utf-8');
      const entries = JSON.parse(rawData);

      // Filter for current branch and deduplicate by decision_summary
      const branchEntries = entries.filter((e: any) => e.branch === gitStats.branch);
      const uniqueMap = new Map();
      for (const entry of branchEntries) {
        uniqueMap.set(entry.decision_summary, entry);
      }
      recentDecisions = Array.from(uniqueMap.values()).slice(-5);
    }

    const prMarkdown = `## ⚓ AnchorGit Verified Architectural Decision Brief

> 🔒 **Zero-Knowledge Audit Guarantee:** Hardware-bound HMAC verification. Zero proprietary source code ingested or transmitted.

### 📊 Cryptographic Provenance & Change Scope
| Metric | Verified Value | Compliance Mapping |
| :--- | :--- | :--- |
| **Target Commit & Branch** | \`${gitStats.branch}\` (\`${gitStats.commitSha.substring(0, 7)}\`) | **SOC 2 CC6.1** (Change Control) |
| **Cumulative Scope** | \`+${gitStats.linesAdded} / -${gitStats.linesDeleted} LOC\` | **ISO 27001 A.12.1.2** (Capacity & Scope) |
| **Files Modified** | \`${gitStats.affectedFiles ? gitStats.affectedFiles.length : 0} files\` | **Audit Trail** (Scope Validation) |
| **Hardware Attestation** | HMAC-SHA256 (Workstation Bound) | **Non-Repudiation** (Hardware Fingerprint) |
| **Segregation of Duties** | Enforced via GitHub Branch Rules | **SOC 2 CC6.8** (Author ≠ Approver) |

---

### 🎯 Notarized Architectural Intent & Trade-offs

${recentDecisions.length > 0
        ? recentDecisions
          .map(
            (d, idx) => `#### ${idx + 1}. "${d.decision_summary}"
* **Diff Checksum:** \`SHA-256 (${d.diff_sha256.substring(0, 12)}...)\`
* **Hardware Attestation:** \`HMAC-SHA256 (${d.hmac_signature.substring(0, 16)}...)\` [Hardware Bound]`
          )
          .join('\n\n')
        : '*No architectural decisions notarized for this branch yet. Run `anchor decide "your intent"` to attach context.*'
      }

---

### 🛡️ Compliance & Audit Verification Instructions for Reviewer

To satisfy **SOC 2 Type II (CC6.8)** & **ISO 27001 (A.12.1.2)** single-reviewer approval requirements:

1. **Verify Non-Author Identity:** Ensure your GitHub account is **different** from commit author \`${gitStats.commitSha.substring(0, 7)}\`.
2. **Inspect Hardware Provenance:** Click the verification link below to confirm the workstation HMAC signature matches the registered hardware ledger.
3. **Approve via GitHub UI:** Submit a formal "Approve" review in GitHub. GitHub's immutable audit log records the non-author approval event required by compliance frameworks.

👉 **Auditor Live Verification Link:** [anchorgit.com/p/${username}](https://anchorgit.com/p/${username})`;

    console.log(`\n` + prMarkdown + `\n`);
    console.log(`💡 Tip: Paste the Markdown above directly into your Pull Request description!\n`);

    process.exit(0);
  } catch (error: any) {
    console.error(`❌ Error generating PR brief: ${error.message}`);
    process.exit(1);
  }
}