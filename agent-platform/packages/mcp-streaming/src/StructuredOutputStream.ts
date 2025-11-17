import EventEmitter from 'eventemitter3';
import {
  StreamDestination,
  StreamDestinationType,
  StructuredOutput,
  StreamDeliveryResult,
  StreamStatistics,
  WidgetUpdate,
  WidgetUpdateType,
} from './types.js';

/**
 * Structured output stream manager
 * Enables zero-copy data flow from sources to destinations
 * WITHOUT passing through the calling agent's context
 */
export class StructuredOutputStream extends EventEmitter {
  private destinations: Map<string, StreamDestination> = new Map();
  private statistics: StreamStatistics = {
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageLatencyMs: 0,
    deliveriesByDestinationType: {
      [StreamDestinationType.AGENT]: 0,
      [StreamDestinationType.WORKFLOW]: 0,
      [StreamDestinationType.DATABASE]: 0,
      [StreamDestinationType.WIDGET]: 0,
      [StreamDestinationType.USER]: 0,
      [StreamDestinationType.WEBHOOK]: 0,
    },
  };

  // External handlers for different destination types
  private agentHandler?: (agentId: string, data: any, bypassContext: boolean) => Promise<void>;
  private workflowHandler?: (workflowId: string, data: any) => Promise<void>;
  private databaseHandler?: (collectionId: string, data: any) => Promise<void>;
  private widgetHandler?: (widgetId: string, update: WidgetUpdate) => Promise<void>;
  private webhookHandler?: (url: string, data: any) => Promise<void>;

  /**
   * Register handlers for different destination types
   */
  setHandlers(handlers: {
    agent?: (agentId: string, data: any, bypassContext: boolean) => Promise<void>;
    workflow?: (workflowId: string, data: any) => Promise<void>;
    database?: (collectionId: string, data: any) => Promise<void>;
    widget?: (widgetId: string, update: WidgetUpdate) => Promise<void>;
    webhook?: (url: string, data: any) => Promise<void>;
  }): void {
    if (handlers.agent) this.agentHandler = handlers.agent;
    if (handlers.workflow) this.workflowHandler = handlers.workflow;
    if (handlers.database) this.databaseHandler = handlers.database;
    if (handlers.widget) this.widgetHandler = handlers.widget;
    if (handlers.webhook) this.webhookHandler = handlers.webhook;
  }

  /**
   * Register a destination for structured output
   */
  addDestination(destination: StreamDestination): void {
    const key = `${destination.type}:${destination.id}`;
    this.destinations.set(key, destination);
    this.emit('destination:added', destination);
  }

  /**
   * Remove a destination
   */
  removeDestination(type: StreamDestinationType, id: string): void {
    const key = `${type}:${id}`;
    const destination = this.destinations.get(key);
    if (destination) {
      this.destinations.delete(key);
      this.emit('destination:removed', destination);
    }
  }

  /**
   * Get all registered destinations
   */
  getDestinations(): StreamDestination[] {
    return Array.from(this.destinations.values());
  }

  /**
   * Stream output to all registered destinations
   * WITHOUT passing through the calling agent's context
   */
  async stream(output: StructuredOutput): Promise<StreamDeliveryResult[]> {
    const results: StreamDeliveryResult[] = [];
    const destinations = Array.from(this.destinations.values());

    // Stream to all destinations in parallel
    const deliveryPromises = destinations.map(async (dest) => {
      const startTime = Date.now();
      
      try {
        // Apply filter if specified
        if (dest.filter && !dest.filter(output.data)) {
          return {
            destinationId: dest.id,
            success: true,
            deliveredAt: new Date(),
            latencyMs: 0,
          };
        }

        // Apply schema transformation if specified
        let data = output.data;
        if (dest.transformSchema) {
          data = dest.transformSchema.parse(data);
        }

        // Route to appropriate handler
        await this.routeToDestination(dest, data, output);

        const latencyMs = Date.now() - startTime;
        
        this.updateStatistics(dest.type, true, latencyMs);

        return {
          destinationId: dest.id,
          success: true,
          deliveredAt: new Date(),
          latencyMs,
        };
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        
        this.updateStatistics(dest.type, false, latencyMs);

        return {
          destinationId: dest.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          deliveredAt: new Date(),
          latencyMs,
        };
      }
    });

    results.push(...(await Promise.all(deliveryPromises)));

    this.emit('stream:complete', { output, results });

    return results;
  }

  /**
   * Route data to the appropriate destination handler
   */
  private async routeToDestination(
    destination: StreamDestination,
    data: any,
    output: StructuredOutput
  ): Promise<void> {
    switch (destination.type) {
      case StreamDestinationType.AGENT:
        await this.streamToAgent(destination.id, data);
        break;
      case StreamDestinationType.WORKFLOW:
        await this.streamToWorkflow(destination.id, data);
        break;
      case StreamDestinationType.DATABASE:
        await this.streamToDatabase(destination.id, data);
        break;
      case StreamDestinationType.WIDGET:
        await this.streamToWidget(destination.id, data, output);
        break;
      case StreamDestinationType.USER:
        // User destination is handled by emitting an event
        this.emit('user:data', { data, sourceId: output.sourceId });
        break;
      case StreamDestinationType.WEBHOOK:
        await this.streamToWebhook(destination.id, data);
        break;
      default:
        throw new Error(`Unknown destination type: ${destination.type}`);
    }
  }

  /**
   * Stream to agent WITHOUT adding to LLM context
   */
  private async streamToAgent(agentId: string, data: any): Promise<void> {
    if (!this.agentHandler) {
      throw new Error('Agent handler not configured');
    }
    
    // KEY: bypassContext = true means data goes to working memory, not LLM context
    await this.agentHandler(agentId, data, true);
  }

  /**
   * Stream to workflow
   */
  private async streamToWorkflow(workflowId: string, data: any): Promise<void> {
    if (!this.workflowHandler) {
      throw new Error('Workflow handler not configured');
    }
    
    await this.workflowHandler(workflowId, data);
  }

  /**
   * Stream to database
   */
  private async streamToDatabase(collectionId: string, data: any): Promise<void> {
    if (!this.databaseHandler) {
      throw new Error('Database handler not configured');
    }
    
    await this.databaseHandler(collectionId, data);
  }

  /**
   * Stream to widget via direct update
   */
  private async streamToWidget(
    widgetId: string,
    data: any,
    output: StructuredOutput
  ): Promise<void> {
    if (!this.widgetHandler) {
      throw new Error('Widget handler not configured');
    }
    
    const update: WidgetUpdate = {
      widgetId,
      type: WidgetUpdateType.DATA,
      data,
      timestamp: new Date(),
      sourceId: output.sourceId,
    };
    
    await this.widgetHandler(widgetId, update);
  }

  /**
   * Stream to webhook
   */
  private async streamToWebhook(url: string, data: any): Promise<void> {
    if (!this.webhookHandler) {
      throw new Error('Webhook handler not configured');
    }
    
    await this.webhookHandler(url, data);
  }

  /**
   * Update delivery statistics
   */
  private updateStatistics(
    destinationType: StreamDestinationType,
    success: boolean,
    latencyMs: number
  ): void {
    this.statistics.totalDeliveries++;
    
    if (success) {
      this.statistics.successfulDeliveries++;
    } else {
      this.statistics.failedDeliveries++;
    }
    
    this.statistics.deliveriesByDestinationType[destinationType]++;
    
    // Update average latency (moving average)
    const totalLatency =
      this.statistics.averageLatencyMs * (this.statistics.totalDeliveries - 1) +
      latencyMs;
    this.statistics.averageLatencyMs = totalLatency / this.statistics.totalDeliveries;
    
    this.statistics.lastDeliveryAt = new Date();
  }

  /**
   * Get streaming statistics
   */
  getStatistics(): StreamStatistics {
    return { ...this.statistics };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageLatencyMs: 0,
      deliveriesByDestinationType: {
        [StreamDestinationType.AGENT]: 0,
        [StreamDestinationType.WORKFLOW]: 0,
        [StreamDestinationType.DATABASE]: 0,
        [StreamDestinationType.WIDGET]: 0,
        [StreamDestinationType.USER]: 0,
        [StreamDestinationType.WEBHOOK]: 0,
      },
    };
  }

  /**
   * Clear all destinations
   */
  clearDestinations(): void {
    this.destinations.clear();
    this.emit('destinations:cleared');
  }
}
