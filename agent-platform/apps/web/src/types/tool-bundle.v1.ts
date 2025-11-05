/**
 * Tool Bundle Specification V1.0
 * Defines the structure for platform tools that combine UI components with MCP functionality
 */

export interface ToolBundleV1 {
  // Metadata
  id: string;
  version: string;
  name: string;
  description: string;
  author: {
    id: string;
    name: string;
    email?: string;
    website?: string;
  };
  
  // Classification
  category: 'development' | 'communication' | 'analytics' | 'visualization' | 'workflow' | 'ai' | 'custom';
  tags: string[];
  
  // Pricing & Access
  pricing: {
    model: 'free' | 'freemium' | 'paid' | 'subscription';
    price?: number; // in cents, if paid
    subscriptionPrice?: number; // monthly, in cents
  };
  
  // UI Component
  ui: {
    componentPath: string; // Path to React component
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
    maxSize?: { width: number; height: number };
    resizable: boolean;
    draggable: boolean;
  };
  
  // MCP Tools Required
  mcpTools: {
    id: string;
    name: string;
    required: boolean;
    configuration?: Record<string, any>;
  }[];
  
  // Permissions Required
  permissions: {
    filesystem?: boolean;
    network?: boolean;
    llm?: boolean;
    database?: boolean;
    userData?: boolean;
  };
  
  // Dependencies
  dependencies?: {
    toolBundleIds?: string[]; // Other tool bundles this depends on
    npmPackages?: string[]; // NPM packages required
    apiEndpoints?: string[]; // External APIs used
  };
  
  // Configuration Schema
  configSchema?: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      default?: any;
      required?: boolean;
    }>;
  };
  
  // Lifecycle Hooks
  lifecycle?: {
    onInstall?: string; // Function to run on installation
    onUninstall?: string; // Function to run on uninstallation
    onActivate?: string; // Function to run when tool is activated
    onDeactivate?: string; // Function to run when tool is deactivated
  };
  
  // Metadata
  metadata: {
    icon?: string; // Icon URL or emoji
    screenshots?: string[]; // Screenshot URLs
    documentation?: string; // Documentation URL or markdown
    repository?: string; // Source code repository
    license: string; // e.g., 'MIT', 'Apache-2.0', 'Proprietary'
    verified: boolean; // Platform-verified tool
    featured: boolean; // Featured in marketplace
    downloads: number;
    rating: number; // 0-5
    reviews: number;
    createdAt: string; // ISO date
    updatedAt: string; // ISO date
  };
}

/**
 * Example Tool Bundle: Chat Interface
 */
export const chatToolBundleExample: ToolBundleV1 = {
  id: 'chat-interface-v1',
  version: '1.0.0',
  name: 'Chat Interface',
  description: 'A conversational AI interface for interacting with agents',
  author: {
    id: 'platform',
    name: 'Platform Team',
    website: 'https://platform.com',
  },
  category: 'communication',
  tags: ['chat', 'ai', 'conversation', 'messaging'],
  pricing: {
    model: 'free',
  },
  ui: {
    componentPath: '/tools/chat-interface/ChatWidget.tsx',
    defaultPosition: { x: 100, y: 100 },
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 300, height: 400 },
    resizable: true,
    draggable: true,
  },
  mcpTools: [
    {
      id: 'mcp-chat-send',
      name: 'Send Chat Message',
      required: true,
    },
    {
      id: 'mcp-chat-history',
      name: 'Get Chat History',
      required: true,
    },
  ],
  permissions: {
    llm: true,
    network: true,
    userData: true,
  },
  configSchema: {
    type: 'object',
    properties: {
      model: {
        type: 'string',
        description: 'LLM model to use',
        default: 'gpt-4',
        required: false,
      },
      systemPrompt: {
        type: 'string',
        description: 'System prompt for the chat',
        default: 'You are a helpful assistant.',
        required: false,
      },
    },
  },
  metadata: {
    icon: '💬',
    screenshots: ['/screenshots/chat-1.png', '/screenshots/chat-2.png'],
    documentation: '/docs/tools/chat-interface',
    repository: 'https://github.com/platform/chat-tool',
    license: 'MIT',
    verified: true,
    featured: true,
    downloads: 1500,
    rating: 4.8,
    reviews: 250,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
};

/**
 * Example Tool Bundle: Dev Mode (IDE-like interface)
 */
export const devToolBundleExample: ToolBundleV1 = {
  id: 'dev-mode-v1',
  version: '1.0.0',
  name: 'Development Environment',
  description: 'Full IDE-like environment with code editor, terminal, and file explorer',
  author: {
    id: 'platform',
    name: 'Platform Team',
  },
  category: 'development',
  tags: ['ide', 'code', 'development', 'terminal'],
  pricing: {
    model: 'freemium',
    subscriptionPrice: 999, // $9.99/month
  },
  ui: {
    componentPath: '/tools/dev-mode/DevEnvironment.tsx',
    defaultPosition: { x: 0, y: 0 },
    defaultSize: { width: 1200, height: 800 },
    minSize: { width: 800, height: 600 },
    resizable: true,
    draggable: false, // Full-screen tool
  },
  mcpTools: [
    {
      id: 'mcp-filesystem-read',
      name: 'Read File System',
      required: true,
    },
    {
      id: 'mcp-filesystem-write',
      name: 'Write File System',
      required: true,
    },
    {
      id: 'mcp-terminal-execute',
      name: 'Execute Terminal Commands',
      required: true,
    },
    {
      id: 'mcp-code-completion',
      name: 'Code Completion',
      required: false,
    },
  ],
  permissions: {
    filesystem: true,
    network: true,
    llm: true,
  },
  dependencies: {
    npmPackages: ['monaco-editor', 'xterm'],
  },
  metadata: {
    icon: '💻',
    screenshots: ['/screenshots/dev-1.png'],
    documentation: '/docs/tools/dev-mode',
    license: 'Apache-2.0',
    verified: true,
    featured: true,
    downloads: 3200,
    rating: 4.9,
    reviews: 450,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
};

/**
 * Tool Bundle Registry
 * Manages installed and available tool bundles
 */
export interface ToolBundleRegistry {
  installed: Map<string, ToolBundleV1>;
  available: Map<string, ToolBundleV1>;
}

/**
 * Tool Bundle Installation Result
 */
export interface ToolBundleInstallResult {
  success: boolean;
  toolBundleId: string;
  message: string;
  errors?: string[];
}

/**
 * Tool Bundle Manager Interface
 */
export interface IToolBundleManager {
  // Install a tool bundle
  install(toolBundleId: string): Promise<ToolBundleInstallResult>;
  
  // Uninstall a tool bundle
  uninstall(toolBundleId: string): Promise<ToolBundleInstallResult>;
  
  // Get installed tool bundles
  getInstalled(): ToolBundleV1[];
  
  // Get available tool bundles from marketplace
  getAvailable(): Promise<ToolBundleV1[]>;
  
  // Search tool bundles
  search(query: string, filters?: {
    category?: string;
    tags?: string[];
    priceModel?: string;
  }): Promise<ToolBundleV1[]>;
  
  // Get tool bundle by ID
  getById(id: string): Promise<ToolBundleV1 | null>;
}
