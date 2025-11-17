import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAvailableModels } from "../services/sampling-service.js";
import { Logger } from "../utils/logging.js";
import { withHooks } from "../utils/hooked-registry.js";

/**
 * Intelligent model selection based on task requirements
 */
const selectModelSchema = z.object({
  taskType: z.enum([
    "creative_writing",
    "code_generation",
    "data_analysis",
    "research",
    "conversation",
    "reasoning",
    "vision",
    "general"
  ]).describe("Type of task to perform"),
  complexity: z.enum(["low", "medium", "high"]).describe("Task complexity"),
  budget: z.enum(["low", "medium", "high"]).optional().describe("Budget constraints"),
  speed: z.enum(["fast", "balanced", "quality"]).optional().describe("Speed vs quality tradeoff"),
  contextLength: z.number().optional().describe("Required context window size")
});

/**
 * Optimize model parameters for specific use case
 */
const optimizeParametersSchema = z.object({
  model: z.string().describe("Model ID"),
  useCase: z.enum([
    "chatbot",
    "code_assistant",
    "creative_writer",
    "analyst",
    "researcher",
    "teacher",
    "custom"
  ]),
  customRequirements: z.string().optional().describe("Custom optimization requirements")
});

/**
 * Compare different models for a task
 */
const compareModelsSchema = z.object({
  models: z.array(z.string()).describe("Model IDs to compare"),
  testPrompt: z.string().describe("Prompt to test with"),
  criteria: z.array(z.enum([
    "quality",
    "speed",
    "cost",
    "creativity",
    "accuracy"
  ])).describe("Comparison criteria")
});

/**
 * Register model selection and optimization tools
 */
export async function registerModelTools(server: McpServer, logger: Logger) {
  
  // ===== LIST AVAILABLE MODELS =====
  server.tool(
    "list_models",
    "List all available AI models with their capabilities and specifications",
    {},
    withHooks("list_models", async () => {
      try {
        const models = await getAvailableModels();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: models.length,
              models: models.map(m => ({
                id: m.id,
                provider: m.provider,
                name: m.name,
                contextWindow: m.contextWindow,
                recommended: m.contextWindow > 100000 ? "Large context tasks" :
                           m.id.includes("turbo") ? "Fast responses" :
                           m.id.includes("opus") ? "Complex reasoning" :
                           "General purpose"
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list models:", error);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true
        };
      }
    })
  );

  // ===== INTELLIGENT MODEL SELECTION =====
  server.tool(
    "select_model",
    "Intelligently select the best model for a specific task based on requirements",
    selectModelSchema.shape,
    withHooks("select_model", async (input) => {
      try {
        logger.info(`Selecting model for ${input.taskType} task`);
        
        const models = await getAvailableModels();
        let recommendedModel = "claude-sonnet-4.5-haiku";
        let reasoning = "";

        // Selection logic based on task type and requirements
        if (input.taskType === "creative_writing" || input.taskType === "conversation") {
          // High temperature, creative models
          if (input.complexity === "high") {
            recommendedModel = "claude-3-opus-20240229";
            reasoning = "Claude 3 Opus excels at creative writing with nuanced understanding";
          } else {
            recommendedModel = "gpt-5";
            reasoning = "GPT-5 provides excellent creative output with advanced reasoning";
          }
        } else if (input.taskType === "code_generation") {
          // Precise, structured output
          if (input.speed === "fast") {
            recommendedModel = "grok-code-fast";
            reasoning = "Grok Code Fast offers rapid code generation optimized for speed";
          } else {
            recommendedModel = "claude-4.5-sonnet";
            reasoning = "Claude 4.5 Sonnet provides superior code generation with exceptional accuracy";
          }
        } else if (input.taskType === "reasoning") {
          recommendedModel = "gpt-5";
          reasoning = "GPT-5 is optimized for complex reasoning tasks";
        } else if (input.taskType === "research" || input.taskType === "data_analysis") {
          if (input.contextLength && input.contextLength > 100000) {
            recommendedModel = "gemini-2.5-pro";
            reasoning = "Gemini 2.5 Pro has 2M context window ideal for analyzing extremely large documents";
          } else {
            recommendedModel = "gpt-5";
            reasoning = "GPT-5 balances analytical capability with efficiency";
          }
        } else if (input.taskType === "vision") {
          recommendedModel = "gpt-4-vision-preview";
          reasoning = "GPT-4 Vision is required for image understanding tasks";
        }

        // Adjust for budget if specified
        if (input.budget === "low" && (recommendedModel.includes("5") || recommendedModel.includes("opus"))) {
          recommendedModel = "gpt-5-mini";
          reasoning += " (adjusted for budget constraints)";
        }

        // Get model details
        const modelDetails = models.find(m => m.id === recommendedModel);

        // Recommend optimal parameters
        const parameters = {
          temperature: input.taskType === "creative_writing" ? 0.9 :
                      input.taskType === "code_generation" ? 0.3 :
                      input.taskType === "reasoning" ? 0.1 :
                      0.7,
          topP: input.taskType === "creative_writing" ? 0.95 :
                input.taskType === "code_generation" ? 0.9 :
                0.9,
          maxTokens: input.complexity === "high" ? 4000 :
                    input.complexity === "medium" ? 2000 :
                    1000
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              recommended: recommendedModel,
              reasoning,
              modelDetails,
              parameters,
              alternatives: models
                .filter(m => m.id !== recommendedModel)
                .slice(0, 3)
                .map(m => ({ id: m.id, name: m.name, provider: m.provider }))
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Model selection failed:", error);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true
        };
      }
    })
  );

  // ===== OPTIMIZE PARAMETERS =====
  server.tool(
    "optimize_parameters",
    "Get optimal temperature, top_p, and other parameters for a specific model and use case",
    optimizeParametersSchema.shape,
    withHooks("optimize_parameters", async (input) => {
      try {
        let config: any = {
          model: input.model,
          useCase: input.useCase
        };

        // Define optimal parameters per use case
        switch (input.useCase) {
          case "chatbot":
            config = {
              ...config,
              temperature: 0.8,
              topP: 0.9,
              maxTokens: 1500,
              presencePenalty: 0.6,
              frequencyPenalty: 0.3,
              reasoning: "Conversational with variety, avoiding repetition"
            };
            break;
          
          case "code_assistant":
            config = {
              ...config,
              temperature: 0.2,
              topP: 0.95,
              maxTokens: 2000,
              presencePenalty: 0,
              frequencyPenalty: 0,
              reasoning: "Low temperature for precise, deterministic code generation"
            };
            break;
          
          case "creative_writer":
            config = {
              ...config,
              temperature: 1.0,
              topP: 0.95,
              maxTokens: 4000,
              presencePenalty: 0.8,
              frequencyPenalty: 0.5,
              reasoning: "High temperature and penalties for creative, diverse output"
            };
            break;
          
          case "analyst":
            config = {
              ...config,
              temperature: 0.3,
              topP: 0.9,
              maxTokens: 3000,
              presencePenalty: 0.1,
              frequencyPenalty: 0.1,
              reasoning: "Low temperature for factual, analytical responses"
            };
            break;
          
          case "researcher":
            config = {
              ...config,
              temperature: 0.4,
              topP: 0.92,
              maxTokens: 4000,
              presencePenalty: 0.2,
              frequencyPenalty: 0.2,
              reasoning: "Balanced for thorough, accurate research synthesis"
            };
            break;
          
          case "teacher":
            config = {
              ...config,
              temperature: 0.7,
              topP: 0.9,
              maxTokens: 2000,
              presencePenalty: 0.4,
              frequencyPenalty: 0.3,
              reasoning: "Balanced for clear, pedagogical explanations"
            };
            break;
          
          default:
            config = {
              ...config,
              temperature: 0.7,
              topP: 1.0,
              maxTokens: 2000,
              presencePenalty: 0,
              frequencyPenalty: 0,
              reasoning: "Default balanced parameters"
            };
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify(config, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Parameter optimization failed:", error);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true
        };
      }
    })
  );

  logger.info("Model tools registered successfully");
}
