export type AgentType = 'cursor' | 'claude' | 'codex' | 'custom';
export type SessionStatus = 'active' | 'paused' | 'merged' | 'closed';
export interface Session { id: string; agent: AgentType; name: string; branch: string; worktreePath: string; status: SessionStatus; createdAt: string; updatedAt: string; metadata: Record<string, string>; }
export interface CreateSessionOptions { agent: AgentType; name: string; branch: string; metadata?: Record<string, string>; }
export interface WorktreeInfo { path: string; branch: string; sessionId: string; gitRoot: string; }
export interface FileLock { file: string; sessionId: string; acquiredAt: string; expiresAt: string; reason?: string; }
export interface LockConflict { file: string; requestedBy: string; lockedBy: string; lockedAt: string; }
export interface FileScore { path: string; score: number; reasons: string[]; }
export interface TokenBudget { maxTokens: number; usedTokens: number; remainingTokens: number; }
export interface RuleItem { action: 'require' | 'forbid'; target: string; reason: string; }
export interface SOPRule { domain: string; rules: RuleItem[]; }
export interface SOPGraph { version: string; domains: SOPRule[]; }
export interface ContextRequest { activeFile: string; sessionId?: string; maxTokens?: number; }
export interface CompiledContext { systemPrompt: string; files: FileScore[]; rules: SOPRule[]; tokenEstimate: number; }
export interface RuntimeState { sessions: Session[]; locks: FileLock[]; activeContext?: CompiledContext; }
