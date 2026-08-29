import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';

export interface GitStats {
  commitSha: string;
  branch: string;
  linesAdded: number;
  linesDeleted: number;
  diffHash: string;
  affectedFiles: string[];
}

export function getLocalGitStats(): GitStats {
  try {
    // 1. Current Branch & Commit SHA
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

    // 2. Untracked Files Detection
    let untrackedFiles: string[] = [];
    try {
      const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
      untrackedFiles = statusOutput
        .split('\n')
        .filter((line) => line.startsWith('??'))
        .map((line) => line.substring(3).trim())
        .filter(Boolean);
    } catch {
      untrackedFiles = [];
    }

    // 3. Tracked Diff (staged + unstaged working tree changes)
    let rawDiff = '';
    try {
      rawDiff = execSync('git diff HEAD', { encoding: 'utf-8' });
    } catch {
      rawDiff = '';
    }

    // 4. Calculate untracked files content & line count
    let untrackedContent = '';
    let untrackedLinesAdded = 0;

    for (const file of untrackedFiles) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf-8');
          untrackedContent += `\n--- /dev/null\n+++ b/${file}\n` + content;
          untrackedLinesAdded += content.split('\n').length;
        }
      } catch {
        // Skip unreadable files
      }
    }

    const hasWorkingTreeChanges = rawDiff.trim().length > 0 || untrackedFiles.length > 0;

    // Fallback: Inspect the latest commit (HEAD) directly if working tree is clean
    if (!hasWorkingTreeChanges) {
      try {
        // Show diff for HEAD commit specifically
        rawDiff = execSync('git show --format="" HEAD', { encoding: 'utf-8' });
      } catch {
        rawDiff = '';
      }
    }

    // 5. Compute LOC metrics
    let linesAdded = untrackedLinesAdded;
    let linesDeleted = 0;
    const lines = rawDiff.split('\n');

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        linesAdded++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        linesDeleted++;
      }
    }

    // 6. List of Affected Files (Scoped to HEAD)
    let affectedFilesRaw = '';
    try {
      if (hasWorkingTreeChanges) {
        affectedFilesRaw = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
      } else {
        // Explicitly extract ONLY the files committed in HEAD
        affectedFilesRaw = execSync('git show --name-only --format="" HEAD', { encoding: 'utf-8' });
      }
    } catch {
      affectedFilesRaw = '';
    }

    const trackedAffectedFiles = affectedFilesRaw
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    // Filter unique files and eliminate dirty directory remnants
    const affectedFiles = Array.from(
      new Set(hasWorkingTreeChanges ? [...trackedAffectedFiles, ...untrackedFiles] : trackedAffectedFiles)
    );

    // 7. 🔒 MEMORY PURGING & CRYPTOGRAPHIC HASHING
    const fullDiffText = rawDiff + untrackedContent || `${commitSha}:${branch}:${affectedFiles.join(',')}`;
    const diffBuffer = Buffer.from(fullDiffText, 'utf-8');

    // SHA-256 Checksum over state
    const diffHash = crypto.createHash('sha256').update(diffBuffer).digest('hex');

    // PURGE VOLATILE MEMORY (Patent Claim Requirement)
    diffBuffer.fill(0);

    return {
      commitSha,
      branch,
      linesAdded,
      linesDeleted,
      diffHash,
      affectedFiles,
    };
  } catch (err: any) {
    throw new Error(`Failed to read Git stats: ${err.message}`);
  }
}