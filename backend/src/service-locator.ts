/**
 * Type-Safe Service Locator Implementation
 * 
 * This service locator provides a centralized, type-safe way to manage all application services.
 * It replaces the scattered singleton instances with a unified dependency injection system.
 */

import { MemoryService } from './memory/memory-service';
import { PersonalityService } from './tools/personality/personality-service';
import { McpService } from './tools/mcp/mcp-service';
import { ConversationHistoryService } from './conversation-history';
import { CommandService } from './commands';
import { logger } from './utils/logger';

/**
 * Service identifiers - each service has a unique string identifier
 */
export const ServiceId = {
  MEMORY_SERVICE: 'memoryService',
  PERSONALITY_SERVICE: 'personalityService',
  MCP_SERVICE: 'mcpService',
  CONVERSATION_HISTORY_SERVICE: 'conversationHistoryService',
  COMMAND_SERVICE: 'commandService',
} as const;

/**
 * Service identifier type
 */
export type ServiceIdType = typeof ServiceId[keyof typeof ServiceId];

/**
 * Service registry type mapping service IDs to their implementations
 */
export interface ServiceRegistry {
  [ServiceId.MEMORY_SERVICE]: MemoryService;
  [ServiceId.PERSONALITY_SERVICE]: PersonalityService;
  [ServiceId.MCP_SERVICE]: McpService;
  [ServiceId.CONVERSATION_HISTORY_SERVICE]: ConversationHistoryService;
  [ServiceId.COMMAND_SERVICE]: CommandService;
}

/**
 * Service factory function type
 */
export type ServiceFactory<T extends ServiceIdType> = () => ServiceRegistry[T];

/**
 * Service locator configuration
 */
export interface ServiceLocatorConfig {
  /** Whether to auto-initialize services on registration */
  autoInitialize?: boolean;
  /** Whether to enable lazy loading of services */
  lazyLoading?: boolean;
  /** Custom service factories */
  factories?: Partial<Record<ServiceIdType, ServiceFactory<ServiceIdType>>>;
}

/**
 * Service registration info
 */
interface ServiceRegistration {
  factory: ServiceFactory<ServiceIdType>;
  instance?: any;
  initialized: boolean;
  dependencies?: ServiceIdType[];
}

/**
 * Type-safe service locator implementation
 */
export class ServiceLocator {
  private services = new Map<ServiceIdType, ServiceRegistration>();
  private config: ServiceLocatorConfig;
  private initialized = false;

  constructor(config: ServiceLocatorConfig = {}) {
    this.config = {
      autoInitialize: true,
      lazyLoading: true,
      ...config
    };
  }

  /**
   * Register a service with the locator
   */
  register<T extends ServiceIdType>(
    serviceId: T,
    factory: ServiceFactory<T>,
    dependencies?: ServiceIdType[]
  ): void {
    if (this.services.has(serviceId)) {
      logger.warn(`Service ${serviceId} is already registered. Overwriting...`);
    }

    this.services.set(serviceId, {
      factory,
      initialized: false,
      dependencies
    });

    logger.debug(`Registered service: ${serviceId}`);
  }

  /**
   * Get a service instance, creating it if necessary
   */
  get<T extends ServiceIdType>(serviceId: T): ServiceRegistry[T] {
    const registration = this.services.get(serviceId);
    
    if (!registration) {
      throw new Error(`Service '${serviceId}' is not registered`);
    }

    // Return existing instance if available
    if (registration.instance) {
      return registration.instance;
    }

    // Check dependencies first
    if (registration.dependencies) {
      for (const dependency of registration.dependencies) {
        this.get(dependency);
      }
    }

    // Create new instance
    try {
      registration.instance = registration.factory();
      registration.initialized = true;
      logger.debug(`Created service instance: ${serviceId}`);
      return registration.instance;
    } catch (error) {
      logger.error(`Failed to create service instance for ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a service is registered
   */
  has(serviceId: ServiceIdType): boolean {
    return this.services.has(serviceId);
  }

  /**
   * Check if a service is initialized
   */
  isInitialized(serviceId: ServiceIdType): boolean {
    const registration = this.services.get(serviceId);
    return registration?.initialized ?? false;
  }

  /**
   * Initialize all registered services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    logger.info('Initializing service locator...');

    // Initialize services in dependency order
    const initialized = new Set<ServiceIdType>();
    const toInitialize = Array.from(this.services.keys());

    while (toInitialize.length > 0) {
      const serviceId = toInitialize.shift()!;
      const registration = this.services.get(serviceId)!;

      // Check if dependencies are satisfied
      if (registration.dependencies && !registration.dependencies.every(dep => initialized.has(dep))) {
        toInitialize.push(serviceId); // Put back at end of queue
        continue;
      }

      // Initialize service
      if (!registration.initialized) {
        this.get(serviceId);
      }

      initialized.add(serviceId);
    }

    this.initialized = true;
    logger.info('Service locator initialized successfully');
  }

  /**
   * Reset the service locator (useful for testing)
   */
  reset(): void {
    this.services.clear();
    this.initialized = false;
    logger.debug('Service locator reset');
  }

  /**
   * Close all services that have a close method
   */
  async close(): Promise<void> {
    logger.info('Closing service locator and all services...');

    const closePromises: Promise<void>[] = [];

    for (const [serviceId, registration] of this.services.entries()) {
      if (registration.instance && typeof registration.instance.close === 'function') {
        logger.debug(`Closing service: ${serviceId}`);
        closePromises.push(
          registration.instance.close().catch((error: any) => {
            logger.error(`Error closing service ${serviceId}:`, error);
          })
        );
      }
    }

    // Wait for all services to close
    await Promise.allSettled(closePromises);

    // Clear all instances
    for (const registration of this.services.values()) {
      registration.instance = undefined;
      registration.initialized = false;
    }

    this.initialized = false;
    logger.info('Service locator closed successfully');
  }

  /**
   * Get all registered service IDs
   */
  getRegisteredServices(): ServiceIdType[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service registration info
   */
  getServiceInfo(serviceId: ServiceIdType): { initialized: boolean; hasInstance: boolean; dependencies?: ServiceIdType[] } | null {
    const registration = this.services.get(serviceId);
    if (!registration) {
      return null;
    }

    return {
      initialized: registration.initialized,
      hasInstance: !!registration.instance,
      dependencies: registration.dependencies
    };
  }
}

/**
 * Global service locator instance
 */
let globalServiceLocator: ServiceLocator | null = null;

/**
 * Get or create the global service locator instance
 */
export function getServiceLocator(config?: ServiceLocatorConfig): ServiceLocator {
  if (!globalServiceLocator) {
    globalServiceLocator = new ServiceLocator(config);
  }
  return globalServiceLocator;
}

/**
 * Initialize the global service locator with default services
 */
export async function initializeServiceLocator(config?: ServiceLocatorConfig): Promise<ServiceLocator> {
  const locator = getServiceLocator(config);

  // Register default services
  locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());
  locator.register(ServiceId.MCP_SERVICE, () => new McpService());
  locator.register(ServiceId.CONVERSATION_HISTORY_SERVICE, () => new ConversationHistoryService());
  locator.register(ServiceId.COMMAND_SERVICE, () => new CommandService());

  // Register memory service
  locator.register(
    ServiceId.MEMORY_SERVICE,
    () => new MemoryService({
      autoInitialize: true
    })
  );

  // Initialize all services
  await locator.initialize();

  return locator;
}

/**
 * Close the global service locator
 */
export async function closeServiceLocator(): Promise<void> {
  if (globalServiceLocator) {
    await globalServiceLocator.close();
    globalServiceLocator = null;
  }
}

/**
 * Convenience functions for accessing specific services
 */
export const getMemoryService = (): MemoryService => 
  getServiceLocator().get(ServiceId.MEMORY_SERVICE);

export const getPersonalityService = (): PersonalityService => 
  getServiceLocator().get(ServiceId.PERSONALITY_SERVICE);

export const getMcpService = (): McpService => 
  getServiceLocator().get(ServiceId.MCP_SERVICE);

export const getConversationHistoryService = (): ConversationHistoryService => 
  getServiceLocator().get(ServiceId.CONVERSATION_HISTORY_SERVICE);

export const getCommandService = (): CommandService => 
  getServiceLocator().get(ServiceId.COMMAND_SERVICE);
