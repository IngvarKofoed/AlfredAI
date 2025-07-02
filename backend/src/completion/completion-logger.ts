import fs from 'fs';
import path from 'path';
import { getWorkingDirectory } from '../utils/get-working-directory';
import { generateConversationId } from '../utils/id-generator';
import { Message } from '../types';

/**
 * Interface for completion log entries
 */
export interface CompletionLogEntry {
  timestamp: string;
  modelName?: string;
  systemPrompt: string;
  conversation: Message[];
  rawResponse: string;
  config?: {
    useStreaming?: boolean;
  };
}

/**
 * Completion logger for tracking LLM interactions
 * Creates one log file per conversation with raw LLM outputs
 */
export class CompletionLogger {
  private logsDirectory: string;

  constructor() {
    // Create logs subfolder in the working directory
    this.logsDirectory = getWorkingDirectory('logs', 'completions');
    
    // Ensure logs directory exists
    this.ensureLogsDirectory();
  }

  /**
   * Log a completion interaction
   */
  async logCompletion(
    conversationId: string | undefined,
    modelName: string | undefined,
    systemPrompt: string,
    conversation: Message[],
    rawResponse: string,
    config?: {
      useStreaming?: boolean;
    }
  ): Promise<void> {
    // Generate conversation ID if not provided
    const finalConversationId = conversationId || this.generateConversationId();
    
    const logEntry: CompletionLogEntry = {
      timestamp: new Date().toISOString(),
      modelName,
      systemPrompt,
      conversation,
      rawResponse,
      config
    };

    const logFilePath = this.getLogFilePath(finalConversationId);
    
    try {
      // Overwrite the log file with the new entry
      // Each LLM call contains the full conversation, so we don't need to append
      await fs.promises.writeFile(logFilePath, JSON.stringify([logEntry], null, 2), 'utf-8');
    } catch (error) {
      console.error(`Failed to write completion log: ${error}`);
    }
  }

  /**
   * Get the log file path for a conversation
   */
  private getLogFilePath(conversationId: string): string {
    return path.join(this.logsDirectory, `${conversationId}.json`);
  }

  /**
   * Ensure the logs directory exists
   */
  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDirectory)) {
      fs.mkdirSync(this.logsDirectory, { recursive: true });
    }
  }

  /**
   * Generate a unique conversation ID
   */
  generateConversationId(): string {
    return generateConversationId();
  }

  /**
   * Get the logs directory path
   */
  getLogsDirectory(): string {
    return this.logsDirectory;
  }

  /**
   * Read all logs for a conversation
   */
  async readLogs(conversationId: string): Promise<CompletionLogEntry[]> {
    const logFilePath = this.getLogFilePath(conversationId);
    
    if (!fs.existsSync(logFilePath)) {
      return [];
    }

    try {
      const content = await fs.promises.readFile(logFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to read completion logs: ${error}`);
      return [];
    }
  }

  /**
   * Clear logs for a conversation
   */
  async clearLogs(conversationId: string): Promise<void> {
    const logFilePath = this.getLogFilePath(conversationId);
    
    if (fs.existsSync(logFilePath)) {
      try {
        await fs.promises.unlink(logFilePath);
      } catch (error) {
        console.error(`Failed to clear completion logs: ${error}`);
      }
    }
  }
}

/**
 * Factory function to create a completion logger
 */
export function createCompletionLogger(): CompletionLogger {
  return new CompletionLogger();
}
