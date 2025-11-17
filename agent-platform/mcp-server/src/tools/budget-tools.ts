/**
 * Budget Management Tools
 * 
 * Tools for creating, managing, and enforcing budgets and rate limits
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { getBudgetManager } from "../services/budget-manager.js";

export function registerBudgetTools(server: McpServer, logger: Logger) {
  const manager = getBudgetManager(logger);

  /**
   * Create budget
   */
  server.tool(
    "budget_create",
    "Create a budget to limit token usage, costs, or call counts for an agent or globally",
    {
      agentId: z.string().optional().describe("Agent ID (omit for global budget)"),
      type: z.enum(['token', 'cost', 'calls']).describe("Budget type"),
      limit: z.number().positive().describe("Budget limit"),
      period: z.enum(['hour', 'day', 'week', 'month', 'total']).describe("Reset period"),
      alertThreshold: z.number().min(0).max(1).default(0.8).describe("Alert at percentage (0.8 = 80%)"),
      enforceLimit: z.boolean().default(true).describe("Enforce hard limit or just warn")
    },
    async (args) => {
      try {
        const budget = await manager.createBudget({
          agentId: args.agentId,
          type: args.type,
          limit: args.limit,
          period: args.period,
          alertThreshold: args.alertThreshold,
          enforceLimit: args.enforceLimit
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              budget: {
                id: budget.id,
                agentId: budget.agentId || 'global',
                type: budget.type,
                limit: budget.limit,
                period: budget.period,
                alertThreshold: `${(budget.alertThreshold * 100).toFixed(0)}%`,
                enforceLimit: budget.enforceLimit,
                resetAt: budget.resetAt?.toISOString(),
                status: 'active'
              },
              message: `Budget created: ${budget.limit} ${budget.type} per ${budget.period}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to create budget:", error);
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
   * Get budget status
   */
  server.tool(
    "budget_get_status",
    "Get current status of a budget including usage and remaining amount",
    {
      agentId: z.string().describe("Agent ID"),
      type: z.enum(['token', 'cost', 'calls']).describe("Budget type")
    },
    async (args) => {
      try {
        const status = await manager.getBudgetStatus(args.agentId, args.type);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              status: {
                ...status,
                percentUsed: `${status.percentUsed}%`,
                resetAt: status.resetAt?.toISOString()
              },
              indicator: status.percentUsed >= 90 ? '🔴' : 
                         status.percentUsed >= 75 ? '🟡' : '🟢'
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get budget status:", error);
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
   * List budgets
   */
  server.tool(
    "budget_list",
    "List all budgets for an agent or all global budgets",
    {
      agentId: z.string().optional().describe("Agent ID (omit for global budgets)")
    },
    async (args) => {
      try {
        const budgets = await manager.listBudgets(args.agentId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: budgets.length,
              budgets: budgets.map(b => ({
                id: b.id,
                agentId: b.agentId || 'global',
                type: b.type,
                limit: b.limit,
                current: b.current,
                remaining: b.limit - b.current,
                percentUsed: `${Math.round((b.current / b.limit) * 100)}%`,
                period: b.period,
                enforceLimit: b.enforceLimit,
                resetAt: b.resetAt?.toISOString()
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list budgets:", error);
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
   * Update budget
   */
  server.tool(
    "budget_update",
    "Update budget limits, thresholds, or enforcement settings",
    {
      budgetId: z.string().describe("Budget ID"),
      limit: z.number().positive().optional().describe("New limit"),
      alertThreshold: z.number().min(0).max(1).optional().describe("New alert threshold"),
      enforceLimit: z.boolean().optional().describe("Enable/disable enforcement")
    },
    async (args) => {
      try {
        const updates: any = {};
        if (args.limit !== undefined) updates.limit = args.limit;
        if (args.alertThreshold !== undefined) updates.alertThreshold = args.alertThreshold;
        if (args.enforceLimit !== undefined) updates.enforceLimit = args.enforceLimit;

        const budget = await manager.updateBudget(args.budgetId, updates);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              budget: {
                id: budget.id,
                type: budget.type,
                limit: budget.limit,
                alertThreshold: `${(budget.alertThreshold * 100).toFixed(0)}%`,
                enforceLimit: budget.enforceLimit
              },
              message: 'Budget updated successfully'
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to update budget:", error);
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
   * Delete budget
   */
  server.tool(
    "budget_delete",
    "Delete a budget by ID",
    {
      budgetId: z.string().describe("Budget ID to delete")
    },
    async (args) => {
      try {
        await manager.deleteBudget(args.budgetId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Budget ${args.budgetId} deleted`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to delete budget:", error);
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
   * Set rate limit
   */
  server.tool(
    "rate_limit_set",
    "Set rate limits for an agent (calls per minute/hour)",
    {
      agentId: z.string().describe("Agent ID"),
      maxCallsPerMinute: z.number().positive().describe("Maximum calls per minute"),
      maxCallsPerHour: z.number().positive().describe("Maximum calls per hour"),
      burstAllowance: z.number().nonnegative().optional().describe("Extra calls allowed in bursts")
    },
    async (args) => {
      try {
        await manager.setRateLimit(args.agentId, {
          maxCallsPerMinute: args.maxCallsPerMinute,
          maxCallsPerHour: args.maxCallsPerHour,
          burstAllowance: args.burstAllowance
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              rateLimit: {
                agentId: args.agentId,
                maxCallsPerMinute: args.maxCallsPerMinute,
                maxCallsPerHour: args.maxCallsPerHour,
                burstAllowance: args.burstAllowance || 0
              },
              message: `Rate limit set for ${args.agentId}`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to set rate limit:", error);
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
   * Check rate limit
   */
  server.tool(
    "rate_limit_check",
    "Check if an agent can make a call under current rate limits",
    {
      agentId: z.string().describe("Agent ID")
    },
    async (args) => {
      try {
        const result = await manager.checkRateLimit(args.agentId);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              allowed: result.allowed,
              reason: result.reason,
              retryAfter: result.retryAfter ? `${result.retryAfter}s` : undefined,
              status: result.allowed ? '✓ Allowed' : '✗ Rate limited'
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to check rate limit:", error);
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

  logger.info("✓ Budget management tools registered (7 tools)");
}
