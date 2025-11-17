/**
 * Alert Routing System
 * 
 * Routes anomaly alerts through multiple channels
 */

import { Logger } from "../utils/logging.js";
import { Anomaly, AnomalySeverity } from "../services/anomaly-detector.js";
import { EventEmitter } from "events";

/**
 * Alert channel types
 */
export type AlertChannel = 'widget' | 'email' | 'slack' | 'webhook';

/**
 * Alert routing configuration
 */
export interface AlertRoute {
  severity: AnomalySeverity;
  channels: AlertChannel[];
  rateLimit?: {
    maxPerHour?: number;
    maxPerDay?: number;
  };
  createTask?: boolean;
  taskPriority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Alert delivery result
 */
export interface AlertResult {
  anomalyId: string;
  success: boolean;
  deliveries: Array<{
    channel: AlertChannel;
    success: boolean;
    error?: string;
  }>;
  taskCreated?: boolean;
  taskId?: string;
}

/**
 * Default alert routing configuration
 */
const DEFAULT_ROUTES: AlertRoute[] = [
  {
    severity: 'info',
    channels: ['widget'],
    rateLimit: { maxPerHour: 10 }
  },
  {
    severity: 'warning',
    channels: ['widget', 'email'],
    rateLimit: { maxPerHour: 5 }
  },
  {
    severity: 'critical',
    channels: ['widget', 'email', 'slack'],
    createTask: true,
    taskPriority: 'critical',
    rateLimit: { maxPerHour: 3 }
  }
];

/**
 * Alert Router
 * 
 * Manages alert routing and delivery
 */
export class AlertRouter extends EventEmitter {
  private routes: AlertRoute[];
  private logger: Logger;
  private alertCounts: Map<string, number> = new Map(); // channel:hour -> count
  private lastCleanup: Date = new Date();

  constructor(routes?: AlertRoute[], logger?: Logger) {
    super();
    this.routes = routes || DEFAULT_ROUTES;
    this.logger = logger || console as any;
  }

  /**
   * Route an anomaly alert
   */
  async routeAlert(anomaly: Anomaly): Promise<AlertResult> {
    const route = this.routes.find(r => r.severity === anomaly.severity);
    
    if (!route) {
      this.logger.warn(`[Alert Router] No route configured for severity: ${anomaly.severity}`);
      return {
        anomalyId: anomaly.id,
        success: false,
        deliveries: []
      };
    }

    this.logger.info(
      `[Alert Router] Routing ${anomaly.severity} alert for ${anomaly.agentId} ` +
      `(${anomaly.metric}: ${anomaly.observed})`
    );

    const result: AlertResult = {
      anomalyId: anomaly.id,
      success: true,
      deliveries: []
    };

    // Check rate limits
    this.cleanupOldCounts();

    // Deliver to each channel
    for (const channel of route.channels) {
      if (this.isRateLimited(channel, route)) {
        this.logger.warn(`[Alert Router] Rate limit exceeded for ${channel}`);
        result.deliveries.push({
          channel,
          success: false,
          error: 'Rate limit exceeded'
        });
        continue;
      }

      try {
        await this.deliverToChannel(channel, anomaly);
        this.incrementCount(channel);
        
        result.deliveries.push({
          channel,
          success: true
        });
      } catch (error) {
        this.logger.error(`[Alert Router] Failed to deliver to ${channel}:`, error);
        result.deliveries.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        result.success = false;
      }
    }

    // Create task if configured
    if (route.createTask) {
      try {
        const taskId = await this.createAnomalyTask(anomaly, route.taskPriority);
        result.taskCreated = true;
        result.taskId = taskId;
      } catch (error) {
        this.logger.error('[Alert Router] Failed to create task:', error);
      }
    }

    this.emit('alert-routed', result);
    return result;
  }

  /**
   * Deliver alert to specific channel
   */
  private async deliverToChannel(channel: AlertChannel, anomaly: Anomaly): Promise<void> {
    switch (channel) {
      case 'widget':
        await this.deliverToWidget(anomaly);
        break;
      
      case 'email':
        await this.deliverToEmail(anomaly);
        break;
      
      case 'slack':
        await this.deliverToSlack(anomaly);
        break;
      
      case 'webhook':
        await this.deliverToWebhook(anomaly);
        break;
    }
  }

  /**
   * Deliver to widget
   */
  private async deliverToWidget(anomaly: Anomaly): Promise<void> {
    // Send widget message
    this.logger.info(`[Alert Router] Widget notification: ${anomaly.id}`);
    
    this.emit('widget-alert', {
      type: 'anomaly',
      severity: anomaly.severity,
      anomaly: {
        id: anomaly.id,
        agentId: anomaly.agentId,
        metric: anomaly.metric,
        observed: anomaly.observed,
        baseline: anomaly.baseline,
        timestamp: anomaly.timestamp
      }
    });
  }

  /**
   * Deliver to email
   */
  private async deliverToEmail(anomaly: Anomaly): Promise<void> {
    // In production, integrate with email service
    this.logger.info(`[Alert Router] Email notification: ${anomaly.id}`);
    
    const subject = `⚠️ ${anomaly.severity.toUpperCase()} Anomaly Detected: ${anomaly.agentId}`;
    const body = `
Anomaly Detection Alert

Severity: ${anomaly.severity}
Agent: ${anomaly.agentId}
Metric: ${anomaly.metric}
Observed: ${anomaly.observed.toFixed(2)}
Baseline: ${anomaly.baseline.toFixed(2)}
Deviation: ${anomaly.deviation.toFixed(2)}σ
Time: ${anomaly.timestamp.toISOString()}

Score: ${anomaly.score.toFixed(0)}/100
Confidence: ${(anomaly.confidence * 100).toFixed(0)}%

Please investigate this anomaly immediately.
    `.trim();

    // Emit event for email service integration
    this.emit('email-alert', {
      subject,
      body,
      anomalyId: anomaly.id
    });
  }

  /**
   * Deliver to Slack
   */
  private async deliverToSlack(anomaly: Anomaly): Promise<void> {
    // In production, integrate with Slack API
    this.logger.info(`[Alert Router] Slack notification: ${anomaly.id}`);
    
    const severityEmoji = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'critical': '🚨'
    };

    const message = {
      text: `${severityEmoji[anomaly.severity]} *${anomaly.severity.toUpperCase()}* Anomaly Detected`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Agent:* ${anomaly.agentId}\n*Metric:* ${anomaly.metric}\n*Observed:* ${anomaly.observed.toFixed(2)} (baseline: ${anomaly.baseline.toFixed(2)})`
          }
        }
      ]
    };

    this.emit('slack-alert', message);
  }

  /**
   * Deliver to webhook
   */
  private async deliverToWebhook(anomaly: Anomaly): Promise<void> {
    this.logger.info(`[Alert Router] Webhook notification: ${anomaly.id}`);
    
    this.emit('webhook-alert', {
      event: 'anomaly.detected',
      anomaly
    });
  }

  /**
   * Create PM task for anomaly investigation
   */
  private async createAnomalyTask(
    anomaly: Anomaly,
    priority: string = 'high'
  ): Promise<string> {
    // In production, integrate with PM tools
    const taskId = `anomaly-task-${Date.now()}`;
    
    this.logger.info(`[Alert Router] Creating task ${taskId} for anomaly ${anomaly.id}`);
    
    const taskData = {
      title: `Investigate ${anomaly.severity} ${anomaly.metric} anomaly: ${anomaly.agentId}`,
      description: `
Anomaly detected requiring investigation:

**Severity:** ${anomaly.severity}
**Agent:** ${anomaly.agentId}
**Metric:** ${anomaly.metric}
**Observed Value:** ${anomaly.observed.toFixed(2)}
**Expected (Baseline):** ${anomaly.baseline.toFixed(2)}
**Deviation:** ${anomaly.deviation.toFixed(2)}σ
**Detection Time:** ${anomaly.timestamp.toISOString()}

**Anomaly Score:** ${anomaly.score.toFixed(0)}/100
**Confidence:** ${(anomaly.confidence * 100).toFixed(0)}%

Please investigate the root cause and take appropriate action.
      `.trim(),
      priority,
      labels: ['anomaly', anomaly.severity, anomaly.metric],
      metadata: {
        anomalyId: anomaly.id,
        agentId: anomaly.agentId
      }
    };

    this.emit('task-created', taskData);
    
    return taskId;
  }

  /**
   * Check if rate limited
   */
  private isRateLimited(channel: AlertChannel, route: AlertRoute): boolean {
    if (!route.rateLimit) return false;

    const hourKey = `${channel}:${this.getCurrentHour()}`;
    const dayKey = `${channel}:${this.getCurrentDay()}`;

    const hourCount = this.alertCounts.get(hourKey) || 0;
    const dayCount = this.alertCounts.get(dayKey) || 0;

    if (route.rateLimit.maxPerHour && hourCount >= route.rateLimit.maxPerHour) {
      return true;
    }

    if (route.rateLimit.maxPerDay && dayCount >= route.rateLimit.maxPerDay) {
      return true;
    }

    return false;
  }

  /**
   * Increment alert count
   */
  private incrementCount(channel: AlertChannel): void {
    const hourKey = `${channel}:${this.getCurrentHour()}`;
    const dayKey = `${channel}:${this.getCurrentDay()}`;

    this.alertCounts.set(hourKey, (this.alertCounts.get(hourKey) || 0) + 1);
    this.alertCounts.set(dayKey, (this.alertCounts.get(dayKey) || 0) + 1);
  }

  /**
   * Clean up old counts
   */
  private cleanupOldCounts(): void {
    const now = new Date();
    
    // Clean up every hour
    if (now.getTime() - this.lastCleanup.getTime() < 60 * 60 * 1000) {
      return;
    }

    const currentHour = this.getCurrentHour();
    const currentDay = this.getCurrentDay();

    for (const [key] of this.alertCounts) {
      const [, timestamp] = key.split(':');
      
      // Remove old hour keys
      if (timestamp.includes(':') && timestamp !== currentHour) {
        this.alertCounts.delete(key);
      }
      
      // Remove old day keys
      if (!timestamp.includes(':') && timestamp !== currentDay) {
        this.alertCounts.delete(key);
      }
    }

    this.lastCleanup = now;
  }

  /**
   * Get current hour key
   */
  private getCurrentHour(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}:${now.getHours()}`;
  }

  /**
   * Get current day key
   */
  private getCurrentDay(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  }

  /**
   * Update routing configuration
   */
  updateRoutes(routes: AlertRoute[]): void {
    this.routes = routes;
    this.logger.info('[Alert Router] Routes updated');
  }

  /**
   * Get current routes
   */
  getRoutes(): AlertRoute[] {
    return [...this.routes];
  }
}

/**
 * Global router instance
 */
let globalRouter: AlertRouter | null = null;

/**
 * Get or create global router
 */
export function getAlertRouter(logger?: Logger): AlertRouter {
  if (!globalRouter) {
    globalRouter = new AlertRouter(undefined, logger);
  }
  return globalRouter;
}

/**
 * Set global router
 */
export function setAlertRouter(router: AlertRouter | null): void {
  globalRouter = router;
}
