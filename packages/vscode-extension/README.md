# Runtime MCP for VS Code

AI Dev Control Plane — file locking, context selection, token budgeting, and SOP rule matching for concurrent AI development.

## Features

- **File Locks** — Prevent concurrent AI agents from editing the same file
- **Context Selection** — Find related files for any active file
- **Token Budgeting** — Estimate and control token usage for AI context windows
- **SOP Rules** — Enforce coding policies across your team

## Requirements

This extension works with the [Runtime](https://github.com/d8dzmf5mfn/runtime) project's MCP server. You need to:

1. Clone the Runtime repo:
   ```bash
   git clone https://github.com/d8dzmf5mfn/runtime.git
   cd runtime
   npm install && npm run build
   ```

2. Install this extension from the VS Code Marketplace

3. Restart VS Code — the `runtime` MCP server will be available in agent mode

## Extension Settings

This extension does not add any VS Code settings. All configuration is managed through the MCP server.

## Known Issues

- The MCP server must be built before use (`npm run build` in the Runtime repo)

## Release Notes

### 0.1.0

Initial release: MCP server with 9 tools for concurrent AI development.
