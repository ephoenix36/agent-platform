/**
 * Persistent Storage Tools for MCP Server
 * 
 * Provides comprehensive tools for managing agent platform assets:
 * - Agents (configured, marketplace, custom, templates)
 * - Teams (multi-agent collaboration)
 * - Skills (enhanced with links)
 * - Tools (local, remote MCP, scripts)
 * - Workflows (with hooks)
 * - Projects (with hooks)
 * - Storage utilities
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../../utils/logging.js";
import { PersistentStorageManager } from "../../core/persistent-storage.js";

let storage: PersistentStorageManager | null = null;

async function ensureStorage(logger: Logger): Promise<PersistentStorageManager> {
  if (!storage) {
    storage = new PersistentStorageManager();
    await storage.initialize();
    logger.info("✓ Persistent storage initialized");
  }
  return storage;
}

/**
 * Register persistent storage tools with MCP server
 */
export async function registerPersistentStorageTools(server: McpServer, logger: Logger) {
  
  // ============================================================================
  // AGENT STORAGE TOOLS
  // ============================================================================

  server.tool(
    "storage_save_agent",
    "Save an agent configuration to persistent storage. Supports JSON and Markdown formats.",
    {
      agent: z.object({
        id: z.string().describe("Unique agent identifier"),
        name: z.string().describe("Display name"),
        version: z.string().optional().describe("Version (default: 1.0.0)"),
        model: z.string().describe("AI model (e.g., gpt-4, claude-sonnet-4.5)"),
        temperature: z.number().optional().describe("Temperature 0-2"),
        maxTokens: z.number().optional().describe("Maximum tokens"),
        topP: z.number().optional().describe("Top-P sampling"),
        systemPrompt: z.string().describe("System instructions"),
        toolkits: z.array(z.string()).optional().describe("Toolkit IDs"),
        skills: z.array(z.string()).optional().describe("Skill IDs"),
        metadata: z.record(z.any()).optional().describe("Additional metadata"),
      }).passthrough(),
      format: z.enum(['json', 'markdown']).default('json').describe("Storage format"),
      category: z.enum(['configured', 'marketplace', 'custom', 'templates']).default('custom').describe("Agent category"),
    },
    async ({ agent, format, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.saveAgent(agent, format, category);
        
        logger.info(`Saved agent: ${agent.id} (${format}, ${category})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Agent saved: ${agent.id}`,
              location: `~/.agents/agents/${category}/${agent.id}.${format === 'json' ? 'json' : 'md'}`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to save agent:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_load_agent",
    "Load an agent configuration from persistent storage",
    {
      id: z.string().describe("Agent ID to load"),
      category: z.enum(['configured', 'marketplace', 'custom', 'templates']).default('custom').describe("Agent category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        const agent = await s.loadAgent(id, category);
        
        logger.info(`Loaded agent: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(agent, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to load agent:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_list_agents",
    "List all agents from persistent storage with filtering",
    {
      category: z.enum(['configured', 'marketplace', 'custom', 'templates']).optional().describe("Filter by category"),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage(logger);
        const agents = await s.listAgents(category);
        
        logger.info(`Listed ${agents.length} agents ${category ? `from ${category}` : ''}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: agents.length,
              agents: agents.map(a => ({
                id: a.id,
                name: a.name,
                model: a.model,
                category: a._category,
                format: a._format,
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to list agents:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_delete_agent",
    "Delete an agent from persistent storage",
    {
      id: z.string().describe("Agent ID to delete"),
      category: z.enum(['configured', 'marketplace', 'custom', 'templates']).default('custom').describe("Agent category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.deleteAgent(id, category);
        
        logger.info(`Deleted agent: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Agent deleted: ${id}`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to delete agent:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ============================================================================
  // TEAM STORAGE TOOLS
  // ============================================================================

  const saveTeamSchema = z.object({
    team: z.object({
      id: z.string().describe("Unique team identifier"),
      name: z.string().describe("Team name"),
      version: z.string().optional().describe("Version (default: 1.0.0)"),
      description: z.string().describe("Team purpose"),
      mode: z.enum(['linear', 'parallel', 'rounds', 'intelligent']).default('linear').describe("Execution mode"),
      agents: z.array(z.object({
        id: z.string().describe("Agent ID"),
        role: z.string().optional().describe("Agent role in team"),
        systemPrompt: z.string().optional().describe("Override system prompt"),
        model: z.string().optional().describe("Override model"),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
      })).describe("Team members"),
      maxRounds: z.number().optional().describe("Max collaboration rounds"),
      conditions: z.array(z.record(z.any())).optional().describe("Control flow conditions"),
      skills: z.array(z.string()).optional().describe("Shared skills"),
      metadata: z.record(z.any()).optional(),
    }).passthrough(),
    category: z.enum(['active', 'archived', 'templates']).default('active').describe("Team category"),
  });

  server.tool(
    "storage_save_team",
    "Save an agent team to persistent storage. Teams enable multi-agent collaboration.",
    saveTeamSchema.shape,
    async ({ team, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.saveTeam(team as any, category);
        
        logger.info(`Saved team: ${team.id} (${category})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Team saved: ${team.id}`,
              location: `~/.agents/teams/${category}/${team.id}.json`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to save team:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_load_team",
    "Load an agent team from persistent storage",
    {
      id: z.string().describe("Team ID to load"),
      category: z.enum(['active', 'archived', 'templates']).default('active').describe("Team category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        const team = await s.loadTeam(id, category);
        
        logger.info(`Loaded team: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(team, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to load team:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_list_teams",
    "List agent teams from persistent storage",
    {
      category: z.enum(['active', 'archived', 'templates']).optional().describe("Filter by category"),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage(logger);
        const teams = await s.listTeams(category);
        
        logger.info(`Listed ${teams.length} teams ${category ? `from ${category}` : ''}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: teams.length,
              teams: teams.map(t => ({
                id: t.id,
                name: t.name,
                mode: t.mode,
                agentCount: t.agents.length,
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to list teams:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_delete_team",
    "Delete a team from persistent storage",
    {
      id: z.string().describe("Team ID to delete"),
      category: z.enum(['active', 'archived', 'templates']).default('active').describe("Team category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.deleteTeam(id, category);
        
        logger.info(`Deleted team: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Team deleted: ${id}`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to delete team:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ============================================================================
  // SKILL STORAGE TOOLS
  // ============================================================================

  server.tool(
    "storage_save_skill",
    "Save a skill to persistent storage. Skills can be linked to teams, collections, databases, and projects.",
    {
      skill: z.object({
        id: z.string().describe("Unique skill identifier"),
        name: z.string().describe("Skill name"),
        version: z.string().optional().describe("Version (default: 1.0.0)"),
        description: z.string().describe("Skill purpose"),
        toolkits: z.array(z.string()).describe("Required toolkits"),
        systemInstructions: z.string().describe("Instructions for using this skill"),
        rules: z.array(z.string()).describe("Behavioral rules"),
        documents: z.array(z.string()).optional().describe("Linked documents"),
        collections: z.array(z.string()).optional().describe("Linked collections"),
        databases: z.array(z.string()).optional().describe("Linked databases"),
        agents: z.array(z.string()).optional().describe("Linked agents"),
        teams: z.array(z.string()).optional().describe("Linked teams"),
        projects: z.array(z.string()).optional().describe("Linked projects"),
        evaluationRules: z.record(z.any()).optional().describe("Evaluation criteria"),
        mutationRules: z.record(z.any()).optional().describe("Mutation rules"),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      category: z.enum(['system', 'user', 'marketplace', 'templates']).default('user').describe("Skill category"),
    },
    async ({ skill, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.saveSkill(skill as any, category);
        
        logger.info(`Saved skill: ${skill.id} (${category})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Skill saved: ${skill.id}`,
              location: `~/.agents/skills/${category}/${skill.id}.json`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to save skill:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_load_skill",
    "Load a skill from persistent storage",
    {
      id: z.string().describe("Skill ID to load"),
      category: z.enum(['system', 'user', 'marketplace', 'templates']).default('user').describe("Skill category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        const skill = await s.loadSkill(id, category);
        
        logger.info(`Loaded skill: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(skill, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to load skill:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_list_skills",
    "List skills from persistent storage",
    {
      category: z.enum(['system', 'user', 'marketplace', 'templates']).optional().describe("Filter by category"),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage(logger);
        const skills = await s.listSkills(category);
        
        logger.info(`Listed ${skills.length} skills ${category ? `from ${category}` : ''}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: skills.length,
              skills: skills.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                ruleCount: s.rules.length,
                linkedAgents: s.agents?.length || 0,
                linkedTeams: s.teams?.length || 0,
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to list skills:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_delete_skill",
    "Delete a skill from persistent storage",
    {
      id: z.string().describe("Skill ID to delete"),
      category: z.enum(['system', 'user', 'marketplace', 'templates']).default('user').describe("Skill category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.deleteSkill(id, category);
        
        logger.info(`Deleted skill: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Skill deleted: ${id}`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to delete skill:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ============================================================================
  // TOOL STORAGE TOOLS
  // ============================================================================

  server.tool(
    "storage_save_tool",
    "Save a tool to persistent storage. Supports local, remote MCP servers, scripts, and builtin tools.",
    {
      tool: z.object({
        id: z.string().describe("Unique tool identifier"),
        name: z.string().describe("Tool name"),
        version: z.string().optional().describe("Version (default: 1.0.0)"),
        description: z.string().describe("Tool purpose"),
        type: z.enum(['local', 'remote-mcp', 'script', 'builtin']).describe("Tool type"),
        implementation: z.string().optional().describe("Code implementation (for local)"),
        mcpServer: z.object({
          name: z.string(),
          command: z.string(),
          args: z.array(z.string()).optional(),
          env: z.record(z.string()).optional(),
        }).optional().describe("MCP server config (for remote-mcp)"),
        script: z.object({
          language: z.enum(['python', 'javascript', 'typescript', 'powershell', 'bash']),
          path: z.string(),
          args: z.array(z.string()).optional(),
          env: z.record(z.string()).optional(),
        }).optional().describe("Script config (for script type)"),
        inputSchema: z.record(z.any()).optional().describe("Input validation schema"),
        outputSchema: z.record(z.any()).optional().describe("Output validation schema"),
        permissions: z.array(z.string()).optional().describe("Required permissions"),
        toolkits: z.array(z.string()).optional().describe("Associated toolkits"),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      category: z.enum(['builtin', 'local', 'remote-mcp', 'script', 'custom']).default('custom').describe("Tool category"),
    },
    async ({ tool, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.saveTool(tool as any, category);
        
        logger.info(`Saved tool: ${tool.id} (${tool.type}, ${category})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Tool saved: ${tool.id}`,
              location: `~/.agents/tools/${category}/${tool.id}.json`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to save tool:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_load_tool",
    "Load a tool from persistent storage",
    {
      id: z.string().describe("Tool ID to load"),
      category: z.enum(['builtin', 'local', 'remote-mcp', 'script', 'custom']).default('custom').describe("Tool category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        const tool = await s.loadTool(id, category);
        
        logger.info(`Loaded tool: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(tool, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to load tool:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_list_tools",
    "List tools from persistent storage with optional filtering",
    {
      category: z.enum(['builtin', 'local', 'remote-mcp', 'script', 'custom']).optional().describe("Filter by category"),
      type: z.enum(['local', 'remote-mcp', 'script', 'builtin']).optional().describe("Filter by type"),
    },
    async ({ category, type }) => {
      try {
        const s = await ensureStorage(logger);
        const tools = await s.listTools(category, type);
        
        logger.info(`Listed ${tools.length} tools ${category ? `from ${category}` : ''} ${type ? `of type ${type}` : ''}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: tools.length,
              tools: tools.map(t => ({
                id: t.id,
                name: t.name,
                type: t.type,
                description: t.description,
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to list tools:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_delete_tool",
    "Delete a tool from persistent storage",
    {
      id: z.string().describe("Tool ID to delete"),
      category: z.enum(['builtin', 'local', 'remote-mcp', 'script', 'custom']).default('custom').describe("Tool category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.deleteTool(id, category);
        
        logger.info(`Deleted tool: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Tool deleted: ${id}`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to delete tool:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ============================================================================
  // WORKFLOW STORAGE TOOLS
  // ============================================================================

  server.tool(
    "storage_save_workflow",
    "Save a workflow to persistent storage. Workflows support lifecycle hooks.",
    {
      workflow: z.object({
        id: z.string().describe("Unique workflow identifier"),
        name: z.string().describe("Workflow name"),
        version: z.string().optional().describe("Version (default: 1.0.0)"),
        description: z.string().describe("Workflow purpose"),
        steps: z.array(z.record(z.any())).describe("Workflow steps"),
        agents: z.array(z.string()).optional().describe("Required agents"),
        skills: z.array(z.string()).optional().describe("Required skills"),
        hooks: z.object({
          before: z.array(z.string()).optional(),
          after: z.array(z.string()).optional(),
          error: z.array(z.string()).optional(),
          stepBefore: z.array(z.string()).optional(),
          stepAfter: z.array(z.string()).optional(),
        }).optional().describe("Lifecycle hooks"),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      category: z.enum(['active', 'archived', 'templates']).default('active').describe("Workflow category"),
    },
    async ({ workflow, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.saveWorkflow(workflow as any, category);
        
        logger.info(`Saved workflow: ${workflow.id} (${category})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Workflow saved: ${workflow.id}`,
              location: `~/.agents/workflows/${category}/${workflow.id}.json`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to save workflow:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_load_workflow",
    "Load a workflow from persistent storage",
    {
      id: z.string().describe("Workflow ID to load"),
      category: z.enum(['active', 'archived', 'templates']).default('active').describe("Workflow category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        const workflow = await s.loadWorkflow(id, category);
        
        logger.info(`Loaded workflow: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(workflow, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to load workflow:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_list_workflows",
    "List workflows from persistent storage",
    {
      category: z.enum(['active', 'archived', 'templates']).optional().describe("Filter by category"),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage(logger);
        const workflows = await s.listWorkflows(category);
        
        logger.info(`Listed ${workflows.length} workflows ${category ? `from ${category}` : ''}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: workflows.length,
              workflows: workflows.map(w => ({
                id: w.id,
                name: w.name,
                description: w.description,
                stepCount: w.steps.length,
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to list workflows:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_delete_workflow",
    "Delete a workflow from persistent storage",
    {
      id: z.string().describe("Workflow ID to delete"),
      category: z.enum(['active', 'archived', 'templates']).default('active').describe("Workflow category"),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.deleteWorkflow(id, category);
        
        logger.info(`Deleted workflow: ${id} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Workflow deleted: ${id}`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to delete workflow:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ============================================================================
  // PROJECT STORAGE TOOLS
  // ============================================================================

  server.tool(
    "storage_save_project",
    "Save a project to persistent storage. Projects support lifecycle hooks.",
    {
      project: z.object({
        id: z.string().describe("Unique project identifier"),
        name: z.string().describe("Project name"),
        version: z.string().optional().describe("Version (default: 1.0.0)"),
        description: z.string().describe("Project purpose"),
        slug: z.string().describe("URL-friendly identifier"),
        status: z.enum(['active', 'archived', 'completed']).default('active').describe("Project status"),
        agents: z.array(z.string()).optional().describe("Linked agents"),
        teams: z.array(z.string()).optional().describe("Linked teams"),
        skills: z.array(z.string()).optional().describe("Linked skills"),
        workflows: z.array(z.string()).optional().describe("Linked workflows"),
        hooks: z.object({
          onCreate: z.array(z.string()).optional(),
          onUpdate: z.array(z.string()).optional(),
          onComplete: z.array(z.string()).optional(),
          onArchive: z.array(z.string()).optional(),
        }).optional().describe("Lifecycle hooks"),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      category: z.enum(['active', 'archived', 'completed']).default('active').describe("Project category"),
    },
    async ({ project, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.saveProject(project as any, category);
        
        logger.info(`Saved project: ${project.slug} (${category})`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Project saved: ${project.slug}`,
              location: `~/.agents/projects/${category}/${project.slug}.json`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to save project:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_load_project",
    "Load a project from persistent storage",
    {
      slug: z.string().describe("Project slug to load"),
      category: z.enum(['active', 'archived', 'completed']).default('active').describe("Project category"),
    },
    async ({ slug, category }) => {
      try {
        const s = await ensureStorage(logger);
        const project = await s.loadProject(slug, category);
        
        logger.info(`Loaded project: ${slug} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(project, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to load project:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_list_projects",
    "List projects from persistent storage",
    {
      category: z.enum(['active', 'archived', 'completed']).optional().describe("Filter by category"),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage(logger);
        const projects = await s.listProjects(category);
        
        logger.info(`Listed ${projects.length} projects ${category ? `from ${category}` : ''}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              count: projects.length,
              projects: projects.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                status: p.status,
                description: p.description,
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to list projects:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_delete_project",
    "Delete a project from persistent storage",
    {
      slug: z.string().describe("Project slug to delete"),
      category: z.enum(['active', 'archived', 'completed']).default('active').describe("Project category"),
    },
    async ({ slug, category }) => {
      try {
        const s = await ensureStorage(logger);
        await s.deleteProject(slug, category);
        
        logger.info(`Deleted project: ${slug} from ${category}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Project deleted: ${slug}`
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to delete project:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ============================================================================
  // STORAGE UTILITY TOOLS
  // ============================================================================

  server.tool(
    "storage_stats",
    "Get comprehensive statistics about persistent storage usage",
    {},
    async () => {
      try {
        const s = await ensureStorage(logger);
        const stats = await s.getStats();
        
        logger.info("Retrieved storage statistics");
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(stats, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to get storage stats:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "storage_backup",
    "Create a backup of persistent storage areas",
    {
      areas: z.array(z.enum([
        'agents', 'skills', 'teams', 'toolsets', 'tools', 
        'workflows', 'hooks', 'collections', 'evaluation', 
        'mutation', 'metrics', 'projects'
      ])).optional().describe("Specific areas to backup (default: all)"),
    },
    async ({ areas }) => {
      try {
        const s = await ensureStorage(logger);
        const backupPath = await s.createBackup(areas);
        
        logger.info(`Created backup at ${backupPath}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              backupPath,
              message: 'Backup created successfully',
              areas: areas || 'all'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Failed to create backup:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  logger.info('✓ Persistent storage tools registered (26 tools)');
}
