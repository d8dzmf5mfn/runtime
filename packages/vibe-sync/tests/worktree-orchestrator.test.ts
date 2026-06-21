import { describe, it, expect } from 'vitest';
import { WorktreeOrchestrator } from '../src/worktree/worktree-orchestrator.js';
import { SessionManager } from '../src/session/session-manager.js';
describe('WorktreeOrchestrator', () => {
  it('throw for nonexistent session', () => {
    const sm = new SessionManager(); const wo = new WorktreeOrchestrator(sm, '/tmp');
    expect(() => wo.addWorktree('x', 'feat-x')).toThrow('not found');
    sm.close();
  });
  it('list worktrees', () => {
    const sm = new SessionManager(); const wo = new WorktreeOrchestrator(sm, '/tmp');
    expect(Array.isArray(wo.listWorktrees())).toBe(true);
    sm.close();
  });
});
