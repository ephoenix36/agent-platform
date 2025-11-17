import { z } from 'zod';

/**
 * Component types supported by the platform
 */
export enum ComponentType {
  AGENT = 'agent',
  TOOL = 'tool',
  WORKFLOW = 'workflow',
  SKILL = 'skill',
  HOOK = 'hook',
  WIDGET = 'widget',
  MCP_SERVER = 'mcp_server',
  COLLECTION = 'collection',
}

/**
 * Storage location for components
 */
export enum StorageLocation {
  PLATFORM = 'platform',
  USER = 'user',
}

/**
 * Component visibility levels
 */
export enum ComponentVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
}

/**
 * Base metadata for all components
 */
export const ComponentMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  version: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  documentation: z.string().url().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ComponentMetadata = z.infer<typeof ComponentMetadataSchema>;

/**
 * Agent-specific content
 */
export const AgentContentSchema = z.object({
  name: z.string(),
  description: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().positive(),
  topP: z.number().min(0).max(1),
  systemPrompt: z.string(),
  enabledTools: z.array(z.string()).optional(),
  toolkits: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

export type AgentContent = z.infer<typeof AgentContentSchema>;

/**
 * Tool-specific content
 */
export const ToolContentSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any()),
  handler: z.string().optional(), // Code or reference
  sandbox: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

export type ToolContent = z.infer<typeof ToolContentSchema>;

/**
 * Workflow step definition
 */
export const WorkflowStepSchema = z.object({
  id: z.string(),
  type: z.string(),
  config: z.record(z.any()),
  condition: z.string().optional(),
  onSuccess: z.string().optional(),
  onError: z.string().optional(),
  skipIf: z.string().optional(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

/**
 * Workflow-specific content
 */
export const WorkflowContentSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(WorkflowStepSchema),
  trigger: z.enum(['manual', 'schedule', 'webhook', 'event']),
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
});

export type WorkflowContent = z.infer<typeof WorkflowContentSchema>;

/**
 * Skill-specific content
 */
export const SkillContentSchema = z.object({
  name: z.string(),
  description: z.string(),
  toolkits: z.array(z.string()),
  tools: z.array(z.string()).optional(),
  systemPrompt: z.string().optional(),
  instructions: z.object({
    overview: z.string(),
    usage: z.string(),
    examples: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    bestPractices: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional(),
  }),
  rules: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      enabled: z.boolean().default(true),
      priority: z.number().optional(),
      condition: z.string().optional(),
    })
  ),
  validators: z.array(
    z.object({
      type: z.enum(['pre-execution', 'post-execution', 'parameter']),
      code: z.string(),
      message: z.string(),
    })
  ).optional(),
});

export type SkillContent = z.infer<typeof SkillContentSchema>;

/**
 * Hook-specific content
 */
export const HookContentSchema = z.object({
  name: z.string(),
  description: z.string(),
  triggerOn: z.enum(['tool:before', 'tool:after', 'agent:before', 'agent:after', 'workflow:step:before', 'workflow:step:after']),
  handler: z.string(),
  async: z.boolean().default(false),
  priority: z.number().default(100),
});

export type HookContent = z.infer<typeof HookContentSchema>;

/**
 * Widget-specific content
 */
export const WidgetContentSchema = z.object({
  name: z.string(),
  description: z.string(),
  template: z.string(),
  props: z.record(z.any()).optional(),
  eventHandlers: z.record(z.string()).optional(),
  lifecycle: z.object({
    onMount: z.string().optional(),
    onUpdate: z.string().optional(),
    onDestroy: z.string().optional(),
  }).optional(),
});

export type WidgetContent = z.infer<typeof WidgetContentSchema>;

/**
 * Collection-specific content
 */
export const CollectionContentSchema = z.object({
  name: z.string(),
  description: z.string(),
  schema: z.record(z.any()),
  items: z.array(z.record(z.any())).optional(),
  versioning: z.boolean().default(false),
  maxVersions: z.number().positive().optional(),
  permissions: z.record(
    z.object({
      read: z.boolean(),
      write: z.boolean(),
      delete: z.boolean(),
    })
  ).optional(),
});

export type CollectionContent = z.infer<typeof CollectionContentSchema>;

/**
 * Union of all component content types
 */
export type ComponentContent =
  | AgentContent
  | ToolContent
  | WorkflowContent
  | SkillContent
  | HookContent
  | WidgetContent
  | CollectionContent;

/**
 * Base component interface
 */
export interface Component<T extends ComponentContent = ComponentContent> {
  id: string;
  type: ComponentType;
  name: string;
  description: string;
  content: T;
  version: number;
  storageLocation: StorageLocation;
  visibility: ComponentVisibility;
  metadata: ComponentMetadata;
  storagePath?: string;
  dependencies?: string[];
}

/**
 * Component version history entry
 */
export interface ComponentVersion<T extends ComponentContent = ComponentContent> {
  version: number;
  component: Component<T>;
  timestamp: Date;
  changeDescription?: string;
  changedBy?: string;
}

/**
 * Component query options
 */
export interface ComponentQueryOptions {
  type?: ComponentType;
  storageLocation?: StorageLocation;
  visibility?: ComponentVisibility;
  tags?: string[];
  category?: string;
  author?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created' | 'updated' | 'version';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Component query result
 */
export interface ComponentQueryResult<T extends ComponentContent = ComponentContent> {
  components: Component<T>[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Transaction context for atomic operations
 */
export interface TransactionContext {
  id: string;
  startTime: Date;
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    componentId: string;
    timestamp: Date;
  }>;
}

/**
 * Storage operation result
 */
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalComponents: number;
  componentsByType: Record<ComponentType, number>;
  componentsByLocation: Record<StorageLocation, number>;
  totalSize: number;
  lastUpdated: Date;
}

/**
 * Export/Import format
 */
export interface ComponentExport<T extends ComponentContent = ComponentContent> {
  version: string;
  exportDate: Date;
  components: Component<T>[];
  dependencies: Record<string, string[]>;
}
