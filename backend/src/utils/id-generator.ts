/**
 * Utility for generating unique identifiers
 */
export interface IdGeneratorOptions {
  /** Prefix for the ID (e.g., 'conversation', 'memory', 'personality') */
  prefix?: string;
  
  /** Separator between prefix, timestamp, and random suffix (default: '_') */
  separator?: string;
  
  /** Length of the random suffix (default: 9) */
  randomLength?: number;
}

/**
 * Generate a unique identifier using ISO timestamp
 * @param options - Configuration options for ID generation
 * @returns A unique string identifier
 */
export function generateId(options: IdGeneratorOptions = {}): string {
  const {
    prefix = 'id',
    separator = '_',
    randomLength = 9
  } = options;

  // Always use ISO timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 2 + randomLength);
  return `${prefix}${separator}${timestamp}${separator}${randomSuffix}`;
}

/**
 * Generate a conversation ID
 * @returns A unique conversation identifier
 */
export function generateConversationId(): string {
  return generateId({
    prefix: 'conversation',
    separator: '-',
    randomLength: 9
  });
}

/**
 * Generate a memory ID
 * @returns A unique memory identifier
 */
export function generateMemoryId(): string {
  return generateId({
    prefix: 'mem',
    separator: '_',
    randomLength: 9
  });
}

/**
 * Generate a personality ID
 * @returns A unique personality identifier
 */
export function generatePersonalityId(): string {
  return generateId({
    prefix: 'personality',
    separator: '_',
    randomLength: 9
  });
}

/**
 * Generate a conversation ID (alternative format for conversation history)
 * @returns A unique conversation identifier
 */
export function generateConversationHistoryId(): string {
  return generateId({
    prefix: 'conversation',
    separator: '_',
    randomLength: 9
  });
} 