import { describe, it, expect } from 'vitest';
import { TokenBudgetManager } from '../src/token-budget/token-budget-manager.js';
describe('TokenBudgetManager', () => {
  it('estimate tokens', () => { const tb = new TokenBudgetManager(128000); const e = tb.estimateTokens([{path:'x.ts',score:1,reasons:['t']}]); expect(e.total).toBeGreaterThanOrEqual(0); });
  it('track budget', () => { const tb = new TokenBudgetManager(100000); tb.recordUsage('ctx', 5000); const b = tb.getBudget(); expect(b.usedTokens).toBe(5000); expect(b.remainingTokens).toBe(95000); });
  it('truncate output', () => { const tb = new TokenBudgetManager(); const t = tb.truncateOutput('x'.repeat(200000), 10000); expect(t.length).toBeLessThan(200000); expect(t).toContain('ContextPruner'); });
  it('trim to budget', () => { const tb = new TokenBudgetManager(1000); const t = tb.trimToBudget([{path:'a.ts',score:1,reasons:[]},{path:'b.ts',score:0.9,reasons:[]},{path:'c.ts',score:0.8,reasons:[]}], 200); expect(t.length).toBeLessThanOrEqual(3); });
  it('reset', () => { const tb = new TokenBudgetManager(); tb.recordUsage('ctx', 10000); tb.reset(); expect(tb.getBudget().usedTokens).toBe(0); });
});
