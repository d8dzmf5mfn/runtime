import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.lm.registerMcpServerDefinitionProvider('runtimeMcpProvider', {
            provideMcpServerDefinitions: async () => {
                const servers: vscode.McpServerDefinition[] = [];

                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
                const extRoot = context.extensionUri;

                let serverPath: vscode.Uri | undefined;

                // Check if MCP server exists relative to workspace root
                if (workspaceRoot) {
                    const candidate = vscode.Uri.joinPath(workspaceRoot, 'packages', 'mcp-server', 'dist', 'index.js');
                    try {
                        await vscode.workspace.fs.stat(candidate);
                        serverPath = candidate;
                    } catch {
                        // Not found, try extension dir
                    }
                }

                // Fall back to extension's bundled copy
                if (!serverPath) {
                    const candidate = vscode.Uri.joinPath(extRoot, 'server', 'index.js');
                    try {
                        await vscode.workspace.fs.stat(candidate);
                        serverPath = candidate;
                    } catch {
                        // Not found
                    }
                }

                if (!serverPath) {
                    vscode.window.showWarningMessage(
                        'Runtime MCP server not found. Clone the Runtime repo and run npm install && npm run build first, or reinstall this extension.'
                    );
                    return servers;
                }

                servers.push(new vscode.McpStdioServerDefinition(
                    'runtime',
                    'node',
                    [serverPath.fsPath],
                    {},
                    '0.1.0'
                ));

                return servers;
            },
            resolveMcpServerDefinition: async (server: vscode.McpServerDefinition) => {
                return server;
            }
        })
    );
}

export function deactivate() {}
