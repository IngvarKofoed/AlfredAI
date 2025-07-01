import { MemoryCommand } from '../../src/commands/memory-command';
import { getMemoryService } from '../../src/memory';

// Mock the memory service
jest.mock('../../src/memory', () => ({
  getMemoryService: jest.fn()
}));

describe('MemoryCommand', () => {
  let memoryCommand: MemoryCommand;
  let mockMemoryService: any;

  beforeEach(() => {
    memoryCommand = new MemoryCommand();
    
    // Create mock memory service
    mockMemoryService = {
      getInjectionStats: jest.fn(),
      getRecent: jest.fn(),
      getEvaluatorStats: jest.fn()
    };
    
    (getMemoryService as jest.Mock).mockReturnValue(mockMemoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('name and description', () => {
    it('should have correct name and description', () => {
      expect(memoryCommand.name).toBe('memory');
      expect(memoryCommand.description).toBe('Show memory system status and statistics');
    });
  });

  describe('execute', () => {
    it('should return formatted memory status when all data is available', async () => {
      // Mock data
      const mockStats = {
        enabled: true,
        memoryStats: {
          total: 42,
          byType: {
            fact: 20,
            preference: 10,
            goal: 5,
            'short-term': 4,
            'long-term': 3
          }
        },
        config: {
          maxMemories: 10,
          relevanceThreshold: 0.7,
          memoryTypes: ['fact', 'preference', 'goal'],
          useConversationContext: true
        }
      };

      const mockRecentMemories = [
        {
          id: '1',
          content: 'This is a test memory with some content that should be truncated',
          type: 'fact',
          createdAt: new Date()
        }
      ];

      const mockEvaluatorStats = {
        enabled: true,
        totalAutoMemories: 15,
        recentAutoMemories: 3
      };

      // Setup mocks
      mockMemoryService.getInjectionStats.mockResolvedValue(mockStats);
      mockMemoryService.getRecent.mockResolvedValue(mockRecentMemories);
      mockMemoryService.getEvaluatorStats.mockResolvedValue(mockEvaluatorStats);

      // Execute command
      const result = await memoryCommand.execute();

      // Verify result contains expected content
      expect(result).toContain('🧠 Memory System Status:');
      expect(result).toContain('🟢 Enabled');
      expect(result).toContain('**Total Memories:** 42');
      expect(result).toContain('• Facts: 20');
      expect(result).toContain('**Auto-Generated Memories:** 15');
      expect(result).toContain('[FACT] This is a test memory with some content that should be trunc');
      expect(result).toContain('• Max memories per injection: 10');
      expect(result).toContain('💡 Use the memory tool to create, search, and manage memories!');
    });

    it('should handle disabled memory injection', async () => {
      const mockStats = {
        enabled: false,
        memoryStats: { total: 0, byType: {} },
        config: {
          maxMemories: 10,
          relevanceThreshold: 0.7,
          memoryTypes: ['fact'],
          useConversationContext: false
        }
      };

      mockMemoryService.getInjectionStats.mockResolvedValue(mockStats);
      mockMemoryService.getRecent.mockResolvedValue([]);
      mockMemoryService.getEvaluatorStats.mockResolvedValue(null);

      const result = await memoryCommand.execute();

      expect(result).toContain('🔴 Disabled');
      expect(result).toContain('**Total Memories:** 0');
      expect(result).toContain('**Recent Memories:** None yet');
    });

    it('should handle errors gracefully', async () => {
      mockMemoryService.getInjectionStats.mockRejectedValue(new Error('Memory service error'));

      await expect(memoryCommand.execute()).rejects.toThrow('Failed to access memory system: Memory service error');
    });
  });
}); 