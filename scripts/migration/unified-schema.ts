/**
 * Unified Agent Schema Definition
 * 
 * This is the target schema for all agents after consolidation
 */

import { z } from 'zod';

// Example definition
export const ExampleSchema = z.object({
  input: z.string().describe("Example user request"),
  output: z.string().describe("Expected agent output"),
  explanation: z.string().optional().describe("Why this is a good example")
});

// Success criterion definition
export const SuccessCriterionSchema = z.object({
  name: z.string().describe("Criterion identifier"),
  description: z.string().describe("What to measure"),
  weight: z.number().min(0).max(1).describe("Weight in overall score"),
  required: z.boolean().describe("Whether this criterion must pass")
});

// Weighted metric definition
export const WeightedMetricSchema = z.object({
  name: z.string().describe("Metric identifier"),
  weight: z.number().min(0).max(1).describe("Weight in overall score"),
  aggregation: z.enum(['mean', 'max', 'min', 'median']).describe("How to aggregate scores")
});

// Evaluator configuration
export const EvaluatorSchema = z.object({
  type: z.enum(['llm-judge', 'automated-test', 'rule-based']).describe("Evaluator type"),
  implementation: z.string().describe("Path to evaluator implementation"),
  successCriteria: z.array(SuccessCriterionSchema).describe("Success criteria"),
  weightedMetrics: z.array(WeightedMetricSchema).describe("Weighted metrics"),
  description: z.string().optional().describe("Evaluator description")
});

// Constraint definition
export const ConstraintSchema = z.object({
  name: z.string().describe("Constraint identifier"),
  type: z.enum(['content', 'format', 'length', 'style']).describe("Constraint type"),
  value: z.any().describe("Constraint value"),
  description: z.string().optional().describe("Constraint description")
});

// Mutator configuration
export const MutatorSchema = z.object({
  strategies: z.array(z.string()).describe("Mutation strategies"),
  constraints: z.array(ConstraintSchema).describe("Mutation constraints"),
  mutationRate: z.number().min(0).max(1).describe("Mutation rate"),
  description: z.string().optional().describe("Mutator description")
});

// Tool permission definition
export const ToolPermissionSchema = z.object({
  toolName: z.string(),
  allowRead: z.boolean().default(true),
  allowWrite: z.boolean().default(false),
  allowExecute: z.boolean().default(true)
});

// Optimization history entry
export const OptimizationHistorySchema = z.object({
  timestamp: z.string().describe("ISO timestamp"),
  score: z.number().describe("Optimization score"),
  metrics: z.record(z.number()).describe("Individual metric scores"),
  generation: z.number().describe("Optimization generation"),
  mutations: z.array(z.string()).describe("Applied mutations")
});

// Unified Agent Schema
export const UnifiedAgentSchema = z.object({
  // IDENTITY
  id: z.string().describe("Unique agent identifier"),
  name: z.string().describe("Human-readable agent name"),
  description: z.string().describe("Brief description of capabilities"),
  collection: z.string().describe("Collection category (e.g., 'agents')"),
  subsection: z.string().describe("Subsection path (e.g., 'business/sales')"),
  version: z.string().describe("Agent version (semver)"),
  tags: z.array(z.string()).default([]).describe("Searchable tags"),
  
  // DEFINITION
  systemPrompt: z.string().describe("Detailed agent instructions"),
  userPromptTemplate: z.string().optional().describe("Template for user input"),
  examples: z.array(ExampleSchema).default([]).describe("Input/output examples"),
  
  // MODEL CONFIGURATION
  model: z.string().optional().describe("Default model (e.g., 'claude-4.5-sonnet')"),
  temperature: z.number().min(0).max(2).optional().describe("Model temperature"),
  maxTokens: z.number().positive().optional().describe("Maximum tokens"),
  topP: z.number().min(0).max(1).optional().describe("Top-p sampling"),
  
  // TOOLS & CAPABILITIES
  requiredTools: z.array(z.string()).default([]).describe("Required tools"),
  optionalTools: z.array(z.string()).default([]).describe("Optional tools"),
  toolkits: z.array(z.string()).default([]).describe("Tool collections"),
  skills: z.array(z.string()).default([]).describe("Attached skills"),
  toolPermissions: z.array(ToolPermissionSchema).optional().describe("Tool permissions"),
  
  // OPTIMIZATION
  evaluator: EvaluatorSchema.optional().describe("Evaluator configuration"),
  mutator: MutatorSchema.optional().describe("Mutator configuration"),
  optimizationThreshold: z.number().min(0).max(1).optional().describe("Target optimization score"),
  currentScore: z.number().min(0).max(1).optional().describe("Current optimization score"),
  optimizationHistory: z.array(OptimizationHistorySchema).default([]).describe("Optimization history"),
  
  // METADATA
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe("Difficulty level"),
  estimatedTokens: z.number().positive().optional().describe("Estimated token usage"),
  createdAt: z.string().optional().describe("ISO creation timestamp"),
  updatedAt: z.string().optional().describe("ISO update timestamp"),
  createdBy: z.string().optional().describe("Creator identifier")
});

export type UnifiedAgent = z.infer<typeof UnifiedAgentSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type SuccessCriterion = z.infer<typeof SuccessCriterionSchema>;
export type WeightedMetric = z.infer<typeof WeightedMetricSchema>;
export type Evaluator = z.infer<typeof EvaluatorSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type Mutator = z.infer<typeof MutatorSchema>;
export type OptimizationHistory = z.infer<typeof OptimizationHistorySchema>;

// Legacy marketplace schema (for migration)
export const MarketplaceAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  creator: z.string(),
  category: z.string(),
  version: z.string(),
  performance_score: z.number(),
  tasks_completed: z.number(),
  success_rate: z.number(),
  avg_response_time: z.number(),
  user_rating: z.number(),
  price_per_execution: z.number(),
  total_earnings: z.number(),
  revenue_30d: z.number(),
  generation: z.number(),
  parent_agents: z.array(z.string()),
  mutations: z.array(z.string()),
  system_prompt: z.string(),
  tools: z.array(z.string()),
  model: z.string(),
  parameters: z.record(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
  is_active: z.boolean()
});

export type MarketplaceAgent = z.infer<typeof MarketplaceAgentSchema>;

// Collection agent schema (existing format - mostly compatible)
export const CollectionAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  collection: z.string(),
  subsection: z.string(),
  version: z.string(),
  systemPrompt: z.string(),
  userPromptTemplate: z.string().optional(),
  examples: z.array(ExampleSchema).optional(),
  requiredTools: z.array(z.string()).optional(),
  optionalTools: z.array(z.string()).optional(),
  toolPermissions: z.array(ToolPermissionSchema).optional(),
  evaluator: EvaluatorSchema.optional(),
  mutator: MutatorSchema.optional(),
  optimizationHistory: z.array(z.any()).optional(),
  currentScore: z.number().optional(),
  optimizationThreshold: z.number().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  estimatedTokens: z.number().optional()
});

export type CollectionAgent = z.infer<typeof CollectionAgentSchema>;
