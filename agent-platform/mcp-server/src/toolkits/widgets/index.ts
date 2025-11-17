/**
 * Widgets Toolkit
 * 
 * Interactive UI widgets for agents, workflows, and human-in-the-loop operations
 */

import { Toolkit } from "../../types/toolkit.js";

export const widgetsToolkit: Toolkit = {
  id: "widgets",
  name: "Interactive Widgets",
  description: "Create and manage interactive UI widgets for data collection, visualization, approvals, and real-time updates. Enable human-in-the-loop workflows and rich agent interactions.",
  
  category: "core",
  version: "1.0.0",
  enabled: true,
  toolCount: 7,
  
  register: async (server, logger) => {
    // Widget service will be initialized and passed during registration
    const { registerWidgetTools } = await import('../../tools/widget-tools.js');
    const { WidgetService } = await import('../../services/widget-service.js');
    
    const widgetService = new WidgetService(logger);
    await registerWidgetTools(server, widgetService, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-08",
    updated: "2025-11-08",
    tags: [
      "widgets",
      "ui",
      "interactive",
      "visualization",
      "forms",
      "human-in-loop",
      "approvals"
    ],
    homepage: "https://github.com/agent-platform/mcp-server",
    repository: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      enableAutoRefresh: true,
      defaultRefreshInterval: 5000,
      maxActiveWidgets: 50,
    },
  },
};
