import { describe, it, expect } from 'vitest';
describe('CLI', () => {
  it('vibe commands', async () => { const {vibeCommands} = await import('../src/commands/vibe.js'); expect(vibeCommands().name()).toBe('vibe'); });
  it('context commands', async () => { const {contextCommands} = await import('../src/commands/context.js'); expect(contextCommands().name()).toBe('context'); });
});
