/**
 * MCP Configuration Management Toolkit
 * 
 * Tools for managing MCP server configurations (mcp.json files).
 * Supports adding/removing MCP servers, managing workspace and user configs.
 */

import { Toolkit } from '../../types/toolkit.js';

export const mcpConfigManagementToolkit: Toolkit = {
  id: "mcp-config-management",
  name: "MCP Configuration Management",
  description: "Manage MCP server configurations including adding/removing servers, managing mcp.json files for workspace and user scopes",
  version: "1.0.0",
  category: "core",
  enabled: false,  // Opt-in toolkit
  toolCount: 7,
  
  register: async (server, logger) => {
    const { registerMCPConfigTools } = await import('../../tools/mcp-config-tools.js');
    await registerMCPConfigTools(server, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-10",
    updated: "2025-11-10",
    tags: ["mcp", "configuration", "management", "settings"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: false,
    permissions: ["read", "write"],
    settings: {
      defaultUserConfigPath: process.platform === 'win32'
        ? '%APPDATA%/mcp/mcp.json'
        : '~/.config/mcp/mcp.json',
      defaultWorkspaceConfigPath: './mcp.json',
      backupOnChange: true,
    },
  },
};
