/**
 * Usage Tracker Service - Test Suite
 * 
 * Tests for real-time usage tracking and analytics
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UsageTracker, UsageEvent, UsageStats } from '../../../src/services/usage-tracker.js';

describe('UsageTracker Service', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker();
  });

  describe('trackExecution', () => {
    it('should track agent execution successfully', async () => {
      const event: UsageEvent = {
        id: 'test-1',
        timestamp: new Date(),
        agentId: 'test-agent',
        model: 'claude-sonnet-4.5-haiku',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.001,
        duration: 1500,
        success: true,
        metadata: {}
      };

      await tracker.trackExecution(event);
      
      const stats = await tracker.getStats('test-agent');
      expect(stats.totalCalls).toBe(1);
      expect(stats.totalTokens).toBe(150);
      expect(stats.totalCost).toBe(0.001);
    });

    it('should handle failed executions', async () => {
      const event: UsageEvent = {
        id: 'test-2',
        timestamp: new Date(),
        agentId: 'test-agent',
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 0,
        totalTokens: 100,
        cost: 0,
        duration: 500,
        success: false,
        error: 'API rate limit exceeded',
        metadata: {}
      };

      await tracker.trackExecution(event);
      
      const stats = await tracker.getStats('test-agent');
      expect(stats.errors).toBe(1);
    });
  });

  describe('calculateCost', () => {
    it('should calculate OpenAI costs correctly', () => {
      const cost = tracker.calculateCost('gpt-4', 1000, 500);
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should calculate Claude costs correctly', () => {
      const cost = tracker.calculateCost('claude-4.5-sonnet', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });

    it('should calculate Gemini costs correctly', () => {
      const cost = tracker.calculateCost('gemini-2.5-pro', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle unknown models with default pricing', () => {
      const cost = tracker.calculateCost('unknown-model', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Add test data
      await tracker.trackExecution({
        id: '1',
        timestamp: new Date(),
        agentId: 'agent-1',
        model: 'gpt-4',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.005,
        duration: 1000,
        success: true,
        metadata: {}
      });

      await tracker.trackExecution({
        id: '2',
        timestamp: new Date(),
        agentId: 'agent-1',
        model: 'claude-4.5-sonnet',
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        cost: 0.01,
        duration: 1500,
        success: true,
        metadata: {}
      });
    });

    it('should aggregate usage by agent', async () => {
      const stats = await tracker.getStats('agent-1');
      
      expect(stats.totalCalls).toBe(2);
      expect(stats.totalTokens).toBe(450);
      expect(stats.totalCost).toBe(0.015);
      expect(stats.averageTokens).toBe(225);
    });

    it('should aggregate usage by model', async () => {
      const stats = await tracker.getStats('agent-1');
      
      expect(stats.models['gpt-4']).toBe(1);
      expect(stats.models['claude-4.5-sonnet']).toBe(1);
    });

    it('should calculate average duration', async () => {
      const stats = await tracker.getStats('agent-1');
      
      expect(stats.averageDuration).toBe(1250); // (1000 + 1500) / 2
    });
  });

  describe('getReport', () => {
    it('should generate usage report with time range', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 3600000);
      
      const report = await tracker.getReport({
        startDate: hourAgo,
        endDate: now,
        groupBy: 'agent'
      });

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('breakdown');
      expect(report.summary).toHaveProperty('totalCalls');
      expect(report.summary).toHaveProperty('totalCost');
    });

    it('should group by model', async () => {
      const report = await tracker.getReport({
        groupBy: 'model'
      });

      expect(report.breakdown).toBeInstanceOf(Object);
    });
  });

  describe('exportData', () => {
    it('should export to JSON format', async () => {
      const data = await tracker.exportData('json');
      
      expect(() => JSON.parse(data)).not.toThrow();
    });

    it('should export to CSV format', async () => {
      const data = await tracker.exportData('csv');
      
      expect(data).toContain('timestamp,agentId,model');
    });
  });

  describe('concurrent tracking', () => {
    it('should handle concurrent calls without race conditions', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        tracker.trackExecution({
          id: `concurrent-${i}`,
          timestamp: new Date(),
          agentId: 'concurrent-agent',
          model: 'gpt-4',
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          cost: 0.001,
          duration: 1000,
          success: true,
          metadata: {}
        })
      );

      await Promise.all(promises);
      
      const stats = await tracker.getStats('concurrent-agent');
      expect(stats.totalCalls).toBe(100);
    });
  });
});
