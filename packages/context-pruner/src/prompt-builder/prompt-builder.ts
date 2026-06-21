import type { FileScore, SOPRule, CompiledContext } from '@runtime/shared';
import { FileSelector } from '../selector/file-selector.js';
import { TokenBudgetManager } from '../token-budget/token-budget-manager.js';
import { SOPGraphEngine } from '../sop-graph/sop-graph-engine.js';
export interface PromptBuilderOptions { maxTokens?: number; includeFileContents?: boolean; }
export class PromptBuilder {
  private fileSelector: FileSelector; private tokenBudget: TokenBudgetManager; private sopEngine: SOPGraphEngine; private options: Required<PromptBuilderOptions>;
  constructor(fileSelector: FileSelector, tokenBudget: TokenBudgetManager, sopEngine: SOPGraphEngine, options: PromptBuilderOptions = {}) {
    this.fileSelector = fileSelector; this.tokenBudget = tokenBudget; this.sopEngine = sopEngine;
    this.options = { maxTokens: options.maxTokens ?? 128000, includeFileContents: options.includeFileContents ?? false };
  }
  buildContext(activeFile: string, sessionId?: string): CompiledContext {
    const selectedFiles = this.fileSelector.selectRelatedFiles(activeFile);
    const matchedRules = this.sopEngine.matchRules(activeFile);
    const systemPrompt = this.buildSystemPrompt(matchedRules);
    const { total } = this.tokenBudget.estimateTokens(selectedFiles);
    const trimmedFiles = total > this.options.maxTokens ? this.tokenBudget.trimToBudget(selectedFiles, systemPrompt.length / 4) : selectedFiles;
    this.tokenBudget.recordUsage(`prompt:${activeFile}`, total);
    return { systemPrompt, files: trimmedFiles, rules: matchedRules, tokenEstimate: Math.min(total, this.options.maxTokens) };
  }
  buildPrompt(activeFile: string, sessionId?: string): string {
    const ctx = this.buildContext(activeFile, sessionId);
    const parts: string[] = [];
    parts.push('<!-- ContextPruner: Compiled Context -->'); parts.push('');
    parts.push('## Rules');
    for (const domain of ctx.rules) {
      parts.push(`### Domain: ${domain.domain}`);
      for (const rule of domain.rules) parts.push(`- ${rule.action === 'require' ? '✅ MUST' : '🚫 MUST NOT'} ${rule.target}: ${rule.reason}`);
    }
    parts.push(''); parts.push('## Related Files');
    for (const file of ctx.files) parts.push(`- ${file.path} (relevance: ${(file.score * 100).toFixed(0)}%)`);
    parts.push(''); parts.push(`<!-- Token estimate: ${ctx.tokenEstimate} -->`);
    return parts.join('\n');
  }
  private buildSystemPrompt(rules: SOPRule[]): string {
    if (rules.length === 0) return '';
    const lines: string[] = ['You must follow these coding policies:'];
    for (const domain of rules) for (const rule of domain.rules) lines.push(`- You ${rule.action === 'require' ? 'MUST' : 'MUST NOT'} ${rule.target}. Reason: ${rule.reason}`);
    return lines.join('\n');
  }
}
