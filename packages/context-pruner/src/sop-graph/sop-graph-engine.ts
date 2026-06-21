import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, basename, extname } from 'path';
import { tmpdir } from 'os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { SOPGraph, SOPRule, RuleItem } from '@runtime/shared';
export class SOPGraphEngine {
  private graphDir: string;
  constructor(repoPath?: string) { this.graphDir = repoPath || join(tmpdir(), 'runtime-sop-graph'); }
  init(): string {
    if (!existsSync(this.graphDir)) mkdirSync(this.graphDir, { recursive: true });
    const examplePath = join(this.graphDir, 'general.yaml');
    if (!existsSync(examplePath)) {
      writeFileSync(examplePath, `# SOP Graph: general\nversion: "1.0"\ndomains:\n  - domain: general\n    rules:\n      - action: require\n        target: "strict-mode"\n        reason: "Always use strict mode for type safety"\n      - action: forbid\n        target: "any-type"\n        reason: "Avoid 'any' type - prefer unknown or explicit types"\n`);
    }
    return this.graphDir;
  }
  addDomain(name: string, rules: RuleItem[]): SOPRule {
    if (!existsSync(this.graphDir)) this.init();
    const domain: SOPRule = { domain: name, rules };
    writeFileSync(join(this.graphDir, `${name}.yaml`), stringifyYaml({ version: '1.0', domains: [domain] }));
    return domain;
  }
  getDomain(name: string): SOPRule | null {
    const path = join(this.graphDir, `${name}.yaml`);
    if (!existsSync(path)) return null;
    return this.loadGraph(path).domains[0] || null;
  }
  listDomains(): string[] {
    if (!existsSync(this.graphDir)) return [];
    return readdirSync(this.graphDir).filter(f => f.endsWith('.yaml')).map(f => basename(f, extname(f)));
  }
  matchRules(filePath: string): SOPRule[] {
    if (!existsSync(this.graphDir)) return [];
    const matching: SOPRule[] = [];
    const files = readdirSync(this.graphDir).filter(f => f.endsWith('.yaml'));
    for (const f of files) {
      const graph = this.loadGraph(join(this.graphDir, f));
      for (const domain of graph.domains) {
        const domainName = basename(f, extname(f));
        if (filePath.toLowerCase().includes(domainName.toLowerCase()) || filePath.toLowerCase().includes(domain.domain.toLowerCase())) matching.push(domain);
      }
    }
    return matching;
  }
  removeDomain(name: string): boolean {
    const path = join(this.graphDir, `${name}.yaml`);
    if (!existsSync(path)) return false;
    try { unlinkSync(path); return true; } catch { return false; }
  }
  private loadGraph(path: string): SOPGraph { return parseYaml(readFileSync(path, 'utf-8')) as SOPGraph; }
}
