import { z } from 'zod';

export const WorkflowStepSchema = z.object({
  id: z.string(),
  type: z.enum(["agent", "agent_team", "transform", "human_gate", "loop"]),
  description: z.string(),
  agentId: z.string().optional(),
  teamAgents: z.array(z.string()).optional(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional()
});

export const WorkflowEvaluatorSchema = z.object({
  successCriteria: z.array(
    z.object({
      name: z.string(),
      weight: z.number().min(0).max(1)
    })
  ).optional()
});

export const WorkflowHooksSchema = z.object({
  beforeExecution: z.array(z.string()).optional(),
  afterExecution: z.array(z.string()).optional(),
  onError: z.array(z.string()).optional()
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  version: z.string(),
  description: z.string(),
  triggers: z.array(z.string()),
  valueScore: z.number(),
  complexity: z.enum(["low", "medium", "high"]),
  status: z.string(),
  agentsNeeded: z.array(z.string()),
  skillsNeeded: z.array(z.string()),
  dependencies: z.array(z.string()),
  source: z.object({ origin: z.string(), attribution: z.string().optional() }).optional(),
  steps: z.array(WorkflowStepSchema),
  evaluator: WorkflowEvaluatorSchema.optional(),
  hooks: WorkflowHooksSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Workflow = z.infer<typeof WorkflowSchema>;

export function validateWorkflow(data: unknown) {
  return WorkflowSchema.parse(data);
}
