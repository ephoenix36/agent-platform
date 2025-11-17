/**
 * Usage & Analytics Toolkit
 * 
 * Provides comprehensive usage tracking, cost monitoring, and analytics
 */

import { Toolkit } from '../../types/toolkit.js';

export const usageAnalyticsToolkit: Toolkit = {
  id: "usage-analytics",
  name: "Usage & Analytics",
  description: "Track agent usage, monitor costs, generate reports, analyze performance, enforce budgets, manage rate limits, optimize context, and detect anomalies",
  version: "1.1.0",
  category: "core",  // Core monitoring capability
  enabled: true,  // Auto-enable for monitoring
  toolCount: 25,  // 4 usage + 7 budget + 5 context + 9 anomaly tools
  
  register: async (server, logger) => {
    const { registerUsageTools } = await import('../../tools/usage-tools.js');
    const { registerBudgetTools } = await import('../../tools/budget-tools.js');
    const { registerContextTools } = await import('../../tools/context-tools.js');
    const { registerAnomalyTools } = await import('../../tools/anomaly-tools.js');
    
    await registerUsageTools(server, logger);
    await registerBudgetTools(server, logger);
    await registerContextTools(server, logger);
    await registerAnomalyTools(server, logger);
    
    logger.info('[Usage Analytics] Registered 25 tools (usage + budget + context + anomaly detection)');
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-10",
    updated: "2025-11-16",
    tags: ["usage", "analytics", "monitoring", "costs", "tracking", "budget", "quota", "rate-limit", "context", "optimization", "anomaly", "detection"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read"],
    settings: {
      trackingEnabled: true,
      retentionDays: 90,
      exportFormats: ['json', 'csv'],
    },
  },
};
