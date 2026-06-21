import { execSync } from 'child_process';
import { nanoid } from 'nanoid';
import type { Session, CreateSessionOptions, SessionStatus, AgentType } from '@runtime/shared';

/**
 * 从环境变量自动检测当前 AI agent 类型。
 *
 * 检测优先级：
 * 1. CLAUDE_PROJECT_DIR → claude
 * 2. 父进程为 codex     → codex
 * 3. VS Code 相关环境变量 → cursor
 * 4. 兜底               → custom
 */
function detectAgent(): { agent: AgentType; name: string } {
  // claude: 通过 CLAUDE_PROJECT_DIR 环境变量识别
  const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR;
  if (claudeProjectDir) {
    const projectName = claudeProjectDir.split('/').filter(Boolean).pop() || 'unknown';
    return { agent: 'claude', name: `claude-${projectName}` };
  }

  // codex: 检查父进程命令行是否包含 'codex'
  try {
    const ppid = process.ppid;
    const parentComm = execSync(`ps -p ${ppid} -o comm=`, {
      encoding: 'utf-8',
      timeout: 1000,
    }).trim();
    if (parentComm.includes('codex')) {
      return { agent: 'codex' as AgentType, name: 'codex' };
    }
  } catch {
    // ps 命令失败（如权限不足）则静默忽略
  }

  // cursor / VS Code: 通过 VS Code 环境变量识别
  if (process.env.VSCODE_PID || process.env.VSCODE_NLS_CONFIG || process.env.VSCODE_CWD) {
    return { agent: 'cursor', name: 'cursor' };
  }

  // 兜底
  return { agent: 'custom', name: 'custom' };
}

export class SessionManager {
  private sessions: Session[] = [];
  private currentSession: Session | null = null;

  /**
   * 获取当前 session（懒初始化）。
   * 第一次调用时自动运行 detectAgent() 创建 session。
   */
  getCurrentSession(): Session {
    if (this.currentSession) return this.currentSession;
    const detected = detectAgent();
    const id = nanoid(12);
    const now = new Date().toISOString();
    this.currentSession = {
      id,
      agent: detected.agent,
      name: detected.name,
      branch: '',
      worktreePath: '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };
    this.sessions.push(this.currentSession);
    return this.currentSession;
  }

  createSession(opts: CreateSessionOptions): Session {
    const id = nanoid(12);
    const now = new Date().toISOString();
    const s: Session = {
      id, agent: opts.agent, name: opts.name, branch: opts.branch,
      worktreePath: '', status: 'active', createdAt: now, updatedAt: now,
      metadata: opts.metadata || {},
    };
    this.sessions.push(s);
    return s;
  }

  getSession(id: string): Session | null {
    return this.sessions.find(s => s.id === id) || null;
  }

  listSessions(status?: SessionStatus): Session[] {
    const s = status ? this.sessions.filter(x => x.status === status) : [...this.sessions];
    return s.reverse();
  }

  updateSessionStatus(id: string, status: SessionStatus): Session | null {
    const s = this.sessions.find(x => x.id === id);
    if (!s) return null;
    s.status = status;
    s.updatedAt = new Date().toISOString();
    return s;
  }

  updateWorktreePath(id: string, wp: string): Session | null {
    const s = this.sessions.find(x => x.id === id);
    if (!s) return null;
    s.worktreePath = wp;
    s.updatedAt = new Date().toISOString();
    return s;
  }

  deleteSession(id: string): boolean {
    const i = this.sessions.findIndex(x => x.id === id);
    if (i === -1) return false;
    this.sessions.splice(i, 1);
    return true;
  }

  close(): void {
    this.sessions = [];
    this.currentSession = null;
  }
}
