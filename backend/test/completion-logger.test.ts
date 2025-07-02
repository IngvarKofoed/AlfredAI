import { CompletionLogger, createCompletionLogger } from '../src/completion/completion-logger';
import { Message } from '../src/types';

describe('CompletionLogger', () => {
  let testLogger: CompletionLogger;
  let testConversationId: string;

  beforeEach(() => {
    testConversationId = `test-conversation-${Date.now()}`;
    testLogger = createCompletionLogger();
  });

  afterEach(async () => {
    // Clean up test logs
    await testLogger.clearLogs(testConversationId);
  });

  describe('constructor', () => {
    it('should create logger without conversation ID', () => {
      const logger = createCompletionLogger();
      expect(logger).toBeInstanceOf(CompletionLogger);
    });

    it('should generate conversation ID when requested', () => {
      const conversationId = testLogger.generateConversationId();
      expect(conversationId).toMatch(/^conversation-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[a-z0-9]+$/);
    });

    it('should create logs directory', () => {
      const logsDir = testLogger.getLogsDirectory();
      expect(logsDir).toContain('logs');
      expect(logsDir).toContain('completions');
    });
  });

  describe('logCompletion', () => {
    it('should log completion data correctly', async () => {
      const mockMessages: Message[] = [
        { role: 'user', content: 'Hello' }
      ];

      const systemPrompt = 'You are a helpful assistant.';
      const rawResponse = '{"choices": [{"message": {"content": "Hi there!"}}]}';
      const modelName = 'gpt-4';

      await testLogger.logCompletion(
        testConversationId,
        modelName,
        systemPrompt,
        mockMessages,
        rawResponse
      );

      const logs = await testLogger.readLogs(testConversationId);
      expect(logs).toHaveLength(1);

      const logEntry = logs[0];
      expect(logEntry.modelName).toBe(modelName);
      expect(logEntry.systemPrompt).toBe(systemPrompt);
      expect(logEntry.conversation).toEqual(mockMessages);
      expect(logEntry.rawResponse).toBe(rawResponse);
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should overwrite existing logs with new entry', async () => {
      const mockMessages: Message[] = [
        { role: 'user', content: 'First message' }
      ];

      // Log first completion
      await testLogger.logCompletion(
        testConversationId,
        'gpt-4',
        'System prompt',
        mockMessages,
        'Response 1'
      );

      // Log second completion (should overwrite the first)
      await testLogger.logCompletion(
        testConversationId,
        'gpt-4',
        'System prompt',
        mockMessages,
        'Response 2'
      );

      const logs = await testLogger.readLogs(testConversationId);
      expect(logs).toHaveLength(1); // Should only have the latest entry
      expect(logs[0].rawResponse).toBe('Response 2'); // Should be the second response
    });

    it('should handle different conversation IDs separately', async () => {
      const mockMessages: Message[] = [
        { role: 'user', content: 'Test message' }
      ];

      const conversationId1 = 'conversation-1';
      const conversationId2 = 'conversation-2';

      await testLogger.logCompletion(
        conversationId1,
        'gpt-4',
        'System prompt',
        mockMessages,
        'Response 1'
      );

      await testLogger.logCompletion(
        conversationId2,
        'gpt-4',
        'System prompt',
        mockMessages,
        'Response 2'
      );

      const logs1 = await testLogger.readLogs(conversationId1);
      const logs2 = await testLogger.readLogs(conversationId2);

      expect(logs1).toHaveLength(1);
      expect(logs2).toHaveLength(1);
      expect(logs1[0].rawResponse).toBe('Response 1');
      expect(logs2[0].rawResponse).toBe('Response 2');

      // Clean up
      await testLogger.clearLogs(conversationId1);
      await testLogger.clearLogs(conversationId2);
    });
  });

  describe('readLogs', () => {
    it('should return empty array for non-existent log file', async () => {
      const logs = await testLogger.readLogs('non-existent-conversation');
      expect(logs).toEqual([]);
    });
  });

  describe('clearLogs', () => {
    it('should handle non-existent log file gracefully', async () => {
      // Should not throw when clearing non-existent logs
      await expect(testLogger.clearLogs('non-existent-conversation')).resolves.not.toThrow();
    });
  });

  describe('getLogsDirectory', () => {
    it('should return the correct logs directory path', () => {
      const logsDir = testLogger.getLogsDirectory();
      expect(logsDir).toContain('logs');
      expect(logsDir).toContain('completions');
    });
  });
}); 