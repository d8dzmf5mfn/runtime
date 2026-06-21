import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import {
  FileLockService,
  LockConflictError,
} from "@runtime/vibe-sync";
import { FileSelector, TokenBudgetManager, SOPGraphEngine, PromptBuilder } from "@runtime/context-pruner";

// ── Core instances ──────────────────────────────────────────
const lockService = new FileLockService();
const fileSelector = new FileSelector();
const tokenBudget = new TokenBudgetManager();
const sopEngine = new SOPGraphEngine();
const promptBuilder = new PromptBuilder(fileSelector, tokenBudget, sopEngine);

// ── Server ──────────────────────────────────────────────────
const server = new Server(
  { name: "runtime-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ── Tool registry ───────────────────────────────────────────
const TOOLS = [
  {
    name: "vibe_lock_acquire",
    description: "Acquire a file lock for an AI session. Prevents concurrent agents from editing the same file.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "File path to lock (relative to repo root)" },
        sessionId: { type: "string", description: "AI agent session ID" },
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
      case "vibe_lock_acquire": {
        const { file, sessionId, reason, ttlMs } = args as Record<string, unknown>;
        const lock = lockService.acquireLock(file as string, sessionId as string, reason as string | undefined, ttlMs as number | undefined);
        return { content: [{ type: "text", text: JSON.stringify({ success: true, lock }) }] };
      }

      case "vibe_lock_release": {
        const { file } = args as Record<string, unknown>;
        const released = lockService.releaseLock(file as string);
        return { content: [{ type: "text", text: JSON.stringify({ success: released }) }] };
      }

      case "vibe_lock_list": {
        return { content: [{ type: "text", text: JSON.stringify({ locks: lockService.listLocks() }) }] };
      }

      case "context_select": {
        const { file } = args as Record<string, unknown>;
        const files = fileSelector.selectRelatedFiles(file as string);
        return { content: [{ type: "text", text: JSON.stringify({ files }) }] };
      }

      case "context_build_prompt": {
        const { file, sessionId } = args as Record<string, unknown>;
        const prompt = promptBuilder.buildPrompt(file as string, sessionId as string | undefined);
        const ctx = promptBuilder.buildContext(file as string, sessionId as string | undefined);
        return { content: [{ type: "text", text: JSON.stringify({ prompt, tokenEstimate: ctx.tokenEstimate }) }] };
      }

      case "context_estimate_tokens": {
        const { files } = args as Record<string, unknown>;
        const scores = (files as string[]).map((f) => ({ path: f, score: 0, reasons: [] as string[] }));
        return { content: [{ type: "text", text: JSON.stringify(tokenBudget.estimateTokens(scores)) }] };
      }

      case "sop_match": {
        const { file } = args as Record<string, unknown>;
        return { content: [{ type: "text", text: JSON.stringify({ rules: sopEngine.matchRules(file as string) }) }] };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err: unknown) {
    if (err instanceof LockConflictError) {
      return { content: [{ type: "text", text: JSON.stringify({ success: false, conflict: err.message }) }] };
    }
    if (err instanceof McpError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new McpError(ErrorCode.InternalError, msg);
  }
});

// ── Start ───────────────────────────────────────────────────
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
