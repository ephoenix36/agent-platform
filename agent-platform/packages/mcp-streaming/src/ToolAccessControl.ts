import EventEmitter from 'eventemitter3';
import {
  ToolAccessPolicy,
  ToolAccessMode,
  ToolAccessCheckResult,
  ToolMetadata,
  ToolUsageRecord,
} from './types.js';

/**
 * Tool Access Control System
 * Manages which tools agents can access with granular permissions and budget limits
 */
export class ToolAccessControl extends EventEmitter {
  private policies = new Map<string, ToolAccessPolicy>();
  private toolMetadata = new Map<string, ToolMetadata>();
  private usageRecords: ToolUsageRecord[] = [];
  private usageCache = new Map<string, Map<string, number>>(); // agentId -> toolId -> count

  /**
   * Set access policy for an agent
   */
  setPolicy(policy: ToolAccessPolicy): void {
    this.policies.set(policy.agentId, policy);
    this.emit('policy:set', policy);
  }

  /**
   * Get access policy for an agent
   */
  getPolicy(agentId: string): ToolAccessPolicy | undefined {
    return this.policies.get(agentId);
  }

  /**
   * Register tool metadata
   */
  registerTool(metadata: ToolMetadata): void {
    this.toolMetadata.set(metadata.id, metadata);
    this.emit('tool:registered', metadata);
  }

  /**
   * Get tool metadata
   */
  getToolMetadata(toolId: string): ToolMetadata | undefined {
    return this.toolMetadata.get(toolId);
  }

  /**
   * Check if agent can access a tool
   */
  async canAccess(agentId: string, toolId: string): Promise<ToolAccessCheckResult> {
    const policy = this.getResolvedPolicy(agentId);
    const toolMeta = this.toolMetadata.get(toolId);

    // Check mode-based access
    const modeCheck = this.checkModeAccess(policy, toolId);
    if (!modeCheck.allowed) {
      return modeCheck;
    }

    // Check tool-specific approval requirement
    const requiresApproval = 
      policy.requireApproval?.includes(toolId) || 
      toolMeta?.requiresApproval || 
      false;

    // Check budget limits
    const budgetStatus = await this.checkBudget(agentId, toolId, policy);
    if (!budgetStatus.withinBudget) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: 'Budget limit exceeded',
        budgetStatus,
      };
    }

    return {
      allowed: true,
      requiresApproval,
      budgetStatus,
    };
  }

  /**
   * Check mode-based access (all/whitelist/blacklist)
   */
  private checkModeAccess(policy: ToolAccessPolicy, toolId: string): Omit<ToolAccessCheckResult, 'budgetStatus'> {
    if (policy.mode === ToolAccessMode.ALL) {
      return { allowed: true, requiresApproval: false };
    }

    if (policy.mode === ToolAccessMode.WHITELIST) {
      const allowed = policy.whitelist?.includes(toolId) || false;
      return {
        allowed,
        requiresApproval: false,
        reason: allowed ? undefined : 'Tool not in whitelist',
      };
    }

    if (policy.mode === ToolAccessMode.BLACKLIST) {
      const blocked = policy.blacklist?.includes(toolId) || false;
      return {
        allowed: !blocked,
        requiresApproval: false,
        reason: blocked ? 'Tool is blacklisted' : undefined,
      };
    }

    return { allowed: false, requiresApproval: false, reason: 'Unknown policy mode' };
  }

  /**
   * Check budget limits for tool usage
   */
  private async checkBudget(
    agentId: string,
    toolId: string,
    policy: ToolAccessPolicy
  ): Promise<{
    withinBudget: boolean;
    remaining?: number;
    resetAt?: Date;
  }> {
    const limits = policy.budgetLimits?.[toolId];
    if (!limits) {
      return { withinBudget: true };
    }

    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    // Count recent usage
    const hourlyUsage = this.countUsage(agentId, toolId, hourStart);
    const dailyUsage = this.countUsage(agentId, toolId, dayStart);

    // Check call limits
    if (limits.maxCallsPerHour && hourlyUsage >= limits.maxCallsPerHour) {
      const resetAt = new Date(hourStart);
      resetAt.setHours(resetAt.getHours() + 1);
      return {
        withinBudget: false,
        remaining: 0,
        resetAt,
      };
    }

    if (limits.maxCallsPerDay && dailyUsage >= limits.maxCallsPerDay) {
      const resetAt = new Date(dayStart);
      resetAt.setDate(resetAt.getDate() + 1);
      return {
        withinBudget: false,
        remaining: 0,
        resetAt,
      };
    }

    // Check cost limits
    if (limits.maxCostPerDay || limits.maxCostPerMonth) {
      const dailyCost = this.calculateCost(agentId, toolId, dayStart);
      
      if (limits.maxCostPerDay && dailyCost >= limits.maxCostPerDay) {
        const resetAt = new Date(dayStart);
        resetAt.setDate(resetAt.getDate() + 1);
        return {
          withinBudget: false,
          remaining: 0,
          resetAt,
        };
      }
    }

    // Calculate remaining calls
    const remaining = limits.maxCallsPerHour 
      ? limits.maxCallsPerHour - hourlyUsage
      : undefined;

    return {
      withinBudget: true,
      remaining,
    };
  }

  /**
   * Record tool usage
   */
  recordUsage(record: ToolUsageRecord): void {
    this.usageRecords.push(record);
    
    // Update cache
    let agentCache = this.usageCache.get(record.agentId);
    if (!agentCache) {
      agentCache = new Map();
      this.usageCache.set(record.agentId, agentCache);
    }
    
    const currentCount = agentCache.get(record.toolId) || 0;
    agentCache.set(record.toolId, currentCount + 1);

    this.emit('usage:recorded', record);
  }

  /**
   * Count tool usage for an agent since a given time
   */
  private countUsage(agentId: string, toolId: string, since: Date): number {
    return this.usageRecords.filter(
      (record) =>
        record.agentId === agentId &&
        record.toolId === toolId &&
        record.timestamp >= since
    ).length;
  }

  /**
   * Calculate total cost of tool usage since a given time
   */
  private calculateCost(agentId: string, toolId: string, since: Date): number {
    return this.usageRecords
      .filter(
        (record) =>
          record.agentId === agentId &&
          record.toolId === toolId &&
          record.timestamp >= since
      )
      .reduce((sum, record) => sum + (record.cost || 0), 0);
  }

  /**
   * Get resolved policy (including inheritance)
   */
  private getResolvedPolicy(agentId: string): ToolAccessPolicy {
    const policy = this.policies.get(agentId);
    
    if (!policy) {
      return this.getDefaultPolicy(agentId);
    }

    // Handle inheritance
    if (policy.inheritFrom) {
      const parentPolicy = this.policies.get(policy.inheritFrom);
      if (parentPolicy) {
        return {
          ...parentPolicy,
          ...policy,
          agentId,
        };
      }
    }

    return policy;
  }

  /**
   * Get default policy for agents without explicit policies
   */
  private getDefaultPolicy(agentId: string): ToolAccessPolicy {
    return {
      agentId,
      mode: ToolAccessMode.ALL,
      budgetLimits: {},
    };
  }

  /**
   * Get usage statistics for an agent
   */
  getUsageStats(agentId: string): {
    totalCalls: number;
    totalCost: number;
    byTool: Record<string, { calls: number; cost: number }>;
  } {
    const records = this.usageRecords.filter((r) => r.agentId === agentId);
    
    const byTool: Record<string, { calls: number; cost: number }> = {};
    
    records.forEach((record) => {
      if (!byTool[record.toolId]) {
        byTool[record.toolId] = { calls: 0, cost: 0 };
      }
      byTool[record.toolId].calls++;
      byTool[record.toolId].cost += record.cost || 0;
    });

    return {
      totalCalls: records.length,
      totalCost: records.reduce((sum, r) => sum + (r.cost || 0), 0),
      byTool,
    };
  }

  /**
   * Clear old usage records (for memory management)
   */
  clearOldRecords(olderThanDays = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const originalLength = this.usageRecords.length;
    this.usageRecords = this.usageRecords.filter((r) => r.timestamp >= cutoff);

    // Rebuild cache
    this.usageCache.clear();
    this.usageRecords.forEach((record) => {
      let agentCache = this.usageCache.get(record.agentId);
      if (!agentCache) {
        agentCache = new Map();
        this.usageCache.set(record.agentId, agentCache);
      }
      const currentCount = agentCache.get(record.toolId) || 0;
      agentCache.set(record.toolId, currentCount + 1);
    });

    return originalLength - this.usageRecords.length;
  }

  /**
   * Export usage records for analysis
   */
  exportUsageRecords(
    filters?: {
      agentId?: string;
      toolId?: string;
      since?: Date;
      until?: Date;
    }
  ): ToolUsageRecord[] {
    let records = this.usageRecords;

    if (filters) {
      records = records.filter((record) => {
        if (filters.agentId && record.agentId !== filters.agentId) return false;
        if (filters.toolId && record.toolId !== filters.toolId) return false;
        if (filters.since && record.timestamp < filters.since) return false;
        if (filters.until && record.timestamp > filters.until) return false;
        return true;
      });
    }

    return records;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.policies.clear();
    this.toolMetadata.clear();
    this.usageRecords = [];
    this.usageCache.clear();
  }
}
