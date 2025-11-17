/**
 * Task Management Toolkit (Legacy)
 * 
 * Simple task tracking and wait/async operation tools.
 * Includes task management and wait handle tools.
 * 
 * Note: This is the legacy task system. Consider migrating to the new
 * project-management toolkit for more advanced features.
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerTaskTools } from '../../tools/task-tools.js';
import { registerWaitTools } from '../../tools/wait-tools.js';

export const taskManagementToolkit: Toolkit = {
  id: "task-management",
  name: "Task Management (Legacy)",
  description: "Simple task tracking with status management and timer integration. Includes wait handles for async operations. For advanced project management, see the project-management toolkit.",
  version: "1.0.0",
  category: "task-management",
  enabled: true,  // Load by default for backward compatibility
  toolCount: 11,  // 6 task tools + 5 wait tools
  
  register: async (server, logger) => {
    await registerTaskTools(server, logger);
    await registerWaitTools(server, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-05",
    tags: ["task", "management", "timer", "wait", "async", "legacy"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      deprecationWarning: "Consider migrating to project-management toolkit for advanced features",
    },
  },
};
