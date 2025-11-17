/**
 * Anomaly Detection Service
 * 
 * Detects anomalies in agent usage patterns using statistical methods
 */

import { Logger } from "../utils/logging.js";
import { UsageStats, UsageEvent, getUsageTracker } from "./usage-tracker.js";

/**
 * Anomaly detection metric types
 */
export type AnomalyMetric = 'cost' | 'tokens' | 'errors' | 'latency' | 'calls';

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = 'info' | 'warning' | 'critical';

/**
 * Anomaly detection methods
 */
export type AnomalyDetectionMethod = 'zscore' | 'iqr' | 'moving_average';

/**
 * Detected anomaly interface
 */
export interface Anomaly {
  id: string;
  timestamp: Date;
  agentId: string;
  metric: AnomalyMetric;
  severity: AnomalySeverity;
  score: number; // 0-100
  confidence: number; // 0-1
  baseline: number;
  observed: number;
  deviation: number;
  method: AnomalyDetectionMethod;
  context: Record<string, any>;
  resolved: boolean;
  resolutionTaskId?: string;
}

/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
  enabled: boolean;
  metrics: AnomalyMetric[];
  method: AnomalyDetectionMethod;
  thresholds: {
    info: number;      // e.g., 2 sigma for z-score
    warning: number;   // e.g., 3 sigma
    critical: number;  // e.g., 5 sigma
  };
  lookbackPeriod: number; // days
  minimumDataPoints: number;
  excludeWeekends: boolean;
  excludeNightHours: boolean; // Exclude 00:00-06:00
}

/**
 * Anomaly report interface
 */
export interface AnomalyReport {
  agentId: string;
  metric: AnomalyMetric;
  timeRange: {
    start: Date;
    end: Date;
  };
  anomalies: Anomaly[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    iqr: number;
  };
  recommendations: string[];
}

/**
 * Batch processing result
 */
export interface BatchResult {
  totalAgents: number;
  analyzedAgents: number;
  anomaliesDetected: number;
  duration: number;
  errors: Array<{ agentId: string; error: string }>;
  anomalies: Anomaly[];
}

/**
 * Statistical calculation results
 */
interface Statistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
}

/**
 * Default anomaly detection configuration
 */
const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  enabled: true,
  metrics: ['cost', 'tokens', 'errors'],
  method: 'zscore',
  thresholds: {
    info: 2,
    warning: 3,
    critical: 5
  },
  lookbackPeriod: 7,
  minimumDataPoints: 10,
  excludeWeekends: false,
  excludeNightHours: false
};

/**
 * Anomaly Detector Service
 * 
 * Provides statistical anomaly detection for usage patterns
 */
export class AnomalyDetector {
  private config: AnomalyDetectionConfig;
  private logger?: Logger;

  constructor(config?: Partial<AnomalyDetectionConfig>, logger?: Logger) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger;
  }

  /**
   * Detect anomalies in usage statistics
   */
  async detectAnomalies(
    stats: UsageStats[],
    config?: Partial<AnomalyDetectionConfig>
  ): Promise<Anomaly[]> {
    const effectiveConfig = { ...this.config, ...config };
    
    if (!effectiveConfig.enabled) {
      return [];
    }

    // Filter data based on config
    const filteredStats = this.filterStats(stats, effectiveConfig);

    if (filteredStats.length < effectiveConfig.minimumDataPoints) {
      this.logger?.warn(`Insufficient data points for anomaly detection: ${filteredStats.length} < ${effectiveConfig.minimumDataPoints}`);
      return [];
    }

    const anomalies: Anomaly[] = [];

    // Detect anomalies for each configured metric
    for (const metric of effectiveConfig.metrics) {
      const metricAnomalies = await this.detectMetricAnomalies(
        filteredStats,
        metric,
        effectiveConfig
      );
      anomalies.push(...metricAnomalies);
    }

    return anomalies;
  }

  /**
   * Analyze spikes for a specific agent and metric
   */
  async analyzeSpikes(
    agentId: string,
    metric: AnomalyMetric,
    timeRange: { start: Date; end: Date }
  ): Promise<AnomalyReport> {
    const usageTracker = getUsageTracker(this.logger);
    
    // Fetch historical usage data
    const report = await usageTracker.getReport({
      agentId,
      startDate: timeRange.start,
      endDate: timeRange.end,
      groupBy: 'day'
    });

    // Convert to stats array
    const stats = Object.values(report.breakdown);
    
    if (stats.length < this.config.minimumDataPoints) {
      this.logger?.warn(`Insufficient data for spike analysis: ${stats.length} data points`);
      return {
        agentId,
        metric,
        timeRange,
        anomalies: [],
        statistics: {
          mean: 0,
          median: 0,
          stdDev: 0,
          min: 0,
          max: 0,
          q1: 0,
          q3: 0,
          iqr: 0
        },
        recommendations: ['Insufficient historical data for analysis']
      };
    }

    // Detect anomalies
    const anomalies = await this.detectAnomalies(stats, {
      metrics: [metric]
    });

    // Calculate statistics
    const values = this.extractMetricValues(stats, metric);
    const statistics = this.calculateStatistics(values);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      anomalies,
      statistics,
      metric
    );

    return {
      agentId,
      metric,
      timeRange,
      anomalies,
      statistics,
      recommendations
    };
  }

  /**
   * Run daily batch analysis for all agents
   */
  async runDailyBatch(): Promise<BatchResult> {
    const startTime = Date.now();
    const usageTracker = getUsageTracker(this.logger);
    
    // Get all agents with activity in the last lookback period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.config.lookbackPeriod);

    const report = await usageTracker.getReport({
      startDate,
      endDate,
      groupBy: 'agent'
    });

    const agents = Object.keys(report.breakdown);
    const allAnomalies: Anomaly[] = [];
    const errors: Array<{ agentId: string; error: string }> = [];

    this.logger?.info(`[Anomaly Detection] Running daily batch for ${agents.length} agents...`);

    // Analyze each agent
    for (const agentId of agents) {
      try {
        const agentReport = await usageTracker.getReport({
          agentId,
          startDate,
          endDate,
          groupBy: 'day'
        });

        const stats = Object.values(agentReport.breakdown);
        
        if (stats.length >= this.config.minimumDataPoints) {
          const anomalies = await this.detectAnomalies(stats);
          allAnomalies.push(...anomalies);
        }
      } catch (error) {
        errors.push({
          agentId,
          error: error instanceof Error ? error.message : String(error)
        });
        this.logger?.error(`[Anomaly Detection] Error analyzing ${agentId}:`, error);
      }
    }

    const duration = Date.now() - startTime;

    this.logger?.info(
      `[Anomaly Detection] Batch complete: ${allAnomalies.length} anomalies detected in ${duration}ms`
    );

    return {
      totalAgents: agents.length,
      analyzedAgents: agents.length - errors.length,
      anomaliesDetected: allAnomalies.length,
      duration,
      errors,
      anomalies: allAnomalies
    };
  }

  /**
   * Generate recommendations based on anomalies
   */
  private generateRecommendations(
    anomalies: Anomaly[],
    statistics: Statistics,
    metric: AnomalyMetric
  ): string[] {
    const recommendations: string[] = [];

    if (anomalies.length === 0) {
      recommendations.push('No anomalies detected - usage patterns are normal');
      return recommendations;
    }

    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    const warningCount = anomalies.filter(a => a.severity === 'warning').length;

    if (criticalCount > 0) {
      recommendations.push(
        `⚠️ CRITICAL: ${criticalCount} critical ${metric} spike(s) detected - immediate investigation recommended`
      );
    }

    if (warningCount > 0) {
      recommendations.push(
        `⚡ WARNING: ${warningCount} ${metric} anomal(ies) detected - monitor closely`
      );
    }

    // Metric-specific recommendations
    switch (metric) {
      case 'cost':
        if (criticalCount > 0) {
          recommendations.push('Consider implementing cost caps or reviewing agent configurations');
        }
        recommendations.push(`Normal cost range: $${statistics.min.toFixed(2)} - $${statistics.max.toFixed(2)}`);
        break;

      case 'tokens':
        if (criticalCount > 0) {
          recommendations.push('Review context optimization settings and prompt templates');
        }
        recommendations.push(`Typical token usage: ${Math.round(statistics.mean)} tokens`);
        break;

      case 'errors':
        if (criticalCount > 0) {
          recommendations.push('Check agent logs for error patterns and investigate root causes');
        }
        break;

      case 'latency':
        if (criticalCount > 0) {
          recommendations.push('Investigate performance bottlenecks or external service issues');
        }
        break;
    }

    return recommendations;
  }

  /**
   * Detect anomalies for a specific metric
   */
  private async detectMetricAnomalies(
    stats: UsageStats[],
    metric: AnomalyMetric,
    config: AnomalyDetectionConfig
  ): Promise<Anomaly[]> {
    const values = this.extractMetricValues(stats, metric);
    const statistics = this.calculateStatistics(values);

    const anomalies: Anomaly[] = [];

    // Detect anomalies using configured method
    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      const value = values[i];
      
      const anomaly = this.checkAnomaly(
        stat,
        value,
        metric,
        statistics,
        config
      );

      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Check if a value is an anomaly
   */
  private checkAnomaly(
    stat: UsageStats,
    value: number,
    metric: AnomalyMetric,
    statistics: Statistics,
    config: AnomalyDetectionConfig
  ): Anomaly | null {
    let deviation: number;
    let baseline: number;

    switch (config.method) {
      case 'zscore':
        deviation = Math.abs(value - statistics.mean) / statistics.stdDev;
        baseline = statistics.mean;
        break;

      case 'iqr':
        const lowerBound = statistics.q1 - 1.5 * statistics.iqr;
        const upperBound = statistics.q3 + 1.5 * statistics.iqr;
        
        if (value < lowerBound || value > upperBound) {
          deviation = Math.max(
            Math.abs(value - lowerBound),
            Math.abs(value - upperBound)
          ) / statistics.iqr;
          baseline = statistics.median;
        } else {
          return null;
        }
        break;

      case 'moving_average':
        // Simplified moving average - could be enhanced
        baseline = statistics.mean;
        deviation = Math.abs(value - baseline) / statistics.stdDev;
        break;

      default:
        return null;
    }

    // Determine severity based on deviation
    let severity: AnomalySeverity | null = null;
    
    if (deviation >= config.thresholds.critical) {
      severity = 'critical';
    } else if (deviation >= config.thresholds.warning) {
      severity = 'warning';
    } else if (deviation >= config.thresholds.info) {
      severity = 'info';
    }

    if (!severity) {
      return null;
    }

    // Calculate confidence score (0-1)
    const confidence = Math.min(1, deviation / config.thresholds.critical);

    // Calculate anomaly score (0-100)
    const score = Math.min(100, (deviation / config.thresholds.critical) * 100);

    return {
      id: this.generateAnomalyId(stat, metric),
      timestamp: new Date(),
      agentId: stat.agentId || 'unknown',
      metric,
      severity,
      score,
      confidence,
      baseline,
      observed: value,
      deviation,
      method: config.method,
      context: {
        period: stat.period,
        statistics: {
          mean: statistics.mean,
          stdDev: statistics.stdDev,
          median: statistics.median
        }
      },
      resolved: false
    };
  }

  /**
   * Extract metric values from usage statistics
   */
  private extractMetricValues(
    stats: UsageStats[],
    metric: AnomalyMetric
  ): number[] {
    return stats.map(stat => {
      switch (metric) {
        case 'cost':
          return stat.totalCost;
        case 'tokens':
          return stat.totalTokens;
        case 'errors':
          return stat.errors;
        case 'latency':
          return stat.averageDuration;
        case 'calls':
          return stat.totalCalls;
        default:
          return 0;
      }
    });
  }

  /**
   * Calculate statistical measures
   */
  private calculateStatistics(values: number[]): Statistics {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    // Basic stats
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];
    
    // Standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[n - 1],
      q1,
      q3,
      iqr
    };
  }

  /**
   * Filter statistics based on configuration
   */
  private filterStats(
    stats: UsageStats[],
    config: AnomalyDetectionConfig
  ): UsageStats[] {
    let filtered = [...stats];

    // Filter by lookback period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.lookbackPeriod);
    
    // Note: This assumes stats have a timestamp in period string
    // In production, we'd need proper date parsing

    return filtered;
  }

  /**
   * Generate unique anomaly ID
   */
  private generateAnomalyId(stat: UsageStats, metric: AnomalyMetric): string {
    const timestamp = Date.now();
    const agentId = stat.agentId || 'unknown';
    return `anomaly-${agentId}-${metric}-${timestamp}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnomalyDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnomalyDetectionConfig {
    return { ...this.config };
  }
}

/**
 * Global anomaly detector instance
 */
let globalDetector: AnomalyDetector | null = null;

/**
 * Get or create global anomaly detector
 */
export function getAnomalyDetector(logger?: Logger): AnomalyDetector {
  if (!globalDetector) {
    globalDetector = new AnomalyDetector(undefined, logger);
  }
  return globalDetector;
}

/**
 * Set global anomaly detector
 */
export function setAnomalyDetector(detector: AnomalyDetector | null): void {
  globalDetector = detector;
}
