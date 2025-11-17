/**
 * Widget Type System
 * 
 * Comprehensive support for custom widgets that can interact with agents and workflows
 */

/**
 * Widget lifecycle states
 */
export type WidgetState = 'initialized' | 'active' | 'inactive' | 'error' | 'destroyed';

/**
 * Widget communication message
 */
export interface WidgetMessage {
  id: string;
  widgetId: string;
  type: 'event' | 'request' | 'response' | 'data' | 'command';
  payload: any;
  timestamp: Date;
  source?: string;  // agent ID or workflow ID
  target?: string;  // widget ID or agent ID
}

/**
 * Widget configuration
 */
export interface WidgetConfig {
  id: string;
  name: string;
  type: string;  // 'form', 'chart', 'table', 'custom', etc.
  version: string;
  
  // Display properties
  title?: string;
  description?: string;
  icon?: string;
  
  // Behavioral properties
  interactive: boolean;
  persistent: boolean;  // survives workflow completion
  autoRefresh?: boolean;
  refreshInterval?: number;  // milliseconds
  
  // Data binding
  inputSchema?: Record<string, any>;  // JSON Schema for input validation
  outputSchema?: Record<string, any>; // JSON Schema for output validation
  
  // Lifecycle hooks
  onInit?: string;  // JavaScript function code
  onMount?: string;
  onUpdate?: string;
  onDestroy?: string;
  
  // Communication
  subscriptions?: string[];  // Event types to subscribe to
  publications?: string[];   // Event types this widget publishes
  
  // Rendering
  template?: string;  // HTML/React template
  styleSheet?: string;  // CSS styles
  
  // Metadata
  tags?: string[];
  category?: string;
  author?: string;
  metadata?: Record<string, any>;
}

/**
 * Widget instance (runtime state)
 */
export interface WidgetInstance {
  id: string;
  configId: string;
  state: WidgetState;
  data: Record<string, any>;
  props: Record<string, any>;
  
  // Lifecycle tracking
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  
  // Communication
  messageQueue: WidgetMessage[];
  eventHandlers: Map<string, Function[]>;
  
  // Associations
  workflowId?: string;
  agentIds?: string[];
  collectionIds?: string[];
  
  // Error handling
  errors: Array<{
    timestamp: Date;
    message: string;
    stack?: string;
  }>;
  
  // Metrics
  metrics: {
    messagesReceived: number;
    messagesSent: number;
    eventsHandled: number;
    errorsCount: number;
    averageResponseTime: number;
  };
}

/**
 * Widget registry entry
 */
export interface WidgetRegistryEntry {
  config: WidgetConfig;
  instances: Map<string, WidgetInstance>;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

/**
 * Widget event
 */
export interface WidgetEvent {
  id: string;
  widgetId: string;
  instanceId: string;
  eventType: string;
  data: any;
  timestamp: Date;
  propagate: boolean;  // should this event be sent to other widgets/agents
}

/**
 * Widget interaction with agents/workflows
 */
export interface WidgetInteraction {
  id: string;
  widgetId: string;
  sourceType: 'agent' | 'workflow' | 'user' | 'system';
  sourceId: string;
  actionType: 'read' | 'write' | 'invoke' | 'subscribe' | 'unsubscribe';
  payload: any;
  timestamp: Date;
  result?: any;
  error?: string;
}

/**
 * Widget error classes
 */
export class WidgetError extends Error {
  constructor(
    message: string,
    public widgetId: string,
    public instanceId?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'WidgetError';
  }
}

export class WidgetValidationError extends WidgetError {
  constructor(message: string, widgetId: string, public validationErrors: any[]) {
    super(message, widgetId, undefined, 'VALIDATION_ERROR');
    this.name = 'WidgetValidationError';
  }
}

export class WidgetCommunicationError extends WidgetError {
  constructor(message: string, widgetId: string, instanceId?: string) {
    super(message, widgetId, instanceId, 'COMMUNICATION_ERROR');
    this.name = 'WidgetCommunicationError';
  }
}

/**
 * Widget templates for common use cases
 */
export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Partial<WidgetConfig>;
  exampleUsage: string;
}
