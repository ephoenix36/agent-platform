/**
 * Widget Service
 * 
 * Manages widget lifecycle, communication, and integration with agents/workflows
 */

import { Logger } from '../utils/logging.js';
import {
  WidgetConfig,
  WidgetInstance,
  WidgetRegistryEntry,
  WidgetMessage,
  WidgetEvent,
  WidgetState,
  WidgetError,
  WidgetValidationError,
  WidgetCommunicationError,
  WidgetTemplate
} from '../types/widget.js';
import { EventEmitter } from 'events';

export class WidgetService extends EventEmitter {
  private registry: Map<string, WidgetRegistryEntry> = new Map();
  private messageHandlers: Map<string, Function> = new Map();
  private templates: Map<string, WidgetTemplate> = new Map();
  
  constructor(private logger: Logger) {
    super();
    this.initializeTemplates();
  }

  /**
   * Initialize built-in widget templates
   */
  private initializeTemplates(): void {
    const templates: WidgetTemplate[] = [
      {
        id: 'form-input',
        name: 'Form Input Widget',
        description: 'Collect structured input from agents or users',
        category: 'input',
        config: {
          type: 'form',
          interactive: true,
          persistent: false,
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        exampleUsage: 'Create a form to collect data during workflow execution'
      },
      {
        id: 'data-chart',
        name: 'Data Visualization Chart',
        description: 'Visualize data with various chart types',
        category: 'visualization',
        config: {
          type: 'chart',
          interactive: false,
          persistent: true,
          autoRefresh: true,
          refreshInterval: 5000
        },
        exampleUsage: 'Display agent analysis results as charts'
      },
      {
        id: 'approval-gate',
        name: 'Approval Gate Widget',
        description: 'Pause workflow for human approval',
        category: 'workflow',
        config: {
          type: 'approval',
          interactive: true,
          persistent: false,
          inputSchema: {
            type: 'object',
            properties: {
              approve: { type: 'boolean' },
              comments: { type: 'string' }
            },
            required: ['approve']
          }
        },
        exampleUsage: 'Require approval before deploying changes'
      },
      {
        id: 'data-table',
        name: 'Data Table Widget',
        description: 'Display and edit tabular data',
        category: 'data',
        config: {
          type: 'table',
          interactive: true,
          persistent: true
        },
        exampleUsage: 'Show results from collection queries'
      },
      {
        id: 'status-monitor',
        name: 'Status Monitor Widget',
        description: 'Real-time status monitoring dashboard',
        category: 'monitoring',
        config: {
          type: 'monitor',
          interactive: false,
          persistent: true,
          autoRefresh: true,
          refreshInterval: 1000
        },
        exampleUsage: 'Monitor workflow or agent status in real-time'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    this.logger.info(`Initialized ${templates.length} widget templates`);
  }

  /**
   * Register a new widget configuration
   */
  registerWidget(config: WidgetConfig): void {
    this.logger.info(`Registering widget: ${config.id}`);

    // Validate configuration
    this.validateWidgetConfig(config);

    const entry: WidgetRegistryEntry = {
      config,
      instances: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };

    this.registry.set(config.id, entry);
    this.emit('widget:registered', config);
  }

  /**
   * Create a widget instance
   */
  createInstance(
    configId: string,
    props?: Record<string, any>,
    workflowId?: string
  ): WidgetInstance {
    const entry = this.registry.get(configId);
    if (!entry) {
      throw new WidgetError(`Widget config not found: ${configId}`, configId);
    }

    const instanceId = `${configId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const instance: WidgetInstance = {
      id: instanceId,
      configId,
      state: 'initialized',
      data: {},
      props: props || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      messageQueue: [],
      eventHandlers: new Map(),
      workflowId,
      agentIds: [],
      collectionIds: [],
      errors: [],
      metrics: {
        messagesReceived: 0,
        messagesSent: 0,
        eventsHandled: 0,
        errorsCount: 0,
        averageResponseTime: 0
      }
    };

    entry.instances.set(instanceId, instance);
    entry.usageCount++;
    entry.updatedAt = new Date();

    this.logger.debug(`Created widget instance: ${instanceId}`);
    this.emit('widget:instance:created', instance);

    // Run onInit hook if defined
    if (entry.config.onInit) {
      this.runHook(instance, entry.config.onInit, 'onInit');
    }

    // Transition to active state
    this.updateInstanceState(instanceId, 'active');

    return instance;
  }

  /**
   * Get widget instance
   */
  getInstance(instanceId: string): WidgetInstance | undefined {
    for (const entry of this.registry.values()) {
      const instance = entry.instances.get(instanceId);
      if (instance) {
        return instance;
      }
    }
    return undefined;
  }

  /**
   * Update widget instance state
   */
  updateInstanceState(instanceId: string, newState: WidgetState): void {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new WidgetError(`Instance not found: ${instanceId}`, 'unknown', instanceId);
    }

    const oldState = instance.state;
    instance.state = newState;
    instance.updatedAt = new Date();

    this.logger.debug(`Widget ${instanceId} state: ${oldState} -> ${newState}`);
    this.emit('widget:instance:state-changed', { instance, oldState, newState });
  }

  /**
   * Send message to widget
   */
  async sendMessage(instanceId: string, message: Omit<WidgetMessage, 'id' | 'timestamp'>): Promise<void> {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new WidgetCommunicationError(`Instance not found: ${instanceId}`, 'unknown', instanceId);
    }

    const fullMessage: WidgetMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    instance.messageQueue.push(fullMessage);
    instance.metrics.messagesReceived++;
    instance.lastActivityAt = new Date();

    this.logger.debug(`Message sent to widget ${instanceId}: ${fullMessage.type}`);
    this.emit('widget:message:received', { instance, message: fullMessage });

    // Process message handlers
    await this.processMessage(instance, fullMessage);
  }

  /**
   * Process message
   */
  private async processMessage(instance: WidgetInstance, message: WidgetMessage): Promise<void> {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      try {
        await handlers.call(null, instance, message);
      } catch (error: any) {
        this.logger.error(`Error processing message ${message.id}:`, error);
        instance.errors.push({
          timestamp: new Date(),
          message: error.message,
          stack: error.stack
        });
        instance.metrics.errorsCount++;
      }
    }
  }

  /**
   * Register message handler
   */
  registerMessageHandler(messageType: string, handler: Function): void {
    this.messageHandlers.set(messageType, handler);
    this.logger.debug(`Registered message handler for type: ${messageType}`);
  }

  /**
   * Emit widget event
   */
  emitWidgetEvent(event: WidgetEvent): void {
    const instance = this.getInstance(event.instanceId);
    if (!instance) {
      this.logger.warn(`Cannot emit event for unknown instance: ${event.instanceId}`);
      return;
    }

    instance.metrics.eventsHandled++;
    instance.lastActivityAt = new Date();

    this.logger.debug(`Widget event emitted: ${event.eventType} from ${event.widgetId}`);
    this.emit('widget:event', event);

    // If event should propagate, send to associated agents/workflows
    if (event.propagate && instance.workflowId) {
      this.emit('widget:event:propagate', { event, workflowId: instance.workflowId });
    }
  }

  /**
   * Update widget data
   */
  updateData(instanceId: string, data: Record<string, any>, merge: boolean = true): void {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      throw new WidgetError(`Instance not found: ${instanceId}`, 'unknown', instanceId);
    }

    if (merge) {
      instance.data = { ...instance.data, ...data };
    } else {
      instance.data = data;
    }

    instance.updatedAt = new Date();
    instance.lastActivityAt = new Date();

    this.emit('widget:data:updated', { instance, data });
  }

  /**
   * Destroy widget instance
   */
  destroyInstance(instanceId: string): void {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      this.logger.warn(`Instance not found for destruction: ${instanceId}`);
      return;
    }

    // Run onDestroy hook
    const entry = this.registry.get(instance.configId);
    if (entry?.config.onDestroy) {
      this.runHook(instance, entry.config.onDestroy, 'onDestroy');
    }

    // Update state
    this.updateInstanceState(instanceId, 'destroyed');

    // Remove from registry
    if (entry) {
      entry.instances.delete(instanceId);
    }

    this.logger.info(`Destroyed widget instance: ${instanceId}`);
    this.emit('widget:instance:destroyed', instance);
  }

  /**
   * Run lifecycle hook
   */
  private runHook(instance: WidgetInstance, code: string, hookName: string): void {
    try {
      const hookFn = new Function('instance', 'data', 'props', code);
      hookFn.call(null, instance, instance.data, instance.props);
      this.logger.debug(`Executed ${hookName} hook for ${instance.id}`);
    } catch (error: any) {
      this.logger.error(`Error in ${hookName} hook:`, error);
      instance.errors.push({
        timestamp: new Date(),
        message: `${hookName} hook error: ${error.message}`,
        stack: error.stack
      });
    }
  }

  /**
   * Validate widget configuration
   */
  private validateWidgetConfig(config: WidgetConfig): void {
    const errors: string[] = [];

    if (!config.id) errors.push('Widget ID is required');
    if (!config.name) errors.push('Widget name is required');
    if (!config.type) errors.push('Widget type is required');
    if (!config.version) errors.push('Widget version is required');

    if (errors.length > 0) {
      throw new WidgetValidationError(
        'Widget configuration validation failed',
        config.id || 'unknown',
        errors
      );
    }
  }

  /**
   * Get widget templates
   */
  getTemplates(category?: string): WidgetTemplate[] {
    let templates = Array.from(this.templates.values());
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return templates;
  }

  /**
   * Create instance from template
   */
  createFromTemplate(
    templateId: string,
    customConfig?: Partial<WidgetConfig>,
    props?: Record<string, any>,
    workflowId?: string
  ): WidgetInstance {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new WidgetError(`Template not found: ${templateId}`, templateId);
    }

    // Merge template config with custom config
    const config: WidgetConfig = {
      id: `${templateId}_${Date.now()}`,
      name: template.name,
      version: '1.0.0',
      interactive: false,
      persistent: false,
      ...template.config,
      ...customConfig
    } as WidgetConfig;

    // Register and create instance
    this.registerWidget(config);
    return this.createInstance(config.id, props, workflowId);
  }

  /**
   * Get widget statistics
   */
  getStats(): any {
    const stats = {
      totalConfigs: this.registry.size,
      totalInstances: 0,
      activeInstances: 0,
      errorInstances: 0,
      totalMessages: 0,
      totalEvents: 0,
      totalErrors: 0
    };

    for (const entry of this.registry.values()) {
      stats.totalInstances += entry.instances.size;
      
      for (const instance of entry.instances.values()) {
        if (instance.state === 'active') stats.activeInstances++;
        if (instance.state === 'error') stats.errorInstances++;
        stats.totalMessages += instance.metrics.messagesReceived + instance.metrics.messagesSent;
        stats.totalEvents += instance.metrics.eventsHandled;
        stats.totalErrors += instance.metrics.errorsCount;
      }
    }

    return stats;
  }

  /**
   * Cleanup inactive instances
   */
  cleanup(maxInactiveTime: number = 3600000): number {
    let cleaned = 0;
    const now = new Date();

    for (const entry of this.registry.values()) {
      for (const [instanceId, instance] of entry.instances.entries()) {
        const inactiveTime = now.getTime() - instance.lastActivityAt.getTime();
        
        if (inactiveTime > maxInactiveTime && instance.state !== 'active' && !instance.props.persistent) {
          this.destroyInstance(instanceId);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      this.logger.info(`Cleaned up ${cleaned} inactive widget instances`);
    }

    return cleaned;
  }
}
