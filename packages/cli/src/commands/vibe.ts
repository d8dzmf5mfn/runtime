import { Command } from 'commander';
import chalk from 'chalk';
import { SessionManager, WorktreeOrchestrator, FileLockService } from '@runtime/vibe-sync';
export function vibeCommands(): Command {
  const vibe = new Command('vibe').description('VibeSync - concurrent AI development gateway');
  
  vibe.command('session-start').description('Start a new AI agent session')
    .requiredOption('-a, --agent <type>', 'Agent type (cursor, claude, custom)')
    .requiredOption('-b, --branch <name>', 'Git branch for this session')
    .option('-n, --name <name>', 'Session name')
    .action(async (options) => {
      const sm = new SessionManager(); const wo = new WorktreeOrchestrator(sm);
      try {
        const session = sm.createSession({ agent: options.agent, name: options.name || `${options.agent}-${options.branch}`, branch: options.branch });
        console.log(chalk.green('✓') + ` Session created: ${chalk.bold(session.id)}`);
        console.log(`  Agent: ${chalk.cyan(session.agent)}`);
        console.log(`  Branch: ${chalk.yellow(session.branch)}`);
        const worktreePath = wo.addWorktree(session.id, session.branch);
        console.log(`  Worktree: ${chalk.magenta(worktreePath)}`);
      } finally { sm.close(); }
    });
    
  vibe.command('session-list').description('List all AI agent sessions').action(() => {
    const sm = new SessionManager();
    try {
      const sessions = sm.listSessions();
      if (sessions.length === 0) { console.log(chalk.dim('No sessions found')); return; }
      for (const s of sessions) {
        const sc = s.status === 'active' ? chalk.green : chalk.dim;
        console.log(`${sc('●')} ${chalk.bold(s.id)} - ${s.name}`);
        console.log(`  Agent: ${chalk.cyan(s.agent)} | Branch: ${chalk.yellow(s.branch)} | Status: ${sc(s.status)}`);
        if (s.worktreePath) console.log(`  Worktree: ${chalk.magenta(s.worktreePath)}`);
      }
    } finally { sm.close(); }
  });
  
  vibe.command('session-stop').description('Stop and merge an AI agent session').argument('<id>', 'Session ID').action((id: string) => {
    const sm = new SessionManager(); const wo = new WorktreeOrchestrator(sm);
    try { wo.removeWorktree(id); sm.updateSessionStatus(id, 'merged'); console.log(chalk.green('✓') + ` Session ${chalk.bold(id)} stopped and merged`); } finally { sm.close(); }
  });
  
  vibe.command('lock-acquire').description('Acquire a file lock for a session').argument('<file>', 'File to lock').requiredOption('-s, --session <id>', 'Session ID').option('-r, --reason <text>', 'Lock reason').action((file, options) => {
    const ls = new FileLockService();
    try { const lock = ls.acquireLock(file, options.session, options.reason); console.log(chalk.green('✓') + ` Locked ${chalk.bold(file)} for session ${chalk.cyan(lock.sessionId)}`); console.log(`  Expires: ${chalk.dim(lock.expiresAt)}`); }
    catch (err) { console.log(chalk.red('✗') + ' ' + (err as Error).message); } finally { ls.close(); }
  });
  
  vibe.command('lock-release').description('Release a file lock').argument('<file>', 'File to unlock').action((file) => {
    const ls = new FileLockService();
    try { if (ls.releaseLock(file)) console.log(chalk.green('✓') + ` Released lock on ${chalk.bold(file)}`); else console.log(chalk.yellow('!') + ` No lock found for ${chalk.bold(file)}`); } finally { ls.close(); }
  });
  
  vibe.command('lock-list').description('List all active file locks').action(() => {
    const ls = new FileLockService();
    try {
      const locks = ls.listLocks();
      if (locks.length === 0) { console.log(chalk.dim('No active locks')); return; }
      for (const l of locks) console.log(`${chalk.yellow('🔒')} ${chalk.bold(l.file)} - session: ${chalk.cyan(l.sessionId)}\n  Acquired: ${chalk.dim(l.acquiredAt)} | Expires: ${chalk.dim(l.expiresAt)}`);
    } finally { ls.close(); }
  });
  
  return vibe;
}
