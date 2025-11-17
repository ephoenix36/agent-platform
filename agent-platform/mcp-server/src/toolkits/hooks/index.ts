/**
 * Hooks Toolkit
 * 
 * Lifecycle hooks for extensible tool, agent, and workflow execution
 */

import { Toolkit } from "../../types/toolkit.js";
import { registerHookTools } from "../../tools/hook-tools.js";

export const hooksToolkit: Toolkit = {
  id: "hooks",
  name: "Lifecycle Hooks",
  description: "Register and manage lifecycle hooks for tool, agent, and workflow execution. Enable validation, logging, metrics, authentication, and custom extensions at key execution points.",
  
  category: "core",
  version: "1.0.0",
  enabled: true,
  toolCount: 5,
  
  register: async (server, logger) => {
    // Hook manager is initialized globally in index.ts
    const { getHookManager } = await import('../../utils/hooked-registry.js');
    const hookManager = getHookManager();
    await registerHookTools(server, hookManager, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-08",
    updated: "2025-11-08",
    tags: [
      "hooks",
      "lifecycle",
      "extensibility",
      "validation",
      "logging",
      "metrics",
      "middleware"
    ],
    homepage: "https://github.com/agent-platform/mcp-server",
    repository: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      defaultTimeout: 500,
      maxHooksPerEvent: 20,
      collectMetrics: true,
    },
  },
};
