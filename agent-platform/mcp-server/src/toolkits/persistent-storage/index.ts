/**
 * Persistent Storage Toolkit
 * 
 * Comprehensive asset management for the Agent Platform:
 * - Agents (configured, marketplace, custom, templates)
 * - Teams (multi-agent collaboration)
 * - Skills (enhanced with linking capabilities)
 * - Tools (local, remote MCP, scripts, builtin)
 * - Workflows (with lifecycle hooks)
 * - Projects (with lifecycle hooks)
 * - Storage utilities (stats, backups)
 * 
 * Storage Location: ~/.agents/
 * 
 * Features:
 * - Full CRUD operations for all asset types
 * - Category-based organization
 * - Automatic versioning and timestamps
 * - Backup and restore capabilities
 * - Comprehensive statistics
 * - Support for multiple formats (JSON, Markdown)
 * - Enhanced linking (skills ↔ teams, collections, projects)
 * - Lifecycle hooks for workflows and projects
 */

import { Toolkit } from '../../types/toolkit.js';
import { registerPersistentStorageTools } from './tools.js';

export const persistentStorageToolkit: Toolkit = {
  id: 'persistent-storage',
  name: 'Persistent Storage',
  description: 'Comprehensive asset management for agents, teams, skills, tools, workflows, and projects. Provides durable storage in ~/.agents with full CRUD operations.',
  version: '2.0.0',
  category: 'core',
  
  dependencies: [],
  conflicts: [],
  
  register: registerPersistentStorageTools,
  toolCount: 26, // 4 agents + 4 teams + 4 skills + 4 tools + 4 workflows + 4 projects + 2 utilities
  enabled: true,
  
  metadata: {
    author: 'Agent Platform Team',
    created: '2024-11-16T00:00:00Z',
    updated: '2024-11-16T00:00:00Z',
    tags: [
      'storage',
      'persistence',
      'agents',
      'teams',
      'skills',
      'tools',
      'workflows',
      'projects',
      'backup',
      'crud',
      'asset-management',
    ],
    homepage: 'https://github.com/your-org/agent-platform',
    repository: 'https://github.com/your-org/agent-platform',
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: true,
    permissions: ['read', 'write'],
    settings: {
      storageRoot: '~/.agents',
      autoBackup: true,
      backupIntervalDays: 7,
      cacheEnabled: true,
      loggingEnabled: true,
    },
  },
};

/**
 * Tool Categories:
 * 
 * AGENTS (4 tools):
 * - storage_save_agent
 * - storage_load_agent
 * - storage_list_agents
 * - storage_delete_agent
 * 
 * TEAMS (4 tools):
 * - storage_save_team
 * - storage_load_team
 * - storage_list_teams
 * - storage_delete_team
 * 
 * SKILLS (4 tools):
 * - storage_save_skill
 * - storage_load_skill
 * - storage_list_skills
 * - storage_delete_skill
 * 
 * TOOLS (4 tools):
 * - storage_save_tool
 * - storage_load_tool
 * - storage_list_tools
 * - storage_delete_tool
 * 
 * WORKFLOWS (4 tools):
 * - storage_save_workflow
 * - storage_load_workflow
 * - storage_list_workflows
 * - storage_delete_workflow
 * 
 * PROJECTS (4 tools):
 * - storage_save_project
 * - storage_load_project
 * - storage_list_projects
 * - storage_delete_project
 * 
 * UTILITIES (2 tools):
 * - storage_stats
 * - storage_backup
 * 
 * Total: 26 tools
 */

/**
 * Usage Examples:
 * 
 * Save an agent:
 * ```
 * storage_save_agent({
 *   agent: {
 *     id: "my-agent",
 *     name: "My Agent",
 *     model: "gpt-4",
 *     systemPrompt: "You are a helpful assistant",
 *     toolkits: ["agent-development"]
 *   },
 *   format: "json",
 *   category: "custom"
 * })
 * ```
 * 
 * Create a team:
 * ```
 * storage_save_team({
 *   team: {
 *     id: "research-team",
 *     name: "Research Team",
 *     description: "Multi-agent research collaboration",
 *     mode: "parallel",
 *     agents: [
 *       { id: "researcher-1", role: "data-analyst" },
 *       { id: "researcher-2", role: "synthesizer" }
 *     ]
 *   },
 *   category: "active"
 * })
 * ```
 * 
 * Save a skill with links:
 * ```
 * storage_save_skill({
 *   skill: {
 *     id: "code-review",
 *     name: "Code Review",
 *     description: "Expert code review and analysis",
 *     toolkits: ["file-operations"],
 *     systemInstructions: "Review code for quality...",
 *     rules: ["Check for security issues", "Verify best practices"],
 *     teams: ["dev-team"],
 *     projects: ["main-project"]
 *   },
 *   category: "user"
 * })
 * ```
 * 
 * Get statistics:
 * ```
 * storage_stats()
 * ```
 * 
 * Create backup:
 * ```
 * storage_backup({ areas: ["agents", "teams", "skills"] })
 * ```
 */
