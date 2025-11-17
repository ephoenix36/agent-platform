import fs from 'fs/promises';
import path from 'path';
import { watch as chokidarWatch, FSWatcher } from 'chokidar';
import YAML from 'yaml';
import { ComponentStore } from './ComponentStore.js';
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
  StorageLocation,
  ComponentVisibility,
} from './types.js';

/**
 * File system implementation of ComponentStore
 * Stores components as JSON or Markdown+YAML files with hot reload support
 */
export class FileSystemStore extends ComponentStore {
  private basePath: string;
  private components: Map<string, Component> = new Map();
  private versions: Map<string, ComponentVersion[]> = new Map();
  private watchers: FSWatcher[] = [];
  private watchCallbacks: Array<(event: any) => void> = [];
  private transactions: Map<string, TransactionContext> = new Map();
  private initialized = false;

  constructor(basePath: string) {
    super();
    this.basePath = path.resolve(basePath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Create base directory structure
    await this.ensureDirectoryStructure();

    // Load all existing components
    await this.loadAllComponents();

    // Setup file watchers
    this.setupWatchers();

    this.initialized = true;
  }

  private async ensureDirectoryStructure(): Promise<void> {
    const locations = ['platform', 'user'];
    const types = ['agents', 'tools', 'workflows', 'skills', 'hooks', 'widgets', 'collections'];

    for (const location of locations) {
      for (const type of types) {
        const dirPath = path.join(this.basePath, location, type);
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
  }

  private async loadAllComponents(): Promise<void> {
    const locations: StorageLocation[] = [StorageLocation.PLATFORM, StorageLocation.USER];

    for (const location of locations) {
      const locationPath = path.join(this.basePath, location);
      await this.loadComponentsFromDirectory(locationPath, location);
    }
  }

  private async loadComponentsFromDirectory(
    dirPath: string,
    location: StorageLocation
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.loadComponentsFromDirectory(fullPath, location);
        } else if (entry.isFile() && this.isComponentFile(entry.name)) {
          try {
            const component = await this.loadComponentFromFile(fullPath, location);
            this.components.set(component.id, component);
          } catch (error) {
            console.error(`Failed to load component from ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
  }

  private isComponentFile(filename: string): boolean {
    return filename.endsWith('.json') || filename.endsWith('.yaml') || filename.endsWith('.yml');
  }

  private async loadComponentFromFile(
    filePath: string,
    location: StorageLocation
  ): Promise<Component> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);

    let component: Component;

    if (ext === '.json') {
      component = JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      component = YAML.parse(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }

    // Add storage metadata
    component.storageLocation = location;
    component.storagePath = path.relative(this.basePath, filePath);

    this.validateComponent(component);

    return component;
  }

  private setupWatchers(): void {
    const platformPath = path.join(this.basePath, 'platform');
    const userPath = path.join(this.basePath, 'user');

    const watcher = chokidarWatch([platformPath, userPath], {
      persistent: true,
      ignoreInitial: true,
      depth: 10,
    });

    watcher.on('add', async (filePath) => {
      if (this.isComponentFile(filePath)) {
        const location = filePath.includes('platform')
          ? StorageLocation.PLATFORM
          : StorageLocation.USER;
        const component = await this.loadComponentFromFile(filePath, location);
        this.components.set(component.id, component);
        this.notifyWatchers({ type: 'create', componentId: component.id, component });
      }
    });

    watcher.on('change', async (filePath) => {
      if (this.isComponentFile(filePath)) {
        const location = filePath.includes('platform')
          ? StorageLocation.PLATFORM
          : StorageLocation.USER;
        const component = await this.loadComponentFromFile(filePath, location);
        this.components.set(component.id, component);
        this.notifyWatchers({ type: 'update', componentId: component.id, component });
      }
    });

    watcher.on('unlink', (filePath) => {
      if (this.isComponentFile(filePath)) {
        const component = Array.from(this.components.values()).find(
          (c) => c.storagePath && path.join(this.basePath, c.storagePath) === filePath
        );
        if (component) {
          this.components.delete(component.id);
          this.notifyWatchers({ type: 'delete', componentId: component.id });
        }
      }
    });

    this.watchers.push(watcher);
  }

  private notifyWatchers(event: any): void {
    this.watchCallbacks.forEach((callback) => callback(event));
  }

  async create<T extends ComponentContent>(
    component: Omit<Component<T>, 'id' | 'version'>
  ): Promise<StorageResult<Component<T>>> {
    try {
      const id = this.generateId(component.type, component.name);
      const now = new Date().toISOString();

      const fullComponent: Component<T> = {
        ...component,
        id,
        version: 1,
        metadata: {
          ...component.metadata,
          createdAt: now,
          updatedAt: now,
        },
      } as Component<T>;

      this.validateComponent(fullComponent);

      // Save to file
      const filePath = await this.saveComponentToFile(fullComponent);
      fullComponent.storagePath = path.relative(this.basePath, filePath);

      // Store in memory
      this.components.set(id, fullComponent as Component);

      // Initialize version history
      this.versions.set(id, [
        {
          version: 1,
          component: fullComponent as Component,
          timestamp: new Date(now),
        },
      ]);

      return {
        success: true,
        data: fullComponent,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  private async saveComponentToFile<T extends ComponentContent>(
    component: Component<T>
  ): Promise<string> {
    const location = component.storageLocation || StorageLocation.USER;
    const typePath = this.getTypeDirectory(component.type);
    const dirPath = path.join(this.basePath, location, typePath);

    await fs.mkdir(dirPath, { recursive: true });

    const filename = `${component.id}.json`;
    const filePath = path.join(dirPath, filename);

    await fs.writeFile(filePath, JSON.stringify(component, null, 2), 'utf-8');

    return filePath;
  }

  private getTypeDirectory(type: ComponentType): string {
    const typeMap: Record<ComponentType, string> = {
      [ComponentType.AGENT]: 'agents',
      [ComponentType.TOOL]: 'tools',
      [ComponentType.WORKFLOW]: 'workflows',
      [ComponentType.SKILL]: 'skills',
      [ComponentType.HOOK]: 'hooks',
      [ComponentType.WIDGET]: 'widgets',
      [ComponentType.MCP_SERVER]: 'tools/mcp',
      [ComponentType.COLLECTION]: 'collections',
    };
    return typeMap[type] || 'misc';
  }

  async read<T extends ComponentContent>(
    id: string,
    version?: number
  ): Promise<Component<T> | null> {
    if (version !== undefined) {
      const versions = this.versions.get(id);
      if (!versions) return null;

      const versionEntry = versions.find((v) => v.version === version);
      return versionEntry ? (versionEntry.component as Component<T>) : null;
    }

    const component = this.components.get(id);
    return component ? (component as Component<T>) : null;
  }

  async update<T extends ComponentContent>(
    id: string,
    updates: Partial<Omit<Component<T>, 'id' | 'type'>>,
    changeDescription?: string
  ): Promise<StorageResult<Component<T>>> {
    try {
      const existing = await this.read<T>(id);
      if (!existing) {
        return {
          success: false,
          error: `Component ${id} not found`,
          timestamp: new Date(),
        };
      }

      const now = new Date().toISOString();
      const updatedComponent: Component<T> = {
        ...existing,
        ...updates,
        id,
        type: existing.type,
        version: existing.version + 1,
        metadata: {
          ...existing.metadata,
          ...updates.metadata,
          updatedAt: now,
        },
      } as Component<T>;

      this.validateComponent(updatedComponent);

      // Save to file
      await this.saveComponentToFile(updatedComponent);

      // Update memory
      this.components.set(id, updatedComponent as Component);

      // Add to version history
      const versions = this.versions.get(id) || [];
      versions.push({
        version: updatedComponent.version,
        component: updatedComponent as Component,
        timestamp: new Date(now),
        changeDescription,
      });
      this.versions.set(id, versions);

      return {
        success: true,
        data: updatedComponent,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  async delete(id: string, permanent = false): Promise<StorageResult<void>> {
    try {
      const component = await this.read(id);
      if (!component) {
        return {
          success: false,
          error: `Component ${id} not found`,
          timestamp: new Date(),
        };
      }

      if (permanent) {
        // Delete file
        if (component.storagePath) {
          const filePath = path.join(this.basePath, component.storagePath);
          await fs.unlink(filePath);
        }

        // Remove from memory
        this.components.delete(id);
        this.versions.delete(id);
      } else {
        // Soft delete: mark as deleted
        await this.update(id, {
          visibility: ComponentVisibility.PRIVATE,
          metadata: {
            ...component.metadata,
            deleted: true,
          },
        } as any);
      }

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  async list<T extends ComponentContent>(
    options: ComponentQueryOptions = {}
  ): Promise<ComponentQueryResult<T>> {
    const {
      type,
      storageLocation,
      visibility,
      tags,
      category,
      author,
      search,
      limit = 100,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    let filtered = Array.from(this.components.values());

    // Apply filters
    if (type) {
      filtered = filtered.filter((c) => c.type === type);
    }
    if (storageLocation) {
      filtered = filtered.filter((c) => c.storageLocation === storageLocation);
    }
    if (visibility) {
      filtered = filtered.filter((c) => c.visibility === visibility);
    }
    if (tags && tags.length > 0) {
      filtered = filtered.filter((c) =>
        tags.some((tag) => c.metadata.tags?.includes(tag))
      );
    }
    if (category) {
      filtered = filtered.filter((c) => c.metadata.category === category);
    }
    if (author) {
      filtered = filtered.filter((c) => c.metadata.author === author);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter out soft-deleted components
    filtered = filtered.filter((c) => !(c.metadata as any).deleted);

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'created':
          compareValue =
            new Date(a.metadata.createdAt || 0).getTime() -
            new Date(b.metadata.createdAt || 0).getTime();
          break;
        case 'updated':
          compareValue =
            new Date(a.metadata.updatedAt || 0).getTime() -
            new Date(b.metadata.updatedAt || 0).getTime();
          break;
        case 'version':
          compareValue = a.version - b.version;
          break;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      components: paginated as Component<T>[],
      total,
      limit,
      offset,
    };
  }

  async search<T extends ComponentContent>(
    query: string,
    options?: Omit<ComponentQueryOptions, 'search'>
  ): Promise<ComponentQueryResult<T>> {
    return this.list<T>({ ...options, search: query });
  }

  async getVersions<T extends ComponentContent>(
    id: string
  ): Promise<ComponentVersion<T>[]> {
    const versions = this.versions.get(id) || [];
    return versions as ComponentVersion<T>[];
  }

  async restoreVersion<T extends ComponentContent>(
    id: string,
    version: number
  ): Promise<StorageResult<Component<T>>> {
    try {
      const versions = await this.getVersions<T>(id);
      const versionEntry = versions.find((v) => v.version === version);

      if (!versionEntry) {
        return {
          success: false,
          error: `Version ${version} not found for component ${id}`,
          timestamp: new Date(),
        };
      }

      // Create a new version with the old content
      return await this.update(id, versionEntry.component, `Restored to version ${version}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  async exists(id: string): Promise<boolean> {
    return this.components.has(id);
  }

  async getDependencies(id: string): Promise<string[]> {
    const component = await this.read(id);
    if (!component) return [];
    return this.extractDependencies(component);
  }

  async getDependents(id: string): Promise<string[]> {
    const dependents: string[] = [];

    for (const component of this.components.values()) {
      const deps = this.extractDependencies(component);
      if (deps.includes(id)) {
        dependents.push(component.id);
      }
    }

    return dependents;
  }

  async validateDependencies(id: string): Promise<{ valid: boolean; missing: string[] }> {
    const dependencies = await this.getDependencies(id);
    const missing: string[] = [];

    for (const depId of dependencies) {
      if (!(await this.exists(depId))) {
        missing.push(depId);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  async beginTransaction(): Promise<TransactionContext> {
    const transaction: TransactionContext = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      startTime: new Date(),
      operations: [],
    };

    this.transactions.set(transaction.id, transaction);

    return transaction;
  }

  async commitTransaction(transaction: TransactionContext): Promise<StorageResult<void>> {
    try {
      // In file system implementation, operations are already applied
      // Just cleanup transaction state
      this.transactions.delete(transaction.id);

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  async rollbackTransaction(transaction: TransactionContext): Promise<StorageResult<void>> {
    try {
      // Rollback operations in reverse order
      const operations = [...transaction.operations].reverse();

      for (const op of operations) {
        const versions = this.versions.get(op.componentId);
        if (!versions || versions.length < 2) continue;

        // Restore to previous version
        const prevVersion = versions[versions.length - 2];
        await this.saveComponentToFile(prevVersion.component);
        this.components.set(op.componentId, prevVersion.component);
      }

      this.transactions.delete(transaction.id);

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  async export(ids?: string[], includeDependencies = true): Promise<ComponentExport> {
    const exportSet = new Set<string>();
    const componentsToExport: Component[] = [];
    const dependencies: Record<string, string[]> = {};

    // Determine which components to export
    if (!ids || ids.length === 0) {
      // Export all
      componentsToExport.push(...this.components.values());
    } else {
      // Export specific components
      for (const id of ids) {
        exportSet.add(id);
        if (includeDependencies) {
          const deps = await this.getDependencies(id);
          deps.forEach((dep) => exportSet.add(dep));
        }
      }

      for (const id of exportSet) {
        const component = await this.read(id);
        if (component) {
          componentsToExport.push(component);
        }
      }
    }

    // Build dependency map
    for (const component of componentsToExport) {
      dependencies[component.id] = await this.getDependencies(component.id);
    }

    return {
      version: '1.0.0',
      exportDate: new Date(),
      components: componentsToExport,
      dependencies,
    };
  }

  async import(data: ComponentExport, overwrite = false): Promise<StorageResult<string[]>> {
    try {
      const imported: string[] = [];

      for (const component of data.components) {
        const exists = await this.exists(component.id);

        if (exists && !overwrite) {
          continue;
        }

        if (exists) {
          await this.update(component.id, component, 'Imported from export');
        } else {
          // For import, we want to preserve the original ID
          this.validateComponent(component);
          const now = new Date().toISOString();
          component.metadata = {
            ...component.metadata,
            updatedAt: now,
          };
          
          // Save to file
          const filePath = await this.saveComponentToFile(component);
          component.storagePath = path.relative(this.basePath, filePath);
          
          // Store in memory
          this.components.set(component.id, component);
          
          // Initialize version history
          this.versions.set(component.id, [
            {
              version: component.version,
              component: component,
              timestamp: new Date(now),
            },
          ]);
        }

        imported.push(component.id);
      }

      return {
        success: true,
        data: imported,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  async getStats(): Promise<StorageStats> {
    const components = Array.from(this.components.values());

    const componentsByType: Record<ComponentType, number> = {
      [ComponentType.AGENT]: 0,
      [ComponentType.TOOL]: 0,
      [ComponentType.WORKFLOW]: 0,
      [ComponentType.SKILL]: 0,
      [ComponentType.HOOK]: 0,
      [ComponentType.WIDGET]: 0,
      [ComponentType.MCP_SERVER]: 0,
      [ComponentType.COLLECTION]: 0,
    };

    const componentsByLocation: Record<StorageLocation, number> = {
      [StorageLocation.PLATFORM]: 0,
      [StorageLocation.USER]: 0,
    };

    for (const component of components) {
      componentsByType[component.type]++;
      componentsByLocation[component.storageLocation]++;
    }

    return {
      totalComponents: components.length,
      componentsByType,
      componentsByLocation,
      totalSize: 0, // TODO: Calculate actual file sizes
      lastUpdated: new Date(),
    };
  }

  async clear(confirmToken: string): Promise<StorageResult<void>> {
    if (confirmToken !== 'CONFIRM_CLEAR_ALL_COMPONENTS') {
      return {
        success: false,
        error: 'Invalid confirmation token',
        timestamp: new Date(),
      };
    }

    try {
      // Delete all user components
      const userPath = path.join(this.basePath, 'user');
      await fs.rm(userPath, { recursive: true, force: true });
      await fs.mkdir(userPath, { recursive: true });

      // Clear memory
      const platformComponents = Array.from(this.components.values()).filter(
        (c) => c.storageLocation === StorageLocation.PLATFORM
      );
      this.components.clear();
      platformComponents.forEach((c) => this.components.set(c.id, c));

      this.versions.clear();

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  watch(callback: (event: any) => void): () => void {
    this.watchCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.watchCallbacks.indexOf(callback);
      if (index > -1) {
        this.watchCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Cleanup watchers and resources
   */
  async dispose(): Promise<void> {
    for (const watcher of this.watchers) {
      await watcher.close();
    }
    this.watchers = [];
    this.watchCallbacks = [];
  }
}
