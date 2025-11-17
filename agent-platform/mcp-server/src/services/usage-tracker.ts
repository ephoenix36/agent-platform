/**
 * Usage Tracker Service
 * 
 * Tracks agent execution usage, calculates costs, and generates analytics
 */

import { Logger } from "../utils/logging.js";

// Model pricing per million tokens (input/output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'o1-preview': { input: 15, output: 60 },
  'o1-mini': { input: 3, output: 12 },
  
  // Anthropic Claude
  'claude-4.5-sonnet': { input: 3, output: 15 },
  'claude-sonnet-4.5-haiku': { input: 1, output: 5 },
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  
  // Google Gemini
  'gemini-2.5-pro': { input: 1.25, output: 5 },
  'gemini-2.5-flash': { input: 0.075, output: 0.3 },
  'gemini-pro': { input: 0.5, output: 1.5 },
  
  // X.AI Grok
  'grok-code-fast': { input: 5, output: 15 },
  'grok-beta': { input: 5, output: 15 },
  
  // Default pricing for unknown models
  'default': { input: 2, output: 6 }
};

/**
 * Usage event interface
 */
export interface UsageEvent {
  id: string;
  timestamp: Date;
  agentId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

/**
 * Usage statistics interface
 */
export interface UsageStats {
  agentId?: string;
  period: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  averageTokens: number;
  averageDuration: number;
  models: Record<string, number>;
  errors: number;
  successRate: number;
}

/**
 * Report options interface
 */
export interface ReportOptions {
  startDate?: Date;
  endDate?: Date;
  agentId?: string;
  model?: string;
  groupBy?: 'agent' | 'model' | 'day' | 'hour';
}

/**
 * Usage report interface
 */
export interface UsageReport {
  summary: {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    period: { start: Date; end: Date };
  };
  breakdown: Record<string, UsageStats>;
}

/**
 * Usage Tracker Service
 * 
 * In-memory storage for now; can be extended to use collections
 */
export class UsageTracker {
  private events: UsageEvent[] = [];
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || console as any;
  }

  /**
   * Track an agent execution
   */
  async trackExecution(event: UsageEvent): Promise<void> {
    // Validate event
    if (!event.id || !event.agentId || !event.model) {
      throw new Error('Invalid usage event: missing required fields');
    }

    // Calculate cost if not provided
    if (event.cost === 0 || !event.cost) {
      event.cost = this.calculateCost(
        event.model,
        event.promptTokens,
        event.completionTokens
      );
    }

    // Store event
    this.events.push(event);

    // Log for monitoring
    this.logger.info?.(`[Usage] ${event.agentId} | ${event.model} | ${event.totalTokens} tokens | $${event.cost.toFixed(4)}`);
  }

  /**
   * Calculate cost based on model and token usage
   */
  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Find pricing for model
    let pricing = MODEL_PRICING[model];
    
    if (!pricing) {
      // Try to match by prefix
      const modelPrefix = model.split('-')[0];
      const matchingKey = Object.keys(MODEL_PRICING).find(key => 
        key.startsWith(modelPrefix)
      );
      pricing = matchingKey ? MODEL_PRICING[matchingKey] : MODEL_PRICING['default'];
    }

    // Calculate cost (pricing is per million tokens)
    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Get usage statistics
   */
  async getStats(agentId?: string, period?: string): Promise<UsageStats> {
    // Filter events
    let filtered = this.events;
    
    if (agentId) {
      filtered = filtered.filter(e => e.agentId === agentId);
    }

    if (period) {
      const now = new Date();
      const cutoff = this.getPeriodCutoff(now, period);
      filtered = filtered.filter(e => e.timestamp >= cutoff);
    }

    // Calculate statistics
    const totalCalls = filtered.length;
    const totalTokens = filtered.reduce((sum, e) => sum + e.totalTokens, 0);
    const totalCost = filtered.reduce((sum, e) => sum + e.cost, 0);
    const totalDuration = filtered.reduce((sum, e) => sum + e.duration, 0);
    const errors = filtered.filter(e => !e.success).length;

    // Model breakdown
    const models: Record<string, number> = {};
    filtered.forEach(e => {
      models[e.model] = (models[e.model] || 0) + 1;
    });

    return {
      agentId,
      period: period || 'all-time',
      totalCalls,
      totalTokens,
      totalCost,
      averageTokens: totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0,
      averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      models,
      errors,
      successRate: totalCalls > 0 ? (totalCalls - errors) / totalCalls : 0
    };
  }

  /**
   * Generate usage report
   */
  async getReport(options: ReportOptions = {}): Promise<UsageReport> {
    const { startDate, endDate, agentId, model, groupBy = 'agent' } = options;

    // Filter events
    let filtered = this.events;

    if (startDate) {
      filtered = filtered.filter(e => e.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(e => e.timestamp <= endDate);
    }

    if (agentId) {
      filtered = filtered.filter(e => e.agentId === agentId);
    }

    if (model) {
      filtered = filtered.filter(e => e.model === model);
    }

    // Calculate summary
    const summary = {
      totalCalls: filtered.length,
      totalTokens: filtered.reduce((sum, e) => sum + e.totalTokens, 0),
      totalCost: filtered.reduce((sum, e) => sum + e.cost, 0),
      period: {
        start: startDate || (filtered.length > 0 ? filtered[0].timestamp : new Date()),
        end: endDate || new Date()
      }
    };

    // Calculate breakdown
    const breakdown: Record<string, UsageStats> = {};

    if (groupBy === 'agent') {
      const agents = [...new Set(filtered.map(e => e.agentId))];
      for (const agent of agents) {
        breakdown[agent] = await this.getStatsForEvents(
          filtered.filter(e => e.agentId === agent),
          agent
        );
      }
    } else if (groupBy === 'model') {
      const models = [...new Set(filtered.map(e => e.model))];
      for (const modelName of models) {
        breakdown[modelName] = await this.getStatsForEvents(
          filtered.filter(e => e.model === modelName),
          undefined,
          modelName
        );
      }
    }

    return { summary, breakdown };
  }

  /**
   * Export usage data
   */
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.events, null, 2);
    } else if (format === 'csv') {
      const headers = [
        'timestamp',
        'agentId',
        'model',
        'promptTokens',
        'completionTokens',
        'totalTokens',
        'cost',
        'duration',
        'success',
        'error'
      ];

      const rows = this.events.map(e => [
        e.timestamp.toISOString(),
        e.agentId,
        e.model,
        e.promptTokens.toString(),
        e.completionTokens.toString(),
        e.totalTokens.toString(),
        e.cost.toFixed(6),
        e.duration.toString(),
        e.success.toString(),
        e.error || ''
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Clear all events (for testing)
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get period cutoff date
   */
  private getPeriodCutoff(now: Date, period: string): Date {
    const cutoff = new Date(now);
    
    switch (period) {
      case 'hour':
        cutoff.setHours(cutoff.getHours() - 1);
        break;
      case 'day':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      default:
        return new Date(0); // Beginning of time
    }
    
    return cutoff;
  }

  /**
   * Calculate stats for a set of events
   */
  private async getStatsForEvents(
    events: UsageEvent[],
    agentId?: string,
    model?: string
  ): Promise<UsageStats> {
    const totalCalls = events.length;
    const totalTokens = events.reduce((sum, e) => sum + e.totalTokens, 0);
    const totalCost = events.reduce((sum, e) => sum + e.cost, 0);
    const totalDuration = events.reduce((sum, e) => sum + e.duration, 0);
    const errors = events.filter(e => !e.success).length;

    const models: Record<string, number> = {};
    events.forEach(e => {
      models[e.model] = (models[e.model] || 0) + 1;
    });

    return {
      agentId,
      period: 'custom',
      totalCalls,
      totalTokens,
      totalCost,
      averageTokens: totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0,
      averageDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      models,
      errors,
      successRate: totalCalls > 0 ? (totalCalls - errors) / totalCalls : 0
    };
  }
}

// Global instance
let globalTracker: UsageTracker | null = null;

/**
 * Get or create global usage tracker
 */
export function getUsageTracker(logger?: Logger): UsageTracker {
  if (!globalTracker) {
    globalTracker = new UsageTracker(logger);
  }
  return globalTracker;
}

/**
 * Set global usage tracker (for testing)
 */
export function setUsageTracker(tracker: UsageTracker | null): void {
  globalTracker = tracker;
}
