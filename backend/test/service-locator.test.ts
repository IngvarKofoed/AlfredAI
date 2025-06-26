/**
 * Service Locator Tests
 * 
 * This file contains comprehensive tests for the type-safe service locator.
 */

import { ServiceLocator, ServiceId, ServiceIdType, initializeServiceLocator, getServiceLocator, closeServiceLocator } from '../src/service-locator';
import { MemoryService } from '../src/memory/memory-service';
import { PersonalityService } from '../src/tools/personality/personality-service';
import { McpService } from '../src/tools/mcp/mcp-service';
import { ConversationHistoryService } from '../src/conversation-history';

describe('ServiceLocator', () => {
  let serviceLocator: ServiceLocator;

  beforeEach(() => {
    serviceLocator = new ServiceLocator();
  });

  afterEach(() => {
    serviceLocator.reset();
  });

  describe('Service Registration', () => {
    it('should register a service successfully', () => {
      const mockFactory = () => new PersonalityService();
      
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory);
      
      expect(serviceLocator.has(ServiceId.PERSONALITY_SERVICE)).toBe(true);
    });

    it('should overwrite existing service registration', () => {
      const mockFactory1 = () => new PersonalityService();
      const mockFactory2 = () => new PersonalityService();
      
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory1);
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory2);
      
      expect(serviceLocator.has(ServiceId.PERSONALITY_SERVICE)).toBe(true);
    });

    it('should register service with dependencies', () => {
      const mockFactory = () => new MemoryService();
      
      serviceLocator.register(
        ServiceId.MEMORY_SERVICE, 
        mockFactory, 
        [ServiceId.PERSONALITY_SERVICE]
      );
      
      const info = serviceLocator.getServiceInfo(ServiceId.MEMORY_SERVICE);
      expect(info?.dependencies).toEqual([ServiceId.PERSONALITY_SERVICE]);
    });
  });

  describe('Service Retrieval', () => {
    it('should create and return service instance on first access', () => {
      const mockFactory = () => new PersonalityService();
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory);
      
      const instance = serviceLocator.get(ServiceId.PERSONALITY_SERVICE);
      
      expect(instance).toBeInstanceOf(PersonalityService);
      expect(serviceLocator.isInitialized(ServiceId.PERSONALITY_SERVICE)).toBe(true);
    });

    it('should return same instance on subsequent access', () => {
      const mockFactory = () => new PersonalityService();
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory);
      
      const instance1 = serviceLocator.get(ServiceId.PERSONALITY_SERVICE);
      const instance2 = serviceLocator.get(ServiceId.PERSONALITY_SERVICE);
      
      expect(instance1).toBe(instance2);
    });

    it('should throw error for unregistered service', () => {
      expect(() => {
        serviceLocator.get(ServiceId.MEMORY_SERVICE);
      }).toThrow("Service 'memoryService' is not registered");
    });

    it('should resolve dependencies before creating service', () => {
      const dependencyFactory = () => new PersonalityService();
      const serviceFactory = () => new MemoryService();
      
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, dependencyFactory);
      serviceLocator.register(
        ServiceId.MEMORY_SERVICE, 
        serviceFactory, 
        [ServiceId.PERSONALITY_SERVICE]
      );
      
      const service = serviceLocator.get(ServiceId.MEMORY_SERVICE);
      
      expect(service).toBeInstanceOf(MemoryService);
      expect(serviceLocator.isInitialized(ServiceId.PERSONALITY_SERVICE)).toBe(true);
      expect(serviceLocator.isInitialized(ServiceId.MEMORY_SERVICE)).toBe(true);
    });
  });

  describe('Service Initialization', () => {
    it('should initialize all services in dependency order', async () => {
      const dependencyFactory = () => new PersonalityService();
      const serviceFactory = () => new MemoryService();
      
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, dependencyFactory);
      serviceLocator.register(
        ServiceId.MEMORY_SERVICE, 
        serviceFactory, 
        [ServiceId.PERSONALITY_SERVICE]
      );
      
      await serviceLocator.initialize();
      
      expect(serviceLocator.isInitialized(ServiceId.PERSONALITY_SERVICE)).toBe(true);
      expect(serviceLocator.isInitialized(ServiceId.MEMORY_SERVICE)).toBe(true);
    });

    it('should handle circular dependencies gracefully', () => {
      const factory1 = () => new PersonalityService();
      const factory2 = () => new McpService();
      
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, factory1, [ServiceId.MCP_SERVICE]);
      serviceLocator.register(ServiceId.MCP_SERVICE, factory2, [ServiceId.PERSONALITY_SERVICE]);
      
      // This should not cause infinite recursion
      expect(() => {
        serviceLocator.get(ServiceId.PERSONALITY_SERVICE);
      }).toThrow();
    });
  });

  describe('Service Information', () => {
    it('should provide service registration info', () => {
      const mockFactory = () => new PersonalityService();
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory);
      
      const info = serviceLocator.getServiceInfo(ServiceId.PERSONALITY_SERVICE);
      
      expect(info).toEqual({
        initialized: false,
        hasInstance: false,
        dependencies: undefined
      });
    });

    it('should return null for unregistered service', () => {
      const info = serviceLocator.getServiceInfo(ServiceId.MEMORY_SERVICE);
      expect(info).toBeNull();
    });

    it('should update info after service initialization', () => {
      const mockFactory = () => new PersonalityService();
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory);
      
      serviceLocator.get(ServiceId.PERSONALITY_SERVICE);
      
      const info = serviceLocator.getServiceInfo(ServiceId.PERSONALITY_SERVICE);
      expect(info?.initialized).toBe(true);
      expect(info?.hasInstance).toBe(true);
    });

    it('should return all registered service IDs', () => {
      const mockFactory = () => new PersonalityService();
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory);
      serviceLocator.register(ServiceId.MCP_SERVICE, () => new McpService());
      
      const services = serviceLocator.getRegisteredServices();
      
      expect(services).toContain(ServiceId.PERSONALITY_SERVICE);
      expect(services).toContain(ServiceId.MCP_SERVICE);
      expect(services).toHaveLength(2);
    });
  });

  describe('Global Service Locator', () => {
    it('should return same instance on multiple calls', () => {
      const locator1 = getServiceLocator();
      const locator2 = getServiceLocator();
      
      expect(locator1).toBe(locator2);
    });

    it('should initialize with default services', async () => {
      const locator = await initializeServiceLocator();
      
      expect(locator.has(ServiceId.PERSONALITY_SERVICE)).toBe(true);
      expect(locator.has(ServiceId.MCP_SERVICE)).toBe(true);
      expect(locator.has(ServiceId.CONVERSATION_HISTORY_SERVICE)).toBe(true);
      expect(locator.has(ServiceId.MEMORY_SERVICE)).toBe(true);
    });

    it('should work with global service locator', async () => {
      // Initialize the global service locator
      const locator = await initializeServiceLocator();

      // Verify services are initialized
      expect(locator.isInitialized(ServiceId.MEMORY_SERVICE)).toBe(true);
      expect(locator.isInitialized(ServiceId.MCP_SERVICE)).toBe(true);

      // Close the global service locator
      await closeServiceLocator();

      // Verify that services are no longer initialized
      expect(locator.isInitialized(ServiceId.MEMORY_SERVICE)).toBe(false);
      expect(locator.isInitialized(ServiceId.MCP_SERVICE)).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for service retrieval', () => {
      const mockFactory = () => new PersonalityService();
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, mockFactory);
      
      const instance = serviceLocator.get(ServiceId.PERSONALITY_SERVICE);
      
      // TypeScript should infer the correct type
      expect(instance).toBeInstanceOf(PersonalityService);
      // The following should compile without type errors
      expect(typeof instance.getAllPersonalities).toBe('function');
    });

    it('should handle different service types correctly', () => {
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());
      serviceLocator.register(ServiceId.MCP_SERVICE, () => new McpService());
      serviceLocator.register(ServiceId.CONVERSATION_HISTORY_SERVICE, () => new ConversationHistoryService());
      
      const personalityService = serviceLocator.get(ServiceId.PERSONALITY_SERVICE);
      const mcpService = serviceLocator.get(ServiceId.MCP_SERVICE);
      const conversationHistoryService = serviceLocator.get(ServiceId.CONVERSATION_HISTORY_SERVICE);
      
      expect(personalityService).toBeInstanceOf(PersonalityService);
      expect(mcpService).toBeInstanceOf(McpService);
      expect(conversationHistoryService).toBeInstanceOf(ConversationHistoryService);
    });
  });

  describe('Error Handling', () => {
    it('should handle factory errors gracefully', () => {
      const failingFactory = () => {
        throw new Error('Factory failed');
      };
      
      serviceLocator.register(ServiceId.MEMORY_SERVICE, failingFactory);
      
      expect(() => {
        serviceLocator.get(ServiceId.MEMORY_SERVICE);
      }).toThrow('Factory failed');
    });

    it('should handle dependency resolution errors', () => {
      const serviceFactory = () => new MemoryService();
      
      serviceLocator.register(
        ServiceId.MEMORY_SERVICE, 
        serviceFactory, 
        [ServiceId.PERSONALITY_SERVICE]
      );
      
      expect(() => {
        serviceLocator.get(ServiceId.MEMORY_SERVICE);
      }).toThrow("Service 'personalityService' is not registered");
    });
  });

  describe('close', () => {
    it('should close all services that have a close method', async () => {
      // Create a mock service with a close method
      const mockServiceWithClose = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      const mockServiceWithoutClose = {
        someMethod: jest.fn()
      };

      // Register services
      serviceLocator.register(ServiceId.MEMORY_SERVICE, () => mockServiceWithClose as any);
      serviceLocator.register(ServiceId.PERSONALITY_SERVICE, () => mockServiceWithoutClose as any);

      // Initialize services to create instances
      await serviceLocator.initialize();

      // Close the service locator
      await serviceLocator.close();

      // Verify that close was called on the service that has it
      expect(mockServiceWithClose.close).toHaveBeenCalledTimes(1);

      // Verify that services are reset
      expect(serviceLocator.isInitialized(ServiceId.MEMORY_SERVICE)).toBe(false);
      expect(serviceLocator.isInitialized(ServiceId.PERSONALITY_SERVICE)).toBe(false);
    });

    it('should handle errors when closing services gracefully', async () => {
      // Create a mock service that throws an error when closing
      const mockServiceWithError = {
        close: jest.fn().mockRejectedValue(new Error('Close failed'))
      };

      const mockServiceWithClose = {
        close: jest.fn().mockResolvedValue(undefined)
      };

      // Register services
      serviceLocator.register(ServiceId.MEMORY_SERVICE, () => mockServiceWithError as any);
      serviceLocator.register(ServiceId.MCP_SERVICE, () => mockServiceWithClose as any);

      // Initialize services
      await serviceLocator.initialize();

      // Close should not throw even if one service fails
      await expect(serviceLocator.close()).resolves.not.toThrow();

      // Verify that both close methods were called
      expect(mockServiceWithError.close).toHaveBeenCalledTimes(1);
      expect(mockServiceWithClose.close).toHaveBeenCalledTimes(1);
    });
  });
});

// Example usage demonstration
describe('ServiceLocator Usage Examples', () => {
  it('should demonstrate typical usage pattern', async () => {
    // Initialize the global service locator
    const locator = await initializeServiceLocator();
    
    // Access services through convenience functions
    const personalityService = locator.get(ServiceId.PERSONALITY_SERVICE);
    const memoryService = locator.get(ServiceId.MEMORY_SERVICE);
    const mcpService = locator.get(ServiceId.MCP_SERVICE);
    
    // Verify services are properly initialized
    expect(personalityService).toBeInstanceOf(PersonalityService);
    expect(memoryService).toBeInstanceOf(MemoryService);
    expect(mcpService).toBeInstanceOf(McpService);
    
    // Verify services are singletons
    const personalityService2 = locator.get(ServiceId.PERSONALITY_SERVICE);
    expect(personalityService).toBe(personalityService2);
  });

  it('should demonstrate service dependency resolution', () => {
    const locator = new ServiceLocator();
    
    // Register services with dependencies
    locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());
    locator.register(
      ServiceId.MEMORY_SERVICE, 
      () => new MemoryService({ autoInitialize: false }), 
      [ServiceId.PERSONALITY_SERVICE]
    );
    
    // Get the dependent service
    const memoryService = locator.get(ServiceId.MEMORY_SERVICE);
    
    // Verify both services are initialized
    expect(memoryService).toBeInstanceOf(MemoryService);
    expect(locator.isInitialized(ServiceId.PERSONALITY_SERVICE)).toBe(true);
    expect(locator.isInitialized(ServiceId.MEMORY_SERVICE)).toBe(true);
  });
}); 