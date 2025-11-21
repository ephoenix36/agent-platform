import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OptimizationManager } from '../core/optimization-state.js';

export function registerOptimizationTools(server: McpServer, optimizationManager: OptimizationManager) {

  // ============================================================================
  // SKILL TOOLS
  // ============================================================================

  server.tool(
    "opt_create_skill",
    "Define a new reusable skill that agents can learn",
    {
      name: z.string(),
      description: z.string(),
      instructions: z.string().describe("The system prompt fragment for this skill"),
      tools: z.array(z.string()).describe("Tools required by this skill"),
      inputSchema: z.record(z.any()).optional().describe("JSON Schema for input"),
      outputSchema: z.record(z.any()).optional().describe("JSON Schema for output"),
      configuration: z.record(z.any()).optional().describe("Default configuration parameters"),
    },
    async ({ name, description, instructions, tools, inputSchema, outputSchema, configuration }) => {
      const skill = await optimizationManager.createSkill(
        name, 
        description, 
        instructions, 
        tools,
        inputSchema,
        outputSchema,
        configuration
      );
      return {
        content: [{
          type: "text",
          text: JSON.stringify(skill, null, 2)
        }]
      };
    }
  );

  server.tool(
    "opt_list_skills",
    "List all available skills",
    {},
    async () => {
      const skills = optimizationManager.listSkills();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(skills, null, 2)
        }]
      };
    }
  );

  server.tool(
    "opt_record_performance",
    "Record how well a skill performed in a project",
    {
      skillId: z.string(),
      projectId: z.string(),
      score: z.number().min(0).max(100),
      feedback: z.string(),
    },
    async ({ skillId, projectId, score, feedback }) => {
      await optimizationManager.recordSkillPerformance(skillId, projectId, score, feedback);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true })
        }]
      };
    }
  );

  server.tool(
    "opt_update_skill",
    "Update a skill's instructions (Mutation)",
    {
      skillId: z.string(),
      newInstructions: z.string(),
      version: z.string(),
    },
    async ({ skillId, newInstructions, version }) => {
      await optimizationManager.updateSkillInstructions(skillId, newInstructions, version);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true })
        }]
      };
    }
  );

  // ============================================================================
  // EVALUATOR TOOLS
  // ============================================================================

  server.tool(
    "opt_define_evaluator",
    "Define a standard way to evaluate a specific type of work",
    {
      name: z.string(),
      description: z.string(),
      criteria: z.array(z.string()),
      scoringLogic: z.string().describe("Instructions for the evaluator agent"),
    },
    async ({ name, description, criteria, scoringLogic }) => {
      const evaluator = await optimizationManager.defineEvaluator(name, description, criteria, scoringLogic);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(evaluator, null, 2)
        }]
      };
    }
  );
}
