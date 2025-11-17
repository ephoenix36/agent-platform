import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgentMessageBus } from '../src/AgentMessageBus.js';
import {
  AgentInstance,
  AgentMessageType,
  WorkingMemory,
} from '../src/types.js';

// Mock agent implementation
class MockAgent implements AgentInstance {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error' = 'idle';
  workingMemory: WorkingMemory & { data: any[] };
  contextData: any[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.workingMemory = {
      data: [] as any[],
      add: jest.fn(async (data: any) => {
        this.workingMemory.data.push(data);
      }) as any,
      get: jest.fn((key: string) => this.workingMemory.data.find((d: any) => d.key === key)) as any,
      clear: jest.fn(() => {
        this.workingMemory.data = [];
      }) as any,
    };
  }

  async addToContext(data: any): Promise<void> {
    this.contextData.push(data);
  }

  async process(): Promise<void> {
    this.status = 'busy';
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.status = 'idle';
  }
}

describe('AgentMessageBus', () => {
  let bus: AgentMessageBus;
  let agent1: MockAgent;
  let agent2: MockAgent;

  beforeEach(() => {
    bus = new AgentMessageBus();
    agent1 = new MockAgent('agent-1', 'Agent 1');
    agent2 = new MockAgent('agent-2', 'Agent 2');
  });

  afterEach(() => {
    bus.clear();
  });

  describe('agent registration', () => {
    it('should register agents', () => {
      bus.registerAgent(agent1);
      
      expect(bus.hasAgent('agent-1')).toBe(true);
      expect(bus.getAgent('agent-1')).toBe(agent1);
    });

    it('should unregister agents', () => {
      bus.registerAgent(agent1);
      bus.unregisterAgent('agent-1');
      
      expect(bus.hasAgent('agent-1')).toBe(false);
    });

    it('should emit registration events', () => {
      const registeredHandler = jest.fn();
      const unregisteredHandler = jest.fn();

      bus.on('agent:registered', registeredHandler);
      bus.on('agent:unregistered', unregisteredHandler);

      bus.registerAgent(agent1);
      expect(registeredHandler).toHaveBeenCalledWith('agent-1');

      bus.unregisterAgent('agent-1');
      expect(unregisteredHandler).toHaveBeenCalledWith('agent-1');
    });

    it('should get all agent IDs', () => {
      bus.registerAgent(agent1);
      bus.registerAgent(agent2);

      const ids = bus.getAgentIds();
      expect(ids).toContain('agent-1');
      expect(ids).toContain('agent-2');
      expect(ids).toHaveLength(2);
    });
  });

  describe('message sending', () => {
    beforeEach(() => {
      bus.registerAgent(agent1);
      bus.registerAgent(agent2);
    });

    it('should send message with context bypass', async () => {
      const result = await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.STRUCTURED_INPUT,
        data: { test: 'data' },
        bypassContext: true,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(agent2.workingMemory.add).toHaveBeenCalledWith({ test: 'data' });
      expect(agent2.contextData).toHaveLength(0);
    });

    it('should send message to context', async () => {
      const result = await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.QUERY,
        data: { question: 'test' },
        bypassContext: false,
      });

      expect(result.success).toBe(true);
      expect(agent2.contextData).toHaveLength(1);
      expect(agent2.contextData[0]).toEqual({ question: 'test' });
    });

    it('should return error for non-existent recipient', async () => {
      const result = await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'non-existent',
        type: AgentMessageType.COMMAND,
        data: { action: 'test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should emit delivery event', async () => {
      const deliveredHandler = jest.fn();
      bus.on('message:delivered', deliveredHandler);

      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      expect(deliveredHandler).toHaveBeenCalled();
      expect(deliveredHandler.mock.calls[0][0]).toHaveProperty('messageId');
      expect(deliveredHandler.mock.calls[0][0]).toHaveProperty('latencyMs');
    });

    it('should trigger agent processing if idle', async () => {
      const processSpy = jest.spyOn(agent2, 'process');

      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      expect(processSpy).toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    beforeEach(() => {
      bus.registerAgent(agent1);
      bus.registerAgent(agent2);
    });

    it('should broadcast to multiple agents', async () => {
      const results = await bus.broadcast(['agent-1', 'agent-2'], {
        fromAgentId: 'system',
        type: AgentMessageType.COMMAND,
        data: { broadcast: 'test' },
      });

      expect(results['agent-1'].success).toBe(true);
      expect(results['agent-2'].success).toBe(true);
      expect(agent1.workingMemory.add).toHaveBeenCalled();
      expect(agent2.workingMemory.add).toHaveBeenCalled();
    });

    it('should emit broadcast complete event', async () => {
      const completeHandler = jest.fn();
      bus.on('broadcast:complete', completeHandler);

      await bus.broadcast(['agent-1', 'agent-2'], {
        fromAgentId: 'system',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      expect(completeHandler).toHaveBeenCalled();
    });
  });

  describe('pending messages', () => {
    beforeEach(() => {
      bus.registerAgent(agent1);
      bus.registerAgent(agent2);
    });

    it('should queue pending messages', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.QUERY,
        data: { test: 'data' },
      });

      const pending = bus.getPendingMessages('agent-2');
      expect(pending).toHaveLength(1);
      expect(pending[0].data).toEqual({ test: 'data' });
    });

    it('should clear pending messages', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.QUERY,
        data: { test: 'data' },
      });

      bus.clearPendingMessages('agent-2');
      
      const pending = bus.getPendingMessages('agent-2');
      expect(pending).toHaveLength(0);
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      bus.registerAgent(agent1);
      bus.registerAgent(agent2);
    });

    it('should track delivery statistics', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      const stats = bus.getStats('agent-1');
      expect(stats).toBeDefined();
      expect(stats!.sent).toBe(1);
      expect(stats!.delivered).toBe(1);
      expect(stats!.failed).toBe(0);
    });

    it('should track failed deliveries', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'non-existent',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      const stats = bus.getStats('agent-1');
      expect(stats!.sent).toBe(1);
      expect(stats!.failed).toBe(1);
    });

    it('should get all stats', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      const allStats = bus.getAllStats();
      expect(allStats['agent-1']).toBeDefined();
      expect(allStats['agent-1'].sent).toBe(1);
    });
  });

  describe('dead letter queue', () => {
    beforeEach(() => {
      bus.registerAgent(agent1);
    });

    it('should add failed messages to dead letter queue', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'non-existent',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      const deadLetters = bus.getDeadLetterQueue();
      expect(deadLetters).toHaveLength(1);
      expect(deadLetters[0].toAgentId).toBe('non-existent');
    });

    it('should emit failed message event', async () => {
      const failedHandler = jest.fn();
      bus.on('message:failed', failedHandler);

      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'non-existent',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      expect(failedHandler).toHaveBeenCalled();
    });

    it('should clear dead letter queue', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'non-existent',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      bus.clearDeadLetterQueue();
      
      expect(bus.getDeadLetterQueue()).toHaveLength(0);
    });

    it('should retry messages from dead letter queue', async () => {
      await bus.send({
        fromAgentId: 'agent-1',
        toAgentId: 'agent-2',
        type: AgentMessageType.COMMAND,
        data: { test: 'data' },
      });

      const deadLetters = bus.getDeadLetterQueue();
      const messageId = deadLetters[0]?.id;

      if (messageId) {
        bus.registerAgent(agent2);
        const result = await bus.retryDeadLetter(messageId);
        expect(result.success).toBe(true);
      }
    });
  });
});
