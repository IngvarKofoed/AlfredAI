/**
 * Memory Configuration Manager
 * 
 * This file manages memory system configuration, including memory store settings
 * and memory-related environment variables.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { getWorkingDirectory } from '../utils/get-working-directory';
import { FileMemoryStoreConfig, MemoryStoreConfig } from '../types/memory';

/**
 * Memory system configuration interface
 */
export interface MemoryConfig {
  /** Memory store configuration */
  store: MemoryStoreConfig;
  /** Default memory directory */
  memoryDir: string;
  /** Enable memory system */
  enabled: boolean;
  /** Memory retention settings */
  retention: {
    /** Maximum number of memories to keep */
    maxMemories?: number;
    /** Days to keep short-term memories */
    shortTermDays?: number;
    /** Days to keep long-term memories */
    longTermDays?: number;
  };
}

/**
 * Default memory configuration
 */
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  store: {
    type: 'file',
    config: {
      memoryDir: getWorkingDirectory('memory'),
      format: 'json',
      backup: true
    } as FileMemoryStoreConfig
  },
  memoryDir: getWorkingDirectory('memory'),
  enabled: true,
  retention: {
    maxMemories: 10000,
    shortTermDays: 7,
    longTermDays: 365
  }
};

/**
 * Memory configuration manager class
 */
export class MemoryConfigManager {
  private configFilePath: string;
  private config: MemoryConfig;

  constructor(configFilePath?: string) {
    this.configFilePath = configFilePath || getWorkingDirectory('memory-config.json');
    this.config = this.loadConfig();
  }

  /**
   * Load memory configuration from file or environment
   */
  private loadConfig(): MemoryConfig {
    try {
      // First try to load from file
      if (fs.existsSync(this.configFilePath)) {
        const configData = fs.readFileSync(this.configFilePath, 'utf-8');
        const loadedConfig = JSON.parse(configData) as Partial<MemoryConfig>;
        
        // Merge with defaults
        const config = this.mergeWithDefaults(loadedConfig);
        logger.info(`Memory Config: Loaded configuration from ${this.configFilePath}`);
        return config;
      }

      // If no file exists, create one with environment-based defaults
      const config = this.createConfigFromEnvironment();
      this.saveConfig(config);
      return config;

    } catch (error) {
      logger.warn(`Memory Config: Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
      return this.createConfigFromEnvironment();
    }
  }

  /**
   * Create configuration from environment variables
   */
  private createConfigFromEnvironment(): MemoryConfig {
    const memoryDir = process.env.MEMORY_DIR || DEFAULT_MEMORY_CONFIG.memoryDir;
    const enabled = process.env.MEMORY_ENABLED !== 'false'; // Default to true unless explicitly disabled
    const storeType = (process.env.MEMORY_STORE_TYPE as 'file' | 'vector' | 'hybrid') || 'file';

    const config: MemoryConfig = {
      ...DEFAULT_MEMORY_CONFIG,
      memoryDir,
      enabled,
      store: {
        type: storeType,
        config: {
          memoryDir: getWorkingDirectory('memory'),
          format: (process.env.MEMORY_FORMAT as 'json' | 'yaml') || 'json',
          backup: process.env.MEMORY_BACKUP !== 'false'
        } as FileMemoryStoreConfig
      },
      retention: {
        maxMemories: process.env.MEMORY_MAX_COUNT ? parseInt(process.env.MEMORY_MAX_COUNT, 10) : DEFAULT_MEMORY_CONFIG.retention.maxMemories,
        shortTermDays: process.env.MEMORY_SHORT_TERM_DAYS ? parseInt(process.env.MEMORY_SHORT_TERM_DAYS, 10) : DEFAULT_MEMORY_CONFIG.retention.shortTermDays,
        longTermDays: process.env.MEMORY_LONG_TERM_DAYS ? parseInt(process.env.MEMORY_LONG_TERM_DAYS, 10) : DEFAULT_MEMORY_CONFIG.retention.longTermDays
      }
    };

    return config;
  }

  /**
   * Merge loaded config with defaults
   */
  private mergeWithDefaults(loadedConfig: Partial<MemoryConfig>): MemoryConfig {
    return {
      ...DEFAULT_MEMORY_CONFIG,
      ...loadedConfig,
      store: {
        ...DEFAULT_MEMORY_CONFIG.store,
        ...loadedConfig.store,
        config: {
          ...DEFAULT_MEMORY_CONFIG.store.config,
          ...loadedConfig.store?.config
        }
      },
      retention: {
        ...DEFAULT_MEMORY_CONFIG.retention,
        ...loadedConfig.retention
      }
    };
  }

  /**
   * Save configuration to file
   */
  private saveConfig(config?: MemoryConfig): void {
    try {
      const configToSave = config || this.config;
      
      // Create directory if it doesn't exist
      const configDir = path.dirname(this.configFilePath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.configFilePath, JSON.stringify(configToSave, null, 2));
      logger.info(`Memory Config: Saved configuration to ${this.configFilePath}`);
    } catch (error) {
      logger.error(`Memory Config: Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get current memory configuration
   */
  getConfig(): MemoryConfig {
    return { ...this.config };
  }

  /**
   * Update memory configuration
   */
  updateConfig(updates: Partial<MemoryConfig>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates });
    this.saveConfig();
  }

  /**
   * Get memory store configuration
   */
  getStoreConfig(): MemoryStoreConfig {
    return { ...this.config.store };
  }

  /**
   * Get file memory store configuration (if using file store)
   */
  getFileStoreConfig(): FileMemoryStoreConfig {
    if (this.config.store.type !== 'file') {
      throw new Error('Current store type is not file-based');
    }
    return this.config.store.config as FileMemoryStoreConfig;
  }

  /**
   * Check if memory system is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get memory directory path
   */
  getMemoryDir(): string {
    return this.config.memoryDir;
  }

  /**
   * Get absolute memory directory path
   */
  getAbsoluteMemoryDir(): string {
    if (path.isAbsolute(this.config.memoryDir)) {
      return this.config.memoryDir;
    }
    return getWorkingDirectory(this.config.memoryDir);
  }

  /**
   * Get retention settings
   */
  getRetentionSettings() {
    return { ...this.config.retention };
  }

  /**
   * Get configuration file path
   */
  getConfigFilePath(): string {
    return this.configFilePath;
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_MEMORY_CONFIG };
    this.saveConfig();
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate store type
    if (!['file', 'vector', 'hybrid'].includes(this.config.store.type)) {
      errors.push(`Invalid store type: ${this.config.store.type}`);
    }

    // Validate retention settings
    if (this.config.retention.maxMemories && this.config.retention.maxMemories < 1) {
      errors.push('maxMemories must be greater than 0');
    }

    if (this.config.retention.shortTermDays && this.config.retention.shortTermDays < 1) {
      errors.push('shortTermDays must be greater than 0');
    }

    if (this.config.retention.longTermDays && this.config.retention.longTermDays < 1) {
      errors.push('longTermDays must be greater than 0');
    }

    // Validate memory directory
    if (!this.config.memoryDir || typeof this.config.memoryDir !== 'string') {
      errors.push('memoryDir must be a non-empty string');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
export const memoryConfigManager = new MemoryConfigManager();