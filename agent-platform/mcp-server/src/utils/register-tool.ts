/**
 * Tool Registration Helper
 * 
 * Provides a unified way to register tools with both the MCP server
 * and the tool registry, ensuring agents have access to all tools.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getToolRegistry } from "../services/tool-registry.js";
import { Logger } from "../utils/logging.js";

/**
 * Register a tool with both MCP server and tool registry
 * 
 * This ensures the tool is available both for direct MCP calls
 * and for agent use through sampling/tool calling.
 */
export function registerToolWithRegistry(
  server: McpServer,
  logger: Logger,
  name: string,
  description: string,
  schema: z.ZodObject<any>,
  handler: (input: any) => Promise<any>
) {
  // Register with MCP server (standard registration)
  server.tool(name, description, schema.shape, handler);

  // Also register with tool registry for agent access
  try {
    const toolRegistry = getToolRegistry();
    toolRegistry.registerTool(name, description, schema, handler);
    logger.debug(`Tool '${name}' registered with tool registry for agent access`);
  } catch (error) {
    // Tool registry not initialized yet - will be registered later
    logger.debug(`Tool registry not ready, '${name}' will be registered when registry initializes`);
  }
}

/**
 * Batch register multiple tools
 */
export function registerToolsWithRegistry(
  server: McpServer,
  logger: Logger,
  tools: Array<{
    name: string;
    description: string;
    schema: z.ZodObject<any>;
    handler: (input: any) => Promise<any>;
  }>
) {
  for (const tool of tools) {
    registerToolWithRegistry(
      server,
      logger,
      tool.name,
      tool.description,
      tool.schema,
      tool.handler
    );
  }
  
  logger.info(`Registered ${tools.length} tools with MCP server and tool registry`);
}
