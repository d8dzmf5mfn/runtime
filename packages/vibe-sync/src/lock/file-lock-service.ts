import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path'; import { nanoid } from 'nanoid';
import { tmpdir } from 'os';
import type { FileLock, LockConflict } from '@runtime/shared';

const RUNTIME_DIR = join(tmpdir(), 'runtime-data');
function ensureDir(): void { if (!existsSync(RUNTIME_DIR)) mkdirSync(RUNTIME_DIR, { recursive: true }); }
function loadLocks(): FileLock[] { ensureDir(); const p = join(RUNTIME_DIR, 'locks.json'); if (!existsSync(p)) return []; try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return []; } }
function saveLocks(l: FileLock[]): void { ensureDir(); writeFileSync(join(RUNTIME_DIR, 'locks.json'), JSON.stringify(l, null, 2)); }

export class LockConflictError extends Error { constructor(m: string) { super(m); this.name = 'LockConflictError'; } }

export class FileLockService {
  private defaultTtlMs: number;
  constructor(_dbPath?: string, defaultTtlMs = 300000) { this.defaultTtlMs = defaultTtlMs; this.cleanExpiredLocks(); }

  acquireLock(file: string, sessionId: string, reason?: string, ttlMs?: number): FileLock {
    this.cleanExpiredLocks();
    const existing = this.getLock(file);
    if (existing) throw new LockConflictError(`File "${file}" is already locked by session ${existing.sessionId}`);
    const now = Date.now(); const ttl = ttlMs || this.defaultTtlMs;
    const lock: FileLock = { file, sessionId, acquiredAt: new Date(now).toISOString(), expiresAt: new Date(now + ttl).toISOString(), reason };
    const locks = loadLocks(); locks.push(lock); saveLocks(locks); return lock;
  }

  releaseLock(file: string): boolean {
    this.cleanExpiredLocks(); const locks = loadLocks(); const i = locks.findIndex(l => l.file === file); if (i === -1) return false;
    locks.splice(i, 1); saveLocks(locks); return true;
  }

  releaseSessionLocks(sessionId: string): number {
    this.cleanExpiredLocks(); const locks = loadLocks(); const before = locks.length;
    const remaining = locks.filter(l => l.sessionId !== sessionId); saveLocks(remaining); return before - remaining.length;
  }

  getLock(file: string): FileLock | null { this.cleanExpiredLocks(); return loadLocks().find(l => l.file === file) || null; }

  listLocks(): FileLock[] { this.cleanExpiredLocks(); return loadLocks(); }

  checkConflicts(files: string[], sessionId: string): LockConflict[] {
    this.cleanExpiredLocks(); const locks = loadLocks(); const conflicts: LockConflict[] = [];
    for (const file of files) { const lock = locks.find(l => l.file === file); if (lock && lock.sessionId !== sessionId) conflicts.push({ file, requestedBy: sessionId, lockedBy: lock.sessionId, lockedAt: lock.acquiredAt }); }
    return conflicts;
  }

  private cleanExpiredLocks() {
    const now = new Date().toISOString(); const locks = loadLocks(); const active = locks.filter(l => l.expiresAt > now);
    if (active.length !== locks.length) saveLocks(active);
  }

  close(): void {}
}
