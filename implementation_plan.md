# HMAC Workstation Signatures & Provenance Flags

Add a `deliberation_source` provenance tag to every notarized decision, enabling the dashboard to distinguish passively IDE-tracked entries (hardware-HMAC-signed with real timer seconds) from manually self-declared CLI entries. The HMAC always covers the provenance tag and timestamp, so neither field can be forged without invalidating the signature.

---

## Proposed Changes

### Core — Crypto module

#### [MODIFY] [crypto.ts](file:///home/rahul-kewalramani/projects/personal/anchorgit-cli/src/core/crypto.ts)
- Extend `SignaturePayloadInput` to include `deliberation_source` and `deliberation_seconds` in the HMAC canonical string, so the provenance flag is **cryptographically bound** to the signature.  
- The canonical string becomes: `commit_sha|branch|lines_added|lines_deleted|diff_sha256|decision_summary|timestamp|deliberation_source|deliberation_seconds`

---

### Core — Config module

#### [MODIFY] [config.ts](file:///home/rahul-kewalramani/projects/personal/anchorgit-cli/src/core/config.ts)
- Export a new `ProvenanceSource` type alias: `'ide_passive_tracker' | 'cli_user_declared'`  
- No persistent-config change required; the type just lives here for shared import.

---

### API — Client payload type

#### [MODIFY] [client.ts](file:///home/rahul-kewalramani/projects/personal/anchorgit-cli/src/api/client.ts)
- Add `deliberation_source: ProvenanceSource` to `DecisionPayload` (required field).  
- Clean up the leftover debug `console.log` lines that print the raw API URL.

---

### Commands — decide

#### [MODIFY] [decide.ts](file:///home/rahul-kewalramani/projects/personal/anchorgit-cli/src/commands/decide.ts)
- Import `ProvenanceSource` from config.  
- Default provenance to `'cli_user_declared'` when invoked from the terminal.  
  - Accept `--source <source>` as a hidden flag so the VS Code extension can pass `ide_passive_tracker` programmatically (along with its recorded `deliberation_seconds`).
- Include `deliberation_source` in both the base payload **and** the HMAC input so it is signed.
- Update terminal output:
  - Show `🛡️ Verified Focus` badge when source is `ide_passive_tracker`
  - Show `📝 Self-Declared` badge when source is `cli_user_declared`

---

### Commands — context (read-side display)

#### [MODIFY] [context.ts](file:///home/rahul-kewalramani/projects/personal/anchorgit-cli/src/commands/context.ts)
- Extend `LedgerEntry` interface with `deliberation_source?: ProvenanceSource`.
- Display the correct verification badge per entry in `anchor context` output:
  - `🛡️ Verified Focus` for `ide_passive_tracker`
  - `📝 Self-Declared` for `cli_user_declared`
  - `🔹 Unknown` for entries written before this change (no field present).

---

### CLI entrypoint

#### [MODIFY] [index.ts](file:///home/rahul-kewalramani/projects/personal/anchorgit-cli/src/index.ts)
- Add `--source <source>` option to the `decide` command (marked as hidden so it doesn't clutter user-facing help).

---

### Backend (anchorgit-backend) — database & API

> [!IMPORTANT]
> The backend changes are required for the dashboard badges to render. Without them the new field will be accepted but ignored. Point the user to the backend repo if you need to coordinate merging both PRs together.

The backend needs:
1. **Migration** — add `deliberation_source VARCHAR(32) DEFAULT 'cli_user_declared'` to the `decisions` table.
2. **Strong-params allowlist** — permit `deliberation_source` inside `params.require(:decision).permit(...)`.
3. **Dashboard badge logic** — expose `deliberation_source` in the JSON response and use it to render:
   - `🛡️ Verified Focus` — `ide_passive_tracker`
   - `📝 Self-Declared` — `cli_user_declared`

---

## Security Model

| Property | Detail |
|---|---|
| HMAC coverage | `deliberation_source` + `deliberation_seconds` added to canonical string → tag cannot be changed post-sign |
| Zero-Knowledge guarantee preserved | `diff_sha256`, `affected_files`, `workstation_guid`, and `hmac_signature` still present in every payload |
| Self-declared forgery surface | A user could pass `--source ide_passive_tracker` from the CLI, but the extension's HMAC would use the same hardware-derived key — indistinguishable at the crypto layer. The semantic distinction lives in the *trust* model (extension-set vs. user-set), not in key separation. |

> [!NOTE]
> If stricter IDE-attestation is needed in the future, the extension can sign with a separate extension-provisioned key stored in VS Code's Secret Storage, making `ide_passive_tracker` cryptographically unforge-able from the CLI. That is out of scope for this change.

---

## Verification Plan

### Build
```
cd anchorgit-cli && npm run build
```

### Manual spot-checks
```bash
# 1. CLI self-declared (default)
anchor decide "Test provenance" --dry-run
# → deliberation_source: "cli_user_declared", badge: 📝 Self-Declared

# 2. IDE-style invocation (extension simulation)
anchor decide "Test provenance" --source ide_passive_tracker --deliberation 120 --dry-run
# → deliberation_source: "ide_passive_tracker", badge: 🛡️ Verified Focus

# 3. HMAC changes when source changes (different canonical string)
# Compare the hmac_signature hex between the two dry-run outputs above — they must differ.

# 4. Context display
anchor context
# → Each entry shows the correct badge based on stored deliberation_source
```
