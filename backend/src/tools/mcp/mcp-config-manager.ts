import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { MCPServerConfig } from './mcp-client-manager';

export interface MCPServerConfigEntry {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfigFile {
  mcpServers: Record<string, MCPServerConfigEntry>;
}

export class MCPConfigManager {
  private configFilePath: string;

  constructor(configFilePath?: string) {
    // Default to mcp-servers.json in the backend directory
    this.configFilePath = configFilePath || path.join(__dirname, '..', '..', 'mcp-servers.json');
  }

  /**
   * Load MCP server configurations from the config file
   */
  async loadConfigurations(): Promise<Record<string, MCPServerConfig>> {
    try {
      if (!fs.existsSync(this.configFilePath)) {
        logger.info(`MCP Config: No config file found at ${this.configFilePath}, creating empty configuration`);
        
        // Create empty configuration file
        const emptyConfig: MCPConfigFile = {
          mcpServers: {}
        };
        
        // Ensure directory exists
        const configDir = path.dirname(this.configFilePath);
        if (!fs.existsSync(configDir)) {
          await fs.promises.mkdir(configDir, { recursive: true });
        }
        
        // Write empty configuration
        const fileContent = JSON.stringify(emptyConfig, null, 2);
        await fs.promises.writeFile(this.configFilePath, fileContent, 'utf-8');
        
        logger.info(`MCP Config: Created empty configuration file at ${this.configFilePath}`);
        return {};
      }

      const fileContent = await fs.promises.readFile(this.configFilePath, 'utf-8');
      const configData: MCPConfigFile = JSON.parse(fileContent);

      if (!configData.mcpServers || typeof configData.mcpServers !== 'object') {
        logger.warn('MCP Config: Invalid config file format, expected mcpServers object');
        return {};
      }

      // Convert to MCPServerConfig format
      const configurations: Record<string, MCPServerConfig> = {};
      
      for (const [serverName, config] of Object.entries(configData.mcpServers)) {
        configurations[serverName] = {
          name: serverName,
          command: config.command,
          args: config.args,
          env: config.env
        };
      }

      logger.info(`MCP Config: Loaded ${Object.keys(configurations).length} server configurations`);
      return configurations;

    } catch (error: any) {
      logger.error(`MCP Config: Failed to load configurations: ${error.message}`);
      return {};
    }
  }

  /**
   * Save MCP server configurations to the config file
   */
  async saveConfigurations(configurations: Record<string, MCPServerConfig>): Promise<void> {

    try {
      // Convert to config file format
      const configData: MCPConfigFile = {
        mcpServers: {}
      };

      for (const [serverName, config] of Object.entries(configurations)) {
        configData.mcpServers[serverName] = {
          command: config.command,
          args: config.args,
          ...(config.env && { env: config.env })
        };
      }

      // Write to file with pretty formatting
      const fileContent = JSON.stringify(configData, null, 2);
      await fs.promises.writeFile(this.configFilePath, fileContent, 'utf-8');
      
      logger.info(`MCP Config: Saved ${Object.keys(configurations).length} server configurations to ${this.configFilePath}`);

    } catch (error: any) {
      logger.error(`MCP Config: Failed to save configurations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add or update a single server configuration
   */
  async addServerConfiguration(serverName: string, config: MCPServerConfig): Promise<void> {
    const configurations = await this.loadConfigurations();
    configurations[serverName] = config;
    await this.saveConfigurations(configurations);
  }

  /**
   * Remove a server configuration
   */
  async removeServerConfiguration(serverName: string): Promise<void> {
    const configurations = await this.loadConfigurations();
    if (configurations[serverName]) {
      delete configurations[serverName];
      await this.saveConfigurations(configurations);
      logger.info(`MCP Config: Removed configuration for server "${serverName}"`);
    }
  }

  /**
   * Get the path to the config file
   */
  getConfigFilePath(): string {
    return this.configFilePath;
  }
}

// Singleton instance
export const mcpConfigManager = new MCPConfigManager(); 