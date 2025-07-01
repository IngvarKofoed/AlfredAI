import { McpCommand } from '../../src/tools/mcp/mcp-command';
import { getMcpService } from '../../src/service-locator';

// Mock the service locator
jest.mock('../../src/service-locator', () => ({
  getMcpService: jest.fn()
}));

describe('McpCommand', () => {
  let mcpCommand: McpCommand;
  let mockMcpService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock MCP service
    mockMcpService = {
      clientManager: {
        listConnections: jest.fn(),
        getSavedConfigurations: jest.fn(),
        connectServer: jest.fn(),
        disconnectServer: jest.fn(),
        listTools: jest.fn()
      }
    };
    
    (getMcpService as jest.Mock).mockReturnValue(mockMcpService);
    
    mcpCommand = new McpCommand();
  });

  describe('execute', () => {
    it('should return help text when no action is provided', async () => {
      const result = await mcpCommand.execute();
      
      expect(result).toContain('MCP (Model Context Protocol) Command Help');
      expect(result).toContain('**Usage:** /mcp <action>');
    });

    it('should list connections when action is "list"', async () => {
      mockMcpService.clientManager.listConnections.mockReturnValue([
        { name: 'test-server', connected: true }
      ]);
      mockMcpService.clientManager.getSavedConfigurations.mockResolvedValue({
        'test-server': { command: 'python', args: ['-m', 'test'] }
      });

      const result = await mcpCommand.execute({ action: 'list' });
      
      expect(result).toContain('🔌 MCP Server Connections:');
      expect(result).toContain('test-server');
      expect(mockMcpService.clientManager.listConnections).toHaveBeenCalled();
      expect(mockMcpService.clientManager.getSavedConfigurations).toHaveBeenCalled();
    });

    it('should connect to server when action is "connect"', async () => {
      mockMcpService.clientManager.connectServer.mockResolvedValue(undefined);

      const result = await mcpCommand.execute({
        action: 'connect',
        serverName: 'test-server',
        command: 'python',
        serverArgs: ['-m', 'test']
      });
      
      expect(result).toContain('✅ Successfully connected to MCP server "test-server"');
      expect(mockMcpService.clientManager.connectServer).toHaveBeenCalledWith({
        name: 'test-server',
        command: 'python',
        args: ['-m', 'test'],
        env: undefined
      });
    });

    it('should return error when connect action is missing required parameters', async () => {
      const result = await mcpCommand.execute({ action: 'connect' });
      
      expect(result).toContain('❌ Missing required parameters for connect action');
    });

    it('should disconnect from server when action is "disconnect"', async () => {
      mockMcpService.clientManager.disconnectServer.mockResolvedValue(undefined);

      const result = await mcpCommand.execute({
        action: 'disconnect',
        serverName: 'test-server'
      });
      
      expect(result).toContain('✅ Successfully disconnected from MCP server "test-server"');
      expect(mockMcpService.clientManager.disconnectServer).toHaveBeenCalledWith('test-server');
    });

    it('should return error when disconnect action is missing server name', async () => {
      const result = await mcpCommand.execute({ action: 'disconnect' });
      
      expect(result).toContain('❌ Missing server name for disconnect action');
    });

    it('should list tools when action is "tools"', async () => {
      mockMcpService.clientManager.listTools.mockResolvedValue([
        { name: 'test-tool', description: 'A test tool' }
      ]);

      const result = await mcpCommand.execute({
        action: 'tools',
        serverName: 'test-server'
      });
      
      expect(result).toContain('🔧 Tools from MCP server "test-server":');
      expect(result).toContain('test-tool');
      expect(mockMcpService.clientManager.listTools).toHaveBeenCalledWith('test-server');
    });

    it('should return error when tools action is missing server name', async () => {
      const result = await mcpCommand.execute({ action: 'tools' });
      
      expect(result).toContain('❌ Missing server name for tools action');
    });

    it('should list saved configurations when action is "configs"', async () => {
      mockMcpService.clientManager.getSavedConfigurations.mockResolvedValue({
        'test-server': { command: 'python', args: ['-m', 'test'] }
      });

      const result = await mcpCommand.execute({ action: 'configs' });
      
      expect(result).toContain('📁 Saved MCP Server Configurations:');
      expect(result).toContain('test-server');
      expect(mockMcpService.clientManager.getSavedConfigurations).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockMcpService.clientManager.connectServer.mockRejectedValue(new Error('Connection failed'));

      const result = await mcpCommand.execute({
        action: 'connect',
        serverName: 'test-server',
        command: 'python'
      });
      
      expect(result).toContain('❌ Failed to connect to MCP server "test-server"');
      expect(result).toContain('Connection failed');
    });
  });

  describe('command properties', () => {
    it('should have correct name and description', () => {
      expect(mcpCommand.name).toBe('mcp');
      expect(mcpCommand.description).toBe('Manage MCP (Model Context Protocol) server connections');
    });
  });
}); 