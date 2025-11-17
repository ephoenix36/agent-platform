/**
 * Toolkit Manager
 * 
 * Central service for registering, loading, and managing MCP toolkits.
 * Handles dependency resolution, conflict detection, and selective loading.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';
import {
  Toolkit,
  ToolkitManifest,
  ToolkitManifestEntry,
  ToolkitStatus,
  ToolkitLoadResult,
  ToolkitQuery,
  ToolkitStats,
  ToolkitDependencyNode,
  ToolkitValidationError,
  ToolkitDependencyError,
  ToolkitConflictError,
  CircularDependencyError,
  ToolkitNotFoundError,
} from '../types/toolkit.js';
import { Logger } from '../utils/logging.js';

/**
 * ToolkitManager - Manages toolkit lifecycle and dependencies
 */
export class ToolkitManager {
  private registeredToolkits: Map<string, Toolkit> = new Map();
  private loadedToolkits: Set<string> = new Set();
  private server: McpServer;
  private logger: Logger;
  private manifest: ToolkitManifest;
  private manifestPath: string;
  
  constructor(server: McpServer, logger: Logger, manifestPath?: string) {
    this.server = server;
    this.logger = logger;
    this.manifestPath = manifestPath || path.join(process.cwd(), '.toolkit-manifest.json');
    this.manifest = this.loadManifest();
  }
  
  // ==================== Registration ====================
  
  /**
   * Register a toolkit (doesn't load tools yet)
   */
  registerToolkit(toolkit: Toolkit): void {
    // Validate toolkit
    this.validateToolkit(toolkit);
    
    // Check for ID conflicts
    if (this.registeredToolkits.has(toolkit.id)) {
      throw new Error(`Toolkit already registered: ${toolkit.id}`);
    }
    
    // Validate dependencies exist
    this.validateDependencies(toolkit);
    
    // Check for conflicts with loaded toolkits
    this.checkConflicts(toolkit);
    
    // Store in registry
    this.registeredToolkits.set(toolkit.id, toolkit);
    
    this.logger.info(`📦 Registered toolkit: ${toolkit.name} (${toolkit.toolCount} tools)`);
  }
  
  /**
   * Register multiple toolkits at once
   */
  registerToolkits(toolkits: Toolkit[]): void {
    for (const toolkit of toolkits) {
      this.registerToolkit(toolkit);
    }
  }
  
  /**
   * Unregister a toolkit (must be unloaded first)
   */
  unregisterToolkit(toolkitId: string): void {
    if (this.loadedToolkits.has(toolkitId)) {
      throw new Error(`Cannot unregister loaded toolkit: ${toolkitId}. Unload it first.`);
    }
    
    // Check if any registered toolkits depend on this
    for (const [id, toolkit] of this.registeredToolkits) {
      if (toolkit.dependencies?.includes(toolkitId)) {
        throw new ToolkitDependencyError(
          id,
          [toolkitId],
          `Cannot unregister ${toolkitId}: required by ${id}`
        );
      }
    }
    
    this.registeredToolkits.delete(toolkitId);
    this.logger.info(`Unregistered toolkit: ${toolkitId}`);
  }
  
  // ==================== Loading ====================
  
  /**
   * Load a toolkit's tools into the MCP server
   */
  async loadToolkit(toolkitId: string): Promise<ToolkitLoadResult> {
    const toolkit = this.registeredToolkits.get(toolkitId);
    if (!toolkit) {
      throw new ToolkitNotFoundError(toolkitId);
    }
    
    if (this.loadedToolkits.has(toolkitId)) {
      this.logger.warn(`Toolkit already loaded: ${toolkitId}`);
      return {
        success: true,
        toolkitId,
        toolsLoaded: toolkit.toolCount,
        warnings: ['Toolkit was already loaded'],
      };
    }
    
    const warnings: string[] = [];
    
    try {
      // Load dependencies first (topological order)
      if (toolkit.dependencies && toolkit.dependencies.length > 0) {
        this.logger.info(`Loading dependencies for ${toolkitId}: ${toolkit.dependencies.join(', ')}`);
        
        for (const depId of toolkit.dependencies) {
          if (!this.loadedToolkits.has(depId)) {
            const depResult = await this.loadToolkit(depId);
            if (!depResult.success) {
              throw new ToolkitDependencyError(
                toolkitId,
                [depId],
                `Failed to load dependency ${depId}: ${depResult.error}`
              );
            }
            if (depResult.warnings) {
              warnings.push(...depResult.warnings);
            }
          }
        }
      }
      
      // Call the registration function to register all tools
      this.logger.info(`Registering tools for ${toolkit.name}...`);
      await toolkit.register(this.server, this.logger);
      this.logger.info(`  ✓ Registered ${toolkit.toolCount} tools`);
      
      // Mark as loaded
      this.loadedToolkits.add(toolkitId);
      
      // Update manifest
      if (!this.manifest.toolkits[toolkitId]) {
        this.manifest.toolkits[toolkitId] = {
          enabled: true,
          autoLoad: true,
          lazyLoad: false,
        };
      } else {
        this.manifest.toolkits[toolkitId].enabled = true;
      }
      await this.saveManifest();
      
      this.logger.info(`✓ Loaded toolkit: ${toolkit.name} (${toolkit.toolCount} tools)`);
      
      return {
        success: true,
        toolkitId,
        toolsLoaded: toolkit.toolCount,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`✗ Failed to load toolkit ${toolkitId}: ${errorMsg}`);
      
      return {
        success: false,
        toolkitId,
        toolsLoaded: 0,
        error: errorMsg,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }
  
  /**
   * Unload a toolkit (remove its tools)
   */
  async unloadToolkit(toolkitId: string): Promise<void> {
    if (!this.loadedToolkits.has(toolkitId)) {
      this.logger.warn(`Toolkit not loaded: ${toolkitId}`);
      return;
    }
    
    // Check if any loaded toolkits depend on this
    for (const [id, toolkit] of this.registeredToolkits) {
      if (this.loadedToolkits.has(id) && toolkit.dependencies?.includes(toolkitId)) {
        throw new ToolkitDependencyError(
          id,
          [toolkitId],
          `Cannot unload ${toolkitId}: required by loaded toolkit ${id}`
        );
      }
    }
    
    // Mark as unloaded
    this.loadedToolkits.delete(toolkitId);
    
    // Update manifest
    if (this.manifest.toolkits[toolkitId]) {
      this.manifest.toolkits[toolkitId].enabled = false;
      await this.saveManifest();
    }
    
    this.logger.info(`Unloaded toolkit: ${toolkitId}`);
    
    // Note: MCP SDK doesn't support dynamic tool removal
    // Tools remain registered but toolkit is marked as unloaded
    // Server restart required to fully remove tools
  }
  
  /**
   * Load all enabled toolkits based on manifest
   */
  async loadEnabledToolkits(): Promise<void> {
    const toLoad: string[] = [];
    
    // Core toolkits always load first
    for (const [id, toolkit] of this.registeredToolkits) {
      if (toolkit.category === 'core') {
        toLoad.push(id);
      }
    }
    
    // Add enabled toolkits from manifest
    for (const [id, config] of Object.entries(this.manifest.toolkits)) {
      if (config.enabled && config.autoLoad && !toLoad.includes(id)) {
        // Verify toolkit is registered
        if (this.registeredToolkits.has(id)) {
          toLoad.push(id);
        } else {
          this.logger.warn(`Toolkit ${id} enabled in manifest but not registered`);
        }
      }
    }
    
    // Load in dependency order
    const sorted = this.topologicalSort(toLoad);
    
    this.logger.info(`Loading ${sorted.length} enabled toolkits...`);
    
    for (const id of sorted) {
      await this.loadToolkit(id);
    }
    
    this.logger.info(`✓ Loaded ${this.loadedToolkits.size} toolkits`);
  }
  
  // ==================== Queries ====================
  
  /**
   * Get information about available and loaded toolkits
   */
  getToolkitStatus(query?: ToolkitQuery): ToolkitStatus[] {
    let toolkits = Array.from(this.registeredToolkits.values());
    
    // Apply filters
    if (query) {
      if (query.category) {
        toolkits = toolkits.filter(tk => tk.category === query.category);
      }
      
      if (query.tags && query.tags.length > 0) {
        toolkits = toolkits.filter(tk =>
          query.tags!.some(tag => tk.metadata.tags.includes(tag))
        );
      }
      
      if (query.loaded !== undefined) {
        toolkits = toolkits.filter(tk =>
          this.loadedToolkits.has(tk.id) === query.loaded
        );
      }
      
      if (query.enabled !== undefined) {
        toolkits = toolkits.filter(tk =>
          (this.manifest.toolkits[tk.id]?.enabled ?? false) === query.enabled
        );
      }
      
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        toolkits = toolkits.filter(tk =>
          tk.name.toLowerCase().includes(searchLower) ||
          tk.description.toLowerCase().includes(searchLower) ||
          tk.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }
    
    // Map to status objects
    return toolkits.map(tk => ({
      id: tk.id,
      name: tk.name,
      description: tk.description,
      category: tk.category,
      version: tk.version,
      toolCount: tk.toolCount,
      loaded: this.loadedToolkits.has(tk.id),
      enabled: this.manifest.toolkits[tk.id]?.enabled ?? false,
      dependencies: tk.dependencies ?? [],
      conflicts: tk.conflicts ?? [],
      metadata: tk.metadata,
    }));
  }
  
  /**
   * Get statistics about toolkits
   */
  getStats(): ToolkitStats {
    const byCategory: Record<string, number> = {};
    const toolsByCategory: Record<string, number> = {};
    let totalTools = 0;
    
    for (const toolkit of this.registeredToolkits.values()) {
      byCategory[toolkit.category] = (byCategory[toolkit.category] || 0) + 1;
      toolsByCategory[toolkit.category] = (toolsByCategory[toolkit.category] || 0) + toolkit.toolCount;
      totalTools += toolkit.toolCount;
    }
    
    return {
      totalRegistered: this.registeredToolkits.size,
      totalLoaded: this.loadedToolkits.size,
      totalEnabled: Object.values(this.manifest.toolkits).filter(c => c.enabled).length,
      byCategory: byCategory as any,
      totalTools,
      toolsByCategory: toolsByCategory as any,
    };
  }
  
  /**
   * Get all tools from a specific toolkit
   */
  getToolkitTools(toolkitId: string): string[] {
    const toolkit = this.registeredToolkits.get(toolkitId);
    if (!toolkit) return [];
    
    // For now, return an empty array - actual tool names would need to be tracked separately
    // This is a limitation of the registration function approach
    return [];
  }
  
  /**
   * Find which toolkit provides a specific tool
   * Note: With registration functions, we can't easily determine tool->toolkit mapping
   * Would need to track this during registration
   */
  findToolkitForTool(toolName: string): string | undefined {
    // This would require maintaining a tool->toolkit mapping
    // For now, return undefined
    return undefined;
  }
  
  /**
   * Get a specific toolkit by ID
   */
  getToolkit(toolkitId: string): Toolkit | undefined {
    return this.registeredToolkits.get(toolkitId);
  }
  
  /**
   * Check if a toolkit is loaded
   */
  isLoaded(toolkitId: string): boolean {
    return this.loadedToolkits.has(toolkitId);
  }
  
  /**
   * Enable/disable a toolkit in manifest
   */
  async setToolkitEnabled(toolkitId: string, enabled: boolean): Promise<void> {
    if (!this.registeredToolkits.has(toolkitId)) {
      throw new ToolkitNotFoundError(toolkitId);
    }
    
    if (!this.manifest.toolkits[toolkitId]) {
      this.manifest.toolkits[toolkitId] = {
        enabled,
        autoLoad: true,
        lazyLoad: false,
      };
    } else {
      this.manifest.toolkits[toolkitId].enabled = enabled;
    }
    
    await this.saveManifest();
    
    if (enabled && !this.loadedToolkits.has(toolkitId)) {
      await this.loadToolkit(toolkitId);
    } else if (!enabled && this.loadedToolkits.has(toolkitId)) {
      await this.unloadToolkit(toolkitId);
    }
  }
  
  // ==================== Validation ====================
  
  /**
   * Validate toolkit structure and configuration
   */
  private validateToolkit(toolkit: Toolkit): void {
    const errors: string[] = [];
    
    if (!toolkit.id) errors.push('Toolkit ID is required');
    if (!toolkit.name) errors.push('Toolkit name is required');
    if (!toolkit.version) errors.push('Toolkit version is required');
    if (!toolkit.register) errors.push('Toolkit must have a register function');
    if (!toolkit.toolCount || toolkit.toolCount < 1) {
      errors.push('Toolkit must declare at least one tool');
    }
    
    if (errors.length > 0) {
      throw new ToolkitValidationError(toolkit.id, errors);
    }
  }
  
  /**
   * Validate toolkit dependencies exist
   */
  private validateDependencies(toolkit: Toolkit): void {
    if (!toolkit.dependencies) return;
    
    const missing: string[] = [];
    for (const depId of toolkit.dependencies) {
      if (!this.registeredToolkits.has(depId)) {
        missing.push(depId);
      }
    }
    
    if (missing.length > 0) {
      throw new ToolkitDependencyError(
        toolkit.id,
        missing,
        `Toolkit ${toolkit.id} has unmet dependencies: ${missing.join(', ')}`
      );
    }
  }
  
  /**
   * Check for conflicts with loaded toolkits
   */
  private checkConflicts(toolkit: Toolkit): void {
    if (!toolkit.conflicts) return;
    
    for (const conflictId of toolkit.conflicts) {
      if (this.loadedToolkits.has(conflictId)) {
        throw new ToolkitConflictError(
          toolkit.id,
          conflictId,
          `Toolkit ${toolkit.id} conflicts with already loaded ${conflictId}`
        );
      }
    }
  }
  
  /**
   * Topological sort for dependency ordering
   */
  private topologicalSort(ids: string[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const cycle: string[] = [];
    
    const visit = (id: string, path: string[] = []) => {
      if (visited.has(id)) return;
      
      if (visiting.has(id)) {
        // Circular dependency detected
        const cycleStart = path.indexOf(id);
        cycle.push(...path.slice(cycleStart), id);
        throw new CircularDependencyError(cycle);
      }
      
      visiting.add(id);
      const newPath = [...path, id];
      
      const toolkit = this.registeredToolkits.get(id);
      if (toolkit?.dependencies) {
        for (const depId of toolkit.dependencies) {
          visit(depId, newPath);
        }
      }
      
      visiting.delete(id);
      visited.add(id);
      sorted.push(id);
    };
    
    for (const id of ids) {
      try {
        visit(id);
      } catch (error) {
        if (error instanceof CircularDependencyError) {
          throw error;
        }
        // Skip toolkits that aren't registered
        this.logger.warn(`Skipping unregistered toolkit: ${id}`);
      }
    }
    
    return sorted;
  }
  
  // ==================== Manifest Management ====================
  
  /**
   * Load toolkit manifest from disk
   */
  private loadManifest(): ToolkitManifest {
    if (fs.existsSync(this.manifestPath)) {
      try {
        const content = fs.readFileSync(this.manifestPath, 'utf-8');
        const manifest = JSON.parse(content) as ToolkitManifest;
        this.logger.info(`Loaded toolkit manifest from ${this.manifestPath}`);
        return manifest;
      } catch (error) {
        this.logger.error(`Failed to load manifest: ${error}`);
        this.logger.info('Using default manifest');
      }
    }
    
    // Default manifest
    return {
      version: '1.0.0',
      updated: new Date().toISOString(),
      toolkits: {},
    };
  }
  
  /**
   * Save toolkit manifest to disk
   */
  private async saveManifest(): Promise<void> {
    try {
      this.manifest.updated = new Date().toISOString();
      
      const content = JSON.stringify(this.manifest, null, 2);
      fs.writeFileSync(this.manifestPath, content, 'utf-8');
      
      this.logger.debug(`Saved toolkit manifest to ${this.manifestPath}`);
    } catch (error) {
      this.logger.error(`Failed to save manifest: ${error}`);
      throw error;
    }
  }
  
  /**
   * Reset manifest to default state
   */
  async resetManifest(): Promise<void> {
    this.manifest = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      toolkits: {},
    };
    
    await this.saveManifest();
    this.logger.info('Reset toolkit manifest to default state');
  }
}
