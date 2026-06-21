import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { SessionManager, FileLockService, LockConflictError } from "@runtime/vibe-sync";
import { FileSelector, TokenBudgetManager, SOPGraphEngine, PromptBuilder } from "@runtime/context-pruner";

// ── Resolve repo root ───────────────────────────────────────
// Try CLAUDE_PROJECT_DIR first (Claude Code), then workspace folder env, then cwd
function resolveRepoRoot(): string {
  return process.env.CLAUDE_PROJECT_DIR
    || process.env.VSCODE_WORKSPACE_ROOT
    || process.env.PWD
    || process.cwd();
}

const repoRoot = resolveRepoRoot();
const lockService = new FileLockService();
const sessionManager = new SessionManager();
const fileSelector = new FileSelector({ repoPath: repoRoot });
const tokenBudget = new TokenBudgetManager();
const sopEngine = new SOPGraphEngine(repoRoot);
const promptBuilder = new PromptBuilder(fileSelector, tokenBudget, sopEngine);

// ── Server ──────────────────────────────────────────────────
const server = new Server(
  { name: "runtime-mcp", version: "0.2.0" },
  { capabilities: { tools: {} } }
);

function ok(data: Record<string, unknown>) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: message }) }] };
}

// ── Tool registry ───────────────────────────────────────────
const TOOLS = [
  // ── Session tools ──
  {
    name: "vibe_session_start",
    description: "Create a new AI agent session. Returns a sessionId that other tools need for file locking.",
    inputSchema: {
      type: "object",
      properties: {
        agent: { type: "string", description: "Agent type: cursor, claude, codex, or custom" },
        branch: { type: "string", description: "Git branch for this session" },
        name: { type: "string", description: "Optional session name (defaults to agent-branch)" },
      },
      required: ["agent", "branch"],
    },
  },
  {
    name: "vibe_session_list",
    description: "List all AI agent sessions with their status (active/paused/merged/closed).",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "vibe_session_stop",
    description: "Stop and close an AI agent session.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Session ID to stop" },
      },
      required: ["sessionId"],
    },
  },
  // ── Lock tools ──
  {
    name: "vibe_lock_acquire",
    description: "Acquire a file lock for an AI session. Prevents concurrent agents from editing the same file.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "File path to lock (relative to repo root)" },
        sessionId: { type: "string", description: "AI agent session ID (get from vibe_session_start)" },
        reason: { type: "string", description: "Why this lock is needed" },
        ttlMs: { type: "number", description: "Lock TTL in ms (default 300000 = 5min)" },
      },
      required: ["file", "sessionId"],
    },
  },
  {
    name: "vibe_lock_release",
    description: "Release a previously acquired file lock.",
    inputSchema: {
      type: "object",
      properties: { file: { type: "string", description: "File path to unlock" } },
      required: ["file"],
    },
  },
  {
    name: "vibe_lock_list",
    description: "List all active file locks.",
    inputSchema: { type: "object", properties: {} },
  },
  // ── Context tools ──
  {
    name: "context_select",
    description: "Analyze and rank files related to the given file. Helps AI decide which files are relevant.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "Active file to analyze" },
        topK: { type: "number", description: "Max number of related files (default 10)" },
      },
      required: ["file"],
    },
  },
  {
    name: "context_build_prompt",
    description: "Build an optimized prompt for the given file, combining SOP rules + related files + token budget.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "Active file to build prompt for" },
        sessionId: { type: "string", description: "Optional session ID" },
      },
      required: ["file"],
    },
  },
  {
    name: "context_estimate_tokens",
    description: "Estimate token cost of given files for context window planning.",
    inputSchema: {
      type: "object",
      properties: {
        files: { type: "array", items: { type: "string" }, description: "File paths to estimate" },
      },
      required: ["files"],
    },
  },
  // ── SOP tools ──
  {
    name: "sop_match",
    description: "Find SOP (Standard Operating Procedure) rules that apply to the given file.",
    inputSchema: {
      type: "object",
      properties: { file: { type: "string", description: "File path to match rules against" } },
      required: ["file"],
    },
  },
];

// ── Handlers ────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ── Session handlers ──
      case "vibe_session_start": {
        const { agent, branch, name: sessionName } = args as Record<string, unknown>;
        const session = sessionManager.createSession({
          agent: (agent as string) as any,
          name: (sessionName as string) || `${agent}-${branch}`,
          branch: branch as string,
        });
        return ok({ session });
      }

      case "vibe_session_list": {
        const sessions = sessionManager.listSessions();
        return ok({ sessions });
      }

      case "vibe_session_stop": {
        const { sessionId } = args as Record<string, unknown>;
        const session = sessionManager.updateSessionStatus(sessionId as string, "closed");
        if (!session) return fail(`Session ${sessionId} not found`);
        // Release all locks held by this session
        lockService.releaseSessionLocks(sessionId as string);
        return ok({ session });
      }

      // ── Lock handlers ──
      case "vibe_lock_acquire": {
        const { file, sessionId, reason, ttlMs } = args as Record<string, unknown>;
        try {
          const lock = lockService.acquireLock(file as string, sessionId as string, reason as string | undefined, ttlMs as number | undefined);
          return ok({ lock });
        } catch (err) {
          if (err instanceof LockConflictError) return fail(err.message);
          throw err;
        }
      }

      case "vibe_lock_release": {
        const { file } = args as Record<string, unknown>;
        const released = lockService.releaseLock(file as string);
        return ok({ released });
      }

      case "vibe_lock_list": {
        return ok({ locks: lockService.listLocks() });
      }

      // ── Context handlers ──
      case "context_select": {
        const { file, topK } = args as Record<string, unknown>;
        const selector = new FileSelector({ repoPath: repoRoot, topK: (topK as number) || 10 });
        const files = selector.selectRelatedFiles(file as string);
        return ok({ files });
      }

      case "context_build_prompt": {
        const { file, sessionId } = args as Record<string, unknown>;
        const prompt = promptBuilder.buildPrompt(file as string, sessionId as string | undefined);
        const ctx = promptBuilder.buildContext(file as string, sessionId as string | undefined);
        return ok({ prompt, tokenEstimate: ctx.tokenEstimate });
      }

      case "context_estimate_tokens": {
        const { files } = args as Record<string, unknown>;
        const scores = (files as string[]).map((f: string) => ({ path: f, score: 0, reasons: [] as string[] }));
        const estimate = tokenBudget.estimateTokens(scores);
        return ok({ fileTokens: estimate.fileTokens, total: estimate.total });
      }

      // ── SOP handlers ──
      case "sop_match": {
        const { file } = args as Record<string, unknown>;
        return ok({ rules: sopEngine.matchRules(file as string) });
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err: unknown) {
    if (err instanceof McpError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new McpError(ErrorCode.InternalError, msg);
  }
});

// ── Start ───────────────────────────────────────────────────
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
