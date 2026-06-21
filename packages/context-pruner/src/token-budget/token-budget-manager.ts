import { readFileSync, existsSync } from 'fs';
import type { FileScore, TokenBudget } from '@runtime/shared';
interface HistoryEntry { key: string; tokens: number; timestamp: number; }
export class TokenBudgetManager {
  private maxTokens: number; private history: HistoryEntry[] = []; private usedTokens = 0; private maxHistorySize: number;
  constructor(maxTokens = 128000, maxHistorySize = 50) { this.maxTokens = maxTokens; this.maxHistorySize = maxHistorySize; }
  estimateTokens(files: FileScore[]): { fileTokens: { path: string; tokens: number }[]; total: number } {
    const fileTokens = files.map(f => ({ path: f.path, tokens: this.countFileTokens(f.path) }));
    return { fileTokens, total: fileTokens.reduce((sum, f) => sum + f.tokens, 0) };
  }
  trimToBudget(files: FileScore[], additionalTokens = 0): FileScore[] {
    const budget = this.maxTokens - this.usedTokens - additionalTokens;
    if (budget <= 0) return [];
    const result: FileScore[] = []; let used = 0;
    for (const file of files) { const tokens = this.countFileTokens(file.path); if (used + tokens <= budget) { result.push(file); used += tokens; } else break; }
    return result;
  }
  recordUsage(key: string, tokens: number): void {
    this.usedTokens += tokens;
    this.history.push({ key, tokens, timestamp: Date.now() });
    if (this.history.length > this.maxHistorySize) { const removed = this.history.shift()!; this.usedTokens -= removed.tokens; }
  }
  truncateOutput(text: string, maxTokens = 30000): string {
    const approxTokens = Math.ceil(text.length / 4);
    if (approxTokens <= maxTokens) return text;
    return text.slice(0, maxTokens * 4) + '\n\n<!-- [ContextPruner] Truncated: output exceeded token limit -->';
  }
  getBudget(): TokenBudget { return { maxTokens: this.maxTokens, usedTokens: this.usedTokens, remainingTokens: this.maxTokens - this.usedTokens }; }
  reset(): void { this.usedTokens = 0; this.history = []; }
  private countFileTokens(filePath: string): number {
    const fullPath = `${process.cwd()}/${filePath}`;
    if (!existsSync(fullPath)) return 0;
    try { const content = readFileSync(fullPath, 'utf-8'); return Math.ceil(content.length / 4); } catch { return 0; }
  }
}
