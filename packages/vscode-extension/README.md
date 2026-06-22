# Runtime MCP for VS Code

AI Dev Control Plane — file locking, context selection, token budgeting, and SOP rule matching for concurrent AI development.

## Features

- **File Locks** — Prevent concurrent AI agents from editing the same file
- **Context Selection** — Find related files for any active file
- **Token Budgeting** — Estimate and control token usage for AI context windows
- **SOP Rules** — Enforce coding policies across your team

## Installation

Install the extension from a `.vsix` or the VS Code Marketplace, then restart VS Code. Version `0.1.1` bundles a self-contained MCP server; cloning or building the Runtime repository is not required for installed extensions.

For local development, run `npm install`, `npm run build`, then `npm run package` from the repository root.

## Extension Settings

This extension does not add any VS Code settings. All configuration is managed through the MCP server.

## Release Notes

### 0.1.1

- Bundle all MCP runtime dependencies into the extension
- Pass the active workspace root to context tools
- Restore Git-history relevance scoring in ESM and packaged servers
- Package cleanly from the npm workspace without leaking monorepo files

### 0.1.0

Initial release: MCP server with 9 tools for concurrent AI development.
