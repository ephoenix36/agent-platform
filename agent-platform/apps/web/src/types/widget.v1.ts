/**
 * Widget Specification V1.0
 * Defines the structure for dashboard widgets
 */

export interface WidgetV1 {
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
  category: 'metrics' | 'activity' | 'visualization' | 'ai' | 'custom';
  tags: string[];
  
  // Layout
  layout: {
    defaultPosition: { x: number; y: number };
    defaultSize: { width: number; height: number };
    minSize: { width: number; height: number };
    maxSize?: { width: number; height: number };
    resizable: boolean;
    draggable: boolean;
    collapsible: boolean;
  };
  
  // Data Configuration
  dataConfig?: {
    refreshInterval?: number; // milliseconds
    dataSource?: string; // API endpoint or data source ID
    queryParams?: Record<string, any>;
  };
  
  // Rendering
  rendering: {
    componentPath: string; // Path to React component
    customCSS?: string;
    theme?: 'light' | 'dark' | 'auto';
  };
  
  // Interactions
  interactions?: {
    onClick?: string; // Function to call on click
    onHover?: string; // Function to call on hover
    contextMenu?: {
      label: string;
      action: string;
    }[];
  };
  
  // Configuration Schema
  configSchema?: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      default?: any;
    }>;
  };
  
  // Metadata
  metadata: {
    icon?: string;
    preview?: string; // Preview image URL
    license: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Example Widget: Key Metrics
 */
export const keyMetricsWidgetExample: WidgetV1 = {
  id: 'key-metrics-v1',
  version: '1.0.0',
  name: 'Key Metrics',
  description: 'Display key platform metrics in a grid layout',
  author: {
    id: 'platform',
    name: 'Platform Team',
  },
  category: 'metrics',
  tags: ['metrics', 'stats', 'analytics'],
  layout: {
    defaultPosition: { x: 20, y: 20 },
    defaultSize: { width: 350, height: 250 },
    minSize: { width: 250, height: 200 },
    resizable: true,
    draggable: true,
    collapsible: true,
  },
  dataConfig: {
    refreshInterval: 60000, // 1 minute
    dataSource: '/api/metrics/overview',
  },
  rendering: {
    componentPath: '/widgets/KeyMetrics.tsx',
    theme: 'auto',
  },
  metadata: {
    icon: '📊',
    preview: '/previews/key-metrics.png',
    license: 'MIT',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
};
