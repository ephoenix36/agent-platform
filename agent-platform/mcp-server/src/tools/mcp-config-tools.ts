/**
 * MCP Configuration Management Tools
 * 
 * Tools for reading, writing, and managing MCP server configurations.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

interface MCPConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  [key: string]: any;
}

/**
 * Get the path to user or workspace MCP config
 */
function getMCPConfigPath(scope: 'user' | 'workspace', workspacePath?: string): string {
  if (scope === 'user') {
    if (process.platform === 'win32') {
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'mcp', 'mcp.json');
    } else {
      return path.join(os.homedir(), '.config', 'mcp', 'mcp.json');
    }
  } else {
    return path.join(workspacePath || process.cwd(), 'mcp.json');
  }
}

/**
 * Read MCP configuration file
 */
function readMCPConfig(configPath: string): MCPConfig {
  if (!fs.existsSync(configPath)) {
    return { mcpServers: {} };
  }
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as MCPConfig;
}

/**
 * Write MCP configuration file
 */
function writeMCPConfig(configPath: string, config: MCPConfig, createBackup: boolean = true): void {
  // Create backup if requested and file exists
  if (createBackup && fs.existsSync(configPath)) {
    const backupPath = `${configPath}.backup.${Date.now()}`;
    fs.copyFileSync(configPath, backupPath);
  }

  // Ensure directory exists
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export function registerMCPConfigTools(server: McpServer, logger: Logger) {
  
  /**
   * List MCP servers
   */
  server.tool(
    "mcp_list_servers",
    "List all configured MCP servers in user or workspace scope",
    {
      scope: z.enum(['user', 'workspace']).default('workspace').describe("Configuration scope"),
      workspacePath: z.string().optional().describe("Workspace path (for workspace scope)"),
    },
    async (args) => {
      try {
        const configPath = getMCPConfigPath(args.scope, args.workspacePath);
        const config = readMCPConfig(configPath);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              configPath,
              servers: config.mcpServers || {},
              count: Object.keys(config.mcpServers || {}).length,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list MCP servers:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Add MCP server
   */
  server.tool(
    "mcp_add_server",
    "Add a new MCP server configuration",
    {
      serverName: z.string().describe("Unique server name/identifier"),
      command: z.string().describe("Command to start the server"),
      args: z.array(z.string()).optional().describe("Command arguments"),
      env: z.record(z.string()).optional().describe("Environment variables"),
      scope: z.enum(['user', 'workspace']).default('workspace').describe("Configuration scope"),
      workspacePath: z.string().optional().describe("Workspace path (for workspace scope)"),
      disabled: z.boolean().optional().default(false).describe("Add as disabled"),
    },
    async (args) => {
      try {
        const configPath = getMCPConfigPath(args.scope, args.workspacePath);
        const config = readMCPConfig(configPath);
        
        if (!config.mcpServers) {
          config.mcpServers = {};
        }
        
        if (config.mcpServers[args.serverName]) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Server '${args.serverName}' already exists. Use update or remove first.`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        config.mcpServers[args.serverName] = {
          command: args.command,
          args: args.args,
          env: args.env,
          disabled: args.disabled,
        };
        
        writeMCPConfig(configPath, config);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Added MCP server '${args.serverName}'`,
              configPath,
              server: config.mcpServers[args.serverName]
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to add MCP server:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Remove MCP server
   */
  server.tool(
    "mcp_remove_server",
    "Remove an MCP server configuration",
    {
      serverName: z.string().describe("Server name to remove"),
      scope: z.enum(['user', 'workspace']).default('workspace').describe("Configuration scope"),
      workspacePath: z.string().optional().describe("Workspace path (for workspace scope)"),
    },
    async (args) => {
      try {
        const configPath = getMCPConfigPath(args.scope, args.workspacePath);
        const config = readMCPConfig(configPath);
        
        if (!config.mcpServers || !config.mcpServers[args.serverName]) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Server '${args.serverName}' not found`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        delete config.mcpServers[args.serverName];
        writeMCPConfig(configPath, config);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Removed MCP server '${args.serverName}'`,
              configPath
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to remove MCP server:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Update MCP server
   */
  server.tool(
    "mcp_update_server",
    "Update an existing MCP server configuration",
    {
      serverName: z.string().describe("Server name to update"),
      command: z.string().optional().describe("New command"),
      args: z.array(z.string()).optional().describe("New arguments"),
      env: z.record(z.string()).optional().describe("New environment variables"),
      disabled: z.boolean().optional().describe("Enable/disable server"),
      scope: z.enum(['user', 'workspace']).default('workspace').describe("Configuration scope"),
      workspacePath: z.string().optional().describe("Workspace path (for workspace scope)"),
    },
    async (args) => {
      try {
        const configPath = getMCPConfigPath(args.scope, args.workspacePath);
        const config = readMCPConfig(configPath);
        
        if (!config.mcpServers || !config.mcpServers[args.serverName]) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Server '${args.serverName}' not found`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        const server = config.mcpServers[args.serverName];
        if (args.command) server.command = args.command;
        if (args.args !== undefined) server.args = args.args;
        if (args.env !== undefined) server.env = args.env;
        if (args.disabled !== undefined) server.disabled = args.disabled;
        
        writeMCPConfig(configPath, config);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Updated MCP server '${args.serverName}'`,
              configPath,
              server: config.mcpServers[args.serverName]
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to update MCP server:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Get MCP server details
   */
  server.tool(
    "mcp_get_server",
    "Get details of a specific MCP server configuration",
    {
      serverName: z.string().describe("Server name"),
      scope: z.enum(['user', 'workspace']).default('workspace').describe("Configuration scope"),
      workspacePath: z.string().optional().describe("Workspace path (for workspace scope)"),
    },
    async (args) => {
      try {
        const configPath = getMCPConfigPath(args.scope, args.workspacePath);
        const config = readMCPConfig(configPath);
        
        if (!config.mcpServers || !config.mcpServers[args.serverName]) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Server '${args.serverName}' not found`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              serverName: args.serverName,
              server: config.mcpServers[args.serverName],
              configPath
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get MCP server:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Enable/Disable MCP server
   */
  server.tool(
    "mcp_toggle_server",
    "Enable or disable an MCP server without removing it",
    {
      serverName: z.string().describe("Server name"),
      enabled: z.boolean().describe("true to enable, false to disable"),
      scope: z.enum(['user', 'workspace']).default('workspace').describe("Configuration scope"),
      workspacePath: z.string().optional().describe("Workspace path (for workspace scope)"),
    },
    async (args) => {
      try {
        const configPath = getMCPConfigPath(args.scope, args.workspacePath);
        const config = readMCPConfig(configPath);
        
        if (!config.mcpServers || !config.mcpServers[args.serverName]) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: `Server '${args.serverName}' not found`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        config.mcpServers[args.serverName].disabled = !args.enabled;
        writeMCPConfig(configPath, config);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Server '${args.serverName}' ${args.enabled ? 'enabled' : 'disabled'}`,
              configPath
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to toggle MCP server:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Backup MCP configuration
   */
  server.tool(
    "mcp_backup_config",
    "Create a timestamped backup of MCP configuration",
    {
      scope: z.enum(['user', 'workspace']).default('workspace').describe("Configuration scope"),
      workspacePath: z.string().optional().describe("Workspace path (for workspace scope)"),
    },
    async (args) => {
      try {
        const configPath = getMCPConfigPath(args.scope, args.workspacePath);
        
        if (!fs.existsSync(configPath)) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Configuration file does not exist"
              }, null, 2)
            }],
            isError: true
          };
        }
        
        const backupPath = `${configPath}.backup.${Date.now()}`;
        fs.copyFileSync(configPath, backupPath);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Configuration backed up successfully",
              backupPath,
              originalPath: configPath
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to backup MCP config:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  logger.info("✓ MCP configuration tools registered");
}
