import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { FileLockService } from '../src/lock/file-lock-service.js';
import { GitActionProxy } from '../src/git-proxy/git-action-proxy.js';

describe('GitActionProxy', () => {
  let tmpRepo: string;
  let lockService: FileLockService;
  let proxy: GitActionProxy;

  beforeAll(() => {
    tmpRepo = mkdtempSync(join(tmpdir(), 'gap-test-'));
    execSync('git init', { cwd: tmpRepo });
    execSync('git config user.email test@test.com', { cwd: tmpRepo });
    execSync('git config user.name test', { cwd: tmpRepo });
    writeFileSync(join(tmpRepo, 'readme.md'), 'hello');
    execSync('git add -A && git commit -m "initial"', { cwd: tmpRepo });

    lockService = new FileLockService(join(tmpRepo, '.runtime-locks.json'));
    proxy = new GitActionProxy(lockService, tmpRepo);
  });

  afterAll(() => {
    rmSync(tmpRepo, { recursive: true, force: true });
  });

  it('should get current branch', () => {
    expect(proxy.getCurrentBranch()).toBe('main');
  });

  it('should get git status', () => {
    expect(typeof proxy.getStatus()).toBe('string');
  });

  it('should commit with session prefix', () => {
    // Stage a change first
    writeFileSync(join(tmpRepo, 'readme.md'), 'hello world');
    execSync('git add readme.md', { cwd: tmpRepo });
    const output = proxy.commit('session-1', 'test commit');
    expect(output).toContain('session-1');
  });

  it('should install pre-commit hook', () => {
    proxy.installHook('session-1');
    const { existsSync } = require('fs');
    expect(existsSync(join(tmpRepo, '.git', 'hooks', 'pre-commit'))).toBe(true);
  });
});
