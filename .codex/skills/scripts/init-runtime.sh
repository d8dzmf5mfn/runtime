#!/bin/bash
# Initialize Runtime project with SOP rules and verify MCP server
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Runtime MCP Init ==="

# 1. Check MCP config
if [ -f .codex/mcp.json ]; then
  echo "✅ .codex/mcp.json found"
else
  echo "⚠️  No .codex/mcp.json — create one with the runtime-mcp server config"
fi

# 2. Init SOP graph
if command -v runtime &> /dev/null; then
  runtime context sop-init 2>/dev/null && echo "✅ SOP graph initialized" || echo "⚠️  runtime CLI not built"
else
  echo "ℹ️  runtime CLI not found — run 'npm run build' first"
fi

echo "=== Done ==="
