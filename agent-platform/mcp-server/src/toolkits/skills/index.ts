/**
 * Skills Toolkit
 * 
 * Comprehensive skill management system as an extension of toolsets.
 * Provides tools for creating, managing, and composing skills with
 * instructions, rules, and toolkit integration.
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerSkillTools } from '../../tools/skill-tools.js';

export const skillsToolkit: Toolkit = {
  id: "skills",
  name: "Skills Management",
  description: "Create and manage skills as extensions of toolsets with instructions, rules, and composition. Skills provide higher-level abstractions for organizing tools with context and can be attached to agents, workflows, and teams.",
  version: "1.0.0",
  category: "core",
  enabled: true,
  toolCount: 15,  // 15 skill management tools
  
  register: async (server, logger) => {
    // Skills service will be injected during initialization
    const { getSkillsService } = await import('../../services/service-registry.js');
    const skillsService = getSkillsService();
    await registerSkillTools(server, logger, skillsService);
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-07",
    updated: "2025-11-07",
    tags: ["skills", "toolsets", "composition", "management", "instructions", "rules"],
    homepage: "https://github.com/agent-platform/mcp-server",
    repository: "https://github.com/agent-platform/mcp-server",
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ["read", "write"],
    settings: {
      storageDir: "local-storage/skills",
      enableAutoLoad: true,
      enableComposition: true,
    },
  },
};
