import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../../utils/logger';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { mcpConfigManager } from './mcp-config-manager';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConnection {
  config: MCPServerConfig;
  client: Client;
  transport: StdioClientTransport;
  process: ChildProcess;
  connected: boolean;
  lastError?: string;
}

export class MCPClientManager extends EventEmitter {
  private connections = new Map<string, MCPConnection>();
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();
  private readonly reconnectDelayMs = 5000;
  private initialized = false;

  constructor() {
    super();
    // Cleanup on process exit
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  /**
   * Initialize the MCP client manager and load saved configurations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('MCP: Initializing client manager and loading saved configurations');
      const savedConfigurations = await mcpConfigManager.loadConfigurations();
      
      // Connect to all saved servers
      const connectionPromises = Object.values(savedConfigurations).map(async (config) => {
        try {
          await this.connectServer(config, false); // false = don't save to file since it's already saved
          logger.info(`MCP: Auto-connected to saved server "${config.name}"`);
        } catch (error: any) {
          logger.warn(`MCP: Failed to auto-connect to saved server "${config.name}": ${error.message}`);
        }
      });

      await Promise.allSettled(connectionPromises);
      this.initialized = true;
      
      const connectedCount = Array.from(this.connections.values()).filter(conn => conn.connected).length;
      logger.info(`MCP: Initialization complete. Connected to ${connectedCount}/${Object.keys(savedConfigurations).length} saved servers`);
      
    } catch (error: any) {
      logger.error(`MCP: Failed to initialize: ${error.message}`);
      this.initialized = true; // Set to true anyway to prevent infinite retries
    }
  }

  async connectServer(config: MCPServerConfig, saveToFile: boolean = true): Promise<void> {
    const { name } = config;
    
    logger.info(`MCP: Connecting to server "${name}"`);

    // Disconnect existing connection if any
    if (this.connections.has(name)) {
      await this.disconnectServer(name, false); // Don't remove from file when reconnecting
    }

    try {
      // Create client and transport
      const client = new Client({
        name: 'alfred-ai-client',
        version: '1.0.0'
      }, {
        capabilities: {
          roots: {
            listChanged: true
          }
        }
      });

      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: { 
          ...Object.fromEntries(
            Object.entries(process.env).filter(([_, value]) => value !== undefined)
          ) as Record<string, string>,
          ...config.env 
        }
      });

      // Create connection object
      const connection: MCPConnection = {
        config,
        client,
        transport,
        process: (transport as any)._process, // Access internal process
        connected: false,
        lastError: undefined
      };

      // Set up error handling
      transport.onclose = () => {
        logger.warn(`MCP: Server "${name}" connection closed`);
        connection.connected = false;
        this.emit('disconnected', name);
        this.scheduleReconnect(name);
      };

      transport.onerror = (error) => {
        logger.error(`MCP: Server "${name}" transport error:`, error);
        connection.lastError = error.message;
        connection.connected = false;
        this.emit('error', name, error);
      };

      // Connect to the server
      await client.connect(transport);
      connection.connected = true;
      
      // Store connection
      this.connections.set(name, connection);
      
      // Save to persistent storage if requested
      if (saveToFile) {
        try {
          await mcpConfigManager.addServerConfiguration(name, config);
          logger.info(`MCP: Saved configuration for server "${name}" to persistent storage`);
        } catch (error: any) {
          logger.warn(`MCP: Failed to save configuration for "${name}": ${error.message}`);
        }
      }
      
      logger.info(`MCP: Successfully connected to server "${name}"`);
      this.emit('connected', name);

    } catch (error: any) {
      logger.error(`MCP: Failed to connect to server "${name}":`, error.message);
      throw new Error(`Failed to connect to MCP server "${name}": ${error.message}`);
    }
  }

  async disconnectServer(name: string, removeFromFile: boolean = true): Promise<void> {
    const connection = this.connections.get(name);
    if (!connection) {
      return;
    }

    logger.info(`MCP: Disconnecting server "${name}"`);

    // Clear reconnect timeout
    const timeout = this.reconnectTimeouts.get(name);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(name);
    }

    // Close connection
    try {
      await connection.client.close();
    } catch (error: any) {
      logger.warn(`MCP: Error closing client for "${name}":`, error.message);
    }

    // Kill process if still running
    if (connection.process && !connection.process.killed) {
      connection.process.kill();
    }

    this.connections.delete(name);
    
    // Remove from persistent storage if requested
    if (removeFromFile) {
      try {
        await mcpConfigManager.removeServerConfiguration(name);
        logger.info(`MCP: Removed configuration for server "${name}" from persistent storage`);
      } catch (error: any) {
        logger.warn(`MCP: Failed to remove configuration for "${name}": ${error.message}`);
      }
    }
    
    logger.info(`MCP: Disconnected server "${name}"`);
  }

  /**
   * Remove a server completely (disconnect and remove from config)
   */
  async removeServer(name: string): Promise<void> {
    await this.disconnectServer(name, true);
  }

  /**
   * Get all saved server configurations (both connected and disconnected)
   */
  async getSavedConfigurations(): Promise<Record<string, MCPServerConfig>> {
    return await mcpConfigManager.loadConfigurations();
  }

  /**
   * Get the path to the MCP configuration file
   */
  getConfigFilePath(): string {
    return mcpConfigManager.getConfigFilePath();
  }

  getConnection(name: string): MCPConnection | undefined {
    return this.connections.get(name);
  }

  listConnections(): Array<{ name: string; connected: boolean; lastError?: string }> {
    return Array.from(this.connections.entries()).map(([name, connection]) => ({
      name,
      connected: connection.connected,
      lastError: connection.lastError
    }));
  }

  async listTools(serverName: string): Promise<any[]> {
    const connection = this.getConnection(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`Server "${serverName}" is not connected`);
    }

    logger.info(`MCP: Listing tools from server "${serverName}"`);
    try {
      const result = await connection.client.listTools();
      const tools = result.tools || [];
      logger.info(`MCP: Found ${tools.length} tools from server "${serverName}":`, tools.map(t => t.name));
      return tools;
    } catch (error: any) {
      logger.error(`MCP: Error listing tools from "${serverName}":`, error.message);
      throw error;
    }
  }

  async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
    const connection = this.getConnection(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`Server "${serverName}" is not connected`);
    }

    logger.info(`MCP: Calling tool "${toolName}" on server "${serverName}" with args:`, args);
    try {
      const result = await connection.client.callTool({
        name: toolName,
        arguments: args
      });
      logger.info(`MCP: Tool call "${toolName}" on "${serverName}" completed successfully`);
      logger.debug(`MCP: Tool call result:`, result);
      return result;
    } catch (error: any) {
      logger.error(`MCP: Error calling tool "${toolName}" on "${serverName}":`, error.message);
      throw error;
    }
  }

  async listResources(serverName: string): Promise<any[]> {
    const connection = this.getConnection(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`Server "${serverName}" is not connected`);
    }

    logger.info(`MCP: Listing resources from server "${serverName}"`);
    try {
      const result = await connection.client.listResources();
      const resources = result.resources || [];
      logger.info(`MCP: Found ${resources.length} resources from server "${serverName}":`, resources.map(r => r.uri));
      return resources;
    } catch (error: any) {
      logger.error(`MCP: Error listing resources from "${serverName}":`, error.message);
      throw error;
    }
  }

  async readResource(serverName: string, uri: string): Promise<any> {
    const connection = this.getConnection(serverName);
    if (!connection || !connection.connected) {
      throw new Error(`Server "${serverName}" is not connected`);
    }

    logger.info(`MCP: Reading resource "${uri}" from server "${serverName}"`);
    try {
      const result = await connection.client.readResource({ uri });
      logger.info(`MCP: Successfully read resource "${uri}" from server "${serverName}"`);
      logger.debug(`MCP: Resource content length:`, result.contents?.length || 0);
      return result;
    } catch (error: any) {
      logger.error(`MCP: Error reading resource "${uri}" from "${serverName}":`, error.message);
      throw error;
    }
  }

  private scheduleReconnect(name: string): void {
    if (this.reconnectTimeouts.has(name)) {
      return; // Already scheduled
    }

    const timeout = setTimeout(async () => {
      this.reconnectTimeouts.delete(name);
      const connection = this.connections.get(name);
      if (connection && !connection.connected) {
        logger.info(`MCP: Attempting to reconnect to server "${name}"`);
        try {
          await this.connectServer(connection.config, false); // Don't save when reconnecting
        } catch (error: any) {
          logger.error(`MCP: Reconnection failed for "${name}":`, error.message);
          // Schedule another reconnect
          this.scheduleReconnect(name);
        }
      }
    }, this.reconnectDelayMs);

    this.reconnectTimeouts.set(name, timeout);
  }

  private cleanup(): void {
    logger.info('MCP: Cleaning up all connections');
    
    // Clear all reconnect timeouts
    for (const timeout of this.reconnectTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.reconnectTimeouts.clear();

    // Disconnect all servers
    for (const name of this.connections.keys()) {
      this.disconnectServer(name, false).catch((error) => { // Don't modify config file during cleanup
        logger.error(`MCP: Error during cleanup for "${name}":`, error.message);
      });
    }
  }
}

// Singleton instance
export const mcpClientManager = new MCPClientManager(); 