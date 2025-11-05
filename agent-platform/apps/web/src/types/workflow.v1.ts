/**
 * Workflow Specification V1.0
 * Defines the structure for agent workflows
 */

export interface WorkflowV1 {
  // Metadata
  id: string;
  version: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
  };
  
  // Classification
  category: 'automation' | 'data-processing' | 'ai-pipeline' | 'integration' | 'custom';
  tags: string[];
  
  // Workflow Structure
  nodes: WorkflowNodeV1[];
  edges: WorkflowEdgeV1[];
  
  // Configuration
  config: {
    triggerType: 'manual' | 'scheduled' | 'event' | 'webhook';
    triggerConfig?: {
      schedule?: string; // Cron expression
      event?: string; // Event name
      webhookPath?: string;
    };
    timeout?: number; // milliseconds
    retryPolicy?: {
      maxRetries: number;
      backoffMultiplier: number;
    };
  };
  
  // Input/Output Schema
  inputSchema?: {
    type: 'object';
    properties: Record<string, any>;
  };
  outputSchema?: {
    type: 'object';
    properties: Record<string, any>;
  };
  
  // Metadata
  metadata: {
    icon?: string;
    preview?: string;
    license: string;
    published: boolean;
    verified: boolean;
    downloads: number;
    rating: number;
    createdAt: string;
    updatedAt: string;
  };
}

export interface WorkflowNodeV1 {
  id: string;
  type: 'agent' | 'function' | 'condition' | 'loop' | 'webhook' | 'database' | 'api';
  label: string;
  position: { x: number; y: number };
  data: {
    agentId?: string;
    functionName?: string;
    condition?: string;
    config?: Record<string, any>;
  };
}

export interface WorkflowEdgeV1 {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string; // For conditional edges
}

/**
 * Example Workflow: Content Generation Pipeline
 */
export const contentPipelineExample: WorkflowV1 = {
  id: 'content-pipeline-v1',
  version: '1.0.0',
  name: 'Content Generation Pipeline',
  description: 'Automated content generation, review, and publishing workflow',
  author: {
    id: 'platform',
    name: 'Platform Team',
  },
  category: 'automation',
  tags: ['content', 'ai', 'automation', 'publishing'],
  nodes: [
    {
      id: 'start',
      type: 'webhook',
      label: 'Trigger',
      position: { x: 100, y: 100 },
      data: {
        config: { webhookPath: '/workflows/content-start' },
      },
    },
    {
      id: 'generate',
      type: 'agent',
      label: 'Generate Content',
      position: { x: 100, y: 250 },
      data: {
        agentId: 'content-writer-agent',
      },
    },
    {
      id: 'review',
      type: 'agent',
      label: 'Review Content',
      position: { x: 100, y: 400 },
      data: {
        agentId: 'content-reviewer-agent',
      },
    },
    {
      id: 'publish',
      type: 'api',
      label: 'Publish',
      position: { x: 100, y: 550 },
      data: {
        config: { endpoint: '/api/content/publish' },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'generate' },
    { id: 'e2', source: 'generate', target: 'review' },
    { id: 'e3', source: 'review', target: 'publish' },
  ],
  config: {
    triggerType: 'webhook',
    triggerConfig: {
      webhookPath: '/workflows/content-start',
    },
    timeout: 300000, // 5 minutes
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
    },
  },
  inputSchema: {
    type: 'object',
    properties: {
      topic: { type: 'string' },
      style: { type: 'string' },
      wordCount: { type: 'number' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      content: { type: 'string' },
      publishedUrl: { type: 'string' },
    },
  },
  metadata: {
    icon: '📝',
    preview: '/previews/content-pipeline.png',
    license: 'MIT',
    published: true,
    verified: true,
    downloads: 850,
    rating: 4.7,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
};
