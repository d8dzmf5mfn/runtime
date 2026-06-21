import { describe, it, expect } from 'vitest';
import { SessionManager } from '../src/session/session-manager.js';
describe('SessionManager', () => {
  it('create session', () => {
    const sm = new SessionManager();
    const s = sm.createSession({ agent: 'cursor', name: 'test', branch: 'feat-test' });
    expect(s.id).toBeDefined(); expect(s.agent).toBe('cursor'); expect(s.status).toBe('active');
    sm.deleteSession(s.id); sm.close();
  });
  it('list sessions', () => {
    const sm = new SessionManager();
    sm.createSession({ agent: 'claude', name: 's2', branch: 'feat-2' });
    expect(sm.listSessions().length).toBeGreaterThanOrEqual(1);
    const all = sm.listSessions(); all.forEach(s => sm.deleteSession(s.id)); sm.close();
  });
  it('get by id', () => {
    const sm = new SessionManager(); const c = sm.createSession({ agent: 'custom', name: 'get-test', branch: 'feat-g' });
    expect(sm.getSession(c.id)!.name).toBe('get-test');
    sm.deleteSession(c.id); sm.close();
  });
  it('update status', () => {
    const sm = new SessionManager(); const c = sm.createSession({ agent: 'cursor', name: 'st', branch: 'feat-st' });
    expect(sm.updateSessionStatus(c.id, 'paused')!.status).toBe('paused');
    sm.deleteSession(c.id); sm.close();
  });
  it('delete', () => {
    const sm = new SessionManager(); const c = sm.createSession({ agent: 'cursor', name: 'del', branch: 'feat-del' });
    expect(sm.deleteSession(c.id)).toBe(true); expect(sm.getSession(c.id)).toBeNull(); sm.close();
  });
});
