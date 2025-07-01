# Type-Safe Service Locator

This document describes the type-safe service locator implementation that provides centralized dependency management for the AlfredAI backend.

## Overview

The service locator replaces the scattered singleton instances throughout the codebase with a unified, type-safe dependency injection system. It provides:

- **Type Safety**: Compile-time type checking for all service registrations and retrievals
- **Dependency Management**: Automatic resolution of service dependencies
- **Singleton Management**: Ensures each service has only one instance
- **Eager Loading**: Services are created and initialized during service locator initialization
- **Centralized Configuration**: All service configuration in one place
- **Standardized Lifecycle**: All services implement a consistent interface for initialization and cleanup

## Architecture

### Core Components

1. **ServiceLocator**: Main class that manages service registration and retrieval
2. **ServiceId**: Constants defining all available service identifiers
3. **ServiceRegistry**: Type mapping service IDs to their implementations
4. **ServiceFactory**: Function type for creating service instances
5. **Service Interface**: Base interface that all services must implement

### Service Identifiers

```typescript
export const ServiceId = {
  MEMORY_SERVICE: 'memoryService',
  PERSONALITY_SERVICE: 'personalityService',
  MCP_SERVICE: 'mcpService',
  CONVERSATION_HISTORY_SERVICE: 'conversationHistoryService',
} as const;
```

### Service Interface

All services managed by the ServiceLocator must implement the `Service` interface defined in `backend/src/types/service.ts`:

```typescript
export interface Service {
    initialize(): Promise<void>;
    close(): Promise<void>;
}
```

This interface ensures that all services have:
- **initialize()**: Called during service locator initialization to set up the service
- **close()**: Called during service locator shutdown to clean up resources

The service locator automatically calls these methods during its lifecycle management.

### Naming Convention

All services managed by the ServiceLocator should follow a consistent naming convention:

- **Service Classes**: Should be postfixed with "Service" (e.g., `MemoryService`, `PersonalityService`, `McpService`)
- **Service IDs**: Should use camelCase with "Service" suffix (e.g., `memoryService`, `personalityService`, `mcpService`)
- **Convenience Functions**: Should be prefixed with "get" and postfixed with "Service" (e.g., `getMemoryService()`, `getPersonalityService()`)

This convention ensures consistency across the codebase and makes it clear which classes are managed by the ServiceLocator.

## Usage

### Basic Usage

```typescript
import { getServiceLocator, ServiceId } from './service-locator';

// Get the global service locator
const locator = getServiceLocator();

// Access a service
const personalityService = locator.get(ServiceId.PERSONALITY_SERVICE);
const memoryService = locator.get(ServiceId.MEMORY_SERVICE);
```

### Convenience Functions

For common services, convenience functions are provided:

```typescript
import { 
  getMemoryService, 
  getPersonalityService, 
  getMcpService,
  getConversationHistoryService
} from './service-locator';

const memoryService = getMemoryService();
const personalityService = getPersonalityService();
const mcpService = getMcpService();
const conversationHistoryService = getConversationHistoryService();
```

### Initialization

The service locator can be initialized with default services:

```typescript
import { initializeServiceLocator } from './service-locator';

// Initialize with all default services
const locator = await initializeServiceLocator();

// Or with custom configuration
const locator = await initializeServiceLocator({
  autoInitialize: true,
  lazyLoading: true
});
```

### Custom Service Registration

```typescript
import { ServiceLocator, ServiceId } from './service-locator';
import { Service } from './types/service';

// Example service implementation
class MyCustomService implements Service {
  async initialize(): Promise<void> {
    // Set up the service
    console.log('Initializing MyCustomService');
  }

  async close(): Promise<void> {
    // Clean up resources
    console.log('Closing MyCustomService');
  }

  // Custom service methods
  doSomething(): void {
    console.log('MyCustomService doing something');
  }
}

const locator = new ServiceLocator();

// Register a service
locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());

// Register with dependencies
locator.register(
  ServiceId.MEMORY_SERVICE,
  () => new MemoryService(),
  [ServiceId.PERSONALITY_SERVICE]
);

// Register custom service
locator.register(ServiceId.CUSTOM_SERVICE, () => new MyCustomService());
```

## Service Dependencies

The service locator automatically resolves dependencies during initialization:

```typescript
// MemoryService depends on PersonalityService
locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());
locator.register(
  ServiceId.MEMORY_SERVICE,
  () => new MemoryService(),
  [ServiceId.PERSONALITY_SERVICE] // Dependency
);

// During initialization, PersonalityService is created and initialized before MemoryService
await locator.initialize();
```

## Configuration

### ServiceLocatorConfig

```typescript
interface ServiceLocatorConfig {
  /** Whether to auto-initialize services on registration */
  autoInitialize?: boolean;
  /** Whether to enable lazy loading of services */
  lazyLoading?: boolean;
  /** Custom service factories */
  factories?: Partial<Record<ServiceIdType, ServiceFactory<ServiceIdType>>>;
}
```

### Default Configuration

- `autoInitialize`: `true` - Services are initialized when registered
- `lazyLoading`: `false` - Services are created and initialized during service locator initialization

## Migration from Singleton Pattern

### Before (Scattered Singletons)

```typescript
// In personality-service.ts
export const personalityService = new PersonalityService();

// In mcp-service.ts
export const mcpService = new McpService();

// Usage scattered throughout codebase
import { personalityService } from './tools/personality/personality-service';
import { mcpService } from './tools/mcp/mcp-service';
```

### After (Service Locator)

```typescript
// Centralized service access
import { getPersonalityService, getMcpService } from './service-locator';

const personalityService = getPersonalityService();
const mcpService = getMcpService();
```

### Service Implementation Requirements

When migrating existing services to use the service locator, ensure they implement the `Service` interface:

```typescript
import { Service } from './types/service';

export class PersonalityService implements Service {
  async initialize(): Promise<void> {
    // Load configurations, establish connections, etc.
    await this.loadPersonalities();
  }

  async close(): Promise<void> {
    // Clean up resources, close connections, etc.
    await this.savePersonalities();
  }

  // ... existing service methods
}
```

## API Reference

### ServiceLocator Class

#### Methods

- `register<T>(serviceId: T, factory: ServiceFactory<T>, dependencies?: ServiceIdType[])`: Register a service
- `get<T>(serviceId: T): ServiceRegistry[T]`: Get a service instance (must be called after initialize())
- `has(serviceId: ServiceIdType): boolean`: Check if service is registered
- `isInitialized(serviceId: ServiceIdType): boolean`: Check if service is initialized
- `initialize(): Promise<void>`: Initialize all registered services (creates and initializes all services)
- `reset()`: Reset the service locator (useful for testing)
- `getRegisteredServices(): ServiceIdType[]`: Get all registered service IDs
- `getServiceInfo(serviceId: ServiceIdType)`: Get service registration info

### Global Functions

- `getServiceLocator(config?: ServiceLocatorConfig): ServiceLocator`: Get global service locator
- `initializeServiceLocator(config?: ServiceLocatorConfig): Promise<ServiceLocator>`: Initialize global service locator

### Convenience Functions

- `getMemoryService(): MemoryService`
- `getPersonalityService(): PersonalityService`
- `getMcpService(): McpService`
- `getConversationHistoryService(): ConversationHistoryService`

## Error Handling

The service locator provides comprehensive error handling:

```typescript
try {
  const service = locator.get(ServiceId.MEMORY_SERVICE);
} catch (error) {
  if (error.message.includes('is not registered')) {
    // Service not registered
  } else if (error.message.includes('has not been initialized')) {
    // Service locator not initialized - call initialize() first
  } else if (error.message.includes('Factory failed')) {
    // Service factory failed
  }
}
```

## Testing

The service locator includes a `reset()` method for testing:

```typescript
describe('MyService', () => {
  let locator: ServiceLocator;

  beforeEach(() => {
    locator = new ServiceLocator();
  });

  afterEach(() => {
    locator.reset();
  });

  it('should work with service locator', async () => {
    locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());
    await locator.initialize();
    const service = locator.get(ServiceId.PERSONALITY_SERVICE);
    expect(service).toBeInstanceOf(PersonalityService);
  });
});
```

## Benefits

1. **Centralized Management**: All services managed in one place
2. **Type Safety**: Compile-time checking prevents runtime errors
3. **Dependency Resolution**: Automatic handling of service dependencies
4. **Testability**: Easy to mock and test services
5. **Consistency**: Uniform pattern for service access
6. **Maintainability**: Easier to refactor and modify service relationships
7. **Standardized Lifecycle**: All services follow the same initialization and cleanup patterns
8. **Resource Management**: Automatic cleanup of service resources during shutdown

## Future Enhancements

1. **Enhanced Service Lifecycle Management**: Add support for additional lifecycle hooks (pre-initialize, post-initialize, etc.)
2. **Configuration Injection**: Inject configuration into services
3. **Service Scoping**: Support for different service scopes (singleton, transient, etc.)
4. **Service Health Checks**: Built-in health check functionality
5. **Metrics and Monitoring**: Service usage metrics and monitoring
6. **Service Dependencies Validation**: Validate service dependencies at registration time
7. **Service State Management**: Track and expose service state (initializing, running, error, etc.)

## Integration with Existing Code

To integrate the service locator with existing code:

1. **Implement Service Interface**: Ensure all services implement the `Service` interface
2. Replace direct singleton imports with service locator calls
3. Update service constructors to accept dependencies through the locator
4. Use the convenience functions for common services
5. Update tests to use the service locator's reset functionality

Example migration:

```typescript
// Before
import { personalityService } from './tools/personality/personality-service';
const personalities = personalityService.getAllPersonalities();

// After
import { getPersonalityService } from './service-locator';
const personalityService = getPersonalityService();
const personalities = personalityService.getAllPersonalities();
```

### Service Interface Implementation

When migrating existing services, add the required interface methods:

```typescript
// Before
export class PersonalityService {
  // ... existing methods
}

// After
import { Service } from './types/service';

export class PersonalityService implements Service {
  async initialize(): Promise<void> {
    // Load configurations, establish connections, etc.
    await this.loadPersonalities();
  }

  async close(): Promise<void> {
    // Clean up resources, close connections, etc.
    await this.savePersonalities();
  }

  // ... existing methods
}
``` 