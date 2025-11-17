/**
 * Core Toolkit
 * 
 * Essential server management and toolkit control tools.
 * Always loaded - provides meta-functionality for managing other toolkits.
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerToolkitManagementTools } from './toolkit-management.js';
import { ToolkitManager } from '../../services/toolkit-manager.js';

export function createCoreToolkit(toolkitManager: ToolkitManager): Toolkit {
  return {
    id: "core",
    name: "Core Server Management",
    description: "Essential server management and toolkit control. Provides list_toolkits, enable_toolkit, disable_toolkit, get_toolkit_info, and get_toolkit_stats for runtime toolkit management.",
    version: "1.0.0",
    category: "core",
    enabled: true,  // Always loaded
    toolCount: 5,   // list_toolkits, enable_toolkit, disable_toolkit, get_toolkit_info, get_toolkit_stats
    
    register: async (server, logger) => {
      await registerToolkitManagementTools(server, logger, toolkitManager);
    },
    
    metadata: {
      author: "Agent Platform Team",
      created: "2025-11-05",
      updated: "2025-11-05",
      tags: ["core", "management", "toolkit", "server"],
      homepage: "https://github.com/agent-platform/mcp-server",
    },
    
    config: {
      requiresAuth: false,
      defaultEnabled: true,
      permissions: ["read", "write"],
    },
  };
}
