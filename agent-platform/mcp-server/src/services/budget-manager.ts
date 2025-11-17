/**
 * Budget Manager Service
 * 
 * Manages budgets, quotas, and rate limiting for agent executions
 */

import { EventEmitter } from 'events';
import { Logger } from "../utils/logging.js";

export type BudgetType = 'token' | 'cost' | 'calls';
export type BudgetPeriod = 'hour' | 'day' | 'week' | 'month' | 'total';

/**
 * Budget interface
 */
export interface Budget {
  id: string;
  agentId?: string;  // undefined = global budget
  type: BudgetType;
  limit: number;
  period: BudgetPeriod;
  current: number;
  alertThreshold: number;  // 0.8 = 80%
  enforceLimit: boolean;
  resetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Budget creation parameters
 */
export interface CreateBudgetParams {
  agentId?: string;
  type: BudgetType;
  limit: number;
  period: BudgetPeriod;
  alertThreshold: number;
  enforceLimit: boolean;
}

/**
 * Budget check result
 */
export interface BudgetCheckResult {
  allowed: boolean;
  remaining: number;
  percentUsed: number;
  reason?: string;
  warning?: string;
}

/**
 * Budget status
 */
export interface BudgetStatus {
  id: string;
  type: BudgetType;
  limit: number;
  current: number;
  remaining: number;
  percentUsed: number;
  resetAt?: Date;
  enforceLimit: boolean;
}

/**
 * Rate limit configuration
 */
export interface RateLimit {
  agentId: string;
  maxCallsPerMinute: number;
  maxCallsPerHour: number;
  burstAllowance?: number;
  currentWindow: {
    minute: { calls: number; resetAt: Date };
    hour: { calls: number; resetAt: Date };
  };
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;  // seconds
}

/**
 * Budget Manager Service
 */
export class BudgetManager extends EventEmitter {
  private budgets: Map<string, Budget> = new Map();
  private rateLimits: Map<string, RateLimit> = new Map();
  private logger: Logger;
  private resetTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(logger?: Logger) {
    super();
    this.logger = logger || console as any;
  }

  /**
   * Create a new budget
   */
  async createBudget(params: CreateBudgetParams): Promise<Budget> {
    const id = `budget_${params.agentId || 'global'}_${params.type}_${Date.now()}`;
    
    const budget: Budget = {
      id,
      agentId: params.agentId,
      type: params.type,
      limit: params.limit,
      period: params.period,
      current: 0,
      alertThreshold: params.alertThreshold,
      enforceLimit: params.enforceLimit,
      resetAt: params.period !== 'total' ? this.calculateResetTime(params.period) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.budgets.set(id, budget);

    // Schedule automatic reset if needed
    if (budget.resetAt) {
      this.scheduleReset(budget);
    }

    this.logger.info?.(`[Budget] Created ${params.type} budget for ${params.agentId || 'global'}: ${params.limit} per ${params.period}`);

    return budget;
  }

  /**
   * Check if execution is allowed under budget
   */
  async checkBudget(agentId: string, type: BudgetType, amount: number): Promise<BudgetCheckResult> {
    // Find applicable budgets (agent-specific and global)
    const agentBudgets = Array.from(this.budgets.values()).filter(
      b => b.type === type && (b.agentId === agentId || !b.agentId)
    );

    if (agentBudgets.length === 0) {
      // No budget configured, allow by default
      return {
        allowed: true,
        remaining: Infinity,
        percentUsed: 0
      };
    }

    // Check each budget
    for (const budget of agentBudgets) {
      const newTotal = budget.current + amount;
      const percentUsed = (newTotal / budget.limit) * 100;
      const remaining = budget.limit - newTotal;

      // Check if over budget
      if (newTotal > budget.limit) {
        if (budget.enforceLimit) {
          return {
            allowed: false,
            remaining: budget.limit - budget.current,
            percentUsed: (budget.current / budget.limit) * 100,
            reason: `Budget exceeded: ${budget.type} limit of ${budget.limit} would be exceeded (current: ${budget.current}, requested: ${amount})`
          };
        } else {
          // Warning but allow
          return {
            allowed: true,
            remaining,
            percentUsed,
            warning: `Budget exceeded but enforcement disabled: ${budget.type} over limit`
          };
        }
      }

      // Check if approaching threshold
      if (percentUsed >= budget.alertThreshold * 100 && budget.current < budget.limit * budget.alertThreshold) {
        this.emit('alert', {
          level: 'warning',
          budgetId: budget.id,
          agentId: budget.agentId,
          type: budget.type,
          percentUsed,
          threshold: budget.alertThreshold * 100,
          message: `Budget threshold reached: ${percentUsed.toFixed(1)}% of ${budget.type} budget used`
        });
      }
    }

    // All checks passed
    const primaryBudget = agentBudgets[0];
    return {
      allowed: true,
      remaining: primaryBudget.limit - (primaryBudget.current + amount),
      percentUsed: ((primaryBudget.current + amount) / primaryBudget.limit) * 100
    };
  }

  /**
   * Consume budget after execution
   */
  async consumeBudget(agentId: string, type: BudgetType, amount: number): Promise<void> {
    const budgets = Array.from(this.budgets.values()).filter(
      b => b.type === type && (b.agentId === agentId || !b.agentId)
    );

    for (const budget of budgets) {
      budget.current += amount;
      budget.updatedAt = new Date();

      this.logger.debug?.(`[Budget] Consumed ${amount} ${type} for ${agentId || 'global'} (${budget.current}/${budget.limit})`);

      // Check if limit reached
      if (budget.current >= budget.limit && budget.enforceLimit) {
        this.emit('alert', {
          level: 'error',
          budgetId: budget.id,
          agentId: budget.agentId,
          type: budget.type,
          percentUsed: 100,
          message: `Budget limit reached: ${budget.type} budget exhausted`
        });
      }
    }
  }

  /**
   * Get budget status
   */
  async getBudgetStatus(agentId: string, type: BudgetType): Promise<BudgetStatus> {
    const budget = Array.from(this.budgets.values()).find(
      b => b.type === type && b.agentId === agentId
    );

    if (!budget) {
      throw new Error(`No ${type} budget found for agent ${agentId}`);
    }

    return {
      id: budget.id,
      type: budget.type,
      limit: budget.limit,
      current: budget.current,
      remaining: budget.limit - budget.current,
      percentUsed: Math.round((budget.current / budget.limit) * 100),
      resetAt: budget.resetAt,
      enforceLimit: budget.enforceLimit
    };
  }

  /**
   * Get budget by ID
   */
  async getBudget(id: string): Promise<Budget> {
    const budget = this.budgets.get(id);
    if (!budget) {
      throw new Error(`Budget not found: ${id}`);
    }
    return budget;
  }

  /**
   * List budgets
   */
  async listBudgets(agentId?: string): Promise<Budget[]> {
    if (agentId) {
      return Array.from(this.budgets.values()).filter(b => b.agentId === agentId);
    }
    return Array.from(this.budgets.values()).filter(b => !b.agentId);
  }

  /**
   * Update budget
   */
  async updateBudget(id: string, updates: Partial<Pick<Budget, 'limit' | 'alertThreshold' | 'enforceLimit'>>): Promise<Budget> {
    const budget = await this.getBudget(id);

    if (updates.limit !== undefined) budget.limit = updates.limit;
    if (updates.alertThreshold !== undefined) budget.alertThreshold = updates.alertThreshold;
    if (updates.enforceLimit !== undefined) budget.enforceLimit = updates.enforceLimit;

    budget.updatedAt = new Date();

    this.logger.info?.(`[Budget] Updated budget ${id}`);

    return budget;
  }

  /**
   * Delete budget
   */
  async deleteBudget(id: string): Promise<void> {
    const budget = await this.getBudget(id);
    
    // Clear reset timer if exists
    const timer = this.resetTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.resetTimers.delete(id);
    }

    this.budgets.delete(id);

    this.logger.info?.(`[Budget] Deleted budget ${id}`);
  }

  /**
   * Reset budget (called automatically at period end)
   */
  private async resetBudget(budgetId: string): Promise<void> {
    const budget = this.budgets.get(budgetId);
    if (!budget) return;

    budget.current = 0;
    budget.resetAt = this.calculateResetTime(budget.period);
    budget.updatedAt = new Date();

    this.logger.info?.(`[Budget] Reset budget ${budgetId} for ${budget.agentId || 'global'}`);

    this.emit('reset', {
      budgetId: budget.id,
      agentId: budget.agentId,
      type: budget.type
    });

    // Schedule next reset
    this.scheduleReset(budget);
  }

  /**
   * Set rate limit for agent
   */
  async setRateLimit(agentId: string, config: Pick<RateLimit, 'maxCallsPerMinute' | 'maxCallsPerHour' | 'burstAllowance'>): Promise<void> {
    const now = new Date();
    
    const rateLimit: RateLimit = {
      agentId,
      maxCallsPerMinute: config.maxCallsPerMinute,
      maxCallsPerHour: config.maxCallsPerHour,
      burstAllowance: config.burstAllowance,
      currentWindow: {
        minute: { calls: 0, resetAt: new Date(now.getTime() + 60000) },
        hour: { calls: 0, resetAt: new Date(now.getTime() + 3600000) }
      }
    };

    this.rateLimits.set(agentId, rateLimit);

    this.logger.info?.(`[RateLimit] Set rate limit for ${agentId}: ${config.maxCallsPerMinute}/min, ${config.maxCallsPerHour}/hour`);
  }

  /**
   * Check rate limit
   */
  async checkRateLimit(agentId: string): Promise<RateLimitCheckResult> {
    const limit = this.rateLimits.get(agentId);
    
    if (!limit) {
      return { allowed: true };
    }

    const now = new Date();

    // Check minute window
    if (now >= limit.currentWindow.minute.resetAt) {
      limit.currentWindow.minute.calls = 0;
      limit.currentWindow.minute.resetAt = new Date(now.getTime() + 60000);
    }

    // Check hour window
    if (now >= limit.currentWindow.hour.resetAt) {
      limit.currentWindow.hour.calls = 0;
      limit.currentWindow.hour.resetAt = new Date(now.getTime() + 3600000);
    }

    const effectiveMinuteLimit = limit.maxCallsPerMinute + (limit.burstAllowance || 0);

    // Check limits
    if (limit.currentWindow.minute.calls >= effectiveMinuteLimit) {
      const retryAfter = Math.ceil((limit.currentWindow.minute.resetAt.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${limit.maxCallsPerMinute} calls per minute`,
        retryAfter
      };
    }

    if (limit.currentWindow.hour.calls >= limit.maxCallsPerHour) {
      const retryAfter = Math.ceil((limit.currentWindow.hour.resetAt.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${limit.maxCallsPerHour} calls per hour`,
        retryAfter
      };
    }

    return { allowed: true };
  }

  /**
   * Record a call for rate limiting
   */
  async recordCall(agentId: string): Promise<void> {
    const limit = this.rateLimits.get(agentId);
    if (!limit) return;

    limit.currentWindow.minute.calls++;
    limit.currentWindow.hour.calls++;
  }

  /**
   * Calculate reset time for period
   */
  private calculateResetTime(period: BudgetPeriod): Date {
    const now = new Date();
    
    switch (period) {
      case 'hour':
        return new Date(now.getTime() + 3600 * 1000);
      case 'day':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
      case 'week':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
      case 'month':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        return nextMonth;
      default:
        return new Date(9999, 11, 31);  // Far future for 'total'
    }
  }

  /**
   * Schedule automatic budget reset
   */
  private scheduleReset(budget: Budget): void {
    if (!budget.resetAt) return;

    const timeUntilReset = budget.resetAt.getTime() - Date.now();
    
    if (timeUntilReset > 0) {
      const timer = setTimeout(() => {
        this.resetBudget(budget.id);
      }, timeUntilReset);

      this.resetTimers.set(budget.id, timer);
    }
  }

  /**
   * Clear all budgets and rate limits (for testing)
   */
  clear(): void {
    this.resetTimers.forEach(timer => clearTimeout(timer));
    this.resetTimers.clear();
    this.budgets.clear();
    this.rateLimits.clear();
  }
}

// Global instance
let globalManager: BudgetManager | null = null;

/**
 * Get or create global budget manager
 */
export function getBudgetManager(logger?: Logger): BudgetManager {
  if (!globalManager) {
    globalManager = new BudgetManager(logger);
  }
  return globalManager;
}

/**
 * Set global budget manager (for testing)
 */
export function setBudgetManager(manager: BudgetManager | null): void {
  globalManager = manager;
}
