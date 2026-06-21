import { execSync } from 'child_process';
import { SessionManager } from '../session/session-manager.js';
export class WorktreeOrchestrator {
  constructor(private sessionManager: SessionManager, private repoPath: string = process.cwd()) {}
  addWorktree(sessionId: string, branch: string, targetDir?: string): string {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    const worktreePath = targetDir || `${this.repoPath}/../wt-${branch}`;
    try { execSync(`git branch ${branch} 2>/dev/null || true`, { cwd: this.repoPath }); } catch {}
    execSync(`git worktree add ${worktreePath} ${branch} 2>/dev/null || true`, { cwd: this.repoPath });
    this.sessionManager.updateWorktreePath(sessionId, worktreePath);
    return worktreePath;
  }
  removeWorktree(sessionId: string): void {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (!session.worktreePath) throw new Error(`Session ${sessionId} has no worktree`);
    execSync(`git worktree remove ${session.worktreePath} 2>/dev/null || true`, { cwd: this.repoPath });
    this.sessionManager.updateWorktreePath(sessionId, '');
  }
  listWorktrees(): { path: string; branch: string }[] {
    const output = execSync('git worktree list', { cwd: this.repoPath, encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split(/\s+/);
      return { path: parts[0], branch: parts[1]?.replace(/[\[\]]/g, '') || '' };
    });
  }
}
