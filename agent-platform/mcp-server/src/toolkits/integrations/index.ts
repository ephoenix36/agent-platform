/**
 * Integrations Toolkit
 * 
 * External service integration tools (Zapier-like functionality).
 * Includes api_call, github_action, slack_action, stripe_action, trigger_webhook.
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerAPITools } from '../../tools/api-tools.js';

export const integrationsToolkit: Toolkit = {
  id: "integrations",
  name: "External Integrations",
  description: "Connect to external services like GitHub, Slack, Stripe, and custom webhooks. Make authenticated API calls and trigger automation workflows across platforms.",
  version: "1.0.0",
  category: "integration",
  enabled: true,  // Load by default - commonly used
  toolCount: 5,   // api_call, github_action, slack_action, stripe_action, trigger_webhook
  
  register: registerAPITools,
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-05",
    tags: ["integration", "API", "webhook", "github", "slack", "stripe"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: true,  // Many integrations require API keys
    defaultEnabled: true,
    permissions: ["read", "write", "execute"],
  },
};
