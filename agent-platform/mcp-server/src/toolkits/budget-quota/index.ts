/**
 * Budget & Quota Management Toolkit
 * 
 * Provides budget enforcement, quota management, and rate limiting
 */

import { Toolkit } from '../../types/toolkit.js';

export const budgetQuotaToolkit: Toolkit = {
  id: "budget-quota",
  name: "Budget & Quota Management",
  description: "Create and enforce budgets, manage quotas, and implement rate limiting for agent executions",
  version: "1.0.0",
  category: "core",  // Core capability
  enabled: true,  // Auto-enable for budget enforcement
  toolCount: 7,
  
  register: async (server, logger) => {
    const { registerBudgetTools } = await import('../../tools/budget-tools.js');
    await registerBudgetTools(server, logger);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-10",
    updated: "2025-11-10",
    tags: ["budget", "quota", "rate-limit", "cost-control", "governance"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      budgetEnabled: true,
      rateLimitEnabled: true,
      alertsEnabled: true,
    },
  },
};
