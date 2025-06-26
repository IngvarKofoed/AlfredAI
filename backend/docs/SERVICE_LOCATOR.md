# Type-Safe Service Locator

This document describes the type-safe service locator implementation that provides centralized dependency management for the AlfredAI backend.

## Overview

The service locator replaces the scattered singleton instances throughout the codebase with a unified, type-safe dependency injection system. It provides:

- **Type Safety**: Compile-time type checking for all service registrations and retrievals
- **Dependency Management**: Automatic resolution of service dependencies
- **Singleton Management**: Ensures each service has only one instance
- **Lazy Loading**: Services are created only when first accessed
- **Centralized Configuration**: All service configuration in one place

## Architecture

### Core Components

1. **ServiceLocator**: Main class that manages service registration and retrieval
2. **ServiceId**: Constants defining all available service identifiers
3. **ServiceRegistry**: Type mapping service IDs to their implementations
4. **ServiceFactory**: Function type for creating service instances

### Service Identifiers

```typescript
export const ServiceId = {
  MEMORY_SERVICE: 'memoryService',
  PERSONALITY_SERVICE: 'personalityService',
  MCP_SERVICE: 'mcpService',
  CONVERSATION_HISTORY_SERVICE: 'conversationHistoryService',
} as const;
```

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

const locator = new ServiceLocator();

// Register a service
locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());

// Register with dependencies
locator.register(
  ServiceId.MEMORY_SERVICE,
  () => new MemoryService(),
  [ServiceId.PERSONALITY_SERVICE]
);
```

## Service Dependencies

The service locator automatically resolves dependencies when creating services:

```typescript
// MemoryService depends on PersonalityService
locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());
locator.register(
  ServiceId.MEMORY_SERVICE,
  () => new MemoryService(),
  [ServiceId.PERSONALITY_SERVICE] // Dependency
);

// When getting MemoryService, PersonalityService is created first
const memoryService = locator.get(ServiceId.MEMORY_SERVICE);
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
- `lazyLoading`: `true` - Services are created only when first accessed

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

## API Reference

### ServiceLocator Class

#### Methods

- `register<T>(serviceId: T, factory: ServiceFactory<T>, dependencies?: ServiceIdType[])`: Register a service
- `get<T>(serviceId: T): ServiceRegistry[T]`: Get a service instance
- `has(serviceId: ServiceIdType): boolean`: Check if service is registered
- `isInitialized(serviceId: ServiceIdType): boolean`: Check if service is initialized
- `initialize(): Promise<void>`: Initialize all registered services
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

  it('should work with service locator', () => {
    locator.register(ServiceId.PERSONALITY_SERVICE, () => new PersonalityService());
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

## Future Enhancements

1. **Service Lifecycle Management**: Add support for service lifecycle hooks
2. **Configuration Injection**: Inject configuration into services
3. **Service Scoping**: Support for different service scopes (singleton, transient, etc.)
4. **Async Service Initialization**: Support for async service initialization
5. **Service Health Checks**: Built-in health check functionality
6. **Metrics and Monitoring**: Service usage metrics and monitoring

## Integration with Existing Code

To integrate the service locator with existing code:

1. Replace direct singleton imports with service locator calls
2. Update service constructors to accept dependencies through the locator
3. Use the convenience functions for common services
4. Update tests to use the service locator's reset functionality

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