import { describe, it, expect } from 'vitest';
import { FileSelector } from '../src/selector/file-selector.js'; import { TokenBudgetManager } from '../src/token-budget/token-budget-manager.js';
import { SOPGraphEngine } from '../src/sop-graph/sop-graph-engine.js'; import { PromptBuilder } from '../src/prompt-builder/prompt-builder.js';
describe('PromptBuilder', () => {
  it('build context', () => {
    const pb = new PromptBuilder(new FileSelector({topK:5}), new TokenBudgetManager(128000), new SOPGraphEngine());
    const ctx = pb.buildContext('x.ts');
    expect(ctx.systemPrompt).toBeDefined(); expect(Array.isArray(ctx.files)).toBe(true); expect(ctx.tokenEstimate).toBeGreaterThanOrEqual(0);
  });
  it('build prompt string', () => {
    const pb = new PromptBuilder(new FileSelector({topK:3}), new TokenBudgetManager(128000), new SOPGraphEngine());
    const p = pb.buildPrompt('x.ts');
    expect(p).toContain('ContextPruner'); expect(p).toContain('Rules'); expect(p).toContain('Files');
  });
});
