import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { WorktreeOrchestrator } from '../src/worktree/worktree-orchestrator.js';
import { SessionManager } from '../src/session/session-manager.js';

describe('WorktreeOrchestrator', () => {
  let tmpRepo: string;

  beforeAll(() => {
    tmpRepo = mkdtempSync(join(tmpdir(), 'wt-test-'));
    execSync('git init', { cwd: tmpRepo });
    execSync('git config user.email test@test.com', { cwd: tmpRepo });
    execSync('git config user.name test', { cwd: tmpRepo });
    execSync('git commit --allow-empty -m "initial"', { cwd: tmpRepo });
  });

  afterAll(() => {
    rmSync(tmpRepo, { recursive: true, force: true });
  });

  it('throw for nonexistent session', () => {
    const sm = new SessionManager();
    const wo = new WorktreeOrchestrator(sm, tmpRepo);
    expect(() => wo.addWorktree('x', 'feat-x')).toThrow('not found');
    sm.close();
  });

  it('list worktrees', () => {
    const sm = new SessionManager();
    const wo = new WorktreeOrchestrator(sm, tmpRepo);
    expect(Array.isArray(wo.listWorktrees())).toBe(true);
    sm.close();
  });
});
