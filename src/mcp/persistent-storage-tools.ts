/**
 * Persistent Storage Tools for MCP Server
 * 
 * Provides MCP tools for interacting with the persistent storage system.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PersistentStorageManager } from '../../core/persistent-storage.js';

let storage: PersistentStorageManager | null = null;

async function ensureStorage(): Promise<PersistentStorageManager> {
  if (!storage) {
    storage = new PersistentStorageManager();
    await storage.initialize();
  }
  return storage;
}

/**
 * Register persistent storage tools with MCP server
 */
export function registerPersistentStorageTools(server: McpServer) {
  
  // ============================================================================
  // AGENT STORAGE TOOLS
  // ============================================================================

  server.tool(
    "storage_save_agent",
    "Save an agent to persistent storage",
    {
      agent: z.object({
        id: z.string(),
        name: z.string(),
        version: z.string().optional(),
        model: z.string(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
        topP: z.number().optional(),
        systemPrompt: z.string(),
        toolkits: z.array(z.string()).optional(),
        skills: z.array(z.string()).optional(),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      format: z.enum(['json', 'markdown']).default('json'),
      category: z.enum(['configured', 'marketplace', 'custom', 'templates']).default('custom'),
    },
    async ({ agent, format, category }) => {
      try {
        const s = await ensureStorage();
        await s.saveAgent(agent, format, category);
        
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
    "Load an agent from persistent storage",
    {
      id: z.string(),
      category: z.enum(['configured', 'marketplace', 'custom', 'templates']).default('custom'),
    },
    async ({ id, category }) => {
      try {
        const s = await ensureStorage();
        const agent = await s.loadAgent(id, category);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(agent, null, 2)
          }]
        };
      } catch (error) {
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
    "List agents from persistent storage",
    {
      category: z.enum(['configured', 'marketplace', 'custom', 'templates']).optional(),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage();
        const agents = await s.listAgents(category);
        
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

  server.tool(
    "storage_save_team",
    "Save an agent team to persistent storage",
    {
      team: z.object({
        id: z.string(),
        name: z.string(),
        version: z.string().optional(),
        description: z.string(),
        mode: z.enum(['linear', 'parallel', 'rounds', 'intelligent']).default('linear'),
        agents: z.array(z.object({
          id: z.string(),
          role: z.string().optional(),
          systemPrompt: z.string().optional(),
          model: z.string().optional(),
          temperature: z.number().optional(),
          maxTokens: z.number().optional(),
        })),
        maxRounds: z.number().optional(),
        conditions: z.array(z.any()).optional(),
        skills: z.array(z.string()).optional(),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      category: z.enum(['active', 'archived', 'templates']).default('active'),
    },
    async ({ team, category }) => {
      try {
        const s = await ensureStorage();
        await s.saveTeam(team as any, category);
        
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
      category: z.enum(['active', 'archived', 'templates']).optional(),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage();
        const teams = await s.listTeams(category);
        
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
    "Save a skill to persistent storage",
    {
      skill: z.object({
        id: z.string(),
        name: z.string(),
        version: z.string().optional(),
        description: z.string(),
        toolkits: z.array(z.string()),
        systemInstructions: z.string(),
        rules: z.array(z.string()),
        documents: z.array(z.string()).optional(),
        collections: z.array(z.string()).optional(),
        databases: z.array(z.string()).optional(),
        agents: z.array(z.string()).optional(),
        teams: z.array(z.string()).optional(),
        projects: z.array(z.string()).optional(),
        evaluationRules: z.record(z.any()).optional(),
        mutationRules: z.record(z.any()).optional(),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      category: z.enum(['system', 'user', 'marketplace', 'templates']).default('user'),
    },
    async ({ skill, category }) => {
      try {
        const s = await ensureStorage();
        await s.saveSkill(skill as any, category);
        
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
      category: z.enum(['system', 'user', 'marketplace', 'templates']).optional(),
    },
    async ({ category }) => {
      try {
        const s = await ensureStorage();
        const skills = await s.listSkills(category);
        
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
    "Save a tool to persistent storage",
    {
      tool: z.object({
        id: z.string(),
        name: z.string(),
        version: z.string().optional(),
        description: z.string(),
        type: z.enum(['local', 'remote-mcp', 'script', 'builtin']),
        implementation: z.string().optional(),
        mcpServer: z.object({
          name: z.string(),
          command: z.string(),
          args: z.array(z.string()).optional(),
          env: z.record(z.string()).optional(),
        }).optional(),
        script: z.object({
          language: z.enum(['python', 'javascript', 'typescript', 'powershell', 'bash']),
          path: z.string(),
          args: z.array(z.string()).optional(),
          env: z.record(z.string()).optional(),
        }).optional(),
        inputSchema: z.record(z.any()).optional(),
        outputSchema: z.record(z.any()).optional(),
        permissions: z.array(z.string()).optional(),
        toolkits: z.array(z.string()).optional(),
        metadata: z.record(z.any()).optional(),
      }).passthrough(),
      category: z.enum(['builtin', 'local', 'remote-mcp', 'script', 'custom']).default('custom'),
    },
    async ({ tool, category }) => {
      try {
        const s = await ensureStorage();
        await s.saveTool(tool as any, category);
        
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
    "List tools from persistent storage",
    {
      category: z.enum(['builtin', 'local', 'remote-mcp', 'script', 'custom']).optional(),
      type: z.enum(['local', 'remote-mcp', 'script', 'builtin']).optional(),
    },
    async ({ category, type }) => {
      try {
        const s = await ensureStorage();
        const tools = await s.listTools(category, type);
        
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
    "Get persistent storage statistics",
    {},
    async () => {
      try {
        const s = await ensureStorage();
        const stats = await s.getStats();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(stats, null, 2)
          }]
        };
      } catch (error) {
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
    "Create a backup of persistent storage",
    {
      areas: z.array(z.enum([
        'agents', 'skills', 'teams', 'toolsets', 'tools', 
        'workflows', 'hooks', 'collections', 'evaluation', 
        'mutation', 'metrics', 'projects'
      ])).optional(),
    },
    async ({ areas }) => {
      try {
        const s = await ensureStorage();
        const backupPath = await s.createBackup(areas);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              backupPath,
              message: 'Backup created successfully'
            }, null, 2)
          }]
        };
      } catch (error) {
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

  console.log('✓ Persistent storage tools registered');
}
