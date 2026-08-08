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

    // Fallback: Only use HEAD~1 -> HEAD if working tree is completely clean
    if (!hasWorkingTreeChanges) {
      try {
        rawDiff = execSync('git diff HEAD~1 HEAD', { encoding: 'utf-8' });
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

    // 6. List of Affected Files
    let affectedFilesRaw = '';
    try {
      affectedFilesRaw = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
      if (!affectedFilesRaw.trim() && !hasWorkingTreeChanges) {
        affectedFilesRaw = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
      }
    } catch {
      affectedFilesRaw = '';
    }

    const trackedAffectedFiles = affectedFilesRaw
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const affectedFiles = Array.from(new Set([...trackedAffectedFiles, ...untrackedFiles]));

    // 7. 🔒 MEMORY PURGING & CRYPTOGRAPHIC HASHING
    const fullDiffText = rawDiff + untrackedContent || `${commitSha}:${branch}:${affectedFiles.join(',')}`;
    const diffBuffer = Buffer.from(fullDiffText, 'utf-8');

    // SHA-256 Checksum over working tree state
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