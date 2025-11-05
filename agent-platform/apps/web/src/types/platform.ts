/**
 * Core Platform Types
 * 
 * Comprehensive type definitions for agents, workflows, evaluators, and platform features
 */

// ==================== Base Types ====================

export type AgentType = 'agent' | 'evaluator' | 'mutator' | 'workflow' | 'tool';
export type ExecutionMode = 'sync' | 'async' | 'streaming';
export type PrivacyLevel = 'private' | 'unlisted' | 'public' | 'restricted';
export type MonetizationModel = 'free' | 'one-time' | 'subscription' | 'usage-based' | 'hybrid';
export type SharePermission = 'view' | 'comment' | 'edit' | 'admin';

// ==================== System Prompts & Rules ====================

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  variables?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentRules {
  // Execution rules
  maxTurns?: number;
  maxTokens?: number;
  temperature?: number;
  timeout?: number; // milliseconds
  
  // Behavioral rules
  allowedActions?: string[];
  forbiddenActions?: string[];
  requiredApprovals?: string[];
  
  // Safety rules
  contentFiltering?: 'strict' | 'moderate' | 'permissive';
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    tokensPerDay?: number;
  };
  
  // Custom rules
  customRules?: Array<{
    name: string;
    condition: string; // JavaScript expression
    action: 'allow' | 'deny' | 'warn' | 'require_approval';
    message?: string;
  }>;
}

export interface IslandRules extends AgentRules {
  islandId: string;
  inheritFromGlobal?: boolean;
  agentOverrides?: Record<string, Partial<AgentRules>>;
}

// ==================== Lifecycle Callbacks ====================

export type CallbackEvent = 'on_start' | 'before_turn' | 'after_turn' | 'on_end' | 'on_error';

export interface Callback {
  id: string;
  event: CallbackEvent;
  handler: string; // JavaScript function as string or function reference
  async?: boolean;
  enabled?: boolean;
  order?: number; // Execution order if multiple callbacks
}

export interface CallbackContext {
  agent?: Agent;
  workflow?: Workflow;
  turn?: number;
  input?: any;
  output?: any;
  error?: Error;
  metadata?: Record<string, any>;
}

// ==================== Enhanced Agent Definition ====================

export interface Agent {
  // Basic info
  id: string;
  name: string;
  description: string;
  type: AgentType;
  version: string;
  
  // Configuration
  systemPrompt?: SystemPrompt;
  rules?: AgentRules;
  model?: string;
  temperature?: number;
  
  // Execution
  executionMode?: ExecutionMode;
  callbacks?: Callback[];
  
  // Tools and capabilities
  tools?: Tool[];
  capabilities?: string[];
  
  // Memory
  memoryConfig?: {
    type: 'short-term' | 'long-term' | 'hybrid';
    maxMessages?: number;
    vectorStore?: string;
    retrievalK?: number;
  };
  
  // Metadata
  creator: {
    id: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  category: string;
  tags: string[];
  
  // Sharing & Privacy
  privacy: PrivacyLevel;
  sharing?: SharingConfig;
  
  // Monetization
  monetization?: MonetizationConfig;
  
  // Metrics
  metrics?: AgentMetrics;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Workflows ====================

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'tool' | 'condition' | 'loop' | 'parallel' | 'human_input';
  
  // Agent/Tool reference
  agentId?: string;
  toolId?: string;
  
  // Configuration
  config?: Record<string, any>;
  systemPrompt?: SystemPrompt;
  rules?: AgentRules;
  
  // Flow control
  condition?: string; // JavaScript expression
  next?: string | string[]; // Next step ID(s)
  onSuccess?: string;
  onError?: string;
  
  // Parallel execution
  parallel?: boolean;
  waitForAll?: boolean;
  
  // Callbacks
  callbacks?: Callback[];
  
  // Position (for canvas)
  position?: { x: number; y: number };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  
  // Steps
  steps: WorkflowStep[];
  startStep: string; // Initial step ID
  
  // Configuration
  systemPrompt?: SystemPrompt;
  rules?: AgentRules;
  executionMode?: ExecutionMode;
  
  // Callbacks
  callbacks?: Callback[];
  
  // Variables
  variables?: Record<string, any>;
  
  // Sharing & Privacy
  privacy: PrivacyLevel;
  sharing?: SharingConfig;
  
  // Monetization
  monetization?: MonetizationConfig;
  
  // Metadata
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  
  // Metrics
  metrics?: WorkflowMetrics;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Background Execution ====================

export interface BackgroundJob {
  id: string;
  type: 'agent' | 'workflow';
  targetId: string; // Agent or Workflow ID
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Input/Output
  input: any;
  output?: any;
  error?: string;
  
  // Progress
  progress?: number; // 0-100
  currentStep?: string;
  totalSteps?: number;
  
  // Timing
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Configuration
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  
  // Callbacks
  onComplete?: string; // Webhook URL or callback ID
  onError?: string;
}

// ==================== Sharing & Privacy ====================

export interface SharingConfig {
  // Access control
  permissions: Array<{
    userId?: string;
    email?: string;
    permission: SharePermission;
    expiresAt?: Date;
  }>;
  
  // Link sharing
  linkSharing?: {
    enabled: boolean;
    permission: SharePermission;
    requireAuth?: boolean;
    expiresAt?: Date;
  };
  
  // Mutability
  allowFork?: boolean;
  allowCopy?: boolean;
  allowExport?: boolean;
  
  // Discovery
  listed?: boolean;
  searchable?: boolean;
}

// ==================== Monetization ====================

export interface MonetizationConfig {
  model: MonetizationModel;
  
  // Pricing
  price?: number;
  currency?: string;
  
  // Subscription
  subscriptionTiers?: Array<{
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    limits?: {
      executionsPerMonth?: number;
      tokensPerMonth?: number;
    };
  }>;
  
  // Usage-based
  usageRates?: {
    perExecution?: number;
    perToken?: number;
    perMinute?: number;
  };
  
  // Revenue sharing
  revenueShare?: {
    creatorPercentage: number;
    platformPercentage: number;
  };
  
  // Trials
  trial?: {
    enabled: boolean;
    duration: number; // days
    features?: string[];
  };
}

// ==================== Database Integration ====================

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'supabase' | 'mongodb' | 'sqlite' | 'postgresql' | 'mysql' | 'redis' | 'firebase';
  
  // Connection details
  config: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string; // Encrypted
    ssl?: boolean;
    
    // Service-specific
    projectUrl?: string; // Supabase
    apiKey?: string; // Supabase, Firebase
    connectionString?: string; // MongoDB
    filePath?: string; // SQLite
  };
  
  // Access control
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  
  // Schema
  schema?: Array<{
    table: string;
    columns: Array<{
      name: string;
      type: string;
      nullable?: boolean;
    }>;
  }>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastConnected?: Date;
}

// ==================== Tools ====================

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'function' | 'api' | 'database' | 'agent';
  
  // Function definition
  function?: {
    name: string;
    parameters: Record<string, any>; // JSON Schema
    returns?: Record<string, any>;
    implementation: string; // JavaScript code
  };
  
  // API definition
  api?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    auth?: {
      type: 'bearer' | 'basic' | 'api_key';
      credentials: string; // Encrypted
    };
  };
  
  // Database query
  database?: {
    connectionId: string;
    query: string;
    parameters?: Record<string, any>;
  };
  
  // Agent tool
  agent?: {
    agentId: string;
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
  };
}

// ==================== Voice Agent Tools ====================

export interface VoiceAgentTool extends Tool {
  // Special tools for voice agent
  category: 'agent_builder' | 'workflow_builder' | 'mcp_tool' | 'app_search' | 'marketplace' | 'database';
  
  // Voice-specific configuration
  voiceConfig?: {
    triggerPhrases: string[];
    confirmationRequired?: boolean;
    examples?: string[];
  };
}

// ==================== Canvas & Widgets ====================

export interface CanvasNode {
  id: string;
  type: 'agent' | 'workflow' | 'widget' | 'trigger' | 'action' | 'condition';
  
  // Visual
  position: { x: number; y: number };
  size?: { width: number; height: number };
  color?: string;
  
  // Data
  data: any;
  
  // Connections
  inputs?: string[];
  outputs?: string[];
}

export interface CanvasWidget {
  id: string;
  type: 'text' | 'image' | 'video' | 'form' | 'chart' | 'table' | 'voice_transcript' | 'custom';
  
  // Configuration
  config: {
    title?: string;
    content?: any;
    style?: Record<string, any>;
    interactive?: boolean;
    autoDisplay?: boolean;
  };
  
  // Position
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface Hook {
  id: string;
  name: string;
  type: 'webhook' | 'schedule' | 'event' | 'file_upload' | 'database_change';
  
  // Configuration
  config: {
    url?: string;
    schedule?: string; // Cron expression
    event?: string;
    filter?: string; // JavaScript expression
  };
  
  // Action
  action: {
    type: 'trigger_workflow' | 'call_agent' | 'http_request';
    targetId?: string;
    payload?: any;
  };
  
  // Status
  enabled: boolean;
  lastTriggered?: Date;
}

// ==================== Metrics ====================

export interface AgentMetrics {
  successRate: number;
  avgResponseTime: number; // ms
  totalExecutions: number;
  totalTokens: number;
  avgCost: number;
  satisfaction: number; // 0-100
}

export interface WorkflowMetrics extends AgentMetrics {
  avgSteps: number;
  completionRate: number;
}

// ==================== Evaluators & Mutators ====================

export interface Evaluator extends Agent {
  type: 'evaluator';
  evaluationCriteria: {
    metrics: string[];
    weights?: Record<string, number>;
    threshold?: number;
  };
  outputFormat: 'score' | 'pass_fail' | 'detailed' | 'custom';
}

export interface Mutator extends Agent {
  type: 'mutator';
  mutationType: 'crossover' | 'mutation' | 'hybrid';
  mutationRate?: number;
  crossoverRate?: number;
}

export interface Island {
  id: string;
  name: string;
  agents: Agent[];
  evaluator?: Evaluator;
  mutator?: Mutator;
  rules?: IslandRules;
  systemPrompt?: SystemPrompt;
  generation: number;
  bestScore?: number;
}
