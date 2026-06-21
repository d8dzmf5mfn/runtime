#!/usr/bin/env node
import { Command } from 'commander';
import { vibeCommands } from './commands/vibe.js';
import { contextCommands } from './commands/context.js';
import { statusCommand } from './commands/status.js';
const program = new Command();
program.name('runtime').description('AI Dev Control Plane — VibeSync + ContextPruner').version('0.1.0');
program.addCommand(vibeCommands());
program.addCommand(contextCommands());
program.addCommand(statusCommand);
program.parse(process.argv);
if (!process.argv.slice(2).length) program.outputHelp();
