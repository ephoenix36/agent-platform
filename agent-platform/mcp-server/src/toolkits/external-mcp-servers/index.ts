/**
 * External MCP Servers Toolkit
 * 
 * Provides access to external MCP servers configured in the user's mcp.json.
 * Allows agents to use tools from Context7, Image Studio, Shadcn, DeepWiki, 
 * MarkItDown, Chrome DevTools, and other MCP servers.
 */

import { Toolkit } from '../../types/toolkit.js';

export const externalMcpToolkit: Toolkit = {
  id: "external-mcp-servers",
  name: "External MCP Servers",
  description: "Access tools from external MCP servers: Context7 (docs), Image Studio, Shadcn, DeepWiki, MarkItDown, Chrome DevTools, and more",
  version: "1.0.0",
  category: "integration",
  enabled: true,  // Auto-enable for agent access
  toolCount: 8,
  
  register: async (server, logger) => {
    const { registerExternalMcpTools } = await import('../../tools/external-mcp-tools.js');
    await registerExternalMcpTools(server, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-10",
    updated: "2025-11-10",
    tags: ["mcp", "integrations", "external", "context7", "shadcn", "devtools"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      availableServers: [
        'context7',
        'image-studio',
        'shadcn',
        'deepwiki',
        'markitdown',
        'chrome-devtools',
        'agents',
        'MCPControl'
      ],
      autoConnect: true,
      timeout: 30000,
    },
  },
};
