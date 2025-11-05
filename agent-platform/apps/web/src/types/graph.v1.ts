/**
 * Graph Specification V1.0
 * Defines the structure for visual agent graphs and knowledge graphs
 */

export interface GraphV1 {
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
  type: 'agent-network' | 'knowledge-graph' | 'workflow-graph' | 'dependency-graph' | 'custom';
  tags: string[];
  
  // Graph Structure
  nodes: GraphNodeV1[];
  edges: GraphEdgeV1[];
  
  // Layout Configuration
  layout: {
    algorithm: 'force-directed' | 'hierarchical' | 'circular' | 'grid' | 'manual';
    spacing?: number;
    direction?: 'TB' | 'LR' | 'BT' | 'RL'; // Top-Bottom, Left-Right, etc.
  };
  
  // Visualization
  visualization: {
    nodeStyle?: {
      default?: any;
      byType?: Record<string, any>;
    };
    edgeStyle?: {
      default?: any;
      byType?: Record<string, any>;
    };
    zoom?: {
      min: number;
      max: number;
      default: number;
    };
  };
  
  // Interactivity
  interactions?: {
    draggable: boolean;
    selectable: boolean;
    connectable: boolean;
    onNodeClick?: string;
    onEdgeClick?: string;
  };
  
  // Data Source
  dataSource?: {
    type: 'static' | 'dynamic' | 'api';
    endpoint?: string;
    refreshInterval?: number;
  };
  
  // Metadata
  metadata: {
    icon?: string;
    preview?: string;
    license: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface GraphNodeV1 {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  style?: any;
}

export interface GraphEdgeV1 {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  data?: Record<string, any>;
  style?: any;
}

/**
 * Example Graph: Agent Network
 */
export const agentNetworkExample: GraphV1 = {
  id: 'agent-network-v1',
  version: '1.0.0',
  name: 'Agent Collaboration Network',
  description: 'Visual representation of how agents collaborate',
  author: {
    id: 'platform',
    name: 'Platform Team',
  },
  type: 'agent-network',
  tags: ['agents', 'network', 'collaboration'],
  nodes: [
    {
      id: 'agent-1',
      type: 'agent',
      label: 'Code Reviewer',
      position: { x: 100, y: 100 },
      data: {
        agentId: 'code-reviewer',
        status: 'active',
        tasksCompleted: 145,
      },
    },
    {
      id: 'agent-2',
      type: 'agent',
      label: 'Content Writer',
      position: { x: 300, y: 100 },
      data: {
        agentId: 'content-writer',
        status: 'active',
        tasksCompleted: 89,
      },
    },
    {
      id: 'agent-3',
      type: 'agent',
      label: 'Data Analyst',
      position: { x: 200, y: 250 },
      data: {
        agentId: 'data-analyst',
        status: 'idle',
        tasksCompleted: 203,
      },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'agent-1',
      target: 'agent-2',
      type: 'collaboration',
      label: '12 tasks',
    },
    {
      id: 'e2',
      source: 'agent-2',
      target: 'agent-3',
      type: 'collaboration',
      label: '8 tasks',
    },
  ],
  layout: {
    algorithm: 'force-directed',
    spacing: 150,
  },
  visualization: {
    nodeStyle: {
      byType: {
        agent: {
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      },
    },
    zoom: {
      min: 0.5,
      max: 2,
      default: 1,
    },
  },
  interactions: {
    draggable: true,
    selectable: true,
    connectable: false,
    onNodeClick: 'handleAgentClick',
  },
  dataSource: {
    type: 'dynamic',
    endpoint: '/api/agents/network',
    refreshInterval: 30000,
  },
  metadata: {
    icon: '🕸️',
    preview: '/previews/agent-network.png',
    license: 'MIT',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
};
