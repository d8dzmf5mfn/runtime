import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawn } from 'node:child_process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the packaged MCP server has no workspace-only imports', async () => {
  const bundledServer = await readFile(
    join(repoRoot, 'packages', 'vscode-extension', 'server', 'index.js'),
    'utf8',
  );

  assert.doesNotMatch(bundledServer, /^import .* from ["']@runtime\//m);
  assert.doesNotMatch(bundledServer, /^import .* from ["']@modelcontextprotocol\//m);
});

test('the packaged MCP server starts standalone and uses git history', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'runtime-mcp-bundle-'));
  const children = [];
  const serverPaths = [
    join(repoRoot, 'packages', 'vscode-extension', 'server', 'index.js'),
    join(repoRoot, 'packages', 'mcp-server', 'dist', 'index.js'),
  ];
  try {
    execFileSync('git', ['init'], { cwd: workspace, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: workspace });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: workspace });
    writeFileSync(join(workspace, 'active.ts'), 'export const active = true;');
    writeFileSync(join(workspace, 'related.ts'), 'export const related = true;');
    execFileSync('git', ['add', '-A'], { cwd: workspace });
    execFileSync('git', ['commit', '-m', 'initial'], { cwd: workspace, stdio: 'ignore' });

    for (const serverPath of serverPaths) {
      const child = spawn(process.execPath, [serverPath], {
        cwd: workspace,
        env: { ...process.env, VSCODE_WORKSPACE_ROOT: workspace },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      children.push(child);
      const responses = new Map();
      let buffer = '';
      let stderr = '';
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.stdout.on('data', chunk => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const message = JSON.parse(line);
          if (message.id !== undefined) responses.set(message.id, message);
        }
      });
      const send = message => child.stdin.write(`${JSON.stringify(message)}\n`);
      const waitFor = async id => {
        for (let attempt = 0; attempt < 100; attempt += 1) {
          if (responses.has(id)) return responses.get(id);
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        throw new Error(`Timed out waiting for MCP response ${id}: ${stderr}`);
      };

      send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } } });
      await waitFor(1);
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'context_select', arguments: { file: 'active.ts' } } });
      const response = await waitFor(2);
      const payload = JSON.parse(response.result.content[0].text);

      assert.equal(payload.files[0].path, 'related.ts', serverPath);
      assert.ok(payload.files[0].reasons.some(reason => reason.startsWith('git:')), serverPath);
      child.kill();
    }
  } finally {
    for (const child of children) child.kill();
    rmSync(workspace, { recursive: true, force: true });
  }
});
