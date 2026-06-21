import { Command } from 'commander';
import chalk from 'chalk';
import { SessionManager, FileLockService } from '@runtime/vibe-sync';
export const statusCommand = new Command('status').description('Show runtime status overview').action(async () => {
  console.log(chalk.bold('\n=== Runtime Status ===\n'));
  try { const sm = new SessionManager(); const sessions = sm.listSessions(); const active = sessions.filter(s => s.status === 'active').length; console.log(`${chalk.cyan('Sessions:')} ${chalk.bold(sessions.length)} total, ${chalk.green(active)} active`); sm.close(); } catch { console.log(`${chalk.dim('Sessions:')} not initialized`); }
  try { const ls = new FileLockService(); const locks = ls.listLocks(); console.log(`${chalk.yellow('Locks:')} ${chalk.bold(locks.length)} active`); ls.close(); } catch { console.log(`${chalk.dim('Locks:')} not initialized`); }
  try { const { SOPGraphEngine } = await import('@runtime/context-pruner'); const engine = new SOPGraphEngine(); const domains = engine.listDomains(); console.log(`${chalk.magenta('SOP Domains:')} ${chalk.bold(domains.length)} configured`); } catch { console.log(`${chalk.dim('SOP Domains:')} not initialized`); }
  console.log('');
});
