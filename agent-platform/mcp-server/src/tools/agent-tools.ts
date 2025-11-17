import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { performSampling } from "../services/sampling-service.js";
import { Logger } from "../utils/logging.js";
import { registerWaitHandle, completeWaitHandle, failWaitHandle } from "./wait-tools.js";
import { withHooks } from "../utils/hooked-registry.js";
import { getToolRegistry } from "../services/tool-registry.js";
import { getSkillsService } from "../services/service-registry.js";
import { getUsageTracker } from "../services/usage-tracker.js";
import { getBudgetManager } from "../services/budget-manager.js";
import { 
  registerAgent, 
  getAgent, 
  hasAgent, 
  listAgents, 
  deleteAgent,
  type AgentConfig 
} from "../services/agent-registry.js";

/**
 * Helper: Resolve agent configuration (configured or inline)
 */
function resolveAgentConfig(agentSpec: any, defaultModel?: string): {
  id: string;
  role: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  enabledTools?: string[];
  toolkits?: string[];
  skills?: string[];
} {
  // Check if this references a configured agent
  if (hasAgent(agentSpec.id)) {
    const configured = getAgent(agentSpec.id)!;
    // Merge with any overrides provided in agentSpec
    return {
      id: agentSpec.id,
      role: agentSpec.role || configured.name,
      model: agentSpec.model || configured.model || defaultModel,
      temperature: agentSpec.temperature ?? configured.temperature,
      maxTokens: agentSpec.maxTokens ?? configured.maxTokens,
      systemPrompt: agentSpec.systemPrompt || configured.systemPrompt,
      enabledTools: configured.enabledTools,
      toolkits: configured.toolkits,
      skills: configured.skills
    };
  }
  
  // Use inline configuration
  return {
    id: agentSpec.id,
    role: agentSpec.role || agentSpec.id,
    model: agentSpec.model || defaultModel,
    temperature: agentSpec.temperature,
    maxTokens: agentSpec.maxTokens,
    systemPrompt: agentSpec.systemPrompt
  };
}

/**
 * Helper: Filter output fields
 */
function filterOutputFields(data: any, fields?: string[], verbose: boolean = true): any {
  if (!fields || fields.length === 0) {
    return verbose ? data : {
      agentId: data.agentId,
      contribution: data.contribution
    };
  }
  
  const filtered: any = {};
  for (const field of fields) {
    if (field in data) {
      filtered[field] = data[field];
    }
  }
  return filtered;
}

/**
 * Helper: Evaluate condition
 */
function evaluateCondition(check: string, context: string, result: any): boolean {
  const lowerCheck = check.toLowerCase();
  const lowerContext = context.toLowerCase();
  const lowerContent = result.content?.toLowerCase() || '';
  
  // Simple condition evaluation
  if (lowerCheck.includes('contains') && lowerCheck.includes('error')) {
    return lowerContext.includes('error') || lowerContent.includes('error');
  }
  if (lowerCheck.includes('exceeds') && lowerCheck.includes('threshold')) {
    const tokens = result.usage?.totalTokens || 0;
    return tokens > 2000;
  }
  if (lowerCheck.includes('empty') || lowerCheck.includes('no response')) {
    return !result.content || result.content.trim().length === 0;
  }
  if (lowerCheck.includes('success')) {
    return !lowerContent.includes('error') && !lowerContent.includes('fail');
  }
  
  // Default: evaluate as general text match
  return lowerContext.includes(lowerCheck) || lowerContent.includes(lowerCheck);
}

/**
 * Agent execution input schema
 */
const executeAgentSchema = z.object({
  agentId: z.string().describe("Unique identifier for the agent"),
  prompt: z.string().describe("User prompt/instruction for the agent"),
  model: z.string().optional().describe("AI model to use (gpt-5, claude-4.5-sonnet, claude-sonnet-4.5-haiku, gemini-2.5-pro, grok-code-fast, etc.)"),
  temperature: z.number().min(0).max(2).optional().describe("Sampling temperature (0-2)"),
  maxTokens: z.number().optional().describe("Maximum tokens to generate"),
  topP: z.number().min(0).max(1).optional().describe("Top-p sampling parameter"),
  systemPrompt: z.string().optional().describe("System prompt override"),
  context: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string()
  })).optional().describe("Conversation context"),
  
  // Enhanced tool/skill configuration
  tools: z.array(z.string()).optional().describe("Specific tool names to enable for this agent"),
  toolkits: z.array(z.string()).optional().describe("Toolkit IDs to enable for this agent"),
  skills: z.array(z.string()).optional().describe("Skill IDs to use for this execution"),
  
  documents: z.array(z.object({
    id: z.string(),
    content: z.string(),
    name: z.string()
  })).optional().describe("Documents to include in context"),
  
  // Output control
  outputFields: z.array(z.string()).optional().describe("Specific fields to include in output (e.g., ['response', 'usage'])"),
  verbose: z.boolean().optional().default(true).describe("Include full details or just essential info")
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
  
  // New: Support for skills, toolkits, and tools
  skills: z.array(z.string()).optional().describe("Skill IDs to attach to this agent"),
  toolkits: z.array(z.string()).optional().describe("Toolkit IDs to enable for this agent"),
  enabledTools: z.array(z.string()).optional().describe("Specific tool names to enable"),
  
  // Skill overrides
  skillOverrides: z.record(z.object({
    rules: z.record(z.boolean()).optional(),
    tools: z.array(z.string()).optional(),
    systemPrompt: z.string().optional()
  })).optional().describe("Overrides for attached skills (skillId -> overrides)"),
  
  metadata: z.record(z.any()).optional().describe("Additional metadata")
});

/**
 * Multi-agent collaboration (Enhanced)
 */
const collaborateAgentsSchema = z.object({
  agents: z.array(z.object({
    id: z.string().describe("Agent ID (can reference a configured agent or be inline)"),
    role: z.string().optional().describe("Agent's role in collaboration (required if not using configured agent)"),
    model: z.string().optional().describe("Model for this agent"),
    temperature: z.number().optional().describe("Temperature for this agent"),
    maxTokens: z.number().optional().describe("Max tokens for this agent"),
    systemPrompt: z.string().optional().describe("Custom system prompt for this agent")
  })).describe("Agents participating in collaboration"),
  task: z.string().describe("Collaborative task description"),
  
  // Orchestration options
  mode: z.enum(["linear", "parallel", "rounds", "intelligent"]).optional().default("linear")
    .describe("Orchestration mode: linear (sequential), parallel (all at once), rounds (multiple passes), intelligent (AI selects participants)"),
  maxRounds: z.number().optional().default(5).describe("Maximum collaboration rounds (for rounds/intelligent mode)"),
  intelligentSelection: z.object({
    poolSize: z.number().describe("Number of agents to select from pool each round"),
    criteria: z.string().describe("Selection criteria for intelligent mode")
  }).optional().describe("Config for intelligent agent selection"),
  
  // Conditional logic
  conditions: z.array(z.object({
    check: z.string().describe("Condition to evaluate (e.g., 'contains error', 'exceeds threshold')"),
    action: z.enum(["continue", "stop", "branch", "repeat"]).describe("Action if condition is met"),
    branchTo: z.string().optional().describe("Agent ID to branch to if action is 'branch'")
  })).optional().describe("Conditional logic for flow control"),
  
  // Output control
  outputFields: z.array(z.string()).optional()
    .describe("Specific fields to include in output (e.g., ['contribution', 'usage']). Omit for all fields."),
  verbose: z.boolean().optional().default(true).describe("Include full details or just essential info"),
  
  // Model config
  model: z.string().optional().describe("Default model for all agents"),
  forceModel: z.boolean().optional().default(false).describe("Force all agents to use the default model (set to true to use MCP sampling without API keys)")
});

/**
 * Async multi-agent collaboration (Enhanced)
 */
const collaborateAgentsAsyncSchema = z.object({
  agents: z.array(z.object({
    id: z.string().describe("Agent ID (can reference a configured agent or be inline)"),
    role: z.string().optional().describe("Agent's role in collaboration"),
    model: z.string().optional().describe("Model for this agent"),
    temperature: z.number().optional().describe("Temperature for this agent"),
    maxTokens: z.number().optional().describe("Max tokens for this agent"),
    systemPrompt: z.string().optional().describe("Custom system prompt for this agent")
  })).describe("Agents participating in collaboration"),
  task: z.string().describe("Collaborative task description"),
  
  // Orchestration options
  mode: z.enum(["linear", "parallel", "rounds", "intelligent"]).optional().default("linear")
    .describe("Orchestration mode"),
  maxRounds: z.number().optional().default(5).describe("Maximum collaboration rounds"),
  intelligentSelection: z.object({
    poolSize: z.number().describe("Number of agents to select each round"),
    criteria: z.string().describe("Selection criteria")
  }).optional().describe("Config for intelligent agent selection"),
  
  // Conditional logic
  conditions: z.array(z.object({
    check: z.string().describe("Condition to evaluate"),
    action: z.enum(["continue", "stop", "branch", "repeat"]).describe("Action if condition is met"),
    branchTo: z.string().optional().describe("Agent ID to branch to")
  })).optional().describe("Conditional logic for flow control"),
  
  // Output control
  outputFields: z.array(z.string()).optional().describe("Specific fields to include in output"),
  verbose: z.boolean().optional().default(true).describe("Include full details"),
  
  // Model config
  model: z.string().optional().describe("Default model for all agents"),
  forceModel: z.boolean().optional().default(false).describe("Force MCP sampling (set to true to use MCP without API keys)"),
  
  timeoutMs: z.number().optional().describe("Timeout in milliseconds"),
  continuable: z.boolean().optional().default(true).describe("Allow continuation if timeout is reached before completion")
});

/**
 * Execute agent asynchronously (returns wait handle)
 */
const executeAgentAsyncSchema = z.object({
  agentId: z.string().describe("Unique identifier for the agent"),
  prompt: z.string().describe("User prompt/instruction for the agent"),
  model: z.string().optional().describe("AI model to use (gpt-5, claude-4.5-sonnet, claude-sonnet-4.5-haiku, gemini-2.5-pro, grok-code-fast, etc.)"),
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
  })).optional().describe("Documents to include in context"),
  timeoutMs: z.number().optional().describe("Timeout in milliseconds")
});

/**
 * Register all agent-related tools
 */
export async function registerAgentTools(server: McpServer, logger: Logger) {
  // Get tool registry for agent tool access
  let toolRegistry;
  try {
    toolRegistry = getToolRegistry();
  } catch (error) {
    logger.warn("Tool registry not initialized, tools will not be available for agent use");
  }
  
  // ===== EXECUTE AGENT WITH SAMPLING =====
  server.tool(
    "execute_agent",
    "Execute an AI agent with specified configuration and context. Uses MCP sampling for real AI interactions.",
    executeAgentSchema.shape,
    withHooks("execute_agent", async (input) => {
      try {
        logger.info(`Executing agent: ${input.agentId}`);
        logger.debug("Agent config:", {
          model: input.model,
          temperature: input.temperature,
          contextLength: input.context?.length || 0,
          skills: input.skills,
          toolkits: input.toolkits,
          tools: input.tools
        });

        // Process skills if provided
        let skillInstructions = "";
        let skillRules: string[] = [];
        let skillTools: string[] = [];
        
        if (input.skills && input.skills.length > 0) {
          try {
            const skillsService = getSkillsService();
            
            // Compose all requested skills
            const composition = await skillsService.composeSkills(input.skills);
            
            // Extract skill instructions
            skillInstructions = `
# Skills Guidance

${composition.instructions.overview}

## Usage
${composition.instructions.usage}

## Best Practices
${composition.instructions.bestPractices?.map(bp => `- ${bp}`).join('\n') || ''}

## Warnings
${composition.instructions.warnings?.map(w => `- ⚠️ ${w}`).join('\n') || ''}
`;
            
            // Extract active rules
            skillRules = composition.rules
              .filter(r => r.enabled !== false)
              .sort((a, b) => (b.priority || 0) - (a.priority || 0))
              .map(r => `[Rule ${r.id}] ${r.description}`);
            
            // Add skills-defined tools
            if (composition.tools && composition.tools.length > 0) {
              skillTools.push(...composition.tools);
            }
            
            // Extract system prompt from composition
            if (composition.systemPrompt) {
              skillInstructions += `\n\n# System Instructions\n${composition.systemPrompt}`;
            }
            
            logger.info(`Loaded ${input.skills.length} skills for agent execution`);
            logger.debug(`Skills provide ${skillTools.length} tools, ${skillRules.length} rules`);
          } catch (error) {
            logger.error("Failed to load skills:", error);
            // Continue execution without skills
          }
        }

        // Build messages for sampling
        const messages: Array<{role: "user" | "assistant" | "system", content: string}> = [];
        
        // Add skill instructions first (if any)
        if (skillInstructions) {
          messages.push({
            role: "system",
            content: skillInstructions
          });
        }
        
        // Add skill rules
        if (skillRules.length > 0) {
          messages.push({
            role: "system",
            content: `# Rules to Follow\n${skillRules.join('\n')}`
          });
        }
        
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

        // Merge tools from skills and explicit tool list
        const enabledTools = [
          ...(input.tools || []),
          ...skillTools
        ];

        // Check budgets and rate limits before execution
        const budgetManager = getBudgetManager(logger);
        const estimatedTokens = input.maxTokens || 4000;
        const tracker = getUsageTracker(logger);
        const modelUsed = input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku";
        const estimatedCost = tracker.calculateCost(
          modelUsed,
          Math.round(estimatedTokens * 0.4),  // Rough estimate: 40% prompt, 60% completion
          Math.round(estimatedTokens * 0.6)
        );

        // Check token budget
        const tokenCheck = await budgetManager.checkBudget(input.agentId, 'token', estimatedTokens);
        if (!tokenCheck.allowed) {
          throw new Error(`Token budget exceeded: ${tokenCheck.reason}`);
        }

        // Check cost budget
        const costCheck = await budgetManager.checkBudget(input.agentId, 'cost', estimatedCost);
        if (!costCheck.allowed) {
          throw new Error(`Cost budget exceeded: ${costCheck.reason}`);
        }

        // Check call budget
        const callCheck = await budgetManager.checkBudget(input.agentId, 'calls', 1);
        if (!callCheck.allowed) {
          throw new Error(`Call budget exceeded: ${callCheck.reason}`);
        }

        // Check rate limits
        const rateLimitCheck = await budgetManager.checkRateLimit(input.agentId);
        if (!rateLimitCheck.allowed) {
          throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}. Retry after ${rateLimitCheck.retryAfter}s`);
        }

        // Record call for rate limiting
        await budgetManager.recordCall(input.agentId);

        // Perform MCP sampling
        const startTime = Date.now();
        
        const result = await performSampling({
          messages,
          model: modelUsed,
          temperature: input.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || "0.7"),
          maxTokens: input.maxTokens ?? parseInt(process.env.DEFAULT_MAX_TOKENS || "4000"),
          topP: input.topP ?? parseFloat(process.env.DEFAULT_TOP_P || "1.0"),
          enabledTools: enabledTools.length > 0 ? enabledTools : undefined,
          includeContext: enabledTools.length > 0 ? "thisServer" : undefined
        });
        
        const duration = Date.now() - startTime;

        logger.info(`Agent ${input.agentId} execution completed`);
        logger.debug(`Response length: ${result.content.length} characters`);
        
        // Track usage
        try {
          const tracker = getUsageTracker(logger);
          const actualCost = tracker.calculateCost(result.model, result.usage.promptTokens, result.usage.completionTokens);
          
          await tracker.trackExecution({
            id: `${input.agentId}-${Date.now()}`,
            timestamp: new Date(),
            agentId: input.agentId,
            model: result.model,
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
            cost: actualCost,
            duration,
            success: true,
            metadata: {
              skills: input.skills,
              toolkits: input.toolkits,
              tools: input.tools,
              toolsAvailable: enabledTools.length
            }
          });

          // Consume budgets after successful execution
          const budgetManager = getBudgetManager(logger);
          await budgetManager.consumeBudget(input.agentId, 'token', result.usage.totalTokens);
          await budgetManager.consumeBudget(input.agentId, 'cost', actualCost);
          await budgetManager.consumeBudget(input.agentId, 'calls', 1);
        } catch (trackingError: any) {
          logger.warn(`Failed to track usage/budget: ${trackingError.message}`);
          // Don't fail execution if tracking fails
        }

        const fullResult = {
          agentId: input.agentId,
          response: result.content,
          model: result.model,
          usage: result.usage,
          finishReason: result.finishReason,
          skillsUsed: input.skills,
          toolsAvailable: enabledTools.length,
          timestamp: new Date().toISOString()
        };
        
        // Apply output filtering
        const outputResult = filterOutputFields(fullResult, input.outputFields, input.verbose ?? true);

        return {
          content: [{
            type: "text",
            text: JSON.stringify(outputResult, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error(`Agent execution failed:`, error);
        
        // Track failed execution
        try {
          const tracker = getUsageTracker(logger);
          await tracker.trackExecution({
            id: `${input.agentId}-${Date.now()}-error`,
            timestamp: new Date(),
            agentId: input.agentId,
            model: input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku",
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            cost: 0,
            duration: 0,
            success: false,
            error: error.message,
            metadata: {
              skills: input.skills,
              toolkits: input.toolkits,
              tools: input.tools
            }
          });
        } catch (trackingError: any) {
          logger.warn(`Failed to track error: ${trackingError.message}`);
        }
        
        return {
          content: [{
            type: "text",
            text: `Error executing agent: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // Note: Tools are automatically available for agent use through the sampling mechanism
  // The tool registry can optionally be used for advanced tool discovery and execution

  // ===== EXECUTE AGENT ASYNCHRONOUSLY =====
  server.tool(
    "execute_agent_async",
    "Execute an AI agent asynchronously and return immediately with a wait handle. Use wait_for to retrieve results later.",
    executeAgentAsyncSchema.shape,
    withHooks("execute_agent_async", async (input) => {
      try {
        const handleId = `agent_${input.agentId}_${Date.now()}`;
        
        // Create wait handle
        const handle = registerWaitHandle(
          handleId,
          'agent',
          {
            agentId: input.agentId,
            model: input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku",
            prompt: input.prompt.substring(0, 100) + (input.prompt.length > 100 ? '...' : '')
          },
          input.timeoutMs
        );
        
        logger.info(`Started async agent execution: ${input.agentId} (handle: ${handleId})`);
        
        // Execute agent in background
        (async () => {
          try {
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
              model: input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku",
              temperature: input.temperature ?? parseFloat(process.env.DEFAULT_TEMPERATURE || "0.7"),
              maxTokens: input.maxTokens ?? parseInt(process.env.DEFAULT_MAX_TOKENS || "4000"),
              topP: input.topP ?? parseFloat(process.env.DEFAULT_TOP_P || "1.0"),
              enabledTools: input.tools,
              includeContext: input.tools && input.tools.length > 0 ? "thisServer" : undefined
            });

            logger.info(`Async agent ${input.agentId} execution completed (handle: ${handleId})`);
            
            // Complete wait handle with result
            completeWaitHandle(handleId, {
              agentId: input.agentId,
              response: result.content,
              model: result.model,
              usage: result.usage,
              finishReason: result.finishReason,
              timestamp: new Date().toISOString()
            });
          } catch (error: any) {
            logger.error(`Async agent ${input.agentId} execution failed (handle: ${handleId}):`, error);
            failWaitHandle(handleId, error.message);
          }
        })();
        
        // Return wait handle immediately
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              async: true,
              handleId: handle.id,
              agentId: input.agentId,
              status: handle.status,
              message: "Agent execution started asynchronously. Use wait_for tool to retrieve results.",
              startTime: handle.startTime.toISOString(),
              timeout: input.timeoutMs
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error(`Async agent execution failed:`, error);
        return {
          content: [{
            type: "text",
            text: `Error executing agent asynchronously: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // ===== CHAT WITH AGENT =====
  server.tool(
    "chat_with_agent",
    "Have a conversation with an AI agent. Maintains conversation context automatically.",
    chatWithAgentSchema.shape,
    withHooks("chat_with_agent", async (input) => {
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
          model: process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku",
          temperature: 0.7,
          maxTokens: 2000,
          includeContext: "thisServer" // Enable tool access for chat agents
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
    })
  );

  // ===== CONFIGURE AGENT PRESET =====
  server.tool(
    "configure_agent",
    "Configure or update an agent preset with model settings and capabilities",
    configureAgentSchema.shape,
    withHooks("configure_agent", async (input) => {
      try {
        logger.info(`Configuring agent: ${input.agentId}`);
        
        const now = new Date().toISOString();
        const agentConfig: AgentConfig = {
          id: input.agentId,
          name: input.name,
          model: input.model,
          temperature: input.temperature,
          maxTokens: input.maxTokens,
          topP: input.topP,
          systemPrompt: input.systemPrompt,
          enabledTools: input.enabledTools,
          toolkits: input.toolkits,
          skills: input.skills,
          metadata: input.metadata || {},
          createdAt: hasAgent(input.agentId) ? getAgent(input.agentId)!.createdAt : now,
          updatedAt: now
        };

        // Register agent in registry
        registerAgent(agentConfig);
        logger.debug("Agent registered:", agentConfig);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              agent: {
                id: agentConfig.id,
                name: agentConfig.name,
                config: {
                  model: agentConfig.model,
                  temperature: agentConfig.temperature,
                  maxTokens: agentConfig.maxTokens,
                  topP: agentConfig.topP
                },
                systemPrompt: agentConfig.systemPrompt,
                enabledTools: agentConfig.enabledTools,
                toolkits: agentConfig.toolkits,
                skills: agentConfig.skills,
                metadata: agentConfig.metadata,
                updatedAt: agentConfig.updatedAt
              },
              message: `Agent ${input.name} configured and registered successfully`
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
    })
  );

  // ===== MULTI-AGENT COLLABORATION (ENHANCED) =====
  server.tool(
    "agent_teams",
    "Orchestrate multiple agents to collaborate on a complex task with advanced orchestration modes, conditional logic, and configurable output",
    collaborateAgentsSchema.shape,
    withHooks("agent_teams", async (input) => {
      try {
        logger.info(`Starting collaboration: mode=${input.mode}, agents=${input.agents.length}`);
        
        const results = [];
        let currentContext = input.task;
        let shouldStop = false;
        
        // Resolve all agent configurations
        const resolvedAgents = input.agents.map(a => resolveAgentConfig(a, input.model));
        logger.debug(`Resolved ${resolvedAgents.length} agents (${resolvedAgents.filter(a => hasAgent(a.id)).length} from registry)`);
        
        // Helper: Execute single agent
        const executeAgent = async (agent: any, context: string, round: number) => {
          const prompt = `Role: ${agent.role}\nTask: ${context}\nProvide your contribution:`;
          
          // Add system prompt if available
          const messages: any[] = [];
          if (agent.systemPrompt) {
            messages.push({ role: "system", content: agent.systemPrompt });
          }
          messages.push({ role: "user", content: prompt });
          
          // Determine model to use
          let modelToUse = agent.model || input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku";
          
          // If forceModel is true, don't specify a model to let MCP handle it
          if (input.forceModel) {
            modelToUse = undefined as any;
          }
          
          // Use MCP sampling for each agent
          const result = await performSampling({
            messages,
            model: modelToUse,
            temperature: agent.temperature ?? 0.7,
            maxTokens: agent.maxTokens ?? 1000,
            enabledTools: agent.enabledTools,
            includeContext: (agent.enabledTools || agent.toolkits) ? "thisServer" : undefined
          });
          
          return {
            round,
            agentId: agent.id,
            role: agent.role,
            contribution: result.content,
            model: result.model,
            usage: result.usage,
            finishReason: result.finishReason
          };
        };
        
        // Mode: LINEAR (sequential execution)
        if (input.mode === "linear") {
          for (let round = 0; round < input.maxRounds && !shouldStop; round++) {
            logger.debug(`Linear mode: Round ${round + 1}`);
            
            for (const agent of resolvedAgents) {
              const result = await executeAgent(agent, currentContext, round + 1);
              results.push(result);
              
              // Update context
              currentContext += `\n\n${agent.role} says: ${result.contribution}`;
              
              // Check conditions
              if (input.conditions) {
                for (const condition of input.conditions) {
                  if (evaluateCondition(condition.check, currentContext, result)) {
                    logger.info(`Condition met: ${condition.check} -> ${condition.action}`);
                    
                    if (condition.action === "stop") {
                      shouldStop = true;
                      break;
                    } else if (condition.action === "branch" && condition.branchTo) {
                      const branchAgent = resolvedAgents.find(a => a.id === condition.branchTo);
                      if (branchAgent) {
                        const branchResult = await executeAgent(branchAgent, currentContext, round + 1);
                        results.push(branchResult);
                        currentContext += `\n\n${branchAgent.role} says: ${branchResult.contribution}`;
                      }
                    } else if (condition.action === "repeat") {
                      const repeatResult = await executeAgent(agent, currentContext, round + 1);
                      results.push(repeatResult);
                      currentContext += `\n\n${agent.role} (repeated) says: ${repeatResult.contribution}`;
                    }
                  }
                }
              }
              
              if (shouldStop) break;
            }
          }
        }
        
        // Mode: PARALLEL (all agents execute simultaneously)
        else if (input.mode === "parallel") {
          logger.debug("Parallel mode: All agents executing simultaneously");
          
          const promises = resolvedAgents.map(agent => 
            executeAgent(agent, currentContext, 1)
          );
          
          const parallelResults = await Promise.all(promises);
          results.push(...parallelResults);
          
          // Aggregate all contributions
          currentContext += "\n\n" + parallelResults.map(r => 
            `${r.role} says: ${r.contribution}`
          ).join("\n\n");
        }
        
        // Mode: ROUNDS (multiple discussion rounds)
        else if (input.mode === "rounds") {
          for (let round = 0; round < input.maxRounds && !shouldStop; round++) {
            logger.debug(`Rounds mode: Round ${round + 1}`);
            
            for (const agent of resolvedAgents) {
              const result = await executeAgent(agent, currentContext, round + 1);
              results.push(result);
              currentContext += `\n\n[Round ${round + 1}] ${agent.role}: ${result.contribution}`;
              
              // Check conditions after each round
              if (input.conditions) {
                for (const condition of input.conditions) {
                  if (evaluateCondition(condition.check, currentContext, result)) {
                    if (condition.action === "stop") {
                      shouldStop = true;
                      break;
                    }
                  }
                }
              }
            }
          }
        }
        
        // Mode: INTELLIGENT (AI-selected participants)
        else if (input.mode === "intelligent" && input.intelligentSelection) {
          for (let round = 0; round < input.maxRounds && !shouldStop; round++) {
            logger.debug(`Intelligent mode: Round ${round + 1}`);
            
            // Use AI to select which agents should participate
            const selectionPrompt = `Given these agents: ${resolvedAgents.map((a, i) => `${i}: ${a.role}`).join(', ')}
            And this context: ${currentContext}
            Select ${input.intelligentSelection.poolSize} agents that would be most valuable for the next contribution.
            Criteria: ${input.intelligentSelection.criteria}
            Respond with just the agent indices as a comma-separated list.`;
            
            // Determine model for selection
            let selectionModel = input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku";
            if (input.forceModel) {
              selectionModel = undefined as any; // Let MCP handle it
            }
            
            const selectionResult = await performSampling({
              messages: [{ role: "user", content: selectionPrompt }],
              model: selectionModel,
              temperature: 0.3,
              maxTokens: 100
            });
            
            // Parse selected indices
            const indices = selectionResult.content.match(/\d+/g)?.map(Number) || [];
            const selectedAgents = indices
              .filter(i => i < resolvedAgents.length)
              .map(i => resolvedAgents[i]);
            
            logger.debug(`Selected ${selectedAgents.length} agents for round ${round + 1}`);
            
            // Execute selected agents
            for (const agent of selectedAgents) {
              const result = await executeAgent(agent, currentContext, round + 1);
              results.push(result);
              currentContext += `\n\n[Round ${round + 1}] ${agent.role}: ${result.contribution}`;
            }
          }
        }

        logger.info(`Collaboration completed: ${results.length} contributions from ${resolvedAgents.length} agents`);

        // Filter output based on configuration
        const filteredResults = results.map(r => 
          filterOutputFields(r, input.outputFields, input.verbose ?? true)
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              task: input.task,
              mode: input.mode,
              rounds: input.maxRounds,
              participants: resolvedAgents.length,
              totalContributions: results.length,
              results: filteredResults,
              finalSynthesis: input.verbose ? currentContext : undefined,
              stoppedEarly: shouldStop,
              timestamp: new Date().toISOString()
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
    })
  );

  // ===== ASYNC MULTI-AGENT COLLABORATION (ENHANCED) =====
  server.tool(
    "agent_teams_async",
    "Orchestrate multiple agents to collaborate on a complex task asynchronously with advanced orchestration modes. Returns wait handle immediately.",
    collaborateAgentsAsyncSchema.shape,
    withHooks("agent_teams_async", async (input) => {
      try {
        const handleId = `team_${Date.now()}`;
        
        // Create wait handle
        const handle = registerWaitHandle(
          handleId,
          'custom',
          {
            type: 'agent_team',
            agentCount: input.agents.length,
            maxRounds: input.maxRounds,
            mode: input.mode || 'linear',
            task: input.task.substring(0, 100) + (input.task.length > 100 ? '...' : '')
          },
          input.timeoutMs
        );
        
        logger.info(`Started async agent team collaboration (handle: ${handleId}, mode: ${input.mode || 'linear'})`);
        
        // Setup timeout handling if continuable
        let timeoutHandle: NodeJS.Timeout | undefined;
        let timedOut = false;
        
        if (input.timeoutMs && input.continuable !== false) {
          timeoutHandle = setTimeout(() => {
            timedOut = true;
            logger.warn(`Async agent team timed out (handle: ${handleId}), but continuable - will save partial results`);
          }, input.timeoutMs);
        }
        
        // Execute collaboration in background using enhanced orchestration
        (async () => {
          try {
            const results = [];
            let currentContext = input.task;
            let shouldStop = false;
            let completedRounds = 0;
            
            // Resolve all agent configurations
            const resolvedAgents = input.agents.map(a => resolveAgentConfig(a, input.model));
            logger.debug(`Resolved ${resolvedAgents.length} agents (${resolvedAgents.filter(a => hasAgent(a.id)).length} from registry)`);
            
            // Helper: Execute single agent
            const executeAgent = async (agent: any, context: string, round: number) => {
              // Check if timed out and continuable
              if (timedOut && input.continuable !== false) {
                throw new Error('TIMEOUT_CONTINUE');
              }
              
              const prompt = `Role: ${agent.role}\nTask: ${context}\nProvide your contribution:`;
              
              // Add system prompt if available
              const messages: any[] = [];
              if (agent.systemPrompt) {
                messages.push({ role: "system", content: agent.systemPrompt });
              }
              messages.push({ role: "user", content: prompt });
              
              // Determine model to use
              let modelToUse = agent.model || input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku";
              
              // If forceModel is true, don't specify a model to let MCP handle it
              if (input.forceModel) {
                modelToUse = undefined as any;
              }
              
              // Use MCP sampling for each agent
              const result = await performSampling({
                messages,
                model: modelToUse,
                temperature: agent.temperature ?? 0.7,
                maxTokens: agent.maxTokens ?? 1000,
                enabledTools: agent.enabledTools,
                includeContext: (agent.enabledTools || agent.toolkits) ? "thisServer" : undefined
              });
              
              return {
                round,
                agentId: agent.id,
                role: agent.role,
                contribution: result.content,
                model: result.model,
                usage: result.usage,
                finishReason: result.finishReason
              };
            };
            
            // Mode: LINEAR (sequential execution)
            if (!input.mode || input.mode === "linear") {
              try {
                for (let round = 0; round < input.maxRounds && !shouldStop; round++) {
                  for (const agent of resolvedAgents) {
                    const result = await executeAgent(agent, currentContext, round + 1);
                    results.push(result);
                    currentContext += `\n\n${agent.role} says: ${result.contribution}`;
                    
                    // Check conditions
                    if (input.conditions) {
                      for (const condition of input.conditions) {
                        if (evaluateCondition(condition.check, currentContext, result)) {
                          if (condition.action === "stop") {
                            shouldStop = true;
                            break;
                          } else if (condition.action === "branch" && condition.branchTo) {
                            const branchAgent = resolvedAgents.find(a => a.id === condition.branchTo);
                            if (branchAgent) {
                              const branchResult = await executeAgent(branchAgent, currentContext, round + 1);
                              results.push(branchResult);
                              currentContext += `\n\n${branchAgent.role} says: ${branchResult.contribution}`;
                            }
                          }
                        }
                      }
                    }
                    if (shouldStop) break;
                  }
                  completedRounds = round + 1;
                  if (shouldStop) break;
                }
              } catch (error: any) {
                if (error.message === 'TIMEOUT_CONTINUE') {
                  logger.info(`Linear mode interrupted by timeout at round ${completedRounds} (handle: ${handleId})`);
                } else {
                  throw error;
                }
              }
            }
            
            // Mode: PARALLEL
            else if (input.mode === "parallel") {
              try {
                const promises = resolvedAgents.map(agent => 
                  executeAgent(agent, currentContext, 1)
                );
                const parallelResults = await Promise.all(promises);
                results.push(...parallelResults);
                currentContext += "\n\n" + parallelResults.map(r => 
                  `${r.role} says: ${r.contribution}`
                ).join("\n\n");
                completedRounds = 1;
              } catch (error: any) {
                if (error.message === 'TIMEOUT_CONTINUE') {
                  logger.info(`Parallel mode interrupted by timeout (handle: ${handleId})`);
                } else {
                  throw error;
                }
              }
            }
            
            // Mode: ROUNDS
            else if (input.mode === "rounds") {
              try {
                for (let round = 0; round < input.maxRounds && !shouldStop; round++) {
                  for (const agent of resolvedAgents) {
                    const result = await executeAgent(agent, currentContext, round + 1);
                    results.push(result);
                    currentContext += `\n\n[Round ${round + 1}] ${agent.role}: ${result.contribution}`;
                    
                    if (input.conditions) {
                      for (const condition of input.conditions) {
                        if (evaluateCondition(condition.check, currentContext, result)) {
                          if (condition.action === "stop") {
                            shouldStop = true;
                            break;
                          }
                        }
                      }
                    }
                  }
                  completedRounds = round + 1;
                  if (shouldStop) break;
                }
              } catch (error: any) {
                if (error.message === 'TIMEOUT_CONTINUE') {
                  logger.info(`Rounds mode interrupted by timeout at round ${completedRounds} (handle: ${handleId})`);
                } else {
                  throw error;
                }
              }
            }
            
            // Mode: INTELLIGENT
            else if (input.mode === "intelligent" && input.intelligentSelection) {
              try {
                for (let round = 0; round < input.maxRounds && !shouldStop; round++) {
                  const selectionPrompt = `Given these agents: ${resolvedAgents.map((a, i) => `${i}: ${a.role}`).join(', ')}
                  And this context: ${currentContext}
                  Select ${input.intelligentSelection.poolSize} agents that would be most valuable for the next contribution.
                  Criteria: ${input.intelligentSelection.criteria}
                  Respond with just the agent indices as a comma-separated list.`;
                  
                  // Determine model for selection
                  let selectionModel = input.model || process.env.DEFAULT_MODEL || "claude-sonnet-4.5-haiku";
                  if (input.forceModel) {
                    selectionModel = undefined as any; // Let MCP handle it
                  }
                  
                  const selectionResult = await performSampling({
                    messages: [{ role: "user", content: selectionPrompt }],
                    model: selectionModel,
                    temperature: 0.3,
                    maxTokens: 100
                  });
                  
                  const indices = selectionResult.content.match(/\d+/g)?.map(Number) || [];
                  const selectedAgents = indices
                    .filter(i => i < resolvedAgents.length)
                    .map(i => resolvedAgents[i]);
                  
                  for (const agent of selectedAgents) {
                    const result = await executeAgent(agent, currentContext, round + 1);
                    results.push(result);
                    currentContext += `\n\n[Round ${round + 1}] ${agent.role}: ${result.contribution}`;
                  }
                  completedRounds = round + 1;
                }
              } catch (error: any) {
                if (error.message === 'TIMEOUT_CONTINUE') {
                  logger.info(`Intelligent mode interrupted by timeout at round ${completedRounds} (handle: ${handleId})`);
                } else {
                  throw error;
                }
              }
            }

            // Clear timeout if completed
            if (timeoutHandle) {
              clearTimeout(timeoutHandle);
            }

            logger.info(`Async agent team collaboration completed (handle: ${handleId}, rounds: ${completedRounds}/${input.maxRounds}, contributions: ${results.length})`);
            
            // Filter output based on configuration
            const filteredResults = results.map(r => 
              filterOutputFields(r, input.outputFields, input.verbose ?? true)
            );
            
            const wasInterrupted = timedOut && input.continuable !== false;
            
            // Complete wait handle with result
            completeWaitHandle(handleId, {
              task: input.task,
              mode: input.mode || 'linear',
              rounds: input.maxRounds,
              completedRounds,
              participants: resolvedAgents.length,
              totalContributions: results.length,
              results: filteredResults,
              finalSynthesis: input.verbose ? currentContext : undefined,
              stoppedEarly: shouldStop,
              interrupted: wasInterrupted,
              continuable: input.continuable !== false,
              timestamp: new Date().toISOString()
            });
          } catch (error: any) {
            logger.error(`Async agent team collaboration failed (handle: ${handleId}):`, error);
            
            // Clear timeout
            if (timeoutHandle) {
              clearTimeout(timeoutHandle);
            }
            
            failWaitHandle(handleId, error.message);
          }
        })();
        
        // Return wait handle immediately
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              async: true,
              handleId: handle.id,
              status: handle.status,
              mode: input.mode || 'linear',
              agentCount: input.agents.length,
              maxRounds: input.maxRounds,
              continuable: input.continuable !== false,
              message: "Agent team collaboration started asynchronously. Use wait_for tool to retrieve results.",
              startTime: handle.startTime.toISOString(),
              timeout: input.timeoutMs
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error(`Async agent team collaboration failed:`, error);
        return {
          content: [{
            type: "text",
            text: `Error executing agent team asynchronously: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // ===== LIST CONFIGURED AGENTS =====
  server.tool(
    "list_agents",
    "List all configured agent presets available for use in agent teams and workflows",
    z.object({}).shape,
    withHooks("list_agents", async () => {
      try {
        const agents = listAgents();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: agents.length,
              agents: agents.map(a => ({
                id: a.id,
                name: a.name,
                model: a.model,
                hasSystemPrompt: !!a.systemPrompt,
                toolkits: a.toolkits?.length || 0,
                tools: a.enabledTools?.length || 0,
                skills: a.skills?.length || 0,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("List agents error:", error);
        return {
          content: [{
            type: "text",
            text: `Error listing agents: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // ===== GET AGENT DETAILS =====
  server.tool(
    "get_agent",
    "Get detailed configuration for a specific agent preset",
    z.object({
      agentId: z.string().describe("Agent ID to retrieve")
    }).shape,
    withHooks("get_agent", async (input) => {
      try {
        const agent = getAgent(input.agentId);
        
        if (!agent) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Agent not found: ${input.agentId}`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              agent
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Get agent error:", error);
        return {
          content: [{
            type: "text",
            text: `Error getting agent: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // ===== DELETE AGENT =====
  server.tool(
    "delete_agent",
    "Delete a configured agent preset",
    z.object({
      agentId: z.string().describe("Agent ID to delete")
    }).shape,
    withHooks("delete_agent", async (input) => {
      try {
        const existed = deleteAgent(input.agentId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              deleted: existed,
              message: existed ? 
                `Agent ${input.agentId} deleted successfully` : 
                `Agent ${input.agentId} not found`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Delete agent error:", error);
        return {
          content: [{
            type: "text",
            text: `Error deleting agent: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  logger.info("Agent tools registered successfully");
}
