import { Command, CommandSchema } from '../../types/command';
import { getMcpService } from '../../service-locator';
import { MCPServerConfig } from './mcp-client-manager';

/**
 * MCP command that manages Model Context Protocol server connections.
 * 
 * This command provides functionality to list, connect, disconnect, and manage
 * MCP server connections. It allows users to interact with external tools
 * and resources through the MCP protocol.
 */
export class McpCommand implements Command {
    name = 'mcp';
    description = 'Manage MCP (Model Context Protocol) server connections';

    async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
        return null;
    }

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const mcpService = getMcpService();
            const { action, serverName, command, serverArgs, env } = args || {};

            switch (action) {
                case 'list':
                    return await this.listConnections(mcpService);
                case 'connect':
                    if (!serverName || !command) {
                        return '❌ Missing required parameters for connect action. Usage: /mcp connect <serverName> <command> [args...] [env...]';
                    }
                    return await this.connectServer(mcpService, serverName, command, serverArgs, env);
                case 'disconnect':
                    if (!serverName) {
                        return '❌ Missing server name for disconnect action. Usage: /mcp disconnect <serverName>';
                    }
                    return await this.disconnectServer(mcpService, serverName);
                case 'tools':
                    if (!serverName) {
                        return '❌ Missing server name for tools action. Usage: /mcp tools <serverName>';
                    }
                    return await this.listServerTools(mcpService, serverName);
                case 'configs':
                    return await this.listSavedConfigurations(mcpService);
                default:
                    return this.getHelpText();
            }
        } catch (error: any) {
            throw new Error(`MCP command failed: ${error.message}`);
        }
    }

    private async listConnections(mcpService: any): Promise<string> {
        const connections = mcpService.clientManager.listConnections();
        const savedConfigs = await mcpService.clientManager.getSavedConfigurations();
        
        let result = `🔌 MCP Server Connections:\n\n`;
        
        if (connections.length === 0) {
            result += `**Active Connections:** None\n\n`;
        } else {
            result += `**Active Connections (${connections.length}):**\n`;
            connections.forEach((conn: any) => {
                result += `• **${conn.name}** - ${conn.connected ? '🟢 Connected' : '🔴 Disconnected'}`;
                if (conn.lastError) {
                    result += ` (Error: ${conn.lastError})`;
                }
                result += `\n`;
            });
            result += `\n`;
        }

        const savedCount = Object.keys(savedConfigs).length;
        result += `**Saved Configurations (${savedCount}):**\n`;
        if (savedCount === 0) {
            result += `• No saved configurations\n`;
        } else {
            Object.entries(savedConfigs).forEach(([name, config]: [string, any]) => {
                result += `• **${name}** - ${config.command} ${config.args.join(' ')}\n`;
            });
        }

        result += `\n**Usage Examples:**\n`;
        result += `• /mcp list - Show all connections and configurations\n`;
        result += `• /mcp connect my-server "python" ["-m", "my_mcp_server"] - Connect to a server\n`;
        result += `• /mcp disconnect my-server - Disconnect from a server\n`;
        result += `• /mcp tools my-server - List tools from a connected server\n`;
        result += `• /mcp configs - Show saved configurations\n`;

        return result;
    }

    private async connectServer(mcpService: any, serverName: string, command: string, args?: string[], env?: Record<string, string>): Promise<string> {
        try {
            const config: MCPServerConfig = {
                name: serverName,
                command: command,
                args: args || [],
                env: env
            };

            await mcpService.clientManager.connectServer(config);
            return `✅ Successfully connected to MCP server "${serverName}"`;
        } catch (error: any) {
            return `❌ Failed to connect to MCP server "${serverName}": ${error.message}`;
        }
    }

    private async disconnectServer(mcpService: any, serverName: string): Promise<string> {
        try {
            await mcpService.clientManager.disconnectServer(serverName);
            return `✅ Successfully disconnected from MCP server "${serverName}"`;
        } catch (error: any) {
            return `❌ Failed to disconnect from MCP server "${serverName}": ${error.message}`;
        }
    }

    private async listServerTools(mcpService: any, serverName: string): Promise<string> {
        try {
            const tools = await mcpService.clientManager.listTools(serverName);
            
            let result = `🔧 Tools from MCP server "${serverName}":\n\n`;
            
            if (tools.length === 0) {
                result += `No tools available from this server.`;
            } else {
                tools.forEach((tool: any, index: number) => {
                    result += `${index + 1}. **${tool.name}**\n`;
                    result += `   • ${tool.description || 'No description'}\n`;
                    if (tool.inputSchema) {
                        result += `   • Input schema: ${JSON.stringify(tool.inputSchema)}\n`;
                    }
                    result += `\n`;
                });
            }

            return result;
        } catch (error: any) {
            return `❌ Failed to list tools from MCP server "${serverName}": ${error.message}`;
        }
    }

    private async listSavedConfigurations(mcpService: any): Promise<string> {
        try {
            const configs = await mcpService.clientManager.getSavedConfigurations();
            
            let result = `📁 Saved MCP Server Configurations:\n\n`;
            
            if (Object.keys(configs).length === 0) {
                result += `No saved configurations found.`;
            } else {
                Object.entries(configs).forEach(([name, config]: [string, any]) => {
                    result += `**${name}:**\n`;
                    result += `• Command: ${config.command}\n`;
                    result += `• Args: ${config.args.join(' ')}\n`;
                    if (config.env && Object.keys(config.env).length > 0) {
                        result += `• Environment: ${JSON.stringify(config.env)}\n`;
                    }
                    result += `\n`;
                });
            }

            return result;
        } catch (error: any) {
            return `❌ Failed to list saved configurations: ${error.message}`;
        }
    }

    private getHelpText(): string {
        return `🔌 MCP (Model Context Protocol) Command Help

**Usage:** /mcp <action> [parameters...]

**Available Actions:**

• **list** - Show all active connections and saved configurations
• **connect <serverName> <command> [args...] [env...]** - Connect to an MCP server
• **disconnect <serverName>** - Disconnect from an MCP server
• **tools <serverName>** - List tools available from a connected server
• **configs** - Show all saved server configurations

**Examples:**
• /mcp list
• /mcp connect my-server "python" ["-m", "my_mcp_server"]
• /mcp disconnect my-server
• /mcp tools my-server
• /mcp configs

**Note:** MCP servers provide external tools and resources that can be used through natural conversation.`;
    }
} 