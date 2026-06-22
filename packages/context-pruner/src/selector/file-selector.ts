import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { globSync } from 'glob';
import type { FileScore } from '@runtime/shared';
export interface FileSelectorOptions { repoPath?: string; topK?: number; gitHistoryWeight?: number; importGraphWeight?: number; keywordWeight?: number; }
export class FileSelector {
  private repoPath: string; private topK: number; private weights: { gitHistory: number; importGraph: number; keyword: number };
  private cache: Map<string, { scores: FileScore[]; timestamp: number }> = new Map();
  private cacheTtlMs = 60000;
  constructor(options: FileSelectorOptions = {}) {
    this.repoPath = options.repoPath || process.cwd();
    this.topK = options.topK || 10;
    this.weights = { gitHistory: options.gitHistoryWeight ?? 0.4, importGraph: options.importGraphWeight ?? 0.3, keyword: options.keywordWeight ?? 0.3 };
  }
  selectRelatedFiles(activeFile: string): FileScore[] {
    const cacheKey = activeFile;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) return cached.scores;
    const sourceFiles = this.getSourceFiles();
    const keywords = this.extractKeywords(activeFile);
    const scores: FileScore[] = sourceFiles.filter(f => f !== activeFile).map(file => {
      const reasons: string[] = []; let score = 0;
      const gitScore = this.calcGitHistoryScore(file); score += gitScore * this.weights.gitHistory; if (gitScore > 0) reasons.push(`git:${gitScore.toFixed(2)}`);
      const importScore = this.calcImportScore(activeFile, file); score += importScore * this.weights.importGraph; if (importScore > 0) reasons.push(`import:${importScore.toFixed(2)}`);
      const kwScore = this.calcKeywordScore(file, keywords); score += kwScore * this.weights.keyword; if (kwScore > 0) reasons.push(`keyword:${kwScore.toFixed(2)}`);
      return { path: file, score, reasons };
    });
    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, this.topK);
    this.cache.set(cacheKey, { scores: top, timestamp: Date.now() });
    return top;
  }
  private getSourceFiles(): string[] {
    const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.rs', '**/*.go'];
    const files: string[] = [];
    for (const p of patterns) {
      try { const matches = globSync(p, { cwd: this.repoPath, ignore: ['node_modules/**', 'dist/**'] }); files.push(...matches); } catch {}
    }
    return [...new Set(files)];
  }
  private extractKeywords(filePath: string): string[] {
    const fullPath = `${this.repoPath}/${filePath}`;
    if (!existsSync(fullPath)) return [];
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const words = content.replace(/[^a-zA-Z0-9_]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !['import','from','const','let','var','function','return','export','default','async','await','this','throw','new','typeof'].includes(w));
      const freq = new Map<string, number>();
      words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
      return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([w]) => w);
    } catch { return []; }
  }
  private calcGitHistoryScore(filePath: string): number {
    try {
      const history = execFileSync('git', ['log', '--format=%H', '--follow', '--', filePath], {
        cwd: this.repoPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const count = history.trim() ? history.trim().split('\n').length : 0;
      return Math.min(1, count / 20);
    } catch { return 0; }
  }
  private calcImportScore(activeFile: string, targetFile: string): number {
    const fullPath = `${this.repoPath}/${activeFile}`;
    if (!existsSync(fullPath)) return 0;
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
      const targetName = targetFile.replace(/\.\w+$/, '');
      for (const imp of imports) { if (imp.includes(targetName) || targetName.includes(imp.replace(/from\s+['"]/,'').replace(/['"]/,''))) return 0.8; }
      return 0;
    } catch { return 0; }
  }
  private calcKeywordScore(filePath: string, keywords: string[]): number {
    const fullPath = `${this.repoPath}/${filePath}`;
    if (!existsSync(fullPath) || keywords.length === 0) return 0;
    try {
      const content = readFileSync(fullPath, 'utf-8').toLowerCase();
      return Math.min(1, keywords.filter(kw => content.includes(kw.toLowerCase())).length / keywords.length);
    } catch { return 0; }
  }
  invalidateCache() { this.cache.clear(); }
}
