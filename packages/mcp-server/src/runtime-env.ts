export function resolveRepoRoot(): string {
  return process.env.RUNTIME_PROJECT_ROOT
    || process.env.CLAUDE_PROJECT_DIR
    || process.env.VSCODE_WORKSPACE_ROOT
    || process.env.PWD
    || process.cwd();
}
