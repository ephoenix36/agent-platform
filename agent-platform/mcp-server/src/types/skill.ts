/**
 * Skill Type System
 * 
 * Skills extend toolkits with additional instructions, rules, and configuration.
 * They provide a higher-level abstraction for organizing tools with context.
 */

import { Toolkit, ToolkitCategory } from './toolkit.js';

/**
 * Skill rule - short, actionable instruction
 */
export interface SkillRule {
  id: string;
  description: string;
  priority?: number;  // Higher priority rules are enforced first
  enabled?: boolean;
  condition?: string;  // JavaScript expression for conditional application
}

/**
 * Skill instructions - comprehensive guidance for using the skill
 */
export interface SkillInstructions {
  overview: string;  // High-level description
  usage: string;     // How to use this skill
  examples?: string[];  // Example use cases
  bestPractices?: string[];  // Recommended patterns
  warnings?: string[];  // Things to avoid
  prerequisites?: string[];  // Required knowledge or setup
}

/**
 * Skill configuration
 */
export interface SkillConfig {
  // Toolset composition
  toolkits: string[];  // Toolkit IDs to include
  tools?: string[];    // Specific tool names (overrides toolkit defaults)
  
  // Instructions and rules
  instructions: SkillInstructions;
  rules: SkillRule[];
  systemPrompt?: string;  // Additional system prompt for this skill
  
  // Behavior
  autoLoad?: boolean;  // Load automatically when agent is created
  exclusive?: boolean;  // If true, only this skill's tools are available
  
  // Integration
  requiredSkills?: string[];  // Other skills this depends on
  conflictingSkills?: string[];  // Skills that cannot be used together
  
  // Validation
  validators?: Array<{
    type: 'pre-execution' | 'post-execution' | 'parameter';
    code: string;  // JavaScript function code
    message: string;
  }>;
}

/**
 * Skill metadata
 */
export interface SkillMetadata {
  author: string;
  created: string;  // ISO 8601
  updated: string;  // ISO 8601
  version: string;  // Semantic version
  tags: string[];
  category?: string;
  homepage?: string;
  repository?: string;
  documentation?: string;
  license?: string;
  
  // Usage statistics
  usageCount?: number;
  lastUsed?: string;  // ISO 8601
  
  // Quality metrics
  rating?: number;  // 1-5
  reviews?: number;
}

/**
 * Complete skill definition
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  config: SkillConfig;
  metadata: SkillMetadata;
  
  // State
  enabled: boolean;
  loaded: boolean;
  
  // Runtime
  loadedToolkits?: string[];  // Currently loaded toolkit IDs
  loadedTools?: string[];     // Currently available tool names
  
  // Validation
  validated?: boolean;
  validationErrors?: string[];
}

/**
 * Skill template for creating new skills
 */
export interface SkillTemplate {
  name: string;
  description: string;
  category: string;
  baseSkills?: string[];  // Skills to inherit from
  suggestedToolkits: string[];
  suggestedRules: Omit<SkillRule, 'id'>[];
  instructionTemplate: Partial<SkillInstructions>;
}

/**
 * Skill attachment to an agent, workflow, or team
 */
export interface SkillAttachment {
  skillId: string;
  attachedTo: {
    type: 'agent' | 'workflow' | 'team' | 'collection';
    id: string;
  };
  attachedAt: Date;
  attachedBy?: string;  // User or agent ID
  
  // Override configuration
  overrides?: {
    rules?: Partial<Record<string, boolean>>;  // Rule ID -> enabled
    tools?: string[];  // Override tool list
    systemPrompt?: string;  // Additional prompt
  };
  
  // State
  active: boolean;
  lastUsed?: Date;
}

/**
 * Skill execution context
 */
export interface SkillContext {
  skillId: string;
  executionId: string;
  startTime: Date;
  
  // Execution environment
  agentId?: string;
  workflowId?: string;
  teamId?: string;
  
  // Available resources
  availableTools: string[];
  activeRules: SkillRule[];
  instructions: SkillInstructions;
  
  // State tracking
  toolCalls: Array<{
    tool: string;
    timestamp: Date;
    result?: any;
    error?: string;
  }>;
  
  ruleViolations: Array<{
    ruleId: string;
    description: string;
    timestamp: Date;
    severity: 'warning' | 'error';
  }>;
}

/**
 * Skill query for searching and filtering
 */
export interface SkillQuery {
  search?: string;  // Text search in name, description, tags
  category?: string;
  tags?: string[];
  author?: string;
  
  // Filters
  enabled?: boolean;
  loaded?: boolean;
  hasToolkit?: string;  // Must include specific toolkit
  
  // Sorting
  sortBy?: 'name' | 'created' | 'updated' | 'usage' | 'rating';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Skill validation result
 */
export interface SkillValidationResult {
  valid: boolean;
  skillId: string;
  errors: Array<{
    type: 'missing-toolkit' | 'missing-tool' | 'circular-dependency' | 'conflict' | 'invalid-rule' | 'invalid-validator';
    message: string;
    field?: string;
  }>;
  warnings: Array<{
    type: 'deprecated-toolkit' | 'deprecated-tool' | 'performance' | 'compatibility';
    message: string;
  }>;
}

/**
 * Skill composition result (when combining multiple skills)
 */
export interface SkillComposition {
  composedId: string;
  sourceSkills: string[];
  
  // Merged configuration
  toolkits: string[];
  tools: string[];
  rules: SkillRule[];
  instructions: SkillInstructions;
  systemPrompt: string;
  
  // Conflict resolution
  conflicts: Array<{
    type: 'duplicate-tool' | 'conflicting-rule' | 'incompatible-skill';
    affected: string[];
    resolution: string;
  }>;
}

/**
 * Skill usage statistics
 */
export interface SkillUsageStats {
  skillId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;  // milliseconds
  
  // Tool usage within skill
  toolUsage: Record<string, {
    calls: number;
    successes: number;
    failures: number;
    averageTime: number;
  }>;
  
  // Rule violations
  ruleViolations: Record<string, number>;  // Rule ID -> violation count
  
  // Time-based metrics
  usageByDay: Array<{
    date: string;  // ISO 8601 date
    executions: number;
  }>;
}

/**
 * Skill export format
 */
export interface SkillExport {
  version: string;  // Export format version
  exportedAt: string;  // ISO 8601
  exportedBy?: string;
  
  skill: Skill;
  
  // Include dependencies
  includeDependencies?: boolean;
  dependencies?: Skill[];  // Required skills
  
  // Include usage data
  includeStats?: boolean;
  stats?: SkillUsageStats;
}

/**
 * Skill import result
 */
export interface SkillImportResult {
  success: boolean;
  skillId?: string;
  message: string;
  
  imported: {
    skill: boolean;
    dependencies: string[];  // Imported dependency IDs
  };
  
  skipped: {
    reason: string;
    items: string[];
  };
  
  errors?: string[];
  warnings?: string[];
}
