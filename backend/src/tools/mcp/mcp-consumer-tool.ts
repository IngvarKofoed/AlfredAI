import { Tool, ToolInitializationContext, ToolResult } from '../tool';
import { logger } from '../../utils/logger';
import { mcpClientManager, MCPServerConfig } from './mcp-client-manager';

interface MCPToolCall {
  name: string;
  arguments?: Record<string, any>;
}

interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export const mcpConsumerTool: Tool = {
  description: {
    name: 'mcpConsumer',
    description: 'Connect to and interact with Model Context Protocol (MCP) servers to access external tools, resources, and data sources. Server configurations are automatically saved and restored on restart. This tool can list available MCP tools, invoke them, retrieve resources, and manage server connections.',
    parameters: [
      {
        name: 'action',
        description: 'The action to perform: "list-servers", "list-tools", "call-tool", "list-resources", "read-resource", "connect-server", or "remove-server"',
        usage: 'action type',
        required: true
      },
      {
        name: 'serverName',
        description: 'The name of the MCP server to interact with (required for most actions)',
        usage: 'server name',
        required: false
      },
      {
        name: 'toolName',
        description: 'The name of the tool to call (required for "call-tool" action)',
        usage: 'tool name',
        required: false
      },
      {
        name: 'toolArguments',
        description: 'Arguments to pass to the tool as JSON string or object (optional for "call-tool" action)',
        usage: 'JSON arguments or object',
        required: false
      },
      {
        name: 'resourceUri',
        description: 'The URI of the resource to read (required for "read-resource" action)',
        usage: 'resource URI',
        required: false
      },
      {
        name: 'serverConfig',
        description: 'Server configuration as JSON string or object containing command, args, and optional env properties (required for "connect-server" action)',
        usage: 'server configuration',
        required: false
      }
    ],
    examples: [
      {
        description: 'List all available MCP servers (both connected and saved configurations)',
        parameters: [
          { name: 'action', value: 'list-servers' }
        ]
      },
      {
        description: 'Connect to filesystem MCP server (recommended) - Use npx to auto-download and run, no global installation needed',
        parameters: [
          { name: 'action', value: 'connect-server' },
          { name: 'serverName', value: 'filesystem' },
          { name: 'serverConfig', value: '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/nicolailarsen/Developer/AlfredAI"]}' }
        ]
      },
      {
        description: 'Connect to Notion API MCP server with authentication',
        parameters: [
          { name: 'action', value: 'connect-server' },
          { name: 'serverName', value: 'notionApi' },
          { name: 'serverConfig', value: '{"command": "npx", "args": ["-y", "@notionhq/notion-mcp-server"], "env": {"OPENAPI_MCP_HEADERS": "{\\"Authorization\\": \\"Bearer your_token\\", \\"Notion-Version\\": \\"2022-06-28\\"}"}}' }
        ]
      },
      {
        description: 'Connect to filesystem MCP server for current workspace root',
        parameters: [
          { name: 'action', value: 'connect-server' },
          { name: 'serverName', value: 'workspace-fs' },
          { name: 'serverConfig', value: '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]}' }
        ]
      },
      {
        description: 'Connect to Git MCP server for version control operations',
        parameters: [
          { name: 'action', value: 'connect-server' },
          { name: 'serverName', value: 'git' },
          { name: 'serverConfig', value: '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "."]}' }
        ]
      },
      {
        description: 'Connect to SQLite MCP server for database operations',
        parameters: [
          { name: 'action', value: 'connect-server' },
          { name: 'serverName', value: 'sqlite' },
          { name: 'serverConfig', value: '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "./database.sqlite"]}' }
        ]
      },
      {
        description: 'Remove an MCP server (disconnect and delete saved configuration)',
        parameters: [
          { name: 'action', value: 'remove-server' },
          { name: 'serverName', value: 'filesystem' }
        ]
      },
      {
        description: 'List tools available on a specific MCP server',
        parameters: [
          { name: 'action', value: 'list-tools' },
          { name: 'serverName', value: 'filesystem' }
        ]
      },
      {
        description: 'Call a filesystem tool to read a file',
        parameters: [
          { name: 'action', value: 'call-tool' },
          { name: 'serverName', value: 'filesystem' },
          { name: 'toolName', value: 'read_file' },
          { name: 'toolArguments', value: '{"path": "package.json"}' }
        ]
      },
      {
        description: 'Call a filesystem tool to list directory contents',
        parameters: [
          { name: 'action', value: 'call-tool' },
          { name: 'serverName', value: 'filesystem' },
          { name: 'toolName', value: 'list_directory' },
          { name: 'toolArguments', value: '{"path": "."}' }
        ]
      },
      {
        description: 'List resources available on an MCP server',
        parameters: [
          { name: 'action', value: 'list-resources' },
          { name: 'serverName', value: 'git' }
        ]
      },
      {
        description: 'Read a specific resource from an MCP server',
        parameters: [
          { name: 'action', value: 'read-resource' },
          { name: 'serverName', value: 'git' },
          { name: 'resourceUri', value: 'git://repository/status' }
        ]
      }
    ]
  },

  initialize: async (context: ToolInitializationContext) => {
    // No initialization needed for MCP Consumer tool
  },

  execute: async (parameters: Record<string, any>): Promise<ToolResult> => {
    try {
      const action = parameters.action;
      const serverName = parameters.serverName;
      const toolName = parameters.toolName;
      const toolArguments = parameters.toolArguments;
      const resourceUri = parameters.resourceUri;
      const serverConfig = parameters.serverConfig;

      if (!action) {
        return {
          success: false,
          error: 'Action parameter is required'
        };
      }

      logger.info(`MCP Consumer: Executing action "${action}" ${serverName ? `on server "${serverName}"` : ''}`);

      switch (action) {
        case 'list-servers':
          return await listMCPServers();

        case 'connect-server':
          if (!serverName || !serverConfig) {
            return { success: false, error: 'serverName and serverConfig are required for connect-server action' };
          }
          
          // Handle both JSON string and object formats for serverConfig
          let config: MCPServerConfig;
          try {
            if (typeof serverConfig === 'string') {
              config = JSON.parse(serverConfig) as MCPServerConfig;
            } else if (typeof serverConfig === 'object' && serverConfig !== null) {
              config = serverConfig as MCPServerConfig;
            } else {
              throw new Error('serverConfig must be a JSON string or object');
            }
          } catch (parseError: any) {
            return { 
              success: false, 
              error: `Invalid serverConfig format: ${parseError.message}. Expected JSON string or object with command, args, and optional env properties.` 
            };
          }
          
          return await connectMCPServer(serverName, config);

        case 'remove-server':
          if (!serverName) {
            return { success: false, error: 'serverName is required for remove-server action' };
          }
          return await removeMCPServer(serverName);

        case 'list-tools':
          if (!serverName) {
            return { success: false, error: 'serverName is required for list-tools action' };
          }
          return await listMCPTools(serverName);

        case 'call-tool':
          if (!serverName || !toolName) {
            return { success: false, error: 'serverName and toolName are required for call-tool action' };
          }
          
          // Handle both JSON string and object formats for toolArguments
          let args: Record<string, any> = {};
          if (toolArguments) {
            try {
              if (typeof toolArguments === 'string') {
                args = JSON.parse(toolArguments);
              } else if (typeof toolArguments === 'object' && toolArguments !== null) {
                args = toolArguments;
              } else {
                throw new Error('toolArguments must be a JSON string or object');
              }
            } catch (parseError: any) {
              return { 
                success: false, 
                error: `Invalid toolArguments format: ${parseError.message}. Expected JSON string or object.` 
              };
            }
          }
          
          return await callMCPTool(serverName, toolName, args);

        case 'list-resources':
          if (!serverName) {
            return { success: false, error: 'serverName is required for list-resources action' };
          }
          return await listMCPResources(serverName);

        case 'read-resource':
          if (!serverName || !resourceUri) {
            return { success: false, error: 'serverName and resourceUri are required for read-resource action' };
          }
          return await readMCPResource(serverName, resourceUri);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Available actions: list-servers, connect-server, remove-server, list-tools, call-tool, list-resources, read-resource`
          };
      }

    } catch (error: any) {
      logger.error(`MCP Consumer error: ${error.message}`);
      return {
        success: false,
        error: `MCP Consumer failed: ${error.message}`
      };
    }
  }
};

async function listMCPServers(): Promise<ToolResult> {
  try {
    const connections = mcpClientManager.listConnections();
    const savedConfigurations = await mcpClientManager.getSavedConfigurations();
    const configFilePath = mcpClientManager.getConfigFilePath();

    // Combine connection status with saved configurations
    const serverList = Object.keys(savedConfigurations).map(serverName => {
      const connection = connections.find(conn => conn.name === serverName);
      return {
        name: serverName,
        connected: connection?.connected || false,
        lastError: connection?.lastError,
        config: savedConfigurations[serverName]
      };
    });

    return {
      success: true,
      result: JSON.stringify({
        servers: serverList,
        connectedCount: connections.filter(conn => conn.connected).length,
        totalSavedCount: Object.keys(savedConfigurations).length,
        configFilePath: configFilePath,
        message: serverList.length === 0 ? 'No MCP servers configured. Use connect-server action to add servers.' : undefined
      }, null, 2)
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to list MCP servers: ${error.message}`
    };
  }
}

async function connectMCPServer(serverName: string, config: MCPServerConfig): Promise<ToolResult> {
  try {
    // Validate server configuration
    if (!config.command) {
      return { success: false, error: 'Server configuration must include a command' };
    }

    // Set server name in config if not provided
    const fullConfig = {
      ...config,
      name: serverName
    };

    await mcpClientManager.connectServer(fullConfig);

    logger.info(`MCP server "${serverName}" connected successfully and saved to persistent storage`);

    return {
      success: true,
      result: `MCP server "${serverName}" has been connected and saved to persistent storage. It will automatically reconnect on server restart.`
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to connect MCP server "${serverName}": ${error.message}`
    };
  }
}

async function removeMCPServer(serverName: string): Promise<ToolResult> {
  try {
    await mcpClientManager.removeServer(serverName);

    logger.info(`MCP server "${serverName}" removed successfully`);

    return {
      success: true,
      result: `MCP server "${serverName}" has been disconnected and removed from persistent storage.`
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to remove MCP server "${serverName}": ${error.message}`
    };
  }
}

async function listMCPTools(serverName: string): Promise<ToolResult> {
  try {
    const tools = await mcpClientManager.listTools(serverName);

    return {
      success: true,
      result: JSON.stringify({
        server: serverName,
        tools: tools,
        count: tools.length,
        message: tools.length === 0 ? `No tools available on MCP server "${serverName}"` : undefined
      }, null, 2)
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to list tools from MCP server "${serverName}": ${error.message}`
    };
  }
}

async function callMCPTool(serverName: string, toolName: string, args: Record<string, any>): Promise<ToolResult> {
  try {
    const result = await mcpClientManager.callTool(serverName, toolName, args);

    return {
      success: true,
      result: JSON.stringify({
        server: serverName,
        tool: toolName,
        arguments: args,
        result: result
      }, null, 2)
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to call tool "${toolName}" on MCP server "${serverName}": ${error.message}`
    };
  }
}

async function listMCPResources(serverName: string): Promise<ToolResult> {
  try {
    const resources = await mcpClientManager.listResources(serverName);

    return {
      success: true,
      result: JSON.stringify({
        server: serverName,
        resources: resources,
        count: resources.length,
        message: resources.length === 0 ? `No resources available on MCP server "${serverName}"` : undefined
      }, null, 2)
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to list resources from MCP server "${serverName}": ${error.message}`
    };
  }
}

async function readMCPResource(serverName: string, resourceUri: string): Promise<ToolResult> {
  try {
    const result = await mcpClientManager.readResource(serverName, resourceUri);

    return {
      success: true,
      result: JSON.stringify({
        server: serverName,
        resourceUri: resourceUri,
        result: result
      }, null, 2)
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to read resource "${resourceUri}" from MCP server "${serverName}": ${error.message}`
    };
  }
} 