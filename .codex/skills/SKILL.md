---
name: runtime-mcp
description: "Use the @runtime-mcp MCP tools for concurrent AI agent development. Trigger when the user needs to: manage multiple AI agent sessions, prevent file edit conflicts, find related files for context, estimate token budgets, enforce coding policies (SOP rules), or initialize a Runtime project."
---

# Runtime MCP

Runtime MCP provides 7 tools that turn Codex into a concurrent AI development gateway. Use this skill as a quick reference for when to call each tool.

## Tools Overview

### File Locks (`vibe_lock_*`)

These three tools prevent concurrent agents from clobbering each other's work.

| Tool | When to call |
|---|---|
| `vibe_lock_acquire` | **Before editing a file** — lock it first so other agents know it's yours |
| `vibe_lock_release` | **After you're done editing** — free the lock so others can edit |
| `vibe_lock_list` | When you need to **see who is editing what** |

**Workflow:**
1. `vibe_lock_acquire` before touching any file
2. Edit the file
3. `vibe_lock_release` when done
4. If `vibe_lock_acquire` returns a conflict, pick different work

### Context Tools (`context_*`)

These tools optimize what context is sent to AI agents, saving tokens and improving relevance.

| Tool | When to call |
|---|---|
| `context_select` | When starting work on a file — find which other files are most relevant |
| `context_build_prompt` | When you need a ready-to-use prompt with related files + rules |
| `context_estimate_tokens` | When planning how many files to include — preview token cost |

### SOP Tools (`sop_*`)

Standard Operating Procedure rules let you enforce coding policies automatically.

| Tool | When to call |
|---|---|
| `sop_match` | After selecting a file — check which policies apply |

## Configuration

The plugin is already configured in this workspace's `.codex/mcp.json`:

```json
{
  "servers": {
    "runtime": {
      "command": "node",
      "args": ["path/to/runtime/packages/mcp-server/dist/index.js"]
    }
  }
}
```

## Quick Start

```bash
# 1. Initialize SOP rules (one-time)
runtime context sop-init

# 2. Add your team's coding policies
runtime context sop-add security --rules '[{"action":"forbid","target":"any-type","reason":"Use explicit types"},{"action":"require","target":"strict-mode","reason":"Enable strict type checking"}]'

# 3. Before editing a file, acquire a lock and find related files
vibe_lock_acquire  (call MCP tool)
context_select     (call MCP tool)

# 4. Work on the file

# 5. Release the lock
vibe_lock_release  (call MCP tool)
```

## SOP DSL Reference

See [references/sop-dsl.md](references/sop-dsl.md) for the full SOP YAML syntax and examples.
