import { z } from 'zod';

/**
 * Destination types for structured output streams
 */
export enum StreamDestinationType {
  AGENT = 'agent',
  WORKFLOW = 'workflow',
  DATABASE = 'database',
  WIDGET = 'widget',
  USER = 'user',
  WEBHOOK = 'webhook',
}

/**
 * Stream destination configuration
 */
export interface StreamDestination {
  type: StreamDestinationType;
  id: string;
  transformSchema?: z.ZodSchema;
  filter?: (data: any) => boolean;
  metadata?: Record<string, any>;
}

/**
 * Structured output data
 */
export interface StructuredOutput {
  sourceId: string;
  sourceType: 'agent' | 'tool' | 'workflow';
  data: any;
  schema?: z.ZodSchema;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Stream delivery result
 */
export interface StreamDeliveryResult {
  destinationId: string;
  success: boolean;
  error?: string;
  deliveredAt: Date;
  latencyMs: number;
}

/**
 * Agent message types
 */
export enum AgentMessageType {
  STRUCTURED_INPUT = 'structured_input',
  QUERY = 'query',
  COMMAND = 'command',
  RESPONSE = 'response',
  ERROR = 'error',
}

/**
 * Message between agents
 */
export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  type: AgentMessageType;
  data: any;
  bypassContext?: boolean;
  requireResponse?: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Agent instance interface for message bus
 */
export interface AgentInstance {
  id: string;
  name: string;
  status: 'idle' | 'busy' | 'error';
  workingMemory: WorkingMemory;
  addToContext(data: any): Promise<void>;
  process(): Promise<void>;
}

/**
 * Working memory interface for agents
 */
export interface WorkingMemory {
  add(data: any): Promise<void>;
  get(key: string): any;
  clear(): void;
}

/**
 * Widget update types
 */
export enum WidgetUpdateType {
  DATA = 'data',
  STATE = 'state',
  PROPS = 'props',
  EVENT = 'event',
}

/**
 * Widget update message
 */
export interface WidgetUpdate {
  widgetId: string;
  type: WidgetUpdateType;
  data: any;
  timestamp: Date;
  sourceId?: string;
}

/**
 * Hook trigger events
 */
export type HookTriggerEvent =
  | 'tool:before'
  | 'tool:after'
  | 'agent:before'
  | 'agent:after'
  | 'workflow:step:before'
  | 'workflow:step:after';

/**
 * Hook context passed to hook handlers
 */
export interface HookContext {
  triggerEvent: HookTriggerEvent;
  sourceId: string;
  sourceType: 'agent' | 'tool' | 'workflow';
  input?: any;
  result?: any;
  error?: Error;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Hook interface
 */
export interface Hook {
  id: string;
  name: string;
  triggerOn: HookTriggerEvent;
  handler: (context: HookContext) => Promise<void> | void;
  async?: boolean;
  priority?: number;
}

/**
 * Tool access policy modes
 */
export enum ToolAccessMode {
  ALL = 'all',
  WHITELIST = 'whitelist',
  BLACKLIST = 'blacklist',
}

/**
 * Budget limits for tool usage
 */
export interface ToolBudgetLimits {
  maxCallsPerHour?: number;
  maxCallsPerDay?: number;
  maxCostPerDay?: number;
  maxCostPerMonth?: number;
}

/**
 * Tool access policy
 */
export interface ToolAccessPolicy {
  agentId: string;
  mode: ToolAccessMode;
  whitelist?: string[];
  blacklist?: string[];
  requireApproval?: string[];
  budgetLimits?: Record<string, ToolBudgetLimits>;
  inheritFrom?: string;
}

/**
 * Tool access check result
 */
export interface ToolAccessCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
  budgetStatus?: {
    withinBudget: boolean;
    remaining?: number;
    resetAt?: Date;
  };
}

/**
 * Tool metadata for access control
 */
export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  estimatedCost?: number;
  rateLimit?: {
    maxCallsPerMinute?: number;
    maxCallsPerHour?: number;
  };
}

/**
 * Tool usage record
 */
export interface ToolUsageRecord {
  agentId: string;
  toolId: string;
  timestamp: Date;
  cost?: number;
  duration?: number;
  success: boolean;
  error?: string;
}

/**
 * Message delivery options
 */
export interface MessageDeliveryOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Stream statistics
 */
export interface StreamStatistics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageLatencyMs: number;
  deliveriesByDestinationType: Record<StreamDestinationType, number>;
  lastDeliveryAt?: Date;
}
