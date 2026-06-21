import { describe, it, expect } from 'vitest';
import { FileLockService, LockConflictError } from '../src/lock/file-lock-service.js';
describe('FileLockService', () => {
  it('acquire lock', () => {
    const ls = new FileLockService();
    const l = ls.acquireLock('src/test.ts', 's1', 'test');
    expect(l.file).toBe('src/test.ts');
    ls.releaseLock('src/test.ts'); ls.close();
  });
  it('conflict detection', () => {
    const ls = new FileLockService();
    ls.acquireLock('src/test.ts', 's1');
    expect(() => ls.acquireLock('src/test.ts', 's2')).toThrow(LockConflictError);
    ls.releaseLock('src/test.ts'); ls.close();
  });
  it('list and release', () => {
    const ls = new FileLockService();
    ls.acquireLock('a.ts', 's1'); ls.acquireLock('b.ts', 's2');
    expect(ls.listLocks().length).toBe(2);
    expect(ls.releaseLock('a.ts')).toBe(true);
    expect(ls.getLock('a.ts')).toBeNull();
    ls.releaseLock('b.ts'); ls.close();
  });
  it('check conflicts', () => {
    const ls = new FileLockService();
    ls.acquireLock('a.ts', 's1'); ls.acquireLock('b.ts', 's2');
    expect(ls.checkConflicts(['a.ts', 'b.ts'], 's3').length).toBe(2);
    ls.releaseLock('a.ts'); ls.releaseLock('b.ts'); ls.close();
  });
  it('release session locks', () => {
    const ls = new FileLockService();
    ls.acquireLock('sl.ts', 'ls');
    expect(ls.releaseSessionLocks('ls')).toBe(1);
    ls.close();
  });
});
