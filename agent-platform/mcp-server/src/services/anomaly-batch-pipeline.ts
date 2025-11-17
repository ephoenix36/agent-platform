/**
 * Anomaly Detection Batch Pipeline
 * 
 * Scheduled batch processing for anomaly detection across all agents
 */

import { Logger } from "../utils/logging.js";
import { getAnomalyDetector, Anomaly, BatchResult } from "../services/anomaly-detector.js";
import { getAlertRouter } from "../services/alert-router.js";
import { EventEmitter } from "events";

/**
 * Batch schedule configuration
 */
export interface BatchScheduleConfig {
  enabled: boolean;
  cronSchedule: string; // e.g., "0 0 * * *" for daily at midnight
  timezone?: string;
  runOnStartup?: boolean;
}

/**
 * Batch execution record
 */
export interface BatchExecution {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed';
  result?: BatchResult;
  error?: string;
}

/**
 * Default schedule: daily at 2 AM
 */
const DEFAULT_SCHEDULE: BatchScheduleConfig = {
  enabled: true,
  cronSchedule: "0 2 * * *", // 2 AM daily
  timezone: "UTC",
  runOnStartup: false
};

/**
 * Anomaly Detection Batch Pipeline
 * 
 * Manages scheduled and on-demand batch processing
 */
export class AnomalyBatchPipeline extends EventEmitter {
  private config: BatchScheduleConfig;
  private logger: Logger;
  private intervalId?: NodeJS.Timeout;
  private executions: BatchExecution[] = [];
  private isRunning: boolean = false;

  constructor(config?: Partial<BatchScheduleConfig>, logger?: Logger) {
    super();
    this.config = { ...DEFAULT_SCHEDULE, ...config };
    this.logger = logger || console as any;
  }

  /**
   * Start the batch pipeline
   */
  async start(): Promise<void> {
    if (this.intervalId) {
      this.logger.warn('[Batch Pipeline] Already running');
      return;
    }

    this.logger.info('[Batch Pipeline] Starting...');

    // Run on startup if configured
    if (this.config.runOnStartup) {
      this.logger.info('[Batch Pipeline] Running initial batch on startup...');
      await this.runBatch();
    }

    // Schedule periodic execution
    if (this.config.enabled) {
      // For simplicity, convert cron to interval (production would use proper cron library)
      const intervalMs = this.parseCronToInterval(this.config.cronSchedule);
      
      this.intervalId = setInterval(async () => {
        await this.runBatch();
      }, intervalMs);

      this.logger.info(`[Batch Pipeline] Scheduled to run every ${intervalMs / 1000 / 60} minutes`);
    }

    this.emit('started');
  }

  /**
   * Stop the batch pipeline
   */
  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.logger.info('[Batch Pipeline] Stopped');
      this.emit('stopped');
    }
  }

  /**
   * Run batch processing immediately
   */
  async runBatch(): Promise<BatchResult> {
    if (this.isRunning) {
      throw new Error('Batch already running');
    }

    const execution: BatchExecution = {
      id: `batch-${Date.now()}`,
      startTime: new Date(),
      status: 'running'
    };

    this.executions.push(execution);
    this.isRunning = true;

    this.logger.info(`[Batch Pipeline] Starting execution ${execution.id}...`);
    this.emit('batch-start', execution);

    try {
      const detector = getAnomalyDetector(this.logger);
      const result = await detector.runDailyBatch();

      execution.endTime = new Date();
      execution.duration = result.duration;
      execution.status = 'completed';
      execution.result = result;

      this.logger.info(
        `[Batch Pipeline] Execution ${execution.id} completed: ` +
        `${result.anomaliesDetected} anomalies detected from ${result.analyzedAgents} agents`
      );

      // Emit events for different severity levels
      const criticalAnomalies = result.anomalies.filter(a => a.severity === 'critical');
      const warningAnomalies = result.anomalies.filter(a => a.severity === 'warning');

      if (criticalAnomalies.length > 0) {
        this.emit('critical-anomalies', criticalAnomalies);
      }

      if (warningAnomalies.length > 0) {
        this.emit('warning-anomalies', warningAnomalies);
      }

      this.emit('batch-complete', execution);

      // Route alerts for detected anomalies
      if (result.anomalies.length > 0) {
        await this.routeAlerts(result.anomalies);
      }

      // Store anomalies if enabled
      if (result.anomalies.length > 0) {
        await this.storeAnomalies(result.anomalies);
      }

      return result;
    } catch (error) {
      execution.endTime = new Date();
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);

      this.logger.error(`[Batch Pipeline] Execution ${execution.id} failed:`, error);
      this.emit('batch-error', execution, error);

      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get recent executions
   */
  getRecentExecutions(limit: number = 10): BatchExecution[] {
    return this.executions
      .slice(-limit)
      .reverse();
  }

  /**
   * Get pipeline status
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    lastExecution?: BatchExecution;
    nextScheduled?: Date;
  } {
    const lastExecution = this.executions.length > 0
      ? this.executions[this.executions.length - 1]
      : undefined;

    let nextScheduled: Date | undefined;
    if (this.config.enabled && lastExecution) {
      const intervalMs = this.parseCronToInterval(this.config.cronSchedule);
      nextScheduled = new Date(lastExecution.startTime.getTime() + intervalMs);
    }

    return {
      enabled: this.config.enabled,
      running: this.isRunning,
      lastExecution,
      nextScheduled
    };
  }

  /**
   * Update schedule configuration
   */
  updateConfig(config: Partial<BatchScheduleConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...config };

    // Restart if schedule changed
    if (wasEnabled !== this.config.enabled || config.cronSchedule) {
      this.logger.info('[Batch Pipeline] Configuration updated, restarting...');
      this.stop();
      this.start();
    }
  }

  /**
   * Route alerts for anomalies
   */
  private async routeAlerts(anomalies: Anomaly[]): Promise<void> {
    const router = getAlertRouter(this.logger);
    
    this.logger.info(`[Batch Pipeline] Routing alerts for ${anomalies.length} anomalies`);
    
    const results = await Promise.allSettled(
      anomalies.map(anomaly => router.routeAlert(anomaly))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.info(
      `[Batch Pipeline] Alert routing complete: ${successful} successful, ${failed} failed`
    );
  }

  /**
   * Store anomalies for persistence
   */
  private async storeAnomalies(anomalies: Anomaly[]): Promise<void> {
    // In a production system, this would store to a database/collection
    // For now, we'll keep them in memory
    this.logger.info(`[Batch Pipeline] Storing ${anomalies.length} anomalies`);
    
    // Future: Store to collections system
    // const collection = getCollection('anomalies');
    // await collection.addMany(anomalies.map(a => ({ ...a })));
  }

  /**
   * Parse cron schedule to interval (simplified)
   */
  private parseCronToInterval(cronSchedule: string): number {
    // Simplified cron parsing - production would use a proper cron library
    // For now, we'll support common patterns:
    // "0 * * * *" = hourly
    // "0 0 * * *" = daily
    // "0 0 * * 0" = weekly

    const parts = cronSchedule.split(' ');
    
    if (parts[0] === '0' && parts[1] === '*') {
      return 60 * 60 * 1000; // Hourly
    }
    
    if (parts[0] === '0' && parts[1] === '0') {
      return 24 * 60 * 60 * 1000; // Daily
    }

    // Default to daily
    return 24 * 60 * 60 * 1000;
  }
}

/**
 * Global pipeline instance
 */
let globalPipeline: AnomalyBatchPipeline | null = null;

/**
 * Get or create global pipeline
 */
export function getAnomalyBatchPipeline(logger?: Logger): AnomalyBatchPipeline {
  if (!globalPipeline) {
    globalPipeline = new AnomalyBatchPipeline(undefined, logger);
  }
  return globalPipeline;
}

/**
 * Set global pipeline
 */
export function setAnomalyBatchPipeline(pipeline: AnomalyBatchPipeline | null): void {
  globalPipeline = pipeline;
}
