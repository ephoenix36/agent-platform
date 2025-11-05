/**
 * Extension Registry
 * Central registry for managing extension lifecycle, state, and metadata
 */

import { EventEmitter } from 'events';
import * as semver from 'semver';
import {
  ExtensionManifest,
  ExtensionMetadata,
  ExtensionState,
  Permission,
  parseManifest,
  validateManifest
} from '../manifest/schema';

/**
 * Registry events
 */
export enum RegistryEvent {
  EXTENSION_REGISTERED = 'extension:registered',
  EXTENSION_UNREGISTERED = 'extension:unregistered',
  EXTENSION_STATE_CHANGED = 'extension:state-changed',
  EXTENSION_ENABLED = 'extension:enabled',
  EXTENSION_DISABLED = 'extension:disabled',
  EXTENSION_ERROR = 'extension:error'
}

/**
 * Extension registry error
 */
export class RegistryError extends Error {
  constructor(
    message: string,
    public code: string,
    public extensionId?: string
  ) {
    super(message);
    this.name = 'RegistryError';
  }
}

/**
 * Registry configuration
 */
export interface RegistryConfig {
  platformVersion: string;
  allowedPermissions?: Permission[];
  maxExtensions?: number;
}

/**
 * Extension Registry
 * Manages extension metadata, state, and lifecycle
 */
export class ExtensionRegistry extends EventEmitter {
  private extensions: Map<string, ExtensionMetadata>;
  private config: RegistryConfig;

  constructor(config: RegistryConfig) {
    super();
    this.extensions = new Map();
    this.config = config;
  }

  /**
   * Register a new extension
   */
  async register(
    manifest: ExtensionManifest,
    installPath: string
  ): Promise<ExtensionMetadata> {
    // Validate manifest
    const validation = validateManifest(manifest);
    if (!validation.success) {
      throw new RegistryError(
        `Invalid manifest: ${validation.errors?.message}`,
        'INVALID_MANIFEST',
        manifest.id
      );
    }

    // Check if already registered
    if (this.extensions.has(manifest.id)) {
      throw new RegistryError(
        `Extension ${manifest.id} is already registered`,
        'ALREADY_REGISTERED',
        manifest.id
      );
    }

    // Check max extensions limit
    if (this.config.maxExtensions && this.extensions.size >= this.config.maxExtensions) {
      throw new RegistryError(
        `Maximum number of extensions (${this.config.maxExtensions}) reached`,
        'MAX_EXTENSIONS_EXCEEDED'
      );
    }

    // Validate platform version compatibility
    const requiredVersion = manifest.engines['agent-platform'];
    if (!semver.satisfies(this.config.platformVersion, requiredVersion)) {
      throw new RegistryError(
        `Extension requires agent-platform ${requiredVersion}, but current version is ${this.config.platformVersion}`,
        'INCOMPATIBLE_VERSION',
        manifest.id
      );
    }

    // Check permissions
    if (this.config.allowedPermissions) {
      const disallowedPermissions = manifest.permissions.filter(
        p => !this.config.allowedPermissions!.includes(p)
      );
      
      if (disallowedPermissions.length > 0) {
        throw new RegistryError(
          `Extension requires disallowed permissions: ${disallowedPermissions.join(', ')}`,
          'DISALLOWED_PERMISSIONS',
          manifest.id
        );
      }
    }

    // Check dependencies
    await this.validateDependencies(manifest);

    // Create metadata
    const metadata: ExtensionMetadata = {
      ...manifest,
      state: ExtensionState.INSTALLED,
      installPath,
      installedAt: Date.now()
    };

    // Store extension
    this.extensions.set(manifest.id, metadata);

    // Emit event
    this.emit(RegistryEvent.EXTENSION_REGISTERED, metadata);

    return metadata;
  }

  /**
   * Unregister an extension
   */
  async unregister(extensionId: string): Promise<void> {
    const metadata = this.extensions.get(extensionId);
    
    if (!metadata) {
      throw new RegistryError(
        `Extension ${extensionId} not found`,
        'NOT_FOUND',
        extensionId
      );
    }

    // Check if other extensions depend on this one
    const dependents = this.getDependents(extensionId);
    if (dependents.length > 0) {
      throw new RegistryError(
        `Cannot unregister ${extensionId}: required by ${dependents.join(', ')}`,
        'HAS_DEPENDENTS',
        extensionId
      );
    }

    // Remove from registry
    this.extensions.delete(extensionId);

    // Emit event
    this.emit(RegistryEvent.EXTENSION_UNREGISTERED, metadata);
  }

  /**
   * Enable an extension
   */
  async enable(extensionId: string): Promise<void> {
    const metadata = this.get(extensionId);

    if (metadata.state === ExtensionState.ENABLED) {
      return; // Already enabled
    }

    if (metadata.state === ExtensionState.ERROR) {
      throw new RegistryError(
        `Cannot enable extension in error state: ${metadata.error}`,
        'CANNOT_ENABLE_ERROR',
        extensionId
      );
    }

    // Validate dependencies are enabled
    for (const dep of metadata.dependencies) {
      if (!dep.optional) {
        const depMetadata = this.get(dep.id);
        if (depMetadata.state !== ExtensionState.ENABLED) {
          throw new RegistryError(
            `Required dependency ${dep.id} is not enabled`,
            'DEPENDENCY_NOT_ENABLED',
            extensionId
          );
        }
      }
    }

    // Update state
    this.updateState(extensionId, ExtensionState.ENABLED);

    // Emit event
    this.emit(RegistryEvent.EXTENSION_ENABLED, metadata);
  }

  /**
   * Disable an extension
   */
  async disable(extensionId: string): Promise<void> {
    const metadata = this.get(extensionId);

    if (metadata.state === ExtensionState.DISABLED) {
      return; // Already disabled
    }

    // Check if other enabled extensions depend on this one
    const enabledDependents = this.getDependents(extensionId).filter(id => {
      const dep = this.extensions.get(id);
      return dep?.state === ExtensionState.ENABLED;
    });

    if (enabledDependents.length > 0) {
      throw new RegistryError(
        `Cannot disable ${extensionId}: required by enabled extensions ${enabledDependents.join(', ')}`,
        'HAS_ENABLED_DEPENDENTS',
        extensionId
      );
    }

    // Update state
    this.updateState(extensionId, ExtensionState.DISABLED);

    // Emit event
    this.emit(RegistryEvent.EXTENSION_DISABLED, metadata);
  }

  /**
   * Mark an extension as errored
   */
  setError(extensionId: string, error: string): void {
    const metadata = this.get(extensionId);
    
    metadata.state = ExtensionState.ERROR;
    metadata.error = error;
    metadata.updatedAt = Date.now();

    this.emit(RegistryEvent.EXTENSION_ERROR, metadata);
    this.emit(RegistryEvent.EXTENSION_STATE_CHANGED, metadata);
  }

  /**
   * Get extension metadata
   */
  get(extensionId: string): ExtensionMetadata {
    const metadata = this.extensions.get(extensionId);
    
    if (!metadata) {
      throw new RegistryError(
        `Extension ${extensionId} not found`,
        'NOT_FOUND',
        extensionId
      );
    }

    return metadata;
  }

  /**
   * Check if extension exists
   */
  has(extensionId: string): boolean {
    return this.extensions.has(extensionId);
  }

  /**
   * Get all extensions
   */
  getAll(): ExtensionMetadata[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get extensions by state
   */
  getByState(state: ExtensionState): ExtensionMetadata[] {
    return this.getAll().filter(ext => ext.state === state);
  }

  /**
   * Get extensions by permission
   */
  getByPermission(permission: Permission): ExtensionMetadata[] {
    return this.getAll().filter(ext => ext.permissions.includes(permission));
  }

  /**
   * Get enabled extensions
   */
  getEnabled(): ExtensionMetadata[] {
    return this.getByState(ExtensionState.ENABLED);
  }

  /**
   * Get extensions that depend on a given extension
   */
  getDependents(extensionId: string): string[] {
    const dependents: string[] = [];

    for (const [id, metadata] of this.extensions) {
      const hasDependency = metadata.dependencies.some(dep => dep.id === extensionId);
      if (hasDependency) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  /**
   * Get all dependencies of an extension (recursive)
   */
  getDependencies(extensionId: string, includeOptional = false): string[] {
    const visited = new Set<string>();
    const dependencies: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const metadata = this.extensions.get(id);
      if (!metadata) return;

      for (const dep of metadata.dependencies) {
        if (!includeOptional && dep.optional) continue;
        
        dependencies.push(dep.id);
        traverse(dep.id);
      }
    };

    traverse(extensionId);
    return dependencies;
  }

  /**
   * Clear all extensions
   */
  clear(): void {
    this.extensions.clear();
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const total = this.extensions.size;
    const byState: Record<ExtensionState, number> = {
      [ExtensionState.UNINSTALLED]: 0,
      [ExtensionState.INSTALLED]: 0,
      [ExtensionState.ENABLED]: 0,
      [ExtensionState.DISABLED]: 0,
      [ExtensionState.ERROR]: 0
    };

    for (const metadata of this.extensions.values()) {
      byState[metadata.state]++;
    }

    return {
      total,
      byState,
      enabled: byState[ExtensionState.ENABLED],
      disabled: byState[ExtensionState.DISABLED],
      errors: byState[ExtensionState.ERROR]
    };
  }

  /**
   * Validate extension dependencies
   */
  private async validateDependencies(manifest: ExtensionManifest): Promise<void> {
    for (const dep of manifest.dependencies) {
      // Skip optional dependencies
      if (dep.optional) continue;

      // Check if dependency is registered
      const depMetadata = this.extensions.get(dep.id);
      if (!depMetadata) {
        throw new RegistryError(
          `Required dependency ${dep.id} is not installed`,
          'DEPENDENCY_NOT_FOUND',
          manifest.id
        );
      }

      // Validate version constraint
      if (!semver.satisfies(depMetadata.version, dep.version)) {
        throw new RegistryError(
          `Dependency ${dep.id} version ${depMetadata.version} does not satisfy ${dep.version}`,
          'DEPENDENCY_VERSION_MISMATCH',
          manifest.id
        );
      }
    }
  }

  /**
   * Update extension state
   */
  private updateState(extensionId: string, state: ExtensionState): void {
    const metadata = this.get(extensionId);
    
    const oldState = metadata.state;
    metadata.state = state;
    metadata.updatedAt = Date.now();

    this.emit(RegistryEvent.EXTENSION_STATE_CHANGED, {
      extension: metadata,
      oldState,
      newState: state
    });
  }
}
