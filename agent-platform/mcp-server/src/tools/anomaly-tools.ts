/**
 * Anomaly Detection MCP Tools
 * 
 * Provides tools for detecting and analyzing usage anomalies
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { getAnomalyDetector } from "../services/anomaly-detector.js";
import { getAnomalyBatchPipeline } from "../services/anomaly-batch-pipeline.js";
import { getAlertRouter } from "../services/alert-router.js";

/**
 * Register anomaly detection tools
 */
export function registerAnomalyTools(server: McpServer, logger: Logger) {
  const detector = getAnomalyDetector(logger);

  /**
   * Detect anomalies in usage patterns
   */
  server.tool(
    "anomaly_detect_spikes",
    "Detect anomalies in agent usage patterns for a specific metric",
    {
      agentId: z.string().describe("Agent ID to analyze"),
      metric: z.enum(["cost", "tokens", "errors", "latency", "calls"]).describe("Metric to analyze for anomalies"),
      startDate: z.string().optional().describe("Start date (ISO 8601 format)"),
      endDate: z.string().optional().describe("End date (ISO 8601 format, defaults to now)")
    },
    async (args) => {
      try {
        const start = args.startDate ? new Date(args.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = args.endDate ? new Date(args.endDate) : new Date();

        const report = await detector.analyzeSpikes(args.agentId, args.metric, { start, end });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              report: {
                agentId: report.agentId,
                metric: report.metric,
                timeRange: {
                  start: report.timeRange.start.toISOString(),
                  end: report.timeRange.end.toISOString()
                },
                anomaliesDetected: report.anomalies.length,
                anomalies: report.anomalies.map(a => ({
                  id: a.id,
                  timestamp: a.timestamp.toISOString(),
                  severity: a.severity,
                  score: Math.round(a.score),
                  confidence: Math.round(a.confidence * 100),
                  baseline: Math.round(a.baseline * 100) / 100,
                  observed: Math.round(a.observed * 100) / 100,
                  deviation: Math.round(a.deviation * 10) / 10
                })),
                statistics: {
                  mean: Math.round(report.statistics.mean * 100) / 100,
                  median: Math.round(report.statistics.median * 100) / 100,
                  stdDev: Math.round(report.statistics.stdDev * 100) / 100,
                  range: {
                    min: Math.round(report.statistics.min * 100) / 100,
                    max: Math.round(report.statistics.max * 100) / 100
                  }
                },
                recommendations: report.recommendations
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_detect_spikes] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * Run daily batch anomaly detection
   */
  server.tool(
    "anomaly_run_batch",
    "Run daily batch anomaly detection for all active agents",
    {
      dryRun: z.boolean().optional().default(false).describe("If true, only analyze without storing results")
    },
    async (args) => {
      try {
        logger.info('[Anomaly Detection] Starting batch analysis...');

        const result = await detector.runDailyBatch();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              batch: {
                totalAgents: result.totalAgents,
                analyzedAgents: result.analyzedAgents,
                anomaliesDetected: result.anomaliesDetected,
                duration: `${result.duration}ms`,
                errors: result.errors,
                summary: {
                  critical: result.anomalies.filter(a => a.severity === 'critical').length,
                  warning: result.anomalies.filter(a => a.severity === 'warning').length,
                  info: result.anomalies.filter(a => a.severity === 'info').length
                },
                topAnomalies: result.anomalies
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 10)
                  .map(a => ({
                    id: a.id,
                    agentId: a.agentId,
                    metric: a.metric,
                    severity: a.severity,
                    score: Math.round(a.score),
                    observed: Math.round(a.observed * 100) / 100
                  }))
              },
              dryRun: args.dryRun
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_run_batch] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * Get anomaly detection configuration
   */
  server.tool(
    "anomaly_get_config",
    "Get current anomaly detection configuration",
    {},
    async () => {
      try {
        const config = detector.getConfig();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              config: {
                enabled: config.enabled,
                method: config.method,
                metrics: config.metrics,
                thresholds: config.thresholds,
                lookbackPeriod: `${config.lookbackPeriod} days`,
                minimumDataPoints: config.minimumDataPoints
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_get_config] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * Update anomaly detection configuration
   */
  server.tool(
    "anomaly_update_config",
    "Update anomaly detection configuration",
    {
      enabled: z.boolean().optional().describe("Enable or disable anomaly detection"),
      method: z.enum(["zscore", "iqr", "moving_average"]).optional().describe("Detection method to use"),
      metrics: z.array(z.enum(["cost", "tokens", "errors", "latency", "calls"])).optional().describe("Metrics to monitor"),
      thresholds: z.object({
        info: z.number().optional(),
        warning: z.number().optional(),
        critical: z.number().optional()
      }).optional().describe("Detection thresholds"),
      lookbackPeriod: z.number().optional().describe("Number of days to look back"),
      minimumDataPoints: z.number().optional().describe("Minimum data points required")
    },
    async (args) => {
      try {
        // Build config object with proper typing
        const config: any = {};
        if (args.enabled !== undefined) config.enabled = args.enabled;
        if (args.method) config.method = args.method;
        if (args.metrics) config.metrics = args.metrics;
        if (args.thresholds) config.thresholds = args.thresholds;
        if (args.lookbackPeriod !== undefined) config.lookbackPeriod = args.lookbackPeriod;
        if (args.minimumDataPoints !== undefined) config.minimumDataPoints = args.minimumDataPoints;
        
        detector.updateConfig(config);
        const updated = detector.getConfig();

        logger.info('[Anomaly Detection] Configuration updated');

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Anomaly detection configuration updated",
              config: updated
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_update_config] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * List recent anomalies
   */
  server.tool(
    "anomaly_list_recent",
    "List recent anomalies detected across all agents",
    {
      severity: z.enum(["critical", "warning", "info"]).optional().describe("Filter by severity level"),
      limit: z.number().optional().default(20).describe("Maximum number of anomalies to return"),
      hours: z.number().optional().default(24).describe("Look back this many hours")
    },
    async (args) => {
      try {
        // Run batch to get recent anomalies
        const result = await detector.runDailyBatch();

        let anomalies = result.anomalies;

        // Filter by severity if specified
        if (args.severity) {
          anomalies = anomalies.filter(a => a.severity === args.severity);
        }

        // Filter by time range
        const cutoff = new Date(Date.now() - (args.hours || 24) * 60 * 60 * 1000);
        anomalies = anomalies.filter(a => a.timestamp >= cutoff);

        // Sort by score and limit
        anomalies = anomalies
          .sort((a, b) => b.score - a.score)
          .slice(0, args.limit || 20);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: anomalies.length,
              anomalies: anomalies.map(a => ({
                id: a.id,
                timestamp: a.timestamp.toISOString(),
                agentId: a.agentId,
                metric: a.metric,
                severity: a.severity,
                score: Math.round(a.score),
                baseline: Math.round(a.baseline * 100) / 100,
                observed: Math.round(a.observed * 100) / 100,
                deviation: Math.round(a.deviation * 10) / 10
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_list_recent] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * Get batch pipeline status
   */
  server.tool(
    "anomaly_pipeline_status",
    "Get the status of the anomaly detection batch pipeline",
    {},
    async () => {
      try {
        const pipeline = getAnomalyBatchPipeline(logger);
        const status = pipeline.getStatus();
        const recent = pipeline.getRecentExecutions(5);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              status: {
                enabled: status.enabled,
                running: status.running,
                nextScheduled: status.nextScheduled?.toISOString(),
                lastExecution: status.lastExecution ? {
                  id: status.lastExecution.id,
                  startTime: status.lastExecution.startTime.toISOString(),
                  endTime: status.lastExecution.endTime?.toISOString(),
                  duration: `${status.lastExecution.duration}ms`,
                  status: status.lastExecution.status,
                  anomaliesDetected: status.lastExecution.result?.anomaliesDetected
                } : null
              },
              recentExecutions: recent.map(e => ({
                id: e.id,
                startTime: e.startTime.toISOString(),
                status: e.status,
                anomaliesDetected: e.result?.anomaliesDetected,
                duration: e.duration ? `${e.duration}ms` : null
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_pipeline_status] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * Start batch pipeline
   */
  server.tool(
    "anomaly_pipeline_start",
    "Start the anomaly detection batch pipeline with scheduled execution",
    {
      runImmediately: z.boolean().optional().default(false).describe("Run a batch immediately after starting")
    },
    async (args) => {
      try {
        const pipeline = getAnomalyBatchPipeline(logger);
        await pipeline.start();

        if (args.runImmediately) {
          const result = await pipeline.runBatch();
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Pipeline started and initial batch completed",
                result: {
                  anomaliesDetected: result.anomaliesDetected,
                  analyzedAgents: result.analyzedAgents
                }
              }, null, 2)
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Anomaly detection pipeline started"
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_pipeline_start] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * Stop batch pipeline
   */
  server.tool(
    "anomaly_pipeline_stop",
    "Stop the anomaly detection batch pipeline",
    {},
    async () => {
      try {
        const pipeline = getAnomalyBatchPipeline(logger);
        await pipeline.stop();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Anomaly detection pipeline stopped"
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_pipeline_stop] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  /**
   * Get alert routing configuration
   */
  server.tool(
    "anomaly_alert_routes",
    "Get current alert routing configuration",
    {},
    async () => {
      try {
        const router = getAlertRouter(logger);
        const routes = router.getRoutes();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              routes: routes.map(r => ({
                severity: r.severity,
                channels: r.channels,
                rateLimit: r.rateLimit,
                createTask: r.createTask,
                taskPriority: r.taskPriority
              }))
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("[anomaly_alert_routes] Error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2)
          }]
        };
      }
    }
  );

  logger.info('[Anomaly Detection] Registered 9 tools (detection + pipeline + alerts)');
}
