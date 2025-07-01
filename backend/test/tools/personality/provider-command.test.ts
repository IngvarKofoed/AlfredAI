import { ProviderCommand } from '../../../src/tools/personality/provider-command';
import { getPersonalityService } from '../../../src/service-locator';

// Mock the service locator
jest.mock('../../../src/service-locator', () => ({
  getPersonalityService: jest.fn()
}));

describe('ProviderCommand', () => {
  let providerCommand: ProviderCommand;
  let mockPersonalityService: any;

  beforeEach(() => {
    providerCommand = new ProviderCommand();
    mockPersonalityService = {
      getActivePersonality: jest.fn()
    };
    (getPersonalityService as jest.Mock).mockReturnValue(mockPersonalityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should have correct name and description', () => {
      expect(providerCommand.name).toBe('provider');
      expect(providerCommand.description).toBe('Show current AI provider and personality configuration');
    });
  });

  describe('execute', () => {
    it('should return provider info when personality has preferred provider', async () => {
      const mockPersonality = {
        name: 'Test Personality',
        preferredProvider: 'claude'
      };
      mockPersonalityService.getActivePersonality.mockReturnValue(mockPersonality);

      const result = await providerCommand.execute();

      expect(result).toContain('🤖 AI Provider Status:');
      expect(result).toContain('**Active Provider:** claude (from personality: Test Personality)');
      expect(result).toContain('**Supported Providers:** claude, openai, gemini, openrouter');
      expect(result).toContain('**Current Personality:** Test Personality');
      expect(result).toContain('💡 To change provider: Use the personality tool');
    });

    it('should return provider info when no personality is active', async () => {
      mockPersonalityService.getActivePersonality.mockReturnValue(null);

      const result = await providerCommand.execute();

      expect(result).toContain('🤖 AI Provider Status:');
      expect(result).toContain('**Active Provider:** claude (from environment/default)');
      expect(result).toContain('**Current Personality:** None (using default behavior)');
    });

    it('should handle errors gracefully', async () => {
      mockPersonalityService.getActivePersonality.mockImplementation(() => {
        throw new Error('Service error');
      });

      await expect(providerCommand.execute()).rejects.toThrow('Failed to get provider status: Service error');
    });
  });
}); 