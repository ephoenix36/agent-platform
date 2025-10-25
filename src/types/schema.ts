import { z } from 'zod';

/**
 * Tool permission configuration for MCP tools
 */
export const ToolPermissionSchema = z.object({
  toolName: z.string(),
  allowRead: z.boolean().default(true),
  allowWrite: z.boolean().default(false),
  allowExecute: z.boolean().default(false),
  maxCalls: z.number().optional(),
});

export type ToolPermission = z.infer<typeof ToolPermissionSchema>;

/**
 * Example for agent instruction
 */
export const ExampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  explanation: z.string().optional(),
});

export type Example = z.infer<typeof ExampleSchema>;

/**
 * Evaluation criterion
 */
export const CriterionSchema = z.object({
  name: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(1),
  required: z.boolean().default(false),
});

export type Criterion = z.infer<typeof CriterionSchema>;

/**
 * Weighted metric for evaluation
 */
export const WeightedMetricSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(1),
  target: z.number().optional(),
  aggregation: z.enum(['mean', 'median', 'min', 'max', 'sum']).default('mean'),
});

export type WeightedMetric = z.infer<typeof WeightedMetricSchema>;

/**
 * Evaluator configuration
 */
export const EvaluatorConfigSchema = z.object({
  type: z.enum(['rule-based', 'llm-judge', 'user-feedback', 'automated-test']),
  implementation: z.string(), // Python code or reference path
  successCriteria: z.array(CriterionSchema),
  weightedMetrics: z.array(WeightedMetricSchema),
  description: z.string().optional(),
});

export type EvaluatorConfig = z.infer<typeof EvaluatorConfigSchema>;

/**
 * Constraint for mutation
 */
export const ConstraintSchema = z.object({
  name: z.string(),
  type: z.enum(['length', 'format', 'content', 'complexity']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type Constraint = z.infer<typeof ConstraintSchema>;

/**
 * Mutator configuration
 */
export const MutatorConfigSchema = z.object({
  strategies: z.array(z.string()), // e.g., ["prompt-expansion", "example-refinement"]
  constraints: z.array(ConstraintSchema),
  implementation: z.string(), // Python code or reference path
  mutationRate: z.number().min(0).max(1).default(0.3),
  description: z.string().optional(),
});

export type MutatorConfig = z.infer<typeof MutatorConfigSchema>;

/**
 * Optimization run metadata
 */
export const OptimizationRunSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  startScore: z.number(),
  endScore: z.number(),
  generations: z.number(),
  bestVariant: z.string(), // Reference to best instruction variant
  convergenceReached: z.boolean(),
  duration: z.number(), // milliseconds
});

export type OptimizationRun = z.infer<typeof OptimizationRunSchema>;

/**
 * Complete Agent Instruction Schema
 */
export const AgentInstructionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  collection: z.string(),
  subsection: z.string(),
  version: z.string(),
  
  // Core instruction content
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  examples: z.array(ExampleSchema).optional(),
  
  // MCP Integration
  requiredTools: z.array(z.string()).optional(),
  optionalTools: z.array(z.string()).optional(),
  toolPermissions: z.array(ToolPermissionSchema).optional(),
  
  // Optimization metadata
  evaluator: EvaluatorConfigSchema,
  mutator: MutatorConfigSchema,
  optimizationHistory: z.array(OptimizationRunSchema).default([]),
  currentScore: z.number().min(0).max(1).default(0),
  optimizationThreshold: z.number().min(0).max(1).default(0.8),
  
  // Experience metadata
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  estimatedTokens: z.number().optional(),
  lastOptimized: z.string().optional(),
  
  // Author and versioning
  author: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AgentInstruction = z.infer<typeof AgentInstructionSchema>;

/**
 * Collection metadata
 */
export const CollectionMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  subsections: z.array(z.string()),
  tags: z.array(z.string()).default([]),
  agentCount: z.number().default(0),
});

export type CollectionMetadata = z.infer<typeof CollectionMetadataSchema>;
