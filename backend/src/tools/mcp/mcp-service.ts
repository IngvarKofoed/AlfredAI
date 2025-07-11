import { MCPConfigManager } from './mcp-config-manager';
import { MCPClientManager } from './mcp-client-manager';
import { Service } from '../../types/service';
import { McpCommand } from './mcp-command';
import { getCommandService } from '../../service-locator';

export class McpService implements Service {
  public readonly configManager: MCPConfigManager;
  public readonly clientManager: MCPClientManager;

  constructor(
    configManager?: MCPConfigManager,
    clientManager?: MCPClientManager
  ) {
    // For now, we'll create new instances since we're removing the direct exports
    // In the future, these could be injected through the service locator
    this.configManager = configManager || new MCPConfigManager();
    this.clientManager = clientManager || new MCPClientManager(this.configManager);
  }

  async initialize(): Promise<void> {
    await this.clientManager.initialize();
    
    const commandService = getCommandService();
    commandService.registerCommand(new McpCommand());
  }

  /**
   * Close the MCP service and all connections
   */
  async close(): Promise<void> {
    // The client manager has a close method that handles closing all connections
    await this.clientManager.close();
  }
}
