import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(repoRoot, 'packages', 'mcp-server', 'dist', 'index.js');

function createClient() {
  const cwd = mkdtempSync(join(tmpdir(), 'runtime-mcp-cwd-'));
  const child = spawn(process.execPath, [serverPath], {
    cwd,
    env: {
      ...process.env,
      RUNTIME_AGENT: 'codex',
      RUNTIME_PROJECT_ROOT: repoRoot,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const responses = new Map();
  let stdoutBuffer = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      if (message.id !== undefined) responses.set(message.id, message);
    }
  });
  child.stderr.on('data', chunk => {
    stderr += chunk;
  });

  async function waitFor(id) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (responses.has(id)) return responses.get(id);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw new Error(`Timed out waiting for MCP response ${id}: ${stderr}`);
  }

  function send(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  return {
    cwd,
    child,
    send,
    waitFor,
    getStderr: () => stderr,
  };
}

test('runtime MCP initializes from an external cwd and exposes tools without ps errors', async () => {
  const client = createClient();

  try {
    client.send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      },
    });

    const initResponse = await client.waitFor(1);
    assert.equal(initResponse.result.serverInfo.name, 'runtime-mcp');

    client.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    client.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    const toolsResponse = await client.waitFor(2);
    assert.ok(toolsResponse.result.tools.some(tool => tool.name === 'vibe_session_info'));

    client.send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'vibe_session_info',
        arguments: {},
      },
    });
    const sessionResponse = await client.waitFor(3);
    const sessionPayload = JSON.parse(sessionResponse.result.content[0].text);
    assert.equal(sessionPayload.session.agent, 'codex');

    client.send({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'context_estimate_tokens',
        arguments: { files: ['package.json'] },
      },
    });
    const tokenResponse = await client.waitFor(4);
    const tokenPayload = JSON.parse(tokenResponse.result.content[0].text);
    assert.ok(tokenPayload.total > 0);

    assert.doesNotMatch(client.getStderr(), /ps: Operation not permitted/);
  } finally {
    client.child.kill();
    rmSync(client.cwd, { recursive: true, force: true });
  }
});
