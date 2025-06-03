import { Tool, ToolResult } from './tool';
import { logger } from '../utils/logger';

interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

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
        description: 'The action to perform: "list-servers", "list-tools", "call-tool", "list-resources", or "read-resource"',
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

        case 'connect-server':
          if (!serverName || !serverConfig) {
            return { success: false, error: 'serverName and serverConfig are required for connect-server action' };
          }
          const config = JSON.parse(serverConfig);
          return await connectMCPServer(serverName, config);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Available actions: list-servers, list-tools, call-tool, list-resources, read-resource, connect-server`
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

// In-memory storage for MCP server connections (in production, this should be persistent)
const mcpServers: Map<string, MCPServer> = new Map();

async function listMCPServers(): Promise<ToolResult> {
  const servers = Array.from(mcpServers.entries()).map(([name, config]) => ({
    name,
    command: config.command,
    args: config.args,
    env: config.env
  }));

  return {
    success: true,
    result: JSON.stringify({
      servers,
      count: servers.length,
      message: servers.length === 0 ? 'No MCP servers configured. Use connect-server action to add servers.' : undefined
    }, null, 2)
  };
}

async function connectMCPServer(serverName: string, config: MCPServer): Promise<ToolResult> {
  try {
    // Validate server configuration
    if (!config.command) {
      return { success: false, error: 'Server configuration must include a command' };
    }

    // Store server configuration
    mcpServers.set(serverName, {
      name: serverName,
      command: config.command,
      args: config.args || [],
      env: config.env
    });

    logger.info(`MCP server "${serverName}" configured successfully`);

    return {
      success: true,
      result: `MCP server "${serverName}" has been configured and is ready for use.`
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to configure MCP server "${serverName}": ${error.message}`
    };
  }
}

async function listMCPTools(serverName: string): Promise<ToolResult> {
  const server = mcpServers.get(serverName);
  if (!server) {
    return {
      success: false,
      error: `MCP server "${serverName}" not found. Use connect-server to configure it first.`
    };
  }

  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Start the MCP server process
  // 2. Establish communication (typically via stdio)
  // 3. Send a "tools/list" request according to MCP protocol
  // 4. Parse and return the response

  return {
    success: true,
    result: JSON.stringify({
      message: `MCP server "${serverName}" is configured but tool listing requires MCP protocol implementation`,
      server: server,
      note: 'This is a placeholder. Real implementation would communicate with the MCP server process.'
    }, null, 2)
  };
}

async function callMCPTool(serverName: string, toolName: string, args: Record<string, any>): Promise<ToolResult> {
  const server = mcpServers.get(serverName);
  if (!server) {
    return {
      success: false,
      error: `MCP server "${serverName}" not found. Use connect-server to configure it first.`
    };
  }

  // Placeholder implementation
  // Real implementation would:
  // 1. Ensure server process is running
  // 2. Send a "tools/call" request with the tool name and arguments
  // 3. Handle the response and any errors

  return {
    success: true,
    result: JSON.stringify({
      message: `Would call tool "${toolName}" on MCP server "${serverName}"`,
      server: serverName,
      tool: toolName,
      arguments: args,
      note: 'This is a placeholder. Real implementation would execute the tool via MCP protocol.'
    }, null, 2)
  };
}

async function listMCPResources(serverName: string): Promise<ToolResult> {
  const server = mcpServers.get(serverName);
  if (!server) {
    return {
      success: false,
      error: `MCP server "${serverName}" not found. Use connect-server to configure it first.`
    };
  }

  // Placeholder implementation
  return {
    success: true,
    result: JSON.stringify({
      message: `Would list resources from MCP server "${serverName}"`,
      server: serverName,
      note: 'This is a placeholder. Real implementation would query resources via MCP protocol.'
    }, null, 2)
  };
}

async function readMCPResource(serverName: string, resourceUri: string): Promise<ToolResult> {
  const server = mcpServers.get(serverName);
  if (!server) {
    return {
      success: false,
      error: `MCP server "${serverName}" not found. Use connect-server to configure it first.`
    };
  }

  // Placeholder implementation
  return {
    success: true,
    result: JSON.stringify({
      message: `Would read resource "${resourceUri}" from MCP server "${serverName}"`,
      server: serverName,
      resourceUri: resourceUri,
      note: 'This is a placeholder. Real implementation would fetch the resource via MCP protocol.'
    }, null, 2)
  };
} 