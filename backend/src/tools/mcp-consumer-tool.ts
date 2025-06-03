import { Tool, ToolResult } from './tool';
import { logger } from '../utils/logger';
import { mcpClientManager, MCPServerConfig } from '../utils/mcp-client-manager';

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
    description: 'Connect to and interact with Model Context Protocol (MCP) servers to access external tools, resources, and data sources. This tool can list available MCP tools, invoke them, and retrieve resources.',
    parameters: [
      {
        name: 'action',
        description: 'The action to perform: "list-servers", "list-tools", "call-tool", "list-resources", "read-resource", or "connect-server"',
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
        description: 'JSON string of arguments to pass to the tool (optional for "call-tool" action)',
        usage: 'JSON arguments',
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
        description: 'JSON string containing server configuration (command, args, env) for connecting to a new server',
        usage: 'server configuration',
        required: false
      }
    ],
    examples: [
      {
        description: 'List all available MCP servers',
        parameters: [
          { name: 'action', value: 'list-servers' }
        ]
      },
      {
        description: 'Connect to a filesystem MCP server',
        parameters: [
          { name: 'action', value: 'connect-server' },
          { name: 'serverName', value: 'filesystem' },
          { name: 'serverConfig', value: '{"command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]}' }
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
        description: 'Call a tool on an MCP server',
        parameters: [
          { name: 'action', value: 'call-tool' },
          { name: 'serverName', value: 'filesystem' },
          { name: 'toolName', value: 'read_file' },
          { name: 'toolArguments', value: '{"path": "/path/to/file.txt"}' }
        ]
      },
      {
        description: 'List resources available on an MCP server',
        parameters: [
          { name: 'action', value: 'list-resources' },
          { name: 'serverName', value: 'database' }
        ]
      },
      {
        description: 'Read a specific resource from an MCP server',
        parameters: [
          { name: 'action', value: 'read-resource' },
          { name: 'serverName', value: 'database' },
          { name: 'resourceUri', value: 'database://localhost/users' }
        ]
      }
    ]
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
          const config = JSON.parse(serverConfig) as MCPServerConfig;
          return await connectMCPServer(serverName, config);

        case 'list-tools':
          if (!serverName) {
            return { success: false, error: 'serverName is required for list-tools action' };
          }
          return await listMCPTools(serverName);

        case 'call-tool':
          if (!serverName || !toolName) {
            return { success: false, error: 'serverName and toolName are required for call-tool action' };
          }
          const args = toolArguments ? JSON.parse(toolArguments) : {};
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
            error: `Unknown action: ${action}. Available actions: list-servers, connect-server, list-tools, call-tool, list-resources, read-resource`
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

    return {
      success: true,
      result: JSON.stringify({
        servers: connections,
        count: connections.length,
        message: connections.length === 0 ? 'No MCP servers connected. Use connect-server action to add servers.' : undefined
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

    logger.info(`MCP server "${serverName}" connected successfully`);

    return {
      success: true,
      result: `MCP server "${serverName}" has been connected and is ready for use.`
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to connect MCP server "${serverName}": ${error.message}`
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