/**
 * Service Locator Pattern Implementation
 * Provides centralized service registration and resolution with type safety
 */

/**
 * Service lifecycle types
 */
export enum ServiceLifetime {
  /** New instance created every time */
  Transient = 'transient',
  /** Single instance created and reused */
  Singleton = 'singleton',
  /** Instance created per scope (useful for request-scoped services) */
  Scoped = 'scoped'
}

/**
 * Service factory function type
 */
export type ServiceFactory<T = any> = (locator: ServiceLocator) => T | Promise<T>;

/**
 * Service registration descriptor
 */
interface ServiceDescriptor<T = any> {
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  instance?: T;
  scopedInstances?: Map<string, T>;
}

/**
 * Service identifier type - can be string, symbol, or constructor function
 */
export type ServiceIdentifier<T = any> = string | symbol | (new (...args: any[]) => T);

/**
 * Service Locator class for dependency injection and service management
 */
export class ServiceLocator {
  private services = new Map<ServiceIdentifier, ServiceDescriptor>();
  private currentScope?: string;

  /**
   * Register a service with the locator
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.Transient
  ): this {
    this.services.set(identifier, {
      factory,
      lifetime,
      scopedInstances: lifetime === ServiceLifetime.Scoped ? new Map() : undefined
    });
    return this;
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>
  ): this {
    return this.register(identifier, factory, ServiceLifetime.Singleton);
  }

  /**
   * Register a transient service
   */
  registerTransient<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>
  ): this {
    return this.register(identifier, factory, ServiceLifetime.Transient);
  }

  /**
   * Register a scoped service
   */
  registerScoped<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>
  ): this {
    return this.register(identifier, factory, ServiceLifetime.Scoped);
  }

  /**
   * Register an instance directly as a singleton
   */
  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): this {
    this.services.set(identifier, {
      factory: () => instance,
      lifetime: ServiceLifetime.Singleton,
      instance
    });
    return this;
  }

  /**
   * Resolve a service by its identifier
   */
  async resolve<T>(identifier: ServiceIdentifier<T>): Promise<T> {
    const descriptor = this.services.get(identifier);
    if (!descriptor) {
      throw new Error(`Service not registered: ${this.getIdentifierName(identifier)}`);
    }

    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        if (!descriptor.instance) {
          descriptor.instance = await descriptor.factory(this);
        }
        return descriptor.instance;

      case ServiceLifetime.Scoped:
        if (!this.currentScope) {
          throw new Error('No active scope for scoped service resolution');
        }
        if (!descriptor.scopedInstances!.has(this.currentScope)) {
          const instance = await descriptor.factory(this);
          descriptor.scopedInstances!.set(this.currentScope, instance);
        }
        return descriptor.scopedInstances!.get(this.currentScope)!;

      case ServiceLifetime.Transient:
      default:
        return await descriptor.factory(this);
    }
  }

  /**
   * Synchronous resolve for services that don't require async initialization
   */
  resolveSync<T>(identifier: ServiceIdentifier<T>): T {
    const descriptor = this.services.get(identifier);
    if (!descriptor) {
      throw new Error(`Service not registered: ${this.getIdentifierName(identifier)}`);
    }

    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        if (!descriptor.instance) {
          const result = descriptor.factory(this);
          if (result instanceof Promise) {
            throw new Error(`Cannot synchronously resolve async service: ${this.getIdentifierName(identifier)}`);
          }
          descriptor.instance = result;
        }
        return descriptor.instance;

      case ServiceLifetime.Scoped:
        if (!this.currentScope) {
          throw new Error('No active scope for scoped service resolution');
        }
        if (!descriptor.scopedInstances!.has(this.currentScope)) {
          const result = descriptor.factory(this);
          if (result instanceof Promise) {
            throw new Error(`Cannot synchronously resolve async service: ${this.getIdentifierName(identifier)}`);
          }
          descriptor.scopedInstances!.set(this.currentScope, result);
        }
        return descriptor.scopedInstances!.get(this.currentScope)!;

      case ServiceLifetime.Transient:
      default:
        const result = descriptor.factory(this);
        if (result instanceof Promise) {
          throw new Error(`Cannot synchronously resolve async service: ${this.getIdentifierName(identifier)}`);
        }
        return result;
    }
  }

  /**
   * Check if a service is registered
   */
  isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    return this.services.has(identifier);
  }

  /**
   * Create a new scope for scoped services
   */
  createScope(scopeId?: string): ServiceScope {
    const id = scopeId || `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new ServiceScope(this, id);
  }

  /**
   * Set the current scope (internal use)
   */
  setCurrentScope(scopeId: string | undefined): void {
    this.currentScope = scopeId;
  }

  /**
   * Clear all scoped instances for a specific scope
   */
  clearScope(scopeId: string): void {
    for (const descriptor of this.services.values()) {
      if (descriptor.scopedInstances) {
        descriptor.scopedInstances.delete(scopeId);
      }
    }
  }

  /**
   * Get all registered service identifiers
   */
  getRegisteredServices(): ServiceIdentifier[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.currentScope = undefined;
  }

  /**
   * Get a human-readable name for a service identifier
   */
  private getIdentifierName(identifier: ServiceIdentifier): string {
    if (typeof identifier === 'string') return identifier;
    if (typeof identifier === 'symbol') return identifier.toString();
    if (typeof identifier === 'function') return identifier.name || 'Anonymous';
    return 'Unknown';
  }
}

/**
 * Service scope for managing scoped service lifetimes
 */
export class ServiceScope implements Disposable {
  constructor(
    private locator: ServiceLocator,
    private scopeId: string
  ) {
    this.locator.setCurrentScope(this.scopeId);
  }

  /**
   * Resolve a service within this scope
   */
  async resolve<T>(identifier: ServiceIdentifier<T>): Promise<T> {
    return this.locator.resolve(identifier);
  }

  /**
   * Synchronously resolve a service within this scope
   */
  resolveSync<T>(identifier: ServiceIdentifier<T>): T {
    return this.locator.resolveSync(identifier);
  }

  /**
   * Dispose of the scope and clean up scoped instances
   */
  dispose(): void {
    this.locator.clearScope(this.scopeId);
    this.locator.setCurrentScope(undefined);
  }

  /**
   * Symbol.dispose for using with 'using' keyword in modern TypeScript
   */
  [Symbol.dispose](): void {
    this.dispose();
  }
}

/**
 * Global service locator instance
 */
export const serviceLocator = new ServiceLocator();

/**
 * Convenience function to register services
 */
export function registerService<T>(
  identifier: ServiceIdentifier<T>,
  factory: ServiceFactory<T>,
  lifetime: ServiceLifetime = ServiceLifetime.Transient
): void {
  serviceLocator.register(identifier, factory, lifetime);
}

/**
 * Convenience function to resolve services
 */
export function resolveService<T>(identifier: ServiceIdentifier<T>): Promise<T> {
  return serviceLocator.resolve(identifier);
}

/**
 * Convenience function to resolve services synchronously
 */
export function resolveServiceSync<T>(identifier: ServiceIdentifier<T>): T {
  return serviceLocator.resolveSync(identifier);
}
