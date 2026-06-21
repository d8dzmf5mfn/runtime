import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, rmSync } from 'fs'; import { join } from 'path'; import { tmpdir } from 'os';
import { SOPGraphEngine } from '../src/sop-graph/sop-graph-engine.js';
describe('SOPGraphEngine', () => {
  const td = join(tmpdir(), 'rt-sop-' + Date.now()); let e: SOPGraphEngine;
  beforeAll(() => { e = new SOPGraphEngine(td); });
  afterAll(() => { if (existsSync(td)) rmSync(td, { recursive: true }); });
  it('init', () => { const d = e.init(); expect(existsSync(d)).toBe(true); });
  it('add domain', () => { const d = e.addDomain('test', [{action:'require',target:'sm',reason:'ts'}]); expect(d.domain).toBe('test'); });
  it('list domains', () => { expect(e.listDomains()).toContain('general'); });
  it('match rules', () => { expect(Array.isArray(e.matchRules('src/pay.ts'))).toBe(true); });
  it('get domain', () => { expect(e.getDomain('test')).not.toBeNull(); });
  it('remove domain', () => { e.removeDomain('test'); expect(e.getDomain('test')).toBeNull(); });
});
