/**
 * Usage Tracking Tools
 * 
 * Tools for monitoring agent usage, costs, and generating reports
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { getUsageTracker } from "../services/usage-tracker.js";

export function registerUsageTools(server: McpServer, logger: Logger) {
  const tracker = getUsageTracker(logger);

  /**
   * Get usage statistics
   */
  server.tool(
    "usage_get_stats",
    "Get usage statistics for agents, optionally filtered by agent ID and time period",
    {
      agentId: z.string().optional().describe("Filter by specific agent ID"),
      period: z.enum(['hour', 'day', 'week', 'month', 'all']).optional().describe("Time period for statistics")
    },
    async (args) => {
      try {
        const stats = await tracker.getStats(args.agentId, args.period);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              stats,
              summary: {
                totalCalls: stats.totalCalls,
                totalTokens: stats.totalTokens.toLocaleString(),
                totalCost: `$${stats.totalCost.toFixed(4)}`,
                averageTokens: stats.averageTokens.toLocaleString(),
                averageDuration: `${stats.averageDuration}ms`,
                successRate: `${(stats.successRate * 100).toFixed(1)}%`,
                topModels: Object.entries(stats.models)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([model, count]) => ({ model, count }))
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get usage stats:", error);
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
   * Generate usage report
   */
  server.tool(
    "usage_get_report",
    "Generate comprehensive usage report with breakdown by agent or model",
    {
      startDate: z.string().optional().describe("Start date (ISO format)"),
      endDate: z.string().optional().describe("End date (ISO format)"),
      agentId: z.string().optional().describe("Filter by agent ID"),
      model: z.string().optional().describe("Filter by model"),
      groupBy: z.enum(['agent', 'model']).optional().default('agent').describe("Group results by agent or model")
    },
    async (args) => {
      try {
        const options = {
          startDate: args.startDate ? new Date(args.startDate) : undefined,
          endDate: args.endDate ? new Date(args.endDate) : undefined,
          agentId: args.agentId,
          model: args.model,
          groupBy: args.groupBy
        };

        const report = await tracker.getReport(options);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              report: {
                summary: {
                  ...report.summary,
                  totalCost: `$${report.summary.totalCost.toFixed(4)}`,
                  totalTokens: report.summary.totalTokens.toLocaleString()
                },
                breakdown: Object.entries(report.breakdown).map(([key, stats]) => ({
                  [args.groupBy || 'agent']: key,
                  calls: stats.totalCalls,
                  tokens: stats.totalTokens.toLocaleString(),
                  cost: `$${stats.totalCost.toFixed(4)}`,
                  avgTokens: stats.averageTokens,
                  avgDuration: `${stats.averageDuration}ms`,
                  successRate: `${(stats.successRate * 100).toFixed(1)}%`
                }))
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to generate report:", error);
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
   * Export usage data
   */
  server.tool(
    "usage_export",
    "Export usage data in JSON or CSV format",
    {
      format: z.enum(['json', 'csv']).describe("Export format")
    },
    async (args) => {
      try {
        const data = await tracker.exportData(args.format);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              format: args.format,
              data,
              message: `Usage data exported in ${args.format.toUpperCase()} format`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to export data:", error);
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
   * Calculate cost estimate
   */
  server.tool(
    "usage_estimate_cost",
    "Estimate cost for a given model and token count",
    {
      model: z.string().describe("Model name (e.g., 'gpt-4', 'claude-4.5-sonnet')"),
      promptTokens: z.number().describe("Estimated prompt tokens"),
      completionTokens: z.number().describe("Estimated completion tokens")
    },
    async (args) => {
      try {
        const cost = tracker.calculateCost(
          args.model,
          args.promptTokens,
          args.completionTokens
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              estimate: {
                model: args.model,
                promptTokens: args.promptTokens,
                completionTokens: args.completionTokens,
                totalTokens: args.promptTokens + args.completionTokens,
                estimatedCost: `$${cost.toFixed(6)}`,
                costBreakdown: {
                  input: `$${((args.promptTokens / 1_000_000) * tracker.calculateCost(args.model, 1_000_000, 0)).toFixed(6)}`,
                  output: `$${((args.completionTokens / 1_000_000) * tracker.calculateCost(args.model, 0, 1_000_000)).toFixed(6)}`
                }
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to estimate cost:", error);
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

  logger.info("✓ Usage tracking tools registered (4 tools)");
}
