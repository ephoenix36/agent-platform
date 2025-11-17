import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { StructuredOutputStream } from '../src/StructuredOutputStream.js';
import {
  StreamDestinationType,
  StreamDestination,
  StructuredOutput,
  WidgetUpdate,
} from '../src/types.js';

describe('StructuredOutputStream', () => {
  let stream: StructuredOutputStream;
  let mockHandlers: any;

  beforeEach(() => {
    stream = new StructuredOutputStream();
    
    mockHandlers = {
      agent: jest.fn(),
      workflow: jest.fn(),
      database: jest.fn(),
      widget: jest.fn(),
      webhook: jest.fn(),
    };

    stream.setHandlers(mockHandlers);
  });

  describe('destination management', () => {
    it('should add destinations', () => {
      const destination: StreamDestination = {
        type: StreamDestinationType.AGENT,
        id: 'test-agent',
      };

      stream.addDestination(destination);
      
      const destinations = stream.getDestinations();
      expect(destinations).toHaveLength(1);
      expect(destinations[0].id).toBe('test-agent');
    });

    it('should remove destinations', () => {
      const destination: StreamDestination = {
        type: StreamDestinationType.AGENT,
        id: 'test-agent',
      };

      stream.addDestination(destination);
      stream.removeDestination(StreamDestinationType.AGENT, 'test-agent');
      
      expect(stream.getDestinations()).toHaveLength(0);
    });

    it('should emit events on destination changes', () => {
      const addedHandler = jest.fn();
      const removedHandler = jest.fn();

      stream.on('destination:added', addedHandler);
      stream.on('destination:removed', removedHandler);

      const destination: StreamDestination = {
        type: StreamDestinationType.AGENT,
        id: 'test-agent',
      };

      stream.addDestination(destination);
      expect(addedHandler).toHaveBeenCalledWith(destination);

      stream.removeDestination(StreamDestinationType.AGENT, 'test-agent');
      expect(removedHandler).toHaveBeenCalledWith(destination);
    });

    it('should clear all destinations', () => {
      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'agent1',
      });
      stream.addDestination({
        type: StreamDestinationType.WIDGET,
        id: 'widget1',
      });

      stream.clearDestinations();
      expect(stream.getDestinations()).toHaveLength(0);
    });
  });

  describe('streaming', () => {
    it('should stream to agent destination', async () => {
      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'test-agent',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { result: 'test' },
        timestamp: new Date(),
      };

      const results = await stream.stream(output);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(mockHandlers.agent).toHaveBeenCalledWith(
        'test-agent',
        { result: 'test' },
        true
      );
    });

    it('should stream to multiple destinations in parallel', async () => {
      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'agent-1',
      });
      stream.addDestination({
        type: StreamDestinationType.WIDGET,
        id: 'widget-1',
      });
      stream.addDestination({
        type: StreamDestinationType.DATABASE,
        id: 'collection-1',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { result: 'test' },
        timestamp: new Date(),
      };

      const results = await stream.stream(output);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(mockHandlers.agent).toHaveBeenCalled();
      expect(mockHandlers.widget).toHaveBeenCalled();
      expect(mockHandlers.database).toHaveBeenCalled();
    });

    it('should apply filters to destinations', async () => {
      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'filtered-agent',
        filter: (data: any) => data.important === true,
      });

      const output1: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { important: false },
        timestamp: new Date(),
      };

      await stream.stream(output1);
      expect(mockHandlers.agent).not.toHaveBeenCalled();

      const output2: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { important: true },
        timestamp: new Date(),
      };

      await stream.stream(output2);
      expect(mockHandlers.agent).toHaveBeenCalled();
    });

    it('should handle streaming errors gracefully', async () => {
      mockHandlers.agent.mockRejectedValue(new Error('Handler error'));

      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'error-agent',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      const results = await stream.stream(output);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Handler error');
    });

    it('should emit stream complete event', async () => {
      const completeHandler = jest.fn();
      stream.on('stream:complete', completeHandler);

      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'test-agent',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      await stream.stream(output);

      expect(completeHandler).toHaveBeenCalled();
      expect(completeHandler.mock.calls[0][0]).toHaveProperty('output');
      expect(completeHandler.mock.calls[0][0]).toHaveProperty('results');
    });
  });

  describe('widget streaming', () => {
    it('should format widget updates correctly', async () => {
      stream.addDestination({
        type: StreamDestinationType.WIDGET,
        id: 'test-widget',
      });

      const output: StructuredOutput = {
        sourceId: 'agent-1',
        sourceType: 'agent',
        data: { value: 42 },
        timestamp: new Date(),
      };

      await stream.stream(output);

      expect(mockHandlers.widget).toHaveBeenCalled();
      const widgetUpdate: WidgetUpdate = mockHandlers.widget.mock.calls[0][1];
      expect(widgetUpdate.widgetId).toBe('test-widget');
      expect(widgetUpdate.data).toEqual({ value: 42 });
      expect(widgetUpdate.sourceId).toBe('agent-1');
    });
  });

  describe('user destination', () => {
    it('should emit user data event', async () => {
      const userDataHandler = jest.fn();
      stream.on('user:data', userDataHandler);

      stream.addDestination({
        type: StreamDestinationType.USER,
        id: 'user-1',
      });

      const output: StructuredOutput = {
        sourceId: 'agent-1',
        sourceType: 'agent',
        data: { message: 'Hello user' },
        timestamp: new Date(),
      };

      await stream.stream(output);

      expect(userDataHandler).toHaveBeenCalled();
      expect(userDataHandler.mock.calls[0][0]).toEqual({
        data: { message: 'Hello user' },
        sourceId: 'agent-1',
      });
    });
  });

  describe('statistics', () => {
    it('should track delivery statistics', async () => {
      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'agent-1',
      });
      stream.addDestination({
        type: StreamDestinationType.WIDGET,
        id: 'widget-1',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      await stream.stream(output);

      const stats = stream.getStatistics();
      expect(stats.totalDeliveries).toBe(2);
      expect(stats.successfulDeliveries).toBe(2);
      expect(stats.failedDeliveries).toBe(0);
      expect(stats.deliveriesByDestinationType[StreamDestinationType.AGENT]).toBe(1);
      expect(stats.deliveriesByDestinationType[StreamDestinationType.WIDGET]).toBe(1);
      expect(stats.averageLatencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should track failed deliveries', async () => {
      mockHandlers.agent.mockRejectedValue(new Error('Fail'));

      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'agent-1',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      await stream.stream(output);

      const stats = stream.getStatistics();
      expect(stats.totalDeliveries).toBe(1);
      expect(stats.successfulDeliveries).toBe(0);
      expect(stats.failedDeliveries).toBe(1);
    });

    it('should reset statistics', () => {
      stream.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'agent-1',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      stream.stream(output);
      stream.resetStatistics();

      const stats = stream.getStatistics();
      expect(stats.totalDeliveries).toBe(0);
      expect(stats.successfulDeliveries).toBe(0);
      expect(stats.failedDeliveries).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw error if handler not configured', async () => {
      const streamWithoutHandlers = new StructuredOutputStream();
      
      streamWithoutHandlers.addDestination({
        type: StreamDestinationType.AGENT,
        id: 'test-agent',
      });

      const output: StructuredOutput = {
        sourceId: 'source-1',
        sourceType: 'tool',
        data: { test: 'data' },
        timestamp: new Date(),
      };

      const results = await streamWithoutHandlers.stream(output);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('not configured');
    });
  });
});
