import { Command } from 'commander';
import chalk from 'chalk';
import { FileSelector, TokenBudgetManager, SOPGraphEngine, PromptBuilder } from '@runtime/context-pruner';
export function contextCommands(): Command {
  const ctx = new Command('context').description('ContextPruner - JIT context compilation for AI agents');
  
  ctx.command('select').description('Select relevant files for a given active file').argument('<file>', 'Active file path').option('-k, --top-k <n>', 'Number of files to return', '10').action((file, options) => {
    const selector = new FileSelector({ topK: parseInt(options.topK) });
    const scores = selector.selectRelatedFiles(file);
    if (scores.length === 0) { console.log(chalk.dim('No related files found')); return; }
    console.log(chalk.bold(`\nRelated files for ${chalk.cyan(file)}:\n`));
    for (const s of scores) console.log(`  ${chalk.green((s.score * 100).toFixed(0) + '%')} ${chalk.bold(s.path)}\n     ${chalk.dim('█'.repeat(Math.round(s.score * 10)))} ${s.reasons.join(', ')}`);
  });
  
  ctx.command('budget').description('Estimate token budget for a set of files').argument('<files...>', 'Files to estimate').action((files) => {
    const tb = new TokenBudgetManager();
    const fileScores = files.map((f: string) => ({ path: f, score: 1, reasons: ['explicit'] }));
    const estimate = tb.estimateTokens(fileScores);
    const budget = tb.getBudget();
    console.log(chalk.bold('\nToken Budget:\n'));
    for (const f of estimate.fileTokens) console.log(`  ${chalk.bold(f.path)}: ${chalk.yellow(f.tokens.toLocaleString())} tokens`);
    console.log(`\n  Total: ${chalk.bold(estimate.total.toLocaleString())} / ${chalk.bold(budget.maxTokens.toLocaleString())} tokens`);
    console.log(`  Remaining: ${chalk.green(budget.remainingTokens.toLocaleString())} tokens`);
  });
  
  ctx.command('sop-init').description('Initialize .sop-graph directory with example policy').action(() => {
    const engine = new SOPGraphEngine();
    console.log(chalk.green('✓') + ` Initialized SOP Graph at ${chalk.bold(engine.init())}`);
  });
  
  ctx.command('sop-add').description('Add a SOP domain with rules').argument('<domain>', 'Domain name').option('-r, --rules <json>', 'Rules as JSON array').action((domain, options) => {
    const rules = options.rules ? JSON.parse(options.rules) : [{ action: 'require', target: `${domain}-standards`, reason: `Follow ${domain} best practices` }];
    const engine = new SOPGraphEngine(); engine.addDomain(domain, rules);
    console.log(chalk.green('✓') + ` Added domain ${chalk.bold(domain)}`);
  });
  
  ctx.command('sop-list').description('List SOP domains').action(() => {
    const engine = new SOPGraphEngine();
    const domains = engine.listDomains();
    if (domains.length === 0) { console.log(chalk.dim('No SOP domains found. Run `runtime context sop-init` first.')); return; }
    console.log(chalk.bold('\nSOP Domains:\n'));
    for (const d of domains) console.log(`  ${chalk.cyan('📋')} ${chalk.bold(d)}`);
  });
  
  ctx.command('prompt').description('Build an optimized context prompt for a file').argument('<file>', 'Active file to build prompt for').option('-s, --session <id>', 'Session ID').action((file, options) => {
    const selector = new FileSelector(); const tb = new TokenBudgetManager(); const engine = new SOPGraphEngine(); const pb = new PromptBuilder(selector, tb, engine);
    console.log(chalk.bold(`\nCompiled Context for ${chalk.cyan(file)}:\n`));
    console.log(pb.buildPrompt(file, options.session));
  });
  
  return ctx;
}
