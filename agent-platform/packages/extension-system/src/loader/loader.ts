/**
 * Extension Loader
 * Dynamic loading system with dependency resolution and module caching
 */

import * as path from 'path';
import { EventEmitter } from 'events';
import { ExtensionRegistry } from '../registry/registry';
import {
  ExtensionManifest,
  ExtensionMetadata,
  ExtensionState
} from '../manifest/schema';

/**
 * Extension module interface
 * All extensions must export activate() and deactivate()
 */
export interface ExtensionModule {
  activate?(context: ExtensionContext): Promise<void> | void;
  deactivate?(): Promise<void> | void;
}

/**
 * Extension context passed to activate()
 */
export interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  manifest: ExtensionManifest;
  registry: ExtensionRegistry;
  subscriptions: Disposable[];
}

/**
 * Disposable resource interface
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Loader events
 */
export enum LoaderEvent {
  EXTENSION_LOADED = 'extension:loaded',
  EXTENSION_ACTIVATED = 'extension:activated',
  EXTENSION_DEACTIVATED = 'extension:deactivated',
  EXTENSION_LOAD_ERROR = 'extension:load-error'
}

/**
 * Loader error
 */
export class LoaderError extends Error {
  constructor(
    message: string,
    public code: string,
    public extensionId?: string
  ) {
    super(message);
    this.name = 'LoaderError';
  }
}

/**
 * Extension Loader
 * Handles dynamic loading, activation, and dependency resolution
 */
export class ExtensionLoader extends EventEmitter {
  private registry: ExtensionRegistry;
  private moduleCache: Map<string, ExtensionModule>;
  private contexts: Map<string, ExtensionContext>;
  private loadOrder: string[];

  constructor(registry: ExtensionRegistry) {
    super();
    this.registry = registry;
    this.moduleCache = new Map();
    this.contexts = new Map();
    this.loadOrder = [];
  }

  /**
   * Load an extension module
   */
  async load(extensionId: string): Promise<ExtensionModule> {
    // Check if already loaded
    if (this.moduleCache.has(extensionId)) {
      return this.moduleCache.get(extensionId)!;
    }

    const metadata = this.registry.get(extensionId);

    try {
      // Resolve main module path
      const modulePath = path.resolve(metadata.installPath, metadata.main);

      // Dynamic import
      const module = await this.importModule(modulePath);

      // Validate module interface
      this.validateModule(module, extensionId);

      // Cache module
      this.moduleCache.set(extensionId, module);
      this.loadOrder.push(extensionId);

      // Update metadata
      metadata.module = module;

      // Emit event
      this.emit(LoaderEvent.EXTENSION_LOADED, { extensionId, module });

      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.registry.setError(extensionId, `Load failed: ${message}`);
      
      this.emit(LoaderEvent.EXTENSION_LOAD_ERROR, {
        extensionId,
        error: message
      });

      throw new LoaderError(
        `Failed to load extension ${extensionId}: ${message}`,
        'LOAD_FAILED',
        extensionId
      );
    }
  }

  /**
   * Activate an extension
   */
  async activate(extensionId: string): Promise<void> {
    const metadata = this.registry.get(extensionId);

    // Check current state
    if (metadata.state === ExtensionState.ENABLED) {
      return; // Already activated
    }

    // Load dependencies first
    await this.loadDependencies(extensionId);

    // Activate dependencies
    await this.activateDependencies(extensionId);

    try {
      // Load module if not loaded
      let module = this.moduleCache.get(extensionId);
      if (!module) {
        module = await this.load(extensionId);
      }

      // Create extension context
      const context = this.createContext(extensionId, metadata);
      this.contexts.set(extensionId, context);

      // Call activate
      if (module.activate) {
        await module.activate(context);
      }

      // Update state
      await this.registry.enable(extensionId);

      // Emit event
      this.emit(LoaderEvent.EXTENSION_ACTIVATED, { extensionId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.registry.setError(extensionId, `Activation failed: ${message}`);

      throw new LoaderError(
        `Failed to activate extension ${extensionId}: ${message}`,
        'ACTIVATION_FAILED',
        extensionId
      );
    }
  }

  /**
   * Deactivate an extension
   */
  async deactivate(extensionId: string): Promise<void> {
    const metadata = this.registry.get(extensionId);

    if (metadata.state !== ExtensionState.ENABLED) {
      return; // Not activated
    }

    try {
      // Get module
      const module = this.moduleCache.get(extensionId);
      
      // Call deactivate
      if (module?.deactivate) {
        await module.deactivate();
      }

      // Dispose context subscriptions
      const context = this.contexts.get(extensionId);
      if (context) {
        this.disposeContext(context);
        this.contexts.delete(extensionId);
      }

      // Update state
      await this.registry.disable(extensionId);

      // Emit event
      this.emit(LoaderEvent.EXTENSION_DEACTIVATED, { extensionId });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      throw new LoaderError(
        `Failed to deactivate extension ${extensionId}: ${message}`,
        'DEACTIVATION_FAILED',
        extensionId
      );
    }
  }

  /**
   * Unload an extension
   */
  async unload(extensionId: string): Promise<void> {
    // Deactivate if active
    const metadata = this.registry.get(extensionId);
    if (metadata.state === ExtensionState.ENABLED) {
      await this.deactivate(extensionId);
    }

    // Remove from caches
    this.moduleCache.delete(extensionId);
    this.contexts.delete(extensionId);
    
    const index = this.loadOrder.indexOf(extensionId);
    if (index !== -1) {
      this.loadOrder.splice(index, 1);
    }

    // Clear module reference
    if (metadata.module) {
      delete metadata.module;
    }
  }

  /**
   * Load all extensions in dependency order
   */
  async loadAll(): Promise<void> {
    const extensions = this.registry.getAll();
    const sorted = this.topologicalSort(extensions);

    for (const extensionId of sorted) {
      try {
        await this.load(extensionId);
      } catch (error) {
        // Continue loading other extensions
        console.error(`Failed to load ${extensionId}:`, error);
      }
    }
  }

  /**
   * Activate all loaded extensions
   */
  async activateAll(): Promise<void> {
    // Activate in load order (dependencies first)
    for (const extensionId of this.loadOrder) {
      const metadata = this.registry.get(extensionId);
      
      // Skip if already enabled or in error state
      if (metadata.state === ExtensionState.ENABLED || 
          metadata.state === ExtensionState.ERROR) {
        continue;
      }

      try {
        await this.activate(extensionId);
      } catch (error) {
        // Continue activating other extensions
        console.error(`Failed to activate ${extensionId}:`, error);
      }
    }
  }

  /**
   * Deactivate all active extensions
   */
  async deactivateAll(): Promise<void> {
    // Deactivate in reverse order (dependents first)
    const reversed = [...this.loadOrder].reverse();

    for (const extensionId of reversed) {
      try {
        await this.deactivate(extensionId);
      } catch (error) {
        console.error(`Failed to deactivate ${extensionId}:`, error);
      }
    }
  }

  /**
   * Get loaded module
   */
  getModule(extensionId: string): ExtensionModule | undefined {
    return this.moduleCache.get(extensionId);
  }

  /**
   * Get extension context
   */
  getContext(extensionId: string): ExtensionContext | undefined {
    return this.contexts.get(extensionId);
  }

  /**
   * Check if extension is loaded
   */
  isLoaded(extensionId: string): boolean {
    return this.moduleCache.has(extensionId);
  }

  /**
   * Get load order
   */
  getLoadOrder(): string[] {
    return [...this.loadOrder];
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.moduleCache.clear();
    this.contexts.clear();
    this.loadOrder = [];
  }

  /**
   * Import module (can be overridden for testing)
   */
  protected async importModule(modulePath: string): Promise<ExtensionModule> {
    const module = await import(modulePath);
    return module.default || module;
  }

  /**
   * Validate module interface
   */
  private validateModule(module: any, extensionId: string): void {
    if (!module || typeof module !== 'object') {
      throw new LoaderError(
        'Extension must export an object',
        'INVALID_MODULE',
        extensionId
      );
    }

    if (module.activate && typeof module.activate !== 'function') {
      throw new LoaderError(
        'activate must be a function',
        'INVALID_ACTIVATE',
        extensionId
      );
    }

    if (module.deactivate && typeof module.deactivate !== 'function') {
      throw new LoaderError(
        'deactivate must be a function',
        'INVALID_DEACTIVATE',
        extensionId
      );
    }
  }

  /**
   * Load dependencies
   */
  private async loadDependencies(extensionId: string): Promise<void> {
    const dependencies = this.registry.getDependencies(extensionId, false);

    for (const depId of dependencies) {
      if (!this.moduleCache.has(depId)) {
        await this.load(depId);
      }
    }
  }

  /**
   * Activate dependencies
   */
  private async activateDependencies(extensionId: string): Promise<void> {
    const metadata = this.registry.get(extensionId);

    for (const dep of metadata.dependencies) {
      if (dep.optional) continue;

      const depMetadata = this.registry.get(dep.id);
      if (depMetadata.state !== ExtensionState.ENABLED) {
        await this.activate(dep.id);
      }
    }
  }

  /**
   * Create extension context
   */
  private createContext(
    extensionId: string,
    metadata: ExtensionMetadata
  ): ExtensionContext {
    return {
      extensionId,
      extensionPath: metadata.installPath,
      manifest: metadata,
      registry: this.registry,
      subscriptions: []
    };
  }

  /**
   * Dispose context subscriptions
   */
  private disposeContext(context: ExtensionContext): void {
    for (const subscription of context.subscriptions) {
      try {
        subscription.dispose();
      } catch (error) {
        console.error('Error disposing subscription:', error);
      }
    }
    context.subscriptions = [];
  }

  /**
   * Topological sort for dependency ordering
   */
  private topologicalSort(extensions: ExtensionMetadata[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      
      if (visiting.has(id)) {
        throw new LoaderError(
          `Circular dependency detected involving ${id}`,
          'CIRCULAR_DEPENDENCY',
          id
        );
      }

      visiting.add(id);

      const metadata = this.registry.get(id);
      for (const dep of metadata.dependencies) {
        if (!dep.optional && this.registry.has(dep.id)) {
          visit(dep.id);
        }
      }

      visiting.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    for (const ext of extensions) {
      visit(ext.id);
    }

    return sorted;
  }
}
