/**
 * Toolkit Management Tools
 * 
 * Meta-tools for managing MCP toolkits at runtime.
 * Allows agents and users to query, enable, and disable toolkits dynamically.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../../utils/logging.js";
import { ToolkitManager } from "../../services/toolkit-manager.js";

/**
 * List toolkits schema
 */
const listToolkitsSchema = z.object({
  category: z.string().optional().describe("Filter by category (e.g., 'project-management', 'agent-development')"),
  onlyLoaded: z.boolean().optional().describe("If true, only return loaded toolkits"),
  onlyEnabled: z.boolean().optional().describe("If true, only return enabled toolkits"),
  search: z.string().optional().describe("Search by name, description, or tags")
});

/**
 * Enable toolkit schema
 */
const enableToolkitSchema = z.object({
  toolkitId: z.string().describe("Unique toolkit ID to enable (e.g., 'project-management', 'workflow')")
});

/**
 * Disable toolkit schema
 */
const disableToolkitSchema = z.object({
  toolkitId: z.string().describe("Unique toolkit ID to disable")
});

/**
 * Get toolkit tools schema
 */
const getToolkitToolsSchema = z.object({
  toolkitId: z.string().describe("Unique toolkit ID to query")
});

/**
 * Get toolkit stats schema
 */
const getToolkitStatsSchema = z.object({});

/**
 * Register toolkit management tools with the MCP server
 */
export async function registerToolkitManagementTools(
  server: McpServer,
  logger: Logger,
  toolkitManager: ToolkitManager
) {
  
  // ===== LIST TOOLKITS =====
  server.tool(
    "list_toolkits",
    "List all available and loaded toolkits. Use this to discover what toolkits are available before enabling them. Supports filtering by category, loaded status, and text search.",
    listToolkitsSchema.shape,
    async (input) => {
      try {
        const { category, onlyLoaded, onlyEnabled, search } = input;
        
        logger.info("Listing toolkits", { category, onlyLoaded, onlyEnabled, search });
        
        // Build query
        const query: any = {};
        if (category) query.category = category;
        if (onlyLoaded !== undefined) query.loaded = onlyLoaded;
        if (onlyEnabled !== undefined) query.enabled = onlyEnabled;
        if (search) query.search = search;
        
        // Get toolkit status
        const toolkits = toolkitManager.getToolkitStatus(query);
        
        // Get statistics
        const stats = toolkitManager.getStats();
        
        // Format response
        const response = {
          toolkits: toolkits.map(tk => ({
            id: tk.id,
            name: tk.name,
            description: tk.description,
            category: tk.category,
            version: tk.version,
            toolCount: tk.toolCount,
            loaded: tk.loaded,
            enabled: tk.enabled,
            dependencies: tk.dependencies,
            conflicts: tk.conflicts,
            tags: tk.metadata.tags,
          })),
          summary: {
            totalToolkits: toolkits.length,
            totalRegistered: stats.totalRegistered,
            totalLoaded: stats.totalLoaded,
            totalEnabled: stats.totalEnabled,
            totalTools: stats.totalTools,
          },
        };
        
        logger.info(`Found ${toolkits.length} toolkits`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error listing toolkits:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ===== ENABLE TOOLKIT =====
  server.tool(
    "enable_toolkit",
    "Enable and load a toolkit, making its tools available for use. This will also load any required dependencies automatically. Use list_toolkits first to see available toolkits.",
    enableToolkitSchema.shape,
    async (input) => {
      try {
        const { toolkitId } = input;
        
        logger.info(`Enabling toolkit: ${toolkitId}`);
        
        // Enable the toolkit (this loads it and updates manifest)
        await toolkitManager.setToolkitEnabled(toolkitId, true);
        
        // Get updated status
        const toolkit = toolkitManager.getToolkit(toolkitId);
        const isLoaded = toolkitManager.isLoaded(toolkitId);
        
        if (!toolkit) {
          throw new Error(`Toolkit not found: ${toolkitId}`);
        }
        
        const response = {
          success: true,
          toolkit: {
            id: toolkit.id,
            name: toolkit.name,
            version: toolkit.version,
            toolCount: toolkit.toolCount,
            loaded: isLoaded,
            enabled: true,
          },
          message: `Toolkit '${toolkit.name}' enabled successfully. ${toolkit.toolCount} tools are now available.`
        };
        
        logger.info(`✓ Toolkit enabled: ${toolkit.name} (${toolkit.toolCount} tools)`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error enabling toolkit:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
              message: `Failed to enable toolkit: ${error instanceof Error ? error.message : String(error)}`
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ===== DISABLE TOOLKIT =====
  server.tool(
    "disable_toolkit",
    "Disable a toolkit and unload its tools. This will fail if other loaded toolkits depend on this one. Note: MCP SDK doesn't support dynamic tool removal, so a server restart may be required to fully remove tools.",
    disableToolkitSchema.shape,
    async (input) => {
      try {
        const { toolkitId } = input;
        
        logger.info(`Disabling toolkit: ${toolkitId}`);
        
        // Get toolkit info before disabling
        const toolkit = toolkitManager.getToolkit(toolkitId);
        if (!toolkit) {
          throw new Error(`Toolkit not found: ${toolkitId}`);
        }
        
        // Disable the toolkit (this unloads it and updates manifest)
        await toolkitManager.setToolkitEnabled(toolkitId, false);
        
        const response = {
          success: true,
          toolkit: {
            id: toolkit.id,
            name: toolkit.name,
            version: toolkit.version,
            toolCount: toolkit.toolCount,
            loaded: false,
            enabled: false,
          },
          message: `Toolkit '${toolkit.name}' disabled. Note: Server restart recommended to fully remove tools.`,
          warning: "MCP SDK doesn't support dynamic tool removal. Tools remain registered until server restart."
        };
        
        logger.info(`✓ Toolkit disabled: ${toolkit.name}`);
        logger.warn("Server restart recommended to fully remove tools");
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error disabling toolkit:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error),
              message: `Failed to disable toolkit: ${error instanceof Error ? error.message : String(error)}`
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ===== GET TOOLKIT TOOLS =====
  server.tool(
    "get_toolkit_info",
    "Get detailed information about a specific toolkit, including its tools, dependencies, and configuration. Use this before enabling a toolkit to understand what it provides.",
    getToolkitToolsSchema.shape,
    async (input) => {
      try {
        const { toolkitId } = input;
        
        logger.info(`Getting toolkit info: ${toolkitId}`);
        
        const toolkit = toolkitManager.getToolkit(toolkitId);
        if (!toolkit) {
          throw new Error(`Toolkit not found: ${toolkitId}`);
        }
        
        const isLoaded = toolkitManager.isLoaded(toolkitId);
        
        const response = {
          toolkit: {
            id: toolkit.id,
            name: toolkit.name,
            description: toolkit.description,
            version: toolkit.version,
            category: toolkit.category,
            toolCount: toolkit.toolCount,
            loaded: isLoaded,
            enabled: toolkit.enabled,
            dependencies: toolkit.dependencies || [],
            conflicts: toolkit.conflicts || [],
            config: toolkit.config || {},
            metadata: {
              author: toolkit.metadata.author,
              created: toolkit.metadata.created,
              updated: toolkit.metadata.updated,
              tags: toolkit.metadata.tags,
              homepage: toolkit.metadata.homepage,
              repository: toolkit.metadata.repository,
            },
          },
        };
        
        logger.info(`Retrieved info for toolkit: ${toolkit.name}`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error getting toolkit info:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  // ===== GET TOOLKIT STATISTICS =====
  server.tool(
    "get_toolkit_stats",
    "Get statistics about all registered toolkits, including totals by category, loaded vs available, and tool counts. Useful for monitoring and overview.",
    getToolkitStatsSchema.shape,
    async (input) => {
      try {
        logger.info("Getting toolkit statistics");
        
        const stats = toolkitManager.getStats();
        const allToolkits = toolkitManager.getToolkitStatus();
        
        // Group by category
        const byCategory: Record<string, any> = {};
        for (const tk of allToolkits) {
          if (!byCategory[tk.category]) {
            byCategory[tk.category] = {
              count: 0,
              loaded: 0,
              enabled: 0,
              totalTools: 0,
            };
          }
          byCategory[tk.category].count++;
          if (tk.loaded) byCategory[tk.category].loaded++;
          if (tk.enabled) byCategory[tk.category].enabled++;
          byCategory[tk.category].totalTools += tk.toolCount;
        }
        
        const response = {
          overview: {
            totalRegistered: stats.totalRegistered,
            totalLoaded: stats.totalLoaded,
            totalEnabled: stats.totalEnabled,
            totalTools: stats.totalTools,
            loadedPercentage: stats.totalRegistered > 0 
              ? Math.round((stats.totalLoaded / stats.totalRegistered) * 100)
              : 0,
          },
          byCategory,
          toolkitsList: allToolkits.map(tk => ({
            id: tk.id,
            name: tk.name,
            category: tk.category,
            toolCount: tk.toolCount,
            loaded: tk.loaded,
            enabled: tk.enabled,
          })),
        };
        
        logger.info(`Stats: ${stats.totalLoaded}/${stats.totalRegistered} toolkits loaded, ${stats.totalTools} total tools`);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error getting toolkit stats:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  logger.info("✓ Toolkit management tools registered (5 tools)");
}
