# Runtime — AI Dev Control Plane

> VibeSync + ContextPruner: Concurrent AI development gateway + JIT context compiler

## Architecture

```
Runtime
├── packages/shared          # Shared types & interfaces
├── packages/vibe-sync       # VibeSync - Concurrent AI dev gateway
│   ├── session/             #   Session management
│   ├── worktree/            #   Git Worktree orchestration
│   ├── lock/                #   File lease lock system
│   └── git-proxy/           #   Git action proxy
├── packages/context-pruner  # ContextPruner - JIT context compilation
│   ├── selector/            #   File relevance scoring engine
│   ├── token-budget/        #   Token budget management
│   ├── sop-graph/           #   SOP decision graph DSL
│   └── prompt-builder/      #   Prompt assembler
└── packages/cli             # CLI entry (Commander.js)
```

## Quick Start

```bash
bash bootstrap.sh
```

Or manually:

```bash
npm install
npm run build
node packages/cli/dist/index.js --help
```

## CLI Commands

### VibeSync
- `runtime vibe session-start -a <agent> -b <branch>` - Start new AI session
- `runtime vibe session-list` - List all sessions
- `runtime vibe session-stop <id>` - Stop and merge session
- `runtime vibe lock-acquire <file> -s <session>` - Acquire file lock
- `runtime vibe lock-release <file>` - Release file lock
- `runtime vibe lock-list` - List active locks

### ContextPruner
- `runtime context select <file>` - Analyze related files
- `runtime context budget <files...>` - Estimate token cost
- `runtime context sop-init` - Init .sop-graph/ rules
- `runtime context sop-add <domain>` - Add policy domain
- `runtime context sop-list` - List policy domains
- `runtime context prompt <file>` - Build compiled prompt

### Status
- `runtime status` - System overview

## Demo: Two AI Agents Working Concurrently

```bash
# Agent A locks key file
runtime vibe lock-acquire src/api/auth.ts -s <session-id-A>

# Agent B tries to lock A's file - conflict!
runtime vibe lock-acquire src/api/auth.ts -s <session-id-B>

# Each agent gets optimized context
runtime context prompt src/api/auth.ts -s <session-id-A>
runtime context prompt src/components/button.tsx -s <session-id-B>
```

## SOP DSL Example

```yaml
version: "1.0"
domains:
  - domain: payment
    rules:
      - action: forbid
        target: "hard-delete"
        reason: "Always use soft-delete"
      - action: require
        target: "stripe-idempotency"
        reason: "Prevent duplicate charges"
```

## Tech Stack
- Runtime: Node.js 18+ / TypeScript
- Storage: SQLite (better-sqlite3)
- CLI: Commander.js + Chalk + Ora
