#!/usr/bin/env node
/**
 * Copies the compiled MCP server into the VS Code extension package
 * for distribution.
 */
import { mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const serverEntry = join(repoRoot, 'packages', 'mcp-server', 'src', 'index.ts');
const extDest = join(repoRoot, 'packages', 'vscode-extension', 'server');

// Remove old server bundle
if (existsSync(extDest)) {
    rmSync(extDest, { recursive: true, force: true });
}

if (!existsSync(serverEntry)) {
    console.error(`MCP server entry point not found: ${serverEntry}`);
    process.exit(1);
}

mkdirSync(extDest, { recursive: true });
await build({
    entryPoints: [serverEntry],
    outfile: join(extDest, 'index.js'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    minifyWhitespace: true,
    sourcemap: false,
});

const bundlePath = join(extDest, 'index.js');
const bundle = readFileSync(bundlePath, 'utf8').replace(/[ \t]+$/gm, '');
writeFileSync(bundlePath, bundle);

console.log(`Bundled MCP server to ${extDest}`);
