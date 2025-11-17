/**
 * Agent Development Toolkit
 * 
 * AI agent execution, sampling, and collaboration tools with advanced orchestration.
 * Includes execute_agent, execute_agent_async, chat_with_agent, agent_teams, agent_teams_async, 
 * configure_agent, list_agents, get_agent, delete_agent.
 * 
 * Features:
 * - MCP sampling with VS Code LLM
 * - Configured agent presets
 * - Advanced team orchestration (linear, parallel, rounds, intelligent)
 * - Conditional logic and branching
 * - Configurable output verbosity
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerAgentTools } from '../../tools/agent-tools.js';

export const agentDevelopmentToolkit: Toolkit = {
  id: "agent-development",
  name: "Agent Development",
  description: "AI agent execution with MCP sampling, collaboration, and configuration. Execute agents with multiple models (GPT-5, Claude 4.5 Sonnet, Gemini 2.5 Pro, Grok) and manage agent workflows including async team collaboration with advanced orchestration modes.",
  version: "2.0.0",
  category: "agent-development",
  enabled: true,  // Load by default - core functionality
  toolCount: 9,   // execute_agent, execute_agent_async, chat_with_agent, agent_teams, agent_teams_async, configure_agent, list_agents, get_agent, delete_agent
  
  register: registerAgentTools,
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-08",
    tags: ["agent", "AI", "sampling", "collaboration", "execution", "async", "teams", "orchestration", "conditional"],
    homepage: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write", "execute"],
  },
};
