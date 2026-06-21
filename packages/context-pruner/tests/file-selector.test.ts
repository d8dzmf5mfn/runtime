import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { FileSelector } from '../src/selector/file-selector.js';

describe('FileSelector', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'fs-test-'));
    // Create git repo with history
    execSync('git init', { cwd: tmpDir });
    execSync('git config user.email test@test.com', { cwd: tmpDir });
    execSync('git config user.name test', { cwd: tmpDir });

    // Create source files
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'auth.ts'), 'export function login() { return "token"; }');
    writeFileSync(join(tmpDir, 'src', 'user.ts'), 'import { login } from "./auth"; export function getUser() { return login(); }');
    writeFileSync(join(tmpDir, 'src', 'utils.ts'), 'export function format() { return "ok"; }');
    writeFileSync(join(tmpDir, 'src', 'types.ts'), 'export type User = { id: string };');

    execSync('git add -A && git commit -m "initial"', { cwd: tmpDir });

    // Modify auth.ts to give it git history weight
    writeFileSync(join(tmpDir, 'src', 'auth.ts'), 'export function login(token: string) { return token; }');
    execSync('git add -A && git commit -m "update auth"', { cwd: tmpDir });

    // Modify user.ts too (references auth)
    writeFileSync(join(tmpDir, 'src', 'user.ts'), 'import { login } from "./auth"; export function getUser(id: string) { return login(id); }');
    execSync('git add -A && git commit -m "update user"', { cwd: tmpDir });
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return related files sorted by score', () => {
    const fs = new FileSelector({ repoPath: tmpDir, topK: 5 });
    const results = fs.selectRelatedFiles('src/auth.ts');
    expect(results.length).toBeGreaterThan(0);
    // Results should be sorted descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it('should respect topK limit', () => {
    const fs = new FileSelector({ repoPath: tmpDir, topK: 2 });
    const results = fs.selectRelatedFiles('src/auth.ts');
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should include reason tags in results', () => {
    const fs = new FileSelector({ repoPath: tmpDir, topK: 5 });
    const results = fs.selectRelatedFiles('src/auth.ts');
    for (const r of results) {
      expect(Array.isArray(r.reasons)).toBe(true);
      expect(r.path).toBeDefined();
      expect(typeof r.score).toBe('number');
    }
  });

  it('should cache results for same file', () => {
    const fs = new FileSelector({ repoPath: tmpDir, topK: 5 });
    const r1 = fs.selectRelatedFiles('src/auth.ts');
    const r2 = fs.selectRelatedFiles('src/auth.ts');
    expect(r1).toEqual(r2);
  });

  it('should clear cache on invalidate', () => {
    const fs = new FileSelector({ repoPath: tmpDir, topK: 5 });
    const before = fs.selectRelatedFiles('src/auth.ts');
    fs.invalidateCache();
    // should recompute
    const after = fs.selectRelatedFiles('src/auth.ts');
    expect(after.length).toBe(before.length);
  });
});
