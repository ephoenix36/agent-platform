/**
 * Budget Manager Service - Test Suite
 * 
 * Tests for budget management, quota enforcement, and rate limiting
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BudgetManager, Budget, RateLimit, BudgetType, BudgetPeriod } from '../../../src/services/budget-manager.js';

describe('BudgetManager Service', () => {
  let manager: BudgetManager;

  beforeEach(() => {
    manager = new BudgetManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createBudget', () => {
    it('should create token budget for agent', async () => {
      const budget = await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 100000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      expect(budget.id).toBeDefined();
      expect(budget.agentId).toBe('test-agent');
      expect(budget.type).toBe('token');
      expect(budget.current).toBe(0);
    });

    it('should create global budget', async () => {
      const budget = await manager.createBudget({
        type: 'cost',
        limit: 50,
        period: 'month',
        alertThreshold: 0.9,
        enforceLimit: true
      });

      expect(budget.agentId).toBeUndefined();
      expect(budget.type).toBe('cost');
    });

    it('should create call-based budget', async () => {
      const budget = await manager.createBudget({
        agentId: 'api-agent',
        type: 'calls',
        limit: 1000,
        period: 'hour',
        alertThreshold: 0.75,
        enforceLimit: false
      });

      expect(budget.type).toBe('calls');
      expect(budget.enforceLimit).toBe(false);
    });
  });

  describe('checkBudget', () => {
    it('should allow execution when under budget', async () => {
      await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 10000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      const result = await manager.checkBudget('test-agent', 'token', 1000);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10000);
    });

    it('should deny execution when over budget with enforcement', async () => {
      await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 1000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      const result = await manager.checkBudget('test-agent', 'token', 2000);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('budget exceeded');
    });

    it('should warn but allow when over budget without enforcement', async () => {
      await manager.createBudget({
        agentId: 'test-agent',
        type: 'cost',
        limit: 10,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: false
      });

      const result = await manager.checkBudget('test-agent', 'cost', 15);
      
      expect(result.allowed).toBe(true);
      expect(result.warning).toBeDefined();
    });

    it('should trigger alert at threshold', async () => {
      const onAlert = jest.fn();
      manager.on('alert', onAlert);

      await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 1000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.consumeBudget('test-agent', 'token', 850);
      
      expect(onAlert).toHaveBeenCalled();
      expect(onAlert.mock.calls[0][0].level).toBe('warning');
    });
  });

  describe('consumeBudget', () => {
    it('should track budget consumption', async () => {
      await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 10000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.consumeBudget('test-agent', 'token', 1000);
      await manager.consumeBudget('test-agent', 'token', 500);

      const status = await manager.getBudgetStatus('test-agent', 'token');
      
      expect(status.current).toBe(1500);
      expect(status.remaining).toBe(8500);
      expect(status.percentUsed).toBe(15);
    });

    it('should handle multiple budget types', async () => {
      await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 10000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.createBudget({
        agentId: 'test-agent',
        type: 'cost',
        limit: 50,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.consumeBudget('test-agent', 'token', 1000);
      await manager.consumeBudget('test-agent', 'cost', 5.5);

      const tokenStatus = await manager.getBudgetStatus('test-agent', 'token');
      const costStatus = await manager.getBudgetStatus('test-agent', 'cost');
      
      expect(tokenStatus.current).toBe(1000);
      expect(costStatus.current).toBe(5.5);
    });
  });

  describe('resetBudget', () => {
    it('should reset budget at period end', async () => {
      const budget = await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 1000,
        period: 'hour',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.consumeBudget('test-agent', 'token', 500);
      
      // Advance time by 1 hour
      jest.advanceTimersByTime(3600 * 1000);
      
      const status = await manager.getBudgetStatus('test-agent', 'token');
      
      expect(status.current).toBe(0);
      expect(status.remaining).toBe(1000);
    });

    it('should handle different period types', async () => {
      const periods: BudgetPeriod[] = ['hour', 'day', 'week', 'month'];
      
      for (const period of periods) {
        const budget = await manager.createBudget({
          agentId: `agent-${period}`,
          type: 'token',
          limit: 1000,
          period,
          alertThreshold: 0.8,
          enforceLimit: true
        });

        expect(budget.resetAt).toBeDefined();
      }
    });
  });

  describe('rateLimiting', () => {
    it('should enforce calls per minute limit', async () => {
      await manager.setRateLimit('test-agent', {
        maxCallsPerMinute: 10,
        maxCallsPerHour: 100
      });

      // Make 10 calls (should succeed)
      for (let i = 0; i < 10; i++) {
        const result = await manager.checkRateLimit('test-agent');
        expect(result.allowed).toBe(true);
        await manager.recordCall('test-agent');
      }

      // 11th call should be denied
      const result = await manager.checkRateLimit('test-agent');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('rate limit');
    });

    it('should enforce calls per hour limit', async () => {
      await manager.setRateLimit('test-agent', {
        maxCallsPerMinute: 100,
        maxCallsPerHour: 50
      });

      // Make 50 calls
      for (let i = 0; i < 50; i++) {
        await manager.recordCall('test-agent');
      }

      const result = await manager.checkRateLimit('test-agent');
      expect(result.allowed).toBe(false);
    });

    it('should reset rate limits after time window', async () => {
      await manager.setRateLimit('test-agent', {
        maxCallsPerMinute: 5,
        maxCallsPerHour: 100
      });

      // Max out the limit
      for (let i = 0; i < 5; i++) {
        await manager.recordCall('test-agent');
      }

      expect((await manager.checkRateLimit('test-agent')).allowed).toBe(false);

      // Advance time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      expect((await manager.checkRateLimit('test-agent')).allowed).toBe(true);
    });

    it('should handle burst allowances', async () => {
      await manager.setRateLimit('test-agent', {
        maxCallsPerMinute: 10,
        maxCallsPerHour: 100,
        burstAllowance: 5
      });

      // Should allow 15 calls in burst (10 + 5 burst)
      for (let i = 0; i < 15; i++) {
        const result = await manager.checkRateLimit('test-agent');
        expect(result.allowed).toBe(true);
        await manager.recordCall('test-agent');
      }

      // 16th should be denied
      expect((await manager.checkRateLimit('test-agent')).allowed).toBe(false);
    });
  });

  describe('listBudgets', () => {
    it('should list all budgets for agent', async () => {
      await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 10000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.createBudget({
        agentId: 'test-agent',
        type: 'cost',
        limit: 50,
        period: 'month',
        alertThreshold: 0.9,
        enforceLimit: true
      });

      const budgets = await manager.listBudgets('test-agent');
      
      expect(budgets).toHaveLength(2);
      expect(budgets.map(b => b.type)).toContain('token');
      expect(budgets.map(b => b.type)).toContain('cost');
    });

    it('should list global budgets', async () => {
      await manager.createBudget({
        type: 'cost',
        limit: 100,
        period: 'month',
        alertThreshold: 0.9,
        enforceLimit: true
      });

      const budgets = await manager.listBudgets();
      
      expect(budgets).toHaveLength(1);
      expect(budgets[0].agentId).toBeUndefined();
    });
  });

  describe('updateBudget', () => {
    it('should update budget limits', async () => {
      const budget = await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 10000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.updateBudget(budget.id, {
        limit: 20000,
        alertThreshold: 0.9
      });

      const updated = await manager.getBudget(budget.id);
      
      expect(updated.limit).toBe(20000);
      expect(updated.alertThreshold).toBe(0.9);
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget by ID', async () => {
      const budget = await manager.createBudget({
        agentId: 'test-agent',
        type: 'token',
        limit: 10000,
        period: 'day',
        alertThreshold: 0.8,
        enforceLimit: true
      });

      await manager.deleteBudget(budget.id);

      await expect(manager.getBudget(budget.id)).rejects.toThrow();
    });
  });
});
