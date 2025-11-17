/**
 * Skills Service
 * 
 * Central service for managing skills lifecycle, composition, and integration with agents/workflows.
 */

import {
  Skill,
  SkillConfig,
  SkillMetadata,
  SkillQuery,
  SkillValidationResult,
  SkillComposition,
  SkillAttachment,
  SkillContext,
  SkillUsageStats,
  SkillExport,
  SkillImportResult,
  SkillTemplate,
  SkillRule
} from '../types/skill.js';
import { Toolkit } from '../types/toolkit.js';
import { ToolkitManager } from './toolkit-manager.js';
import { Logger } from '../utils/logging.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Skills Service - Manages skill lifecycle and composition
 */
export class SkillsService {
  private skills: Map<string, Skill> = new Map();
  private attachments: Map<string, SkillAttachment[]> = new Map();  // entity ID -> attachments
  private contexts: Map<string, SkillContext> = new Map();  // execution ID -> context
  private usageStats: Map<string, SkillUsageStats> = new Map();
  
  private toolkitManager: ToolkitManager;
  private logger: Logger;
  private storageDir: string;
  
  constructor(toolkitManager: ToolkitManager, logger: Logger, storageDir?: string) {
    this.toolkitManager = toolkitManager;
    this.logger = logger;
    this.storageDir = storageDir || path.join(process.cwd(), 'local-storage', 'skills');
  }
  
  // ==================== Initialization ====================
  
  /**
   * Initialize skills service and load persisted skills
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Skills Service...');
    
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storageDir, { recursive: true });
      
      // Load persisted skills
      await this.loadPersistedSkills();
      
      // Load usage statistics
      await this.loadUsageStats();
      
      this.logger.info(`Skills Service initialized: ${this.skills.size} skills loaded`);
    } catch (error) {
      this.logger.error('Failed to initialize Skills Service:', error);
      throw error;
    }
  }
  
  // ==================== Skill Management ====================
  
  /**
   * Create a new skill
   */
  async createSkill(
    id: string,
    name: string,
    description: string,
    config: SkillConfig,
    metadata?: Partial<SkillMetadata>
  ): Promise<Skill> {
    // Validate skill doesn't exist
    if (this.skills.has(id)) {
      throw new Error(`Skill already exists: ${id}`);
    }
    
    // Validate configuration
    const validation = await this.validateSkillConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid skill configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    // Create skill
    const skill: Skill = {
      id,
      name,
      description,
      config,
      metadata: {
        author: metadata?.author || 'unknown',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: metadata?.version || '1.0.0',
        tags: metadata?.tags || [],
        ...metadata
      },
      enabled: true,
      loaded: false,
      validated: true,
      validationErrors: []
    };
    
    // Store skill
    this.skills.set(id, skill);
    
    // Persist to disk
    await this.persistSkill(skill);
    
    // Initialize usage stats
    this.initializeUsageStats(id);
    
    this.logger.info(`Skill created: ${name} (${id})`);
    
    return skill;
  }
  
  /**
   * Update an existing skill
   */
  async updateSkill(
    id: string,
    updates: Partial<Omit<Skill, 'id' | 'metadata'>> & { metadata?: Partial<SkillMetadata> }
  ): Promise<Skill> {
    const skill = this.skills.get(id);
    if (!skill) {
      throw new Error(`Skill not found: ${id}`);
    }
    
    // If config is updated, validate it
    if (updates.config) {
      const validation = await this.validateSkillConfig(updates.config);
      if (!validation.valid) {
        throw new Error(`Invalid skill configuration: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    }
    
    // Update skill
    const updatedSkill: Skill = {
      ...skill,
      ...updates,
      metadata: {
        ...skill.metadata,
        ...updates.metadata,
        updated: new Date().toISOString()
      }
    };
    
    this.skills.set(id, updatedSkill);
    
    // Persist changes
    await this.persistSkill(updatedSkill);
    
    this.logger.info(`Skill updated: ${id}`);
    
    return updatedSkill;
  }
  
  /**
   * Delete a skill
   */
  async deleteSkill(id: string): Promise<void> {
    const skill = this.skills.get(id);
    if (!skill) {
      throw new Error(`Skill not found: ${id}`);
    }
    
    // Check if skill is attached anywhere
    const attachments = this.getSkillAttachments(id);
    if (attachments.length > 0) {
      throw new Error(`Cannot delete skill ${id}: still attached to ${attachments.length} entities`);
    }
    
    // Remove from memory
    this.skills.delete(id);
    this.usageStats.delete(id);
    
    // Remove from disk
    const skillPath = path.join(this.storageDir, `${id}.json`);
    try {
      await fs.unlink(skillPath);
    } catch (error) {
      this.logger.warn(`Failed to delete skill file: ${skillPath}`);
    }
    
    this.logger.info(`Skill deleted: ${id}`);
  }
  
  /**
   * Get a skill by ID
   */
  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }
  
  /**
   * List all skills
   */
  listSkills(query?: SkillQuery): Skill[] {
    let skills = Array.from(this.skills.values());
    
    if (query) {
      // Apply filters
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        skills = skills.filter(s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower) ||
          s.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      if (query.category) {
        skills = skills.filter(s => s.metadata.category === query.category);
      }
      
      if (query.tags && query.tags.length > 0) {
        skills = skills.filter(s =>
          query.tags!.every(tag => s.metadata.tags.includes(tag))
        );
      }
      
      if (query.author) {
        skills = skills.filter(s => s.metadata.author === query.author);
      }
      
      if (query.enabled !== undefined) {
        skills = skills.filter(s => s.enabled === query.enabled);
      }
      
      if (query.loaded !== undefined) {
        skills = skills.filter(s => s.loaded === query.loaded);
      }
      
      if (query.hasToolkit) {
        skills = skills.filter(s => s.config.toolkits.includes(query.hasToolkit!));
      }
      
      // Apply sorting
      if (query.sortBy) {
        const order = query.sortOrder === 'desc' ? -1 : 1;
        skills.sort((a, b) => {
          let aVal: any, bVal: any;
          
          switch (query.sortBy) {
            case 'name':
              return order * a.name.localeCompare(b.name);
            case 'created':
              return order * (new Date(a.metadata.created).getTime() - new Date(b.metadata.created).getTime());
            case 'updated':
              return order * (new Date(a.metadata.updated).getTime() - new Date(b.metadata.updated).getTime());
            case 'usage':
              aVal = this.usageStats.get(a.id)?.totalExecutions || 0;
              bVal = this.usageStats.get(b.id)?.totalExecutions || 0;
              return order * (aVal - bVal);
            case 'rating':
              aVal = a.metadata.rating || 0;
              bVal = b.metadata.rating || 0;
              return order * (aVal - bVal);
            default:
              return 0;
          }
        });
      }
      
      // Apply pagination
      if (query.offset !== undefined || query.limit !== undefined) {
        const offset = query.offset || 0;
        const limit = query.limit || skills.length;
        skills = skills.slice(offset, offset + limit);
      }
    }
    
    return skills;
  }
  
  // ==================== Skill Loading ====================
  
  /**
   * Load a skill (activate its toolkits and tools)
   */
  async loadSkill(id: string): Promise<void> {
    const skill = this.skills.get(id);
    if (!skill) {
      throw new Error(`Skill not found: ${id}`);
    }
    
    if (skill.loaded) {
      this.logger.warn(`Skill already loaded: ${id}`);
      return;
    }
    
    this.logger.info(`Loading skill: ${skill.name}`);
    
    // Load required skills first
    if (skill.config.requiredSkills && skill.config.requiredSkills.length > 0) {
      for (const requiredId of skill.config.requiredSkills) {
        const requiredSkill = this.skills.get(requiredId);
        if (!requiredSkill) {
          throw new Error(`Required skill not found: ${requiredId}`);
        }
        if (!requiredSkill.loaded) {
          await this.loadSkill(requiredId);
        }
      }
    }
    
    // Load toolkits
    const loadedToolkits: string[] = [];
    const loadedTools: string[] = [];
    
    for (const toolkitId of skill.config.toolkits) {
      try {
        await this.toolkitManager.loadToolkit(toolkitId);
        loadedToolkits.push(toolkitId);
        
        // Get tools from toolkit
        const toolkit = this.toolkitManager.getToolkit(toolkitId);
        if (toolkit) {
          // If specific tools are specified, only load those
          if (skill.config.tools && skill.config.tools.length > 0) {
            loadedTools.push(...skill.config.tools.filter(tool => 
              // Verify tool exists in toolkit (would need toolkit tool list)
              true
            ));
          } else {
            // Load all tools from toolkit (would need toolkit tool list)
            // For now, just mark toolkit as loaded
          }
        }
      } catch (error) {
        this.logger.error(`Failed to load toolkit ${toolkitId} for skill ${id}:`, error);
        throw error;
      }
    }
    
    // Update skill state
    skill.loaded = true;
    skill.loadedToolkits = loadedToolkits;
    skill.loadedTools = loadedTools;
    
    this.skills.set(id, skill);
    
    this.logger.info(`Skill loaded: ${skill.name} (${loadedToolkits.length} toolkits, ${loadedTools.length} tools)`);
  }
  
  /**
   * Unload a skill (deactivate its toolkits and tools)
   */
  async unloadSkill(id: string): Promise<void> {
    const skill = this.skills.get(id);
    if (!skill) {
      throw new Error(`Skill not found: ${id}`);
    }
    
    if (!skill.loaded) {
      this.logger.warn(`Skill not loaded: ${id}`);
      return;
    }
    
    // Check if any other loaded skills depend on this
    for (const [otherId, otherSkill] of this.skills) {
      if (otherId !== id && otherSkill.loaded && otherSkill.config.requiredSkills?.includes(id)) {
        throw new Error(`Cannot unload skill ${id}: required by ${otherId}`);
      }
    }
    
    // Update skill state
    skill.loaded = false;
    skill.loadedToolkits = [];
    skill.loadedTools = [];
    
    this.skills.set(id, skill);
    
    this.logger.info(`Skill unloaded: ${skill.name}`);
  }
  
  // ==================== Skill Attachment ====================
  
  /**
   * Attach a skill to an agent, workflow, team, or collection
   */
  async attachSkill(
    skillId: string,
    entityType: 'agent' | 'workflow' | 'team' | 'collection',
    entityId: string,
    attachedBy?: string,
    overrides?: SkillAttachment['overrides']
  ): Promise<SkillAttachment> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }
    
    // Load skill if not already loaded
    if (!skill.loaded) {
      await this.loadSkill(skillId);
    }
    
    // Create attachment
    const attachment: SkillAttachment = {
      skillId,
      attachedTo: {
        type: entityType,
        id: entityId
      },
      attachedAt: new Date(),
      attachedBy,
      overrides,
      active: true
    };
    
    // Store attachment
    const key = `${entityType}:${entityId}`;
    const existing = this.attachments.get(key) || [];
    existing.push(attachment);
    this.attachments.set(key, existing);
    
    this.logger.info(`Skill ${skillId} attached to ${entityType} ${entityId}`);
    
    return attachment;
  }
  
  /**
   * Detach a skill from an entity
   */
  async detachSkill(
    skillId: string,
    entityType: 'agent' | 'workflow' | 'team' | 'collection',
    entityId: string
  ): Promise<void> {
    const key = `${entityType}:${entityId}`;
    const attachments = this.attachments.get(key) || [];
    
    const filtered = attachments.filter(a => a.skillId !== skillId);
    
    if (filtered.length === attachments.length) {
      throw new Error(`Skill ${skillId} not attached to ${entityType} ${entityId}`);
    }
    
    this.attachments.set(key, filtered);
    
    this.logger.info(`Skill ${skillId} detached from ${entityType} ${entityId}`);
  }
  
  /**
   * Get all skills attached to an entity
   */
  getAttachedSkills(
    entityType: 'agent' | 'workflow' | 'team' | 'collection',
    entityId: string
  ): SkillAttachment[] {
    const key = `${entityType}:${entityId}`;
    return this.attachments.get(key) || [];
  }
  
  /**
   * Get all attachments for a specific skill
   */
  getSkillAttachments(skillId: string): SkillAttachment[] {
    const result: SkillAttachment[] = [];
    
    for (const attachments of this.attachments.values()) {
      result.push(...attachments.filter(a => a.skillId === skillId));
    }
    
    return result;
  }
  
  // ==================== Skill Composition ====================
  
  /**
   * Compose multiple skills into a single effective configuration
   */
  async composeSkills(skillIds: string[]): Promise<SkillComposition> {
    const skills = skillIds.map(id => {
      const skill = this.skills.get(id);
      if (!skill) {
        throw new Error(`Skill not found: ${id}`);
      }
      return skill;
    });
    
    // Merge toolkits (deduplicate)
    const toolkits = new Set<string>();
    const tools = new Set<string>();
    const rules: SkillRule[] = [];
    const conflicts: SkillComposition['conflicts'] = [];
    
    for (const skill of skills) {
      // Add toolkits
      skill.config.toolkits.forEach(tk => toolkits.add(tk));
      
      // Add tools
      skill.config.tools?.forEach(tool => tools.add(tool));
      
      // Add rules (with conflict detection)
      for (const rule of skill.config.rules) {
        const existing = rules.find(r => r.id === rule.id);
        if (existing) {
          conflicts.push({
            type: 'conflicting-rule',
            affected: [rule.id],
            resolution: `Using rule from skill ${skill.id} (higher priority)`
          });
          // Keep higher priority rule
          if ((rule.priority || 0) > (existing.priority || 0)) {
            rules.splice(rules.indexOf(existing), 1, rule);
          }
        } else {
          rules.push(rule);
        }
      }
    }
    
    // Merge instructions
    const instructions = {
      overview: skills.map(s => s.config.instructions.overview).join('\n\n'),
      usage: skills.map(s => s.config.instructions.usage).join('\n\n'),
      examples: skills.flatMap(s => s.config.instructions.examples || []),
      bestPractices: skills.flatMap(s => s.config.instructions.bestPractices || []),
      warnings: skills.flatMap(s => s.config.instructions.warnings || []),
      prerequisites: skills.flatMap(s => s.config.instructions.prerequisites || [])
    };
    
    // Merge system prompts
    const systemPrompt = skills
      .map(s => s.config.systemPrompt)
      .filter(Boolean)
      .join('\n\n');
    
    return {
      composedId: `composed_${skillIds.join('_')}`,
      sourceSkills: skillIds,
      toolkits: Array.from(toolkits),
      tools: Array.from(tools),
      rules,
      instructions,
      systemPrompt,
      conflicts
    };
  }
  
  // ==================== Validation ====================
  
  /**
   * Validate a skill configuration
   */
  private async validateSkillConfig(config: SkillConfig): Promise<SkillValidationResult> {
    const errors: SkillValidationResult['errors'] = [];
    const warnings: SkillValidationResult['warnings'] = [];
    
    // Validate toolkits exist
    for (const toolkitId of config.toolkits) {
      const toolkit = this.toolkitManager.getToolkit(toolkitId);
      if (!toolkit) {
        errors.push({
          type: 'missing-toolkit',
          message: `Toolkit not found: ${toolkitId}`,
          field: 'toolkits'
        });
      }
    }
    
    // Validate required skills exist
    if (config.requiredSkills) {
      for (const requiredId of config.requiredSkills) {
        if (!this.skills.has(requiredId)) {
          errors.push({
            type: 'missing-toolkit',
            message: `Required skill not found: ${requiredId}`,
            field: 'requiredSkills'
          });
        }
      }
    }
    
    // Check for circular dependencies
    if (config.requiredSkills) {
      // Would need to implement circular dependency detection
    }
    
    // Validate rules
    for (const rule of config.rules) {
      if (!rule.description || rule.description.trim().length === 0) {
        errors.push({
          type: 'invalid-rule',
          message: `Rule ${rule.id} has no description`,
          field: 'rules'
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      skillId: '',
      errors,
      warnings
    };
  }
  
  // ==================== Persistence ====================
  
  /**
   * Persist skill to disk
   */
  private async persistSkill(skill: Skill): Promise<void> {
    const skillPath = path.join(this.storageDir, `${skill.id}.json`);
    await fs.writeFile(skillPath, JSON.stringify(skill, null, 2), 'utf-8');
  }
  
  /**
   * Load persisted skills from disk
   */
  private async loadPersistedSkills(): Promise<void> {
    try {
      const files = await fs.readdir(this.storageDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const skillPath = path.join(this.storageDir, file);
          const content = await fs.readFile(skillPath, 'utf-8');
          const skill: Skill = JSON.parse(content);
          this.skills.set(skill.id, skill);
        }
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  
  /**
   * Initialize usage statistics for a skill
   */
  private initializeUsageStats(skillId: string): void {
    this.usageStats.set(skillId, {
      skillId,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      toolUsage: {},
      ruleViolations: {},
      usageByDay: []
    });
  }
  
  /**
   * Load usage statistics from disk
   */
  private async loadUsageStats(): Promise<void> {
    const statsPath = path.join(this.storageDir, 'usage-stats.json');
    try {
      const content = await fs.readFile(statsPath, 'utf-8');
      const stats: Record<string, SkillUsageStats> = JSON.parse(content);
      
      for (const [id, stat] of Object.entries(stats)) {
        this.usageStats.set(id, stat);
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        this.logger.warn('Failed to load usage stats:', error);
      }
    }
  }
  
  /**
   * Get usage statistics for a skill
   */
  getUsageStats(skillId: string): SkillUsageStats | undefined {
    return this.usageStats.get(skillId);
  }
  
  // ==================== Export/Import ====================
  
  /**
   * Export a skill to a portable format
   */
  async exportSkill(
    skillId: string,
    options?: {
      includeDependencies?: boolean;
      includeStats?: boolean;
    }
  ): Promise<SkillExport> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }
    
    const exportData: SkillExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      skill,
      includeDependencies: options?.includeDependencies || false,
      includeStats: options?.includeStats || false
    };
    
    if (options?.includeDependencies && skill.config.requiredSkills) {
      exportData.dependencies = [];
      for (const depId of skill.config.requiredSkills) {
        const depSkill = this.skills.get(depId);
        if (depSkill) {
          exportData.dependencies.push(depSkill);
        }
      }
    }
    
    if (options?.includeStats) {
      exportData.stats = this.usageStats.get(skillId);
    }
    
    return exportData;
  }
  
  /**
   * Import a skill from exported data
   */
  async importSkill(exportData: SkillExport): Promise<SkillImportResult> {
    const result: SkillImportResult = {
      success: false,
      message: '',
      imported: {
        skill: false,
        dependencies: []
      },
      skipped: {
        reason: '',
        items: []
      },
      errors: [],
      warnings: []
    };
    
    try {
      // Check if skill already exists
      if (this.skills.has(exportData.skill.id)) {
        result.skipped.reason = 'Skill already exists';
        result.skipped.items.push(exportData.skill.id);
        result.message = `Skill ${exportData.skill.id} already exists`;
        return result;
      }
      
      // Import dependencies first
      if (exportData.includeDependencies && exportData.dependencies) {
        for (const dep of exportData.dependencies) {
          if (!this.skills.has(dep.id)) {
            this.skills.set(dep.id, dep);
            await this.persistSkill(dep);
            this.initializeUsageStats(dep.id);
            result.imported.dependencies.push(dep.id);
          }
        }
      }
      
      // Import the skill
      this.skills.set(exportData.skill.id, exportData.skill);
      await this.persistSkill(exportData.skill);
      this.initializeUsageStats(exportData.skill.id);
      result.imported.skill = true;
      
      // Import stats if included
      if (exportData.includeStats && exportData.stats) {
        this.usageStats.set(exportData.skill.id, exportData.stats);
      }
      
      result.success = true;
      result.skillId = exportData.skill.id;
      result.message = `Successfully imported skill ${exportData.skill.id}`;
      
    } catch (error) {
      result.success = false;
      result.message = `Failed to import skill: ${error}`;
      result.errors = [String(error)];
    }
    
    return result;
  }
}
