/**
 * Context Management Tools
 * 
 * Tools for analyzing, optimizing, and managing conversation context
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { getContextManager } from "../services/context-manager.js";

export function registerContextTools(server: McpServer, logger: Logger) {
  const manager = getContextManager(logger);

  /**
   * Analyze context
   */
  server.tool(
    "context_analyze",
    "Analyze conversation context to determine token count, cost, and get optimization recommendations",
    {
      context: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
      })).describe("Conversation messages to analyze"),
      model: z.string().default('gpt-4').describe("Model to use for cost estimation")
    },
    async (args) => {
      try {
        const analysis = await manager.analyzeContext(args.context, args.model);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              analysis: {
                totalTokens: analysis.totalTokens.toLocaleString(),
                estimatedCost: `$${analysis.estimatedCost.toFixed(4)}`,
                messageCount: args.context.length,
                averageTokensPerMessage: Math.round(analysis.totalTokens / args.context.length),
                recommendations: analysis.recommendations,
                breakdown: analysis.messages.map((msg, i) => ({
                  index: i,
                  role: msg.role,
                  tokens: msg.tokens,
                  importance: `${(msg.importance * 100).toFixed(0)}%`
                }))
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to analyze context:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Optimize context
   */
  server.tool(
    "context_optimize",
    "Optimize conversation context using a predefined strategy to reduce tokens and costs",
    {
      context: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
      })).describe("Conversation messages to optimize"),
      strategy: z.enum(['efficient', 'balanced', 'quality']).default('balanced').describe("Optimization strategy")
    },
    async (args) => {
      try {
        const strategy = manager.getStrategy(args.strategy);
        const originalTokens = manager.estimateTokens(args.context);
        
        const optimized = await manager.optimizeContext(args.context, strategy);
        const newTokens = manager.estimateTokens(optimized);
        const savings = ((originalTokens - newTokens) / originalTokens * 100).toFixed(1);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              optimization: {
                strategy: strategy.name,
                original: {
                  messages: args.context.length,
                  tokens: originalTokens
                },
                optimized: {
                  messages: optimized.length,
                  tokens: newTokens
                },
                reduction: {
                  messages: args.context.length - optimized.length,
                  tokens: originalTokens - newTokens,
                  percentage: `${savings}%`
                }
              },
              optimizedContext: optimized
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to optimize context:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Estimate tokens
   */
  server.tool(
    "context_estimate_tokens",
    "Estimate token count for text or conversation",
    {
      input: z.union([
        z.string(),
        z.array(z.object({
          role: z.enum(['user', 'assistant', 'system']),
          content: z.string()
        }))
      ]).describe("Text or conversation to estimate")
    },
    async (args) => {
      try {
        const tokens = manager.estimateTokens(args.input);
        const isConversation = Array.isArray(args.input);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              estimation: {
                tokens,
                type: isConversation ? 'conversation' : 'text',
                messageCount: isConversation ? args.input.length : 1,
                averagePerMessage: isConversation ? Math.round(tokens / args.input.length) : tokens
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to estimate tokens:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Truncate context
   */
  server.tool(
    "context_truncate",
    "Truncate conversation context using a specific method",
    {
      context: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
      })).describe("Conversation messages to truncate"),
      method: z.enum(['sliding_window', 'summarize', 'keep_important']).describe("Truncation method"),
      maxTokens: z.number().positive().describe("Maximum tokens to keep"),
      preserveSystemPrompt: z.boolean().default(true).describe("Keep system prompts"),
      preserveRecentMessages: z.number().default(5).describe("Number of recent messages to keep")
    },
    async (args) => {
      try {
        const originalTokens = manager.estimateTokens(args.context);
        
        const truncated = await manager.truncateContext(
          args.context,
          args.method,
          args.maxTokens,
          args.preserveSystemPrompt,
          args.preserveRecentMessages
        );
        
        const newTokens = manager.estimateTokens(truncated);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              truncation: {
                method: args.method,
                original: {
                  messages: args.context.length,
                  tokens: originalTokens
                },
                truncated: {
                  messages: truncated.length,
                  tokens: newTokens
                },
                removed: {
                  messages: args.context.length - truncated.length,
                  tokens: originalTokens - newTokens
                }
              },
              truncatedContext: truncated
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to truncate context:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * List optimization strategies
   */
  server.tool(
    "context_list_strategies",
    "List available context optimization strategies",
    {},
    async () => {
      try {
        const strategies = manager.listStrategies();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              strategies: strategies.map(s => ({
                id: s.id,
                name: s.name,
                maxTokens: s.maxTokens,
                method: s.truncationMethod,
                preserveRecent: s.preserveRecentMessages,
                description: s.id === 'efficient' ? 'Minimize costs through aggressive optimization' :
                           s.id === 'balanced' ? 'Balance between cost and context preservation' :
                           'Preserve maximum context for quality'
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list strategies:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  logger.info("✓ Context management tools registered (5 tools)");
}
