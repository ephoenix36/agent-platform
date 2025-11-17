import EventEmitter from 'eventemitter3';
import {
  AgentMessage,
  AgentInstance,
  MessageDeliveryOptions,
} from './types.js';

/**
 * Message bus for direct agent-to-agent communication
 * Enables agents to communicate WITHOUT consuming sender's context
 */
export class AgentMessageBus extends EventEmitter {
  private agents: Map<string, AgentInstance> = new Map();
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private deliveryStats = new Map<string, {
    sent: number;
    delivered: number;
    failed: number;
    avgLatencyMs: number;
  }>();
  private deadLetterQueue: AgentMessage[] = [];

  /**
   * Register an agent instance with the message bus
   */
  registerAgent(agent: AgentInstance): void {
    this.agents.set(agent.id, agent);
    this.messageQueue.set(agent.id, []);
    this.deliveryStats.set(agent.id, {
      sent: 0,
      delivered: 0,
      failed: 0,
      avgLatencyMs: 0,
    });
    this.emit('agent:registered', agent.id);
  }

  /**
   * Unregister an agent from the message bus
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.messageQueue.delete(agentId);
    this.deliveryStats.delete(agentId);
    this.emit('agent:unregistered', agentId);
  }

  /**
   * Check if an agent is registered
   */
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * Get a registered agent
   */
  getAgent(agentId: string): AgentInstance | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agent IDs
   */
  getAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Send a message from one agent to another
   * WITHOUT consuming the sender's context
   */
  async send(
    message: Omit<AgentMessage, 'id' | 'timestamp'>,
    _options?: MessageDeliveryOptions
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    latencyMs?: number;
  }> {
    const startTime = Date.now();
    
    const fullMessage: AgentMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
    };

    const stats = this.deliveryStats.get(message.fromAgentId);
    if (stats) {
      stats.sent++;
    }

    // Check if recipient exists
    const recipient = this.agents.get(message.toAgentId);
    if (!recipient) {
      this.handleDeliveryFailure(fullMessage, 'Recipient not found');
      return {
        success: false,
        error: `Agent ${message.toAgentId} not found`,
      };
    }

    try {
      // Queue the message
      const queue = this.messageQueue.get(message.toAgentId);
      if (queue) {
        queue.push(fullMessage);
      }

      // Deliver the message
      if (message.bypassContext) {
        // Add to working memory, NOT to LLM context
        await recipient.workingMemory.add(message.data);
      } else {
        // Traditional approach: add to context
        await recipient.addToContext(message.data);
      }

      // Trigger processing if agent is idle
      if (recipient.status === 'idle') {
        await recipient.process();
      }

      const latencyMs = Date.now() - startTime;
      
      if (stats) {
        stats.delivered++;
        stats.avgLatencyMs =
          (stats.avgLatencyMs * (stats.delivered - 1) + latencyMs) / stats.delivered;
      }

      this.emit('message:delivered', {
        messageId: fullMessage.id,
        fromAgentId: message.fromAgentId,
        toAgentId: message.toAgentId,
        latencyMs,
      });

      return {
        success: true,
        messageId: fullMessage.id,
        latencyMs,
      };
    } catch (error) {
      this.handleDeliveryFailure(fullMessage, error instanceof Error ? error.message : String(error));
      
      if (stats) {
        stats.failed++;
      }

      return {
        success: false,
        messageId: fullMessage.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send a message and wait for a response
   */
  async sendAndWait(
    message: Omit<AgentMessage, 'id' | 'timestamp' | 'requireResponse'>,
    timeoutMs = 30000
  ): Promise<{
    success: boolean;
    response?: any;
    error?: string;
  }> {
    return new Promise((resolve) => {
      let messageId: string | undefined;

      const timeout = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          error: 'Response timeout',
        });
      }, timeoutMs);

      const responseHandler = (event: any) => {
        if (event.messageId === messageId) {
          cleanup();
          resolve({
            success: true,
            response: event.data,
          });
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.off('message:response', responseHandler);
      };

      this.on('message:response', responseHandler);

      this.send({ ...message, requireResponse: true })
        .then((result) => {
          messageId = result.messageId;
          if (!result.success) {
            cleanup();
            resolve({
              success: false,
              error: result.error,
            });
          }
        })
        .catch((error) => {
          cleanup();
          resolve({
            success: false,
            error: error.message,
          });
        });
    });
  }

  /**
   * Broadcast a message to multiple agents in parallel
   */
  async broadcast(
    agentIds: string[],
    message: Omit<AgentMessage, 'id' | 'timestamp' | 'toAgentId'>
  ): Promise<Record<string, { success: boolean; error?: string }>> {
    const results: Record<string, { success: boolean; error?: string }> = {};

    const sendPromises = agentIds.map(async (toAgentId) => {
      const result = await this.send({
        ...message,
        toAgentId,
      });

      results[toAgentId] = {
        success: result.success,
        error: result.error,
      };
    });

    await Promise.all(sendPromises);

    this.emit('broadcast:complete', {
      agentIds,
      results,
    });

    return results;
  }

  /**
   * Get pending messages for an agent
   */
  getPendingMessages(agentId: string): AgentMessage[] {
    return this.messageQueue.get(agentId) || [];
  }

  /**
   * Clear pending messages for an agent
   */
  clearPendingMessages(agentId: string): void {
    const queue = this.messageQueue.get(agentId);
    if (queue) {
      queue.length = 0;
    }
  }

  /**
   * Get delivery statistics for an agent
   */
  getStats(agentId: string) {
    return this.deliveryStats.get(agentId);
  }

  /**
   * Get all delivery statistics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.deliveryStats.forEach((value, key) => {
      stats[key] = value;
    });
    return stats;
  }

  /**
   * Get messages from dead letter queue
   */
  getDeadLetterQueue(): AgentMessage[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue.length = 0;
  }

  /**
   * Retry a message from dead letter queue
   */
  async retryDeadLetter(messageId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const index = this.deadLetterQueue.findIndex((msg) => msg.id === messageId);
    if (index === -1) {
      return {
        success: false,
        error: 'Message not found in dead letter queue',
      };
    }

    const message = this.deadLetterQueue.splice(index, 1)[0];
    return this.send(message);
  }

  /**
   * Handle delivery failure
   */
  private handleDeliveryFailure(message: AgentMessage, error: string): void {
    this.deadLetterQueue.push(message);
    this.emit('message:failed', {
      messageId: message.id,
      fromAgentId: message.fromAgentId,
      toAgentId: message.toAgentId,
      error,
    });
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.agents.clear();
    this.messageQueue.clear();
    this.deliveryStats.clear();
    this.deadLetterQueue.length = 0;
  }
}
