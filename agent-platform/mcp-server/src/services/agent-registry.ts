/**
 * Agent Registry Service
 * 
 * Manages configured agent presets for reuse across the platform.
 * Agents can be created via configure_agent and referenced by ID.
 */

import { Logger } from "../utils/logging.js";

export interface AgentConfig {
  id: string;
  name: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  enabledTools?: string[];
  toolkits?: string[];
  skills?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage (in production, use a database)
const agentRegistry: Map<string, AgentConfig> = new Map();

/**
 * Register or update an agent configuration
 */
export function registerAgent(config: AgentConfig): void {
  agentRegistry.set(config.id, config);
}

/**
 * Get an agent configuration by ID
 */
export function getAgent(agentId: string): AgentConfig | undefined {
  return agentRegistry.get(agentId);
}

/**
 * Check if an agent exists
 */
export function hasAgent(agentId: string): boolean {
  return agentRegistry.has(agentId);
}

/**
 * List all registered agents
 */
export function listAgents(): AgentConfig[] {
  return Array.from(agentRegistry.values());
}

/**
 * Delete an agent configuration
 */
export function deleteAgent(agentId: string): boolean {
  return agentRegistry.delete(agentId);
}

/**
 * Get agent statistics
 */
export function getAgentStats() {
  return {
    totalAgents: agentRegistry.size,
    agents: listAgents().map(a => ({
      id: a.id,
      name: a.name,
      model: a.model,
      hasSystemPrompt: !!a.systemPrompt,
      toolCount: (a.enabledTools?.length || 0) + (a.toolkits?.length || 0),
      skillCount: a.skills?.length || 0
    }))
  };
}

/**
 * Initialize agent registry with logger
 */
export function initializeAgentRegistry(logger: Logger): void {
  logger.info("Agent registry initialized");
}
