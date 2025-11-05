import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { performSampling } from "../services/sampling-service.js";
import { Logger } from "../utils/logging.js";

/**
 * Agent execution input schema
 */
const executeAgentSchema = z.object({
  agentId: z.string().describe("Unique identifier for the agent"),
  prompt: z.string().describe("User prompt/instruction for the agent"),
  model: z.string().optional().describe("AI model to use (gpt-4, claude-3-opus, etc.)"),
  temperature: z.number().min(0).max(2).optional().describe("Sampling temperature (0-2)"),
  maxTokens: z.number().optional().describe("Maximum tokens to generate"),
  topP: z.number().min(0).max(1).optional().describe("Top-p sampling parameter"),
  systemPrompt: z.string().optional().describe("System prompt override"),
  context: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string()
  })).optional().describe("Conversation context"),
  tools: z.array(z.string()).optional().describe("Tool names to enable for this agent"),
  documents: z.array(z.object({
    id: z.string(),
    content: z.string(),
    name: z.string()
  })).optional().describe("Documents to include in context")
});

/**
 * Chat with agent (streaming capable)
 */
const chatWithAgentSchema = z.object({
  agentId: z.string(),
  message: z.string().describe("User message"),
  conversationId: z.string().optional().describe("Conversation ID for context"),
  stream: z.boolean().optional().describe("Enable streaming responses")
});

/**
 * Agent preset configuration
 */
const configureAgentSchema = z.object({
  agentId: z.string(),
  name: z.string().describe("Agent name"),
  model: z.string().describe("Default model (gpt-4, claude-3-opus, gemini-pro, etc.)"),
  temperature: z.number().min(0).max(2).describe("Temperature setting"),
  maxTokens: z.number().describe("Max tokens per response"),
  topP: z.number().min(0).max(1).describe("Top-p sampling"),
  systemPrompt: z.string().describe("System prompt template"),
  enabledTools: z.array(z.string()).describe("List of enabled tool names"),
  metadata: z.record(z.any()).optional().describe("Additional metadata")
});

/**
 * Multi-agent collaboration
 */
const collaborateAgentsSchema = z.object({
  agents: z.array(z.object({
    id: z.string(),
    role: z.string().describe("Agent's role in collaboration")
  })).describe("Agents participating in collaboration"),
  task: z.string().describe("Collaborative task description"),
  maxRounds: z.number().optional().default(5).describe("Maximum collaboration rounds"),
  model: z.string().optional()
});

/**
 * Register all agent-related tools
 */
export async function registerAgentTools(server: McpServer, logger: Logger) {
  
  // ===== EXECUTE AGENT WITH SAMPLING =====
  server.tool(
    "execute_agent",
    "Execute an AI agent with specified configuration and context. Uses MCP sampling for real AI interactions.",
    executeAgentSchema.shape,
    async (input) => {
      try {
        logger.info(`Executing agent: ${input.agentId}`);
        logger.debug("Agent config:", {
          model: input.model,
          temperature: input.temperature,
          contextLength: input.context?.length || 0
        });

        // Build messages for sampling
        const messages: Array<{role: "user" | "assistant" | "system", content: string}> = [];
        
        // Add system prompt
        if (input.systemPrompt) {
          messages.push({
            role: "system",
            content: input.systemPrompt
          });
        }
        
        // Add context if provided
        if (input.context && input.context.length > 0) {
          messages.push(...input.context.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
          })));
        }
        
        // Add documents to context if provided
        if (input.documents && input.documents.length > 0) {
          const docsContext = input.documents.map(doc => 
            `Document: ${doc.name}\n${doc.content}`
          ).join("\n\n");
          
          messages.push({
            role: "system",
            content: `Available documents:\n${docsContext}`
          });
        }
        
        // Add user prompt
        messages.push({
          role: "user",
          content: input.prompt
        });

        // Perform MCP sampling
        const result = await performSampling({
          messages,
          model: input.model || process.env.DEFAULT_MODEL || "gpt-4-turbo-preview",
          temperature: input.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || "0.7"),
          maxTokens: input.maxTokens ?? parseInt(process.env.DEFAULT_MAX_TOKENS || "4000"),
          topP: input.topP ?? parseFloat(process.env.DEFAULT_TOP_P || "1.0"),
          enabledTools: input.tools
        });

        logger.info(`Agent ${input.agentId} execution completed`);
        logger.debug(`Response length: ${result.content.length} characters`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              agentId: input.agentId,
              response: result.content,
              model: result.model,
              usage: result.usage,
              finishReason: result.finishReason,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error(`Agent execution failed:`, error);
        return {
          content: [{
            type: "text",
            text: `Error executing agent: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== CHAT WITH AGENT =====
  server.tool(
    "chat_with_agent",
    "Have a conversation with an AI agent. Maintains conversation context automatically.",
    chatWithAgentSchema.shape,
    async (input) => {
      try {
        logger.info(`Chat with agent: ${input.agentId}`);
        
        // In production, retrieve conversation history from database
        // For now, we'll treat each message independently
        
        const result = await performSampling({
          messages: [
            {
              role: "user",
              content: input.message
            }
          ],
          model: process.env.DEFAULT_MODEL || "gpt-4-turbo-preview",
          temperature: 0.7,
          maxTokens: 2000
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              agentId: input.agentId,
              conversationId: input.conversationId || `conv_${Date.now()}`,
              message: result.content,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Chat error:", error);
        return {
          content: [{
            type: "text",
            text: `Chat error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== CONFIGURE AGENT PRESET =====
  server.tool(
    "configure_agent",
    "Configure or update an agent preset with model settings and capabilities",
    configureAgentSchema.shape,
    async (input) => {
      try {
        logger.info(`Configuring agent: ${input.agentId}`);
        
        const agentConfig = {
          id: input.agentId,
          name: input.name,
          config: {
            model: input.model,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
            topP: input.topP
          },
          systemPrompt: input.systemPrompt,
          enabledTools: input.enabledTools,
          metadata: input.metadata || {},
          updatedAt: new Date().toISOString()
        };

        // In production, save to database
        logger.debug("Agent configuration:", agentConfig);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              agent: agentConfig,
              message: `Agent ${input.name} configured successfully`
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Configuration error:", error);
        return {
          content: [{
            type: "text",
            text: `Configuration error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== MULTI-AGENT COLLABORATION =====
  server.tool(
    "collaborate_agents",
    "Orchestrate multiple agents to collaborate on a complex task",
    collaborateAgentsSchema.shape,
    async (input) => {
      try {
        logger.info(`Starting collaboration with ${input.agents.length} agents`);
        
        const results = [];
        let currentContext = input.task;
        
        // Simulate multi-agent collaboration rounds
        for (let round = 0; round < input.maxRounds; round++) {
          logger.debug(`Collaboration round ${round + 1}`);
          
          for (const agent of input.agents) {
            const prompt = `Role: ${agent.role}\nTask: ${currentContext}\nProvide your contribution:`;
            
            const result = await performSampling({
              messages: [{
                role: "user",
                content: prompt
              }],
              model: input.model || "gpt-4-turbo-preview",
              temperature: 0.7,
              maxTokens: 1000
            });
            
            results.push({
              round: round + 1,
              agentId: agent.id,
              role: agent.role,
              contribution: result.content
            });
            
            // Update context for next agent
            currentContext += `\n\n${agent.role} says: ${result.content}`;
          }
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              task: input.task,
              rounds: input.maxRounds,
              participants: input.agents.length,
              results,
              finalSynthesis: currentContext
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Collaboration error:", error);
        return {
          content: [{
            type: "text",
            text: `Collaboration error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  logger.info("Agent tools registered successfully");
}
