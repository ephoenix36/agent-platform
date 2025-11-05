/**
 * Extension Manifest Schema
 * Zod-validated schemas for extension metadata and configuration
 */

import { z } from 'zod';

/**
 * Semantic versioning pattern
 */
const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/**
 * Extension permission types
 */
export enum Permission {
  // Network permissions
  NETWORK_HTTP = 'network:http',
  NETWORK_WEBSOCKET = 'network:websocket',
  
  // File system permissions
  FS_READ = 'fs:read',
  FS_WRITE = 'fs:write',
  FS_DELETE = 'fs:delete',
  
  // Storage permissions
  STORAGE_LOCAL = 'storage:local',
  STORAGE_SESSION = 'storage:session',
  
  // Widget communication
  WIDGET_COMMUNICATE = 'widget:communicate',
  WIDGET_CREATE = 'widget:create',
  
  // Workflow permissions
  WORKFLOW_READ = 'workflow:read',
  WORKFLOW_WRITE = 'workflow:write',
  WORKFLOW_EXECUTE = 'workflow:execute',
  
  // System permissions
  SYSTEM_CLIPBOARD = 'system:clipboard',
  SYSTEM_NOTIFICATIONS = 'system:notifications',
  
  // Extension communication
  EXTENSION_COMMUNICATE = 'extension:communicate'
}

/**
 * Extension lifecycle states
 */
export enum ExtensionState {
  UNINSTALLED = 'uninstalled',
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error'
}

/**
 * Extension category for organization
 */
export enum ExtensionCategory {
  WORKFLOW_NODE = 'workflow-node',
  WIDGET = 'widget',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
  THEME = 'theme',
  LANGUAGE = 'language'
}

/**
 * Extension author schema
 */
export const ExtensionAuthorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  url: z.string().url().optional()
});

export type ExtensionAuthor = z.infer<typeof ExtensionAuthorSchema>;

/**
 * Extension dependency schema
 * Specifies required extensions and version constraints (semver ranges allowed)
 */
export const ExtensionDependencySchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1), // Allow semver ranges like ">=1.0.0", "^2.0.0"
  optional: z.boolean().default(false)
});

export type ExtensionDependency = z.infer<typeof ExtensionDependencySchema>;

/**
 * Extension contribution point schema
 * Defines what the extension contributes to the platform
 */
export const ExtensionContributionSchema = z.object({
  // Workflow nodes contributed
  nodes: z.array(z.object({
    type: z.string(),
    displayName: z.string(),
    description: z.string(),
    category: z.string(),
    icon: z.string().optional()
  })).optional(),
  
  // Widgets contributed
  widgets: z.array(z.object({
    id: z.string(),
    name: z.string(),
    entryPoint: z.string()
  })).optional(),
  
  // Commands contributed
  commands: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    handler: z.string()
  })).optional(),
  
  // Settings contributed
  settings: z.array(z.object({
    key: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    default: z.any(),
    description: z.string().optional()
  })).optional()
});

export type ExtensionContribution = z.infer<typeof ExtensionContributionSchema>;

/**
 * Complete extension manifest schema
 */
export const ExtensionManifestSchema = z.object({
  // Basic metadata
  id: z.string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'ID must be lowercase alphanumeric with hyphens'),
  
  name: z.string().min(1).max(100),
  version: z.string().regex(semverPattern, 'Invalid semver version'),
  description: z.string().max(500),
  
  // Author information
  author: z.union([
    z.string(),
    ExtensionAuthorSchema
  ]),
  
  // Repository and homepage
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
  
  // Category and keywords
  category: z.nativeEnum(ExtensionCategory),
  keywords: z.array(z.string()).max(10).default([]),
  
  // Entry point
  main: z.string().min(1),
  
  // Dependencies
  dependencies: z.array(ExtensionDependencySchema).default([]),
  
  // Permissions required
  permissions: z.array(z.nativeEnum(Permission)).default([]),
  
  // Contributions
  contributes: ExtensionContributionSchema.optional(),
  
  // Activation events
  activationEvents: z.array(z.string()).default([]),
  
  // Minimum platform version required (supports semver ranges)
  engines: z.object({
    'agent-platform': z.string().min(1)
  }),
  
  // Optional metadata
  icon: z.string().optional(),
  license: z.string().optional(),
  readme: z.string().optional(),
  changelog: z.string().optional()
});

export type ExtensionManifest = z.infer<typeof ExtensionManifestSchema>;

/**
 * Extension metadata (runtime state)
 */
export const ExtensionMetadataSchema = ExtensionManifestSchema.extend({
  // Runtime state
  state: z.nativeEnum(ExtensionState),
  
  // Installation metadata
  installPath: z.string(),
  installedAt: z.number(),
  updatedAt: z.number().optional(),
  
  // Error information if state is ERROR
  error: z.string().optional(),
  
  // Loaded module reference
  module: z.any().optional()
});

export type ExtensionMetadata = z.infer<typeof ExtensionMetadataSchema>;

/**
 * Parse and validate an extension manifest
 */
export function parseManifest(data: unknown): ExtensionManifest {
  return ExtensionManifestSchema.parse(data);
}

/**
 * Validate manifest without throwing
 */
export function validateManifest(data: unknown): { 
  success: boolean; 
  data?: ExtensionManifest; 
  errors?: z.ZodError 
} {
  const result = ExtensionManifestSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Check if an extension ID is valid
 */
export function isValidExtensionId(id: string): boolean {
  return /^[a-z0-9-]{3,100}$/.test(id);
}

/**
 * Check if a version string is valid semver
 */
export function isValidVersion(version: string): boolean {
  return semverPattern.test(version);
}
