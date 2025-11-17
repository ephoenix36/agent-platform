/**
 * Toolkit System Types
 * 
 * Modular toolkit architecture for organizing and selectively loading MCP tools.
 * Prevents tool overload by allowing granular control over which features are enabled.
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../utils/logging.js';

/**
 * Category classification for toolkits
 */
export type ToolkitCategory =
  | 'core'                    // Always loaded (server management, health checks)
  | 'project-management'      // Project, sprint, and task management
  | 'agent-development'       // Agent execution and collaboration
  | 'workflow'                // Workflow orchestration
  | 'model-management'        // AI model selection and optimization
  | 'billing'                 // Payment processing (Stripe)
  | 'integration'             // External service integrations (GitHub, Slack, etc.)
  | 'task-management'         // Legacy simple task system
  | 'custom';                 // User-defined extensions

/**
 * Tool registration function type
 * Follows the same pattern as existing tools (registerAgentTools, registerWorkflowTools, etc.)
 */
export type ToolRegistrationFunction = (server: McpServer, logger: Logger) => Promise<void> | void;

/**
 * Configuration options for a toolkit
 */
export interface ToolkitConfig {
  requiresAuth?: boolean;             // Whether toolkit requires authentication
  defaultEnabled?: boolean;           // Default enabled state for new installations
  permissions?: string[];             // Required permissions (e.g., ["read", "write"])
  settings?: Record<string, any>;     // Toolkit-specific settings
}

/**
 * Complete toolkit definition
 */
export interface Toolkit {
  id: string;                         // Unique identifier (e.g., "project-management")
  name: string;                       // Display name for users
  description: string;                // What this toolkit does
  version: string;                    // Semantic version (e.g., "1.0.0")
  category: ToolkitCategory;
  
  dependencies?: string[];            // Required toolkit IDs that must be loaded first
  conflicts?: string[];               // Incompatible toolkit IDs
  
  register: ToolRegistrationFunction; // Function to register all tools
  toolCount: number;                  // Number of tools this toolkit provides
  enabled: boolean;                   // Default enabled state
  
  metadata: {
    author: string;                   // Creator/maintainer
    created: string;                  // ISO 8601 creation date
    updated: string;                  // ISO 8601 last update date
    tags: string[];                   // Searchable tags
    homepage?: string;                // Documentation URL
    repository?: string;              // Source code URL
  };
  
  config?: ToolkitConfig;             // Optional configuration
}

/**
 * Toolkit configuration in manifest
 */
export interface ToolkitManifestEntry {
  enabled: boolean;                   // Whether toolkit is enabled
  autoLoad: boolean;                  // Load on server start
  lazyLoad: boolean;                  // Load on first tool use
  config?: Record<string, any>;       // Toolkit-specific configuration overrides
}

/**
 * Toolkit manifest for selective loading
 * Stored in .toolkit-manifest.json at project root
 */
export interface ToolkitManifest {
  version: string;                    // Manifest format version
  updated: string;                    // ISO 8601 last update timestamp
  toolkits: {
    [toolkitId: string]: ToolkitManifestEntry;
  };
}

/**
 * Status information for a toolkit
 */
export interface ToolkitStatus {
  id: string;                         // Toolkit ID
  name: string;                       // Display name
  description: string;                // Short description
  category: ToolkitCategory;
  version: string;                    // Current version
  toolCount: number;                  // Number of tools provided
  loaded: boolean;                    // Whether currently loaded
  enabled: boolean;                   // Whether enabled in manifest
  dependencies: string[];             // Required dependencies
  conflicts: string[];                // Conflicting toolkits
  metadata: Toolkit['metadata'];
}

/**
 * Result of toolkit loading operation
 */
export interface ToolkitLoadResult {
  success: boolean;
  toolkitId: string;
  toolsLoaded: number;
  error?: string;
  warnings?: string[];
}

/**
 * Toolkit dependency graph node
 */
export interface ToolkitDependencyNode {
  id: string;
  dependencies: string[];
  dependents: string[];               // Toolkits that depend on this one
  depth: number;                      // Depth in dependency tree (0 = no deps)
}

/**
 * Toolkit search query
 */
export interface ToolkitQuery {
  category?: ToolkitCategory;
  tags?: string[];
  loaded?: boolean;
  enabled?: boolean;
  search?: string;                    // Text search in name/description
}

/**
 * Toolkit validation result
 */
export interface ToolkitValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  toolkit: Toolkit;
}

/**
 * Toolkit registry statistics
 */
export interface ToolkitStats {
  totalRegistered: number;
  totalLoaded: number;
  totalEnabled: number;
  byCategory: Record<ToolkitCategory, number>;
  totalTools: number;
  toolsByCategory: Record<ToolkitCategory, number>;
}

/**
 * Error thrown when toolkit validation fails
 */
export class ToolkitValidationError extends Error {
  constructor(
    public toolkitId: string,
    public validationErrors: string[],
    message?: string
  ) {
    super(message || `Toolkit validation failed: ${toolkitId}`);
    this.name = 'ToolkitValidationError';
  }
}

/**
 * Error thrown when toolkit dependencies cannot be resolved
 */
export class ToolkitDependencyError extends Error {
  constructor(
    public toolkitId: string,
    public missingDependencies: string[],
    message?: string
  ) {
    super(message || `Missing dependencies for toolkit ${toolkitId}: ${missingDependencies.join(', ')}`);
    this.name = 'ToolkitDependencyError';
  }
}

/**
 * Error thrown when conflicting toolkits are loaded
 */
export class ToolkitConflictError extends Error {
  constructor(
    public toolkitId: string,
    public conflictingToolkit: string,
    message?: string
  ) {
    super(message || `Toolkit ${toolkitId} conflicts with ${conflictingToolkit}`);
    this.name = 'ToolkitConflictError';
  }
}

/**
 * Error thrown when circular dependencies are detected
 */
export class CircularDependencyError extends Error {
  constructor(
    public cycle: string[],
    message?: string
  ) {
    super(message || `Circular dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Error thrown when toolkit is not found
 */
export class ToolkitNotFoundError extends Error {
  constructor(
    public toolkitId: string,
    message?: string
  ) {
    super(message || `Toolkit not found: ${toolkitId}`);
    this.name = 'ToolkitNotFoundError';
  }
}
