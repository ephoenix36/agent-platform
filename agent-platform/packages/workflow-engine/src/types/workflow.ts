/**
 * Core workflow type definitions
 * Defines the structure of workflows, nodes, connections, and execution state
 */

import { z } from 'zod';

/**
 * Workflow execution status
 */
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Individual node execution status
 */
export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled'
}

/**
 * Position in the visual workflow canvas
 */
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number()
});

export type Position = z.infer<typeof PositionSchema>;

/**
 * Workflow node definition
 * Represents a single step in the workflow (e.g., HTTP request, AI call, data transform)
 */
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: PositionSchema,
  config: z.record(z.any()),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  status: z.nativeEnum(NodeStatus).optional(),
  result: z.any().optional(),
  error: z.string().optional()
});

export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

/**
 * Connection between two nodes
 * Defines data flow in the workflow
 */
export const WorkflowConnectionSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional()
});

export type WorkflowConnection = z.infer<typeof WorkflowConnectionSchema>;

/**
 * Workflow settings
 * Configuration for workflow execution behavior
 */
export const WorkflowSettingsSchema = z.object({
  timeout: z.number().optional(),
  retryOnFailure: z.boolean().optional(),
  maxRetries: z.number().optional(),
  parallelExecution: z.boolean().optional(),
  saveIntermediateResults: z.boolean().optional()
});

export type WorkflowSettings = z.infer<typeof WorkflowSettingsSchema>;

/**
 * Workflow metadata
 * Tracking information for the workflow
 */
export const WorkflowMetadataSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  updatedBy: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  description: z.string().optional()
});

export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;

/**
 * Complete workflow definition
 * Contains all nodes, connections, and configuration
 */
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  nodes: z.array(WorkflowNodeSchema),
  connections: z.array(WorkflowConnectionSchema),
  settings: WorkflowSettingsSchema,
  metadata: WorkflowMetadataSchema,
  status: z.nativeEnum(WorkflowStatus).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional()
});

export type Workflow = z.infer<typeof WorkflowSchema>;

/**
 * Execution context passed between nodes
 * Contains intermediate results and shared state
 */
export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  nodeResults: Record<string, any>;
  variables: Record<string, any>;
  startTime: Date;
  timeout?: number;
  cancelled: boolean;
}

/**
 * Workflow execution result
 * Returned when workflow completes
 */
export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: 'completed' | 'failed' | 'cancelled';
  nodeResults: Record<string, any>;
  executionTimeMs: number;
  error?: string;
  startedAt: string;
  completedAt: string;
}

/**
 * Execution state for monitoring
 * Current state of workflow execution
 */
export interface ExecutionState {
  workflowId?: string;
  executionId?: string;
  status: WorkflowStatus;
  nodeStates: Record<string, NodeStatus>;
  currentNode?: string;
  context: Partial<ExecutionContext>;
  progress: number; // 0-100
}
