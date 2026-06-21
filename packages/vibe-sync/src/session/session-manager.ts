import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';
import type { Session, CreateSessionOptions, SessionStatus, AgentType } from '@runtime/shared';

const RUNTIME_DIR = join(tmpdir(), 'runtime-data');

function ensureDir(): void { if (!existsSync(RUNTIME_DIR)) mkdirSync(RUNTIME_DIR, { recursive: true }); }
function loadSessions(): Session[] {
  ensureDir();
  const p = join(RUNTIME_DIR, 'sessions.json');
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return []; }
}
function saveSessions(s: Session[]): void { ensureDir(); writeFileSync(join(RUNTIME_DIR, 'sessions.json'), JSON.stringify(s, null, 2)); }

export class SessionManager {
  createSession(opts: CreateSessionOptions): Session {
    const sessions = loadSessions();
    const id = nanoid(12);
    const now = new Date().toISOString();
    const s: Session = { id, agent: opts.agent, name: opts.name, branch: opts.branch, worktreePath: '', status: 'active', createdAt: now, updatedAt: now, metadata: opts.metadata || {} };
    sessions.push(s); saveSessions(sessions); return s;
  }
  getSession(id: string): Session | null { return loadSessions().find(s => s.id === id) || null; }
  listSessions(status?: SessionStatus): Session[] {
    const s = loadSessions();
    return status ? s.filter(x => x.status === status) : s.reverse();
  }
  updateSessionStatus(id: string, status: SessionStatus): Session | null {
    const s = loadSessions(); const i = s.findIndex(x => x.id === id); if (i === -1) return null;
    s[i].status = status; s[i].updatedAt = new Date().toISOString(); saveSessions(s); return s[i];
  }
  updateWorktreePath(id: string, wp: string): Session | null {
    const s = loadSessions(); const i = s.findIndex(x => x.id === id); if (i === -1) return null;
    s[i].worktreePath = wp; s[i].updatedAt = new Date().toISOString(); saveSessions(s); return s[i];
  }
  deleteSession(id: string): boolean {
    const s = loadSessions(); const i = s.findIndex(x => x.id === id); if (i === -1) return false;
    s.splice(i, 1); saveSessions(s); return true;
  }
  close(): void {}
}
