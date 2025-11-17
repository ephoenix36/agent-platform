/**
 * Telemetry Bridge Tests
 * Tests for TelemetryBridge and MetricsAggregator
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { TelemetryBridge, MetricsAggregator } from '../../src/telemetry/index.js';
import type { TelemetryBridgeConfig, SessionMetrics, MetricsSnapshot } from '../../src/telemetry/index.js';

describe('TelemetryBridge', () => {
  let evolutionEmitter: EventEmitter;
  let bridge: TelemetryBridge;

  beforeEach(() => {
    evolutionEmitter = new EventEmitter();
  });

  afterEach(() => {
    if (bridge) {
      bridge.stop();
    }
  });

  describe('Initialization', () => {
    it('should create bridge with default config', () => {
      bridge = new TelemetryBridge(evolutionEmitter, {
        enabled: true
      });

      expect(bridge).toBeDefined();
      expect(bridge.getMetrics().totalSessions).toBe(0);
    });

    it('should create bridge with custom config', () => {
      bridge = new TelemetryBridge(evolutionEmitter, {
        enabled: true,
        batchSize: 10,
        flushInterval: 5000
      });

      expect(bridge).toBeDefined();
    });

    it('should not forward events when disabled', () => {
      bridge = new TelemetryBridge(evolutionEmitter, {
        enabled: false
      });

      const emitListener = jest.fn();
      bridge.on('telemetry', emitListener);
      bridge.start();
      evolutionEmitter.emit('optimization:start', { sessionId: 'test-123' });

      expect(emitListener).not.toHaveBeenCalled();
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(() => {
      bridge = new TelemetryBridge(evolutionEmitter, {
        enabled: true
      });
      bridge.start();
    });

    it('should forward optimization:start events', () => {
      const telemetryHandler = jest.fn();
      bridge.on('telemetry', telemetryHandler);

      const eventData = {
        sessionId: 'test-123',
        options: { populationSize: 50, generations: 20 }
      };

      evolutionEmitter.emit('optimization:start', eventData);

      expect(telemetryHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'evosuite.optimization.start',
        sessionId: 'test-123',
        data: eventData,
        timestamp: expect.any(Number)
      }));
    });

    it('should forward optimization:generation events', () => {
      const telemetryHandler = jest.fn();
      bridge.on('telemetry', telemetryHandler);

      const eventData = {
        sessionId: 'test-123',
        generation: 5,
        bestScore: 0.85,
        averageScore: 0.62
      };

      evolutionEmitter.emit('optimization:generation', eventData);

      expect(telemetryHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'evosuite.optimization.generation',
        sessionId: 'test-123',
        data: eventData
      }));
    });

    it('should forward optimization:complete events', () => {
      const telemetryHandler = jest.fn();
      bridge.on('telemetry', telemetryHandler);

      const eventData = {
        sessionId: 'test-123',
        result: {
          bestIndividual: [1.0, 2.0],
          bestScore: 0.95,
          generation: 20
        }
      };

      evolutionEmitter.emit('optimization:complete', eventData);

      expect(telemetryHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'evosuite.optimization.complete',
        sessionId: 'test-123',
        data: eventData
      }));
    });

    it('should forward optimization:error events', () => {
      const telemetryHandler = jest.fn();
      bridge.on('telemetry', telemetryHandler);

      const eventData = {
        sessionId: 'test-123',
        error: new Error('Test error')
      };

      evolutionEmitter.emit('optimization:error', eventData);

      expect(telemetryHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'evosuite.optimization.error',
        sessionId: 'test-123'
      }));
    });
  });

  describe('Metrics Tracking', () => {
    beforeEach(() => {
      bridge = new TelemetryBridge(evolutionEmitter, {
        enabled: true
      });
      bridge.start();
    });

    it('should track events per session', () => {
      evolutionEmitter.emit('optimization:start', { sessionId: 'session-1' });
      evolutionEmitter.emit('optimization:generation', { sessionId: 'session-1', generation: 1 });
      evolutionEmitter.emit('optimization:generation', { sessionId: 'session-1', generation: 2 });

      const metrics = bridge.getMetrics();

      expect(metrics.totalSessions).toBe(1);
      expect(metrics.sessions[0].sessionId).toBe('session-1');
      expect(metrics.sessions[0].totalEvents).toBe(3);
      expect(metrics.sessions[0].eventCounts['optimization:start']).toBe(1);
      expect(metrics.sessions[0].eventCounts['optimization:generation']).toBe(2);
    });

    it('should track multiple sessions independently', () => {
      evolutionEmitter.emit('optimization:start', { sessionId: 'session-1' });
      evolutionEmitter.emit('optimization:start', { sessionId: 'session-2' });
      evolutionEmitter.emit('optimization:generation', { sessionId: 'session-1', generation: 1 });

      const metrics = bridge.getMetrics();

      expect(metrics.totalSessions).toBe(2);
      expect(metrics.sessions.find(s => s.sessionId === 'session-1')?.totalEvents).toBe(2);
      expect(metrics.sessions.find(s => s.sessionId === 'session-2')?.totalEvents).toBe(1);
    });

    it('should calculate session duration correctly', (done) => {
      const startTime = Date.now();
      
      evolutionEmitter.emit('optimization:start', { sessionId: 'session-1' });

      // Simulate 100ms passing
      setTimeout(() => {
        evolutionEmitter.emit('optimization:complete', { sessionId: 'session-1' });

        const metrics = bridge.getMetrics();
        const session = metrics.sessions.find(s => s.sessionId === 'session-1');

        expect(session?.duration).toBeGreaterThanOrEqual(100);
        done();
      }, 100);
    });

    it('should clear metrics', () => {
      evolutionEmitter.emit('optimization:start', { sessionId: 'session-1' });

      let metrics = bridge.getMetrics();
      expect(metrics.totalSessions).toBe(1);

      bridge.clearMetrics();
      metrics = bridge.getMetrics();

      expect(metrics.totalSessions).toBe(0);
      expect(metrics.sessions).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      bridge = new TelemetryBridge(evolutionEmitter, {
        enabled: true
      });
      bridge.start();
    });

    it('should emit error events on telemetry processing failures', () => {
      const errorHandler = jest.fn();
      bridge.on('error', errorHandler);

      // Create a scenario that will cause an error in telemetry handler
      const telemetryHandler = jest.fn().mockImplementation(() => {
        throw new Error('Telemetry handler failed');
      });
      bridge.on('telemetry', telemetryHandler);

      evolutionEmitter.emit('optimization:start', { sessionId: 'test-123' });

      // The error should be caught and emitted as an error event
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(Error),
        eventType: 'optimization:start'
      }));
    });
  });
});

describe('MetricsAggregator', () => {
  let aggregator: MetricsAggregator;

  beforeEach(() => {
    aggregator = new MetricsAggregator();
  });

  describe('Event Recording', () => {
    it('should record single event', () => {
      aggregator.recordEvent('session-1', 'optimization:start');

      const session = aggregator.getSessionMetrics('session-1');

      expect(session).not.toBeNull();
      expect(session?.sessionId).toBe('session-1');
      expect(session?.totalEvents).toBe(1);
      expect(session?.eventCounts['optimization:start']).toBe(1);
    });

    it('should accumulate events for same session', () => {
      aggregator.recordEvent('session-1', 'optimization:start');
      aggregator.recordEvent('session-1', 'optimization:generation');
      aggregator.recordEvent('session-1', 'optimization:generation');

      const session = aggregator.getSessionMetrics('session-1');

      expect(session?.totalEvents).toBe(3);
      expect(session?.eventCounts['optimization:start']).toBe(1);
      expect(session?.eventCounts['optimization:generation']).toBe(2);
    });

    it('should track last event time', (done) => {
      const startTime = Date.now();
      aggregator.recordEvent('session-1', 'optimization:start');

      setTimeout(() => {
        aggregator.recordEvent('session-1', 'optimization:generation');

        const session = aggregator.getSessionMetrics('session-1');

        expect(session?.lastEventTime).toBeGreaterThanOrEqual(startTime + 100);
        done();
      }, 100);
    });
  });

  describe('Session Management', () => {
    it('should return null for non-existent session', () => {
      const session = aggregator.getSessionMetrics('non-existent');
      expect(session).toBeNull();
    });

    it('should calculate session duration', (done) => {
      const startTime = Date.now();
      aggregator.recordEvent('session-1', 'optimization:start');

      setTimeout(() => {
        aggregator.recordEvent('session-1', 'optimization:complete');

        const session = aggregator.getSessionMetrics('session-1');

        expect(session?.duration).toBeGreaterThanOrEqual(100);
        done();
      }, 100);
    });

    it('should end session and finalize metrics', () => {
      aggregator.recordEvent('session-1', 'optimization:start');
      aggregator.recordEvent('session-1', 'optimization:generation');

      aggregator.endSession('session-1');

      const session = aggregator.getSessionMetrics('session-1');
      expect(session).not.toBeNull();
      expect(session?.totalEvents).toBe(2);
    });
  });

  describe('Aggregate Metrics', () => {
    it('should return empty metrics initially', () => {
      const metrics = aggregator.getAllMetrics();

      expect(metrics.totalSessions).toBe(0);
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.sessions).toHaveLength(0);
      expect(metrics.eventTypeDistribution).toEqual({});
    });

    it('should aggregate metrics across all sessions', () => {
      aggregator.recordEvent('session-1', 'optimization:start');
      aggregator.recordEvent('session-1', 'optimization:generation');
      aggregator.recordEvent('session-2', 'optimization:start');
      aggregator.recordEvent('session-2', 'optimization:error');

      const metrics = aggregator.getAllMetrics();

      expect(metrics.totalSessions).toBe(2);
      expect(metrics.totalEvents).toBe(4);
      expect(metrics.eventTypeDistribution['optimization:start']).toBe(2);
      expect(metrics.eventTypeDistribution['optimization:generation']).toBe(1);
      expect(metrics.eventTypeDistribution['optimization:error']).toBe(1);
    });

    it('should clear all metrics', () => {
      aggregator.recordEvent('session-1', 'optimization:start');
      aggregator.recordEvent('session-2', 'optimization:start');

      let metrics = aggregator.getAllMetrics();
      expect(metrics.totalSessions).toBe(2);

      aggregator.clearAllMetrics();
      metrics = aggregator.getAllMetrics();

      expect(metrics.totalSessions).toBe(0);
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.sessions).toHaveLength(0);
    });
  });
});
