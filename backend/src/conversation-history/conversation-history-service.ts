import fs from 'fs/promises';
import path from 'path';
import { Message } from '../types';
import { getWorkingDirectory } from '../utils/get-working-directory';
import { logger } from '../utils/logger';
import { Service } from '../types/service';
import { getCommandService } from '../service-locator';
import { HistoryCommand } from './history-command';

/**
 * Represents a conversation with metadata and messages
 */
export interface Conversation {
  /** Unique identifier for the conversation */
  id: string;
  
  /** Human-readable title for the conversation */
  title: string;
  
  /** Timestamp when the conversation was created */
  createdAt: Date;
  
  /** Timestamp when the conversation was last updated */
  updatedAt: Date;
  
  /** Array of messages in the conversation */
  messages: Message[];
  
  /** Optional metadata about the conversation */
  metadata?: Record<string, any>;
}

/**
 * Service for managing conversation history
 * Handles saving and loading conversations to/from JSON files
 */
export class ConversationHistoryService implements Service {
  private readonly conversationsDir: string;
  
  constructor() {
    // Store conversations in a 'conversations' subdirectory of the working directory
    this.conversationsDir = getWorkingDirectory('conversations');
  }
  
  async initialize(): Promise<void> {
    const commandService = getCommandService();
    commandService.registerCommand(new HistoryCommand());
  }

  async close(): Promise<void> {
    // Empty implementation - no cleanup needed
  }
  
  /**
   * Ensures the conversations directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.conversationsDir);
    } catch {
      await fs.mkdir(this.conversationsDir, { recursive: true });
    }
  }
  
  /**
   * Generates a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generates a default title from the first user message
   */
  private generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.trim();
      // Take first 50 characters or first line, whichever is shorter
      const title = content.split('\n')[0].substring(0, 50);
      return title.length === 50 ? `${title}...` : title;
    }
    return 'New Conversation';
  }
  
  /**
   * Gets the file path for a conversation
   */
  private getConversationFilePath(conversationId: string): string {
    return path.join(this.conversationsDir, `${conversationId}.json`);
  }
  
  /**
   * Starts a new conversation
   * @param initialMessages - Optional initial messages for the conversation
   * @param title - Optional custom title for the conversation
   * @param metadata - Optional metadata for the conversation
   * @returns The created conversation
   */
  async startNewConversation(
    initialMessages: Message[] = [],
    title?: string,
    metadata?: Record<string, any>
  ): Promise<Conversation> {
    await this.ensureDirectoryExists();
    
    const now = new Date();
    const conversation: Conversation = {
      id: this.generateConversationId(),
      title: title || this.generateTitle(initialMessages),
      createdAt: now,
      updatedAt: now,
      messages: initialMessages,
      metadata
    };
    
    await this.saveConversation(conversation);


    logger.info(`Started new conversation with ID: ${conversation.id}`);

    return conversation;
  }
  
  /**
   * Updates an existing conversation with the full conversation messages
   * @param conversationId - The ID of the conversation to update
   * @param messages - The complete conversation messages
   * @param updateTitle - Whether to update the title based on the messages
   * @returns The updated conversation
   * @throws Error if conversation is not found
   */
  async updateConversation(
    conversationId: string,
    messages: Message[],
    updateTitle: boolean = false
  ): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }
    
    // Replace all messages with the provided messages
    conversation.messages = messages;
    conversation.updatedAt = new Date();
    
    // Update title if requested
    if (updateTitle && messages.length > 0) {
      conversation.title = this.generateTitle(conversation.messages);
    }
    
    await this.saveConversation(conversation);
    return conversation;
  }
  
  /**
   * Saves a conversation to a JSON file
   * @param conversation - The conversation to save
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.ensureDirectoryExists();
    
    const filePath = this.getConversationFilePath(conversation.id);
    const data = JSON.stringify(conversation, null, 2);
    
    await fs.writeFile(filePath, data, 'utf-8');
  }
  
  /**
   * Loads a conversation from a JSON file
   * @param conversationId - The ID of the conversation to load
   * @returns The loaded conversation or null if not found
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const filePath = this.getConversationFilePath(conversationId);
      const data = await fs.readFile(filePath, 'utf-8');
      const conversation = JSON.parse(data) as Conversation;
      
      // Convert string dates back to Date objects
      conversation.createdAt = new Date(conversation.createdAt);
      conversation.updatedAt = new Date(conversation.updatedAt);
      
      return conversation;
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }
  
  /**
   * Gets a list of all historical conversations
   * @returns Array of conversation summaries (without full message content)
   */
  async getConversationList(): Promise<Array<{
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
    metadata?: Record<string, any>;
  }>> {
    await this.ensureDirectoryExists();
    
    try {
      const files = await fs.readdir(this.conversationsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const conversations = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const filePath = path.join(this.conversationsDir, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const conversation = JSON.parse(data) as Conversation;
            
            return {
              id: conversation.id,
              title: conversation.title,
              createdAt: new Date(conversation.createdAt),
              updatedAt: new Date(conversation.updatedAt),
              messageCount: conversation.messages.length,
              metadata: conversation.metadata
            };
          } catch (error) {
            // Skip invalid files
            return null;
          }
        })
      );
      
      // Filter out null values and sort by most recent
      return conversations
        .filter((conv): conv is NonNullable<typeof conv> => conv !== null)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      // Directory doesn't exist yet
      return [];
    }
  }
  
  /**
   * Deletes a conversation
   * @param conversationId - The ID of the conversation to delete
   * @returns True if the conversation was deleted, false if it didn't exist
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const filePath = this.getConversationFilePath(conversationId);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      // File doesn't exist
      return false;
    }
  }
  
  /**
   * Updates the title of a conversation
   * @param conversationId - The ID of the conversation
   * @param newTitle - The new title
   * @returns The updated conversation
   * @throws Error if conversation is not found
   */
  async updateConversationTitle(conversationId: string, newTitle: string): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }
    
    conversation.title = newTitle;
    conversation.updatedAt = new Date();
    
    await this.saveConversation(conversation);
    return conversation;
  }
  
  /**
   * Gets the working directory path where conversations are stored
   */
  getConversationsDirectory(): string {
    return this.conversationsDir;
  }
}
