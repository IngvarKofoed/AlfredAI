import { 
  generateId, 
  generateConversationId, 
  generateMemoryId, 
  generatePersonalityId, 
  generateConversationHistoryId,
  type IdGeneratorOptions 
} from '../../src/utils/id-generator';

describe('ID Generator', () => {
  describe('generateId', () => {
    it('should generate ID with default options', () => {
      const id = generateId();
      expect(id).toMatch(/^id_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[a-z0-9]{9}$/);
    });

    it('should generate ID with custom prefix', () => {
      const id = generateId({ prefix: 'test' });
      expect(id).toMatch(/^test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[a-z0-9]{9}$/);
    });

    it('should generate ID with custom separator', () => {
      const id = generateId({ separator: '-' });
      expect(id).toMatch(/^id-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-z0-9]{9}$/);
    });

    it('should generate ID with custom random length', () => {
      const id = generateId({ randomLength: 5 });
      expect(id).toMatch(/^id_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[a-z0-9]{5}$/);
    });

    it('should generate ID with ISO timestamp', () => {
      const id = generateId({ useIsoTimestamp: true });
      expect(id).toMatch(/^id_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[a-z0-9]{9}$/);
    });

    it('should generate ID with custom timestamp', () => {
      const customTimestamp = 1234567890;
      const id = generateId({ customTimestamp });
      expect(id).toMatch(/^id_1234567890_[a-z0-9]{9}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('generateConversationId', () => {
    it('should generate conversation ID with ISO timestamp', () => {
      const id = generateConversationId();
      expect(id).toMatch(/^conversation-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-z0-9]{8}$/);
    });
  });

  describe('generateMemoryId', () => {
    it('should generate memory ID', () => {
      const id = generateMemoryId();
      expect(id).toMatch(/^mem_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[a-z0-9]{9}$/);
    });
  });

  describe('generatePersonalityId', () => {
    it('should generate personality ID', () => {
      const id = generatePersonalityId();
      expect(id).toMatch(/^personality_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[a-z0-9]{9}$/);
    });
  });

  describe('generateConversationHistoryId', () => {
    it('should generate conversation history ID', () => {
      const id = generateConversationHistoryId();
      expect(id).toMatch(/^conv_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_[a-z0-9]{9}$/);
    });
  });

  describe('ID uniqueness', () => {
    it('should generate unique IDs across different types', () => {
      const ids = new Set();
      
      // Generate multiple IDs of each type
      for (let i = 0; i < 20; i++) {
        ids.add(generateConversationId());
        ids.add(generateMemoryId());
        ids.add(generatePersonalityId());
        ids.add(generateConversationHistoryId());
      }
      
      // Should have 80 unique IDs (20 of each type)
      expect(ids.size).toBe(80);
    });
  });
}); 