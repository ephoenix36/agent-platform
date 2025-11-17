import {
  Component,
  ComponentContent,
  ComponentType,
  ComponentQueryOptions,
  ComponentQueryResult,
  ComponentVersion,
  TransactionContext,
  StorageResult,
  StorageStats,
  ComponentExport,
} from './types.js';

/**
 * Abstract base class for component storage
 * Provides CRUD operations, versioning, transactions, and import/export
 */
export abstract class ComponentStore {
  /**
   * Initialize the storage system
   */
  abstract initialize(): Promise<void>;

  /**
   * Create a new component
   * @param component Component to create
   * @returns Storage result with created component
   */
  abstract create<T extends ComponentContent>(
    component: Omit<Component<T>, 'id' | 'version'>
  ): Promise<StorageResult<Component<T>>>;

  /**
   * Read a component by ID
   * @param id Component ID
   * @param version Optional version number (defaults to latest)
   * @returns Component or null if not found
   */
  abstract read<T extends ComponentContent>(
    id: string,
    version?: number
  ): Promise<Component<T> | null>;

  /**
   * Update an existing component
   * @param id Component ID
   * @param updates Partial component updates
   * @param changeDescription Optional description of changes
   * @returns Storage result with updated component
   */
  abstract update<T extends ComponentContent>(
    id: string,
    updates: Partial<Omit<Component<T>, 'id' | 'type'>>,
    changeDescription?: string
  ): Promise<StorageResult<Component<T>>>;

  /**
   * Delete a component
   * @param id Component ID
   * @param permanent If true, permanently delete; otherwise soft delete
   * @returns Storage result
   */
  abstract delete(id: string, permanent?: boolean): Promise<StorageResult<void>>;

  /**
   * List components matching query criteria
   * @param options Query options
   * @returns Query result with matching components
   */
  abstract list<T extends ComponentContent>(
    options?: ComponentQueryOptions
  ): Promise<ComponentQueryResult<T>>;

  /**
   * Search components by full-text search
   * @param query Search query
   * @param options Additional query options
   * @returns Query result with matching components
   */
  abstract search<T extends ComponentContent>(
    query: string,
    options?: Omit<ComponentQueryOptions, 'search'>
  ): Promise<ComponentQueryResult<T>>;

  /**
   * Get all versions of a component
   * @param id Component ID
   * @returns Array of component versions
   */
  abstract getVersions<T extends ComponentContent>(
    id: string
  ): Promise<ComponentVersion<T>[]>;

  /**
   * Restore a component to a specific version
   * @param id Component ID
   * @param version Version number to restore
   * @returns Storage result with restored component
   */
  abstract restoreVersion<T extends ComponentContent>(
    id: string,
    version: number
  ): Promise<StorageResult<Component<T>>>;

  /**
   * Check if a component exists
   * @param id Component ID
   * @returns True if component exists
   */
  abstract exists(id: string): Promise<boolean>;

  /**
   * Get component dependencies
   * @param id Component ID
   * @returns Array of component IDs that this component depends on
   */
  abstract getDependencies(id: string): Promise<string[]>;

  /**
   * Get components that depend on this component
   * @param id Component ID
   * @returns Array of component IDs that depend on this component
   */
  abstract getDependents(id: string): Promise<string[]>;

  /**
   * Validate component dependencies are met
   * @param id Component ID
   * @returns Validation result with missing dependencies
   */
  abstract validateDependencies(id: string): Promise<{
    valid: boolean;
    missing: string[];
  }>;

  /**
   * Begin a transaction for atomic operations
   * @returns Transaction context
   */
  abstract beginTransaction(): Promise<TransactionContext>;

  /**
   * Commit a transaction
   * @param transaction Transaction context
   * @returns Storage result
   */
  abstract commitTransaction(
    transaction: TransactionContext
  ): Promise<StorageResult<void>>;

  /**
   * Rollback a transaction
   * @param transaction Transaction context
   * @returns Storage result
   */
  abstract rollbackTransaction(
    transaction: TransactionContext
  ): Promise<StorageResult<void>>;

  /**
   * Export components
   * @param ids Component IDs to export (empty array = all)
   * @param includeDependencies If true, include all dependencies
   * @returns Export data
   */
  abstract export(
    ids?: string[],
    includeDependencies?: boolean
  ): Promise<ComponentExport>;

  /**
   * Import components from export data
   * @param data Export data
   * @param overwrite If true, overwrite existing components
   * @returns Storage result with imported component IDs
   */
  abstract import(
    data: ComponentExport,
    overwrite?: boolean
  ): Promise<StorageResult<string[]>>;

  /**
   * Get storage statistics
   * @returns Storage stats
   */
  abstract getStats(): Promise<StorageStats>;

  /**
   * Clear all components (dangerous!)
   * @param confirmToken Confirmation token to prevent accidents
   * @returns Storage result
   */
  abstract clear(confirmToken: string): Promise<StorageResult<void>>;

  /**
   * Watch for changes to components
   * @param callback Callback function called when components change
   * @returns Unsubscribe function
   */
  abstract watch(
    callback: (event: {
      type: 'create' | 'update' | 'delete';
      componentId: string;
      component?: Component;
    }) => void
  ): () => void;

  /**
   * Generate a unique ID for a component
   * @param type Component type
   * @param name Component name
   * @returns Unique ID
   */
  protected generateId(type: ComponentType, name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${type}-${safeName}-${timestamp}-${random}`;
  }

  /**
   * Validate a component before storage operations
   * @param component Component to validate
   * @throws Error if validation fails
   */
  protected validateComponent<T extends ComponentContent>(
    component: Component<T>
  ): void {
    if (!component.id) {
      throw new Error('Component ID is required');
    }
    if (!component.type) {
      throw new Error('Component type is required');
    }
    if (!component.name) {
      throw new Error('Component name is required');
    }
    if (!component.content) {
      throw new Error('Component content is required');
    }
    if (component.version < 1) {
      throw new Error('Component version must be >= 1');
    }
  }

  /**
   * Calculate component dependencies from content
   * @param component Component to analyze
   * @returns Array of dependency IDs
   */
  protected extractDependencies<T extends ComponentContent>(
    component: Component<T>
  ): string[] {
    const dependencies: Set<string> = new Set();

    // Extract explicit dependencies
    if (component.dependencies) {
      component.dependencies.forEach(dep => dependencies.add(dep));
    }

    // Extract implicit dependencies based on content
    const content = component.content as any;

    if (content.skills) {
      content.skills.forEach((skillId: string) => dependencies.add(skillId));
    }

    if (content.toolkits) {
      content.toolkits.forEach((toolkitId: string) => dependencies.add(toolkitId));
    }

    if (content.enabledTools) {
      content.enabledTools.forEach((toolId: string) => dependencies.add(toolId));
    }

    if (content.steps) {
      content.steps.forEach((step: any) => {
        if (step.config?.agentId) {
          dependencies.add(step.config.agentId);
        }
        if (step.config?.workflowId) {
          dependencies.add(step.config.workflowId);
        }
      });
    }

    return Array.from(dependencies);
  }

  /**
   * Resolve conflicts between two component versions
   * @param local Local version
   * @param remote Remote version
   * @returns Resolved component
   */
  protected resolveConflict<T extends ComponentContent>(
    local: Component<T>,
    remote: Component<T>
  ): Component<T> {
    // Default strategy: take the version with higher version number
    if (local.version > remote.version) {
      return local;
    }
    if (remote.version > local.version) {
      return remote;
    }

    // Same version: take the one updated more recently
    const localUpdated = new Date(local.metadata.updatedAt || 0);
    const remoteUpdated = new Date(remote.metadata.updatedAt || 0);

    return localUpdated > remoteUpdated ? local : remote;
  }
}
