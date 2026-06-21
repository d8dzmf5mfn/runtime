import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { FileLockService, LockConflictError } from '../lock/file-lock-service.js';
export class GitActionProxy {
  constructor(private lockService: FileLockService, private repoPath: string = process.cwd()) {}
  commit(sessionId: string, message: string, files?: string[]): string {
    if (files && files.length > 0) {
      const conflicts = this.lockService.checkConflicts(files, sessionId);
      if (conflicts.length > 0) throw new LockConflictError(`Cannot commit: files locked by other sessions:\n${conflicts.map(c => `  ${c.file} (locked by ${c.lockedBy})`).join('\n')}`);
    }
    const fullMessage = `[${sessionId}] ${message}`;
    return execSync(`git commit -m "${fullMessage.replace(/"/g, '\\"')}"`, { cwd: this.repoPath, encoding: 'utf-8' }).trim();
  }
  push(sessionId: string, remote = 'origin', branch?: string): string {
    const sessionBranch = branch || this.getCurrentBranch();
    return execSync(`git push ${remote} ${sessionBranch}`, { cwd: this.repoPath, encoding: 'utf-8' }).trim();
  }
  getStatus(): string { return execSync('git status --short', { cwd: this.repoPath, encoding: 'utf-8' }).trim(); }
  getCurrentBranch(): string { return execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoPath, encoding: 'utf-8' }).trim(); }
  installHook(sessionId: string): void {
    writeFileSync(`${this.repoPath}/.git/hooks/pre-commit`, `#!/bin/sh\n# VibeSync pre-commit hook - session: ${sessionId}\necho "[VibeSync] Checking file locks..."\n`, { mode: 0o755 });
  }
}
