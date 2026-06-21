#!/usr/bin/env node
/**
 * Copies the compiled MCP server into the VS Code extension package
 * for distribution.
 */
import { copyFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const serverSrc = join(repoRoot, 'packages', 'mcp-server', 'dist');
const extDest = join(repoRoot, 'packages', 'vscode-extension', 'server');

// Remove old server bundle
if (existsSync(extDest)) {
    rmSync(extDest, { recursive: true, force: true });
}

// Check if source exists
if (!existsSync(serverSrc)) {
    console.error('MCP server dist not found. Run npm run build in packages/mcp-server first.');
    process.exit(1);
}

// Copy all files from server dist
mkdirSync(extDest, { recursive: true });
for (const file of readdirSync(serverSrc)) {
    copyFileSync(join(serverSrc, file), join(extDest, file));
}

console.log(`Copied MCP server to ${extDest}`);
