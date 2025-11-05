import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { performSampling } from "../services/sampling-service.js";
import { Logger } from "../utils/logging.js";

/**
 * Execute workflow
 */
const executeWorkflowSchema = z.object({
  workflowId: z.string(),
  name: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    type: z.enum(["agent", "api", "condition", "transform", "delay"]),
    config: z.record(z.any())
  })),
  input: z.any(),
  context: z.record(z.any()).optional()
});

/**
 * Create workflow template
 */
const createWorkflowSchema = z.object({
  name: z.string(),
  description: z.string(),
  trigger: z.enum(["manual", "schedule", "webhook", "event"]),
  steps: z.array(z.object({
    name: z.string(),
    type: z.string(),
    config: z.record(z.any())
  }))
});

/**
 * Register workflow orchestration tools
 */
export async function registerWorkflowTools(server: McpServer, logger: Logger) {
  
  // ===== EXECUTE WORKFLOW =====
  server.tool(
    "execute_workflow",
    "Execute a multi-step workflow with agents, API calls, and transformations",
    executeWorkflowSchema.shape,
    async (input) => {
      try {
        logger.info(`Executing workflow: ${input.name}`);
        
        const results: any[] = [];
        let currentData = input.input;
        const context = input.context || {};

        for (const step of input.steps) {
          logger.debug(`Executing step: ${step.id} (${step.type})`);
          
          let stepResult: any;

          switch (step.type) {
            case "agent":
              // Execute agent step
              stepResult = await performSampling({
                messages: [{
                  role: "user",
                  content: step.config.prompt || currentData
                }],
                model: step.config.model || "gpt-4-turbo-preview",
                temperature: step.config.temperature || 0.7,
                maxTokens: step.config.maxTokens || 2000
              });
              currentData = stepResult.content;
              break;

            case "api":
              // API call step (placeholder - would integrate with api-tools)
              stepResult = {
                message: "API call executed",
                endpoint: step.config.url
              };
              break;

            case "condition":
              // Conditional branching
              const condition = step.config.condition;
              const check = eval(condition); // In production, use safer evaluation
              stepResult = {
                conditionMet: check,
                branch: check ? "true" : "false"
              };
              break;

            case "transform":
              // Data transformation
              const transformFn = step.config.transform;
              currentData = JSON.parse(transformFn); // In production, use safer transform
              stepResult = { transformed: true };
              break;

            case "delay":
              // Add delay
              await new Promise(resolve => setTimeout(resolve, step.config.ms || 1000));
              stepResult = { delayed: step.config.ms || 1000 };
              break;

            default:
              stepResult = { error: `Unknown step type: ${step.type}` };
          }

          results.push({
            stepId: step.id,
            type: step.type,
            result: stepResult,
            timestamp: new Date().toISOString()
          });
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              workflowId: input.workflowId,
              name: input.name,
              status: "completed",
              steps: results,
              finalOutput: currentData,
              executionTime: new Date().toISOString()
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Workflow execution failed:", error);
        return {
          content: [{
            type: "text",
            text: `Workflow error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== CREATE WORKFLOW TEMPLATE =====
  server.tool(
    "create_workflow",
    "Create a reusable workflow template",
    createWorkflowSchema.shape,
    async (input) => {
      try {
        const workflow = {
          id: `wf_${Date.now()}`,
          name: input.name,
          description: input.description,
          trigger: input.trigger,
          steps: input.steps,
          createdAt: new Date().toISOString()
        };

        // In production, save to database
        logger.info(`Created workflow: ${workflow.id}`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              workflow
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Workflow creation failed:", error);
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== WORKFLOW TEMPLATES =====
  server.tool(
    "get_workflow_templates",
    "Get pre-built workflow templates for common use cases",
    {},
    async () => {
      const templates = [
        {
          id: "content_generation",
          name: "Content Generation Pipeline",
          description: "Research → Outline → Write → Edit → Publish",
          steps: [
            { type: "agent", name: "Research", config: { prompt: "Research topic" } },
            { type: "agent", name: "Outline", config: { prompt: "Create outline" } },
            { type: "agent", name: "Write", config: { prompt: "Write content" } },
            { type: "agent", name: "Edit", config: { prompt: "Edit and polish" } },
            { type: "api", name: "Publish", config: { endpoint: "/publish" } }
          ]
        },
        {
          id: "customer_support",
          name: "Customer Support Automation",
          description: "Receive → Classify → Route → Respond → Escalate",
          steps: [
            { type: "agent", name: "Classify", config: { prompt: "Classify ticket" } },
            { type: "condition", name: "Check Priority", config: { condition: "priority === 'high'" } },
            { type: "agent", name: "Generate Response", config: { prompt: "Draft response" } },
            { type: "api", name: "Send Email", config: { endpoint: "/send-email" } }
          ]
        },
        {
          id: "data_analysis",
          name: "Data Analysis Workflow",
          description: "Fetch → Clean → Analyze → Visualize → Report",
          steps: [
            { type: "api", name: "Fetch Data", config: { endpoint: "/data" } },
            { type: "transform", name: "Clean Data", config: { transform: "cleanData()" } },
            { type: "agent", name: "Analyze", config: { prompt: "Analyze data" } },
            { type: "api", name: "Create Viz", config: { endpoint: "/visualize" } },
            { type: "agent", name: "Report", config: { prompt: "Generate report" } }
          ]
        }
      ];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ templates }, null, 2)
        }]
      };
    }
  );

  logger.info("Workflow tools registered successfully");
}
