import { initializeServiceLocator, getPersonalityService } from '../src/service-locator';

describe('Personality Service Integration', () => {
  beforeEach(async () => {
    // Initialize service locator before each test
    await initializeServiceLocator();
  });

  test('should get personality service from service locator', () => {
    const personalityService = getPersonalityService();
    expect(personalityService).toBeDefined();
    expect(typeof personalityService.getAllPersonalities).toBe('function');
    expect(typeof personalityService.getActivePersonality).toBe('function');
  });

  test('should be able to get all personalities', () => {
    const personalityService = getPersonalityService();
    const personalities = personalityService.getAllPersonalities();
    expect(personalities).toBeDefined();
    expect(typeof personalities).toBe('object');
  });

  test('should be able to get presets', () => {
    const personalityService = getPersonalityService();
    const presets = personalityService.getPresets();
    expect(presets).toBeDefined();
    expect(Array.isArray(presets)).toBe(true);
    expect(presets.length).toBeGreaterThan(0);
  });

  test('should be able to create personality from preset', () => {
    const personalityService = getPersonalityService();
    const presets = personalityService.getPresets();
    
    if (presets.length > 0) {
      const presetName = presets[0].name;
      const personalityId = personalityService.createPersonalityFromPreset(presetName, {
        name: 'Test Personality'
      });
      
      expect(personalityId).toBeDefined();
      expect(typeof personalityId).toBe('string');
      
      // Clean up - delete the test personality
      if (personalityId) {
        personalityService.deletePersonality(personalityId);
      }
    }
  });
}); 