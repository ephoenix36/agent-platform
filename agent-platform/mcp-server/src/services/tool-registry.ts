/**
 * Tool Registry for Agent Access
 * 
 * Provides agents with access to all MCP tools in the proper format.
 * Enables agents to discover and call tools through MCP sampling.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Logger } from "../utils/logging.js";
import { z } from "zod";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Tool Registry manages all available MCP tools and their schemas
 */
export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private toolExecutors: Map<string, Function> = new Map();
  private server: McpServer;
  private logger: Logger;

  constructor(server: McpServer, logger: Logger) {
    this.server = server;
    this.logger = logger;
  }

  /**
   * Sync tools from MCP server
   * This scans the server's registered tools and adds them to the registry
   */
  async syncFromServer(): Promise<void> {
    try {
      // Access the server's tools (this is implementation-specific)
      // For now, we'll rely on manual registration via registerTool
      this.logger.info("Tool registry ready for manual registration");
    } catch (error) {
      this.logger.warn("Could not auto-sync tools from server, using manual registration");
    }
  }

  /**
   * Register a tool with its execution function
   */
  registerTool(
    name: string,
    description: string,
    schema: z.ZodObject<any>,
    executor: Function
  ): void {
    // Convert Zod schema to JSON schema format
    const inputSchema = this.zodToJsonSchema(schema);

    const tool: MCPTool = {
      name,
      description,
      inputSchema
    };

    this.tools.set(name, tool);
    this.toolExecutors.set(name, executor);

    this.logger.debug(`Registered tool: ${name}`);
  }

  /**
   * Get all available tools in MCP format
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get specific tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get tools filtered by names
   */
  getTools(names: string[]): MCPTool[] {
    return names
      .map(name => this.tools.get(name))
      .filter((tool): tool is MCPTool => tool !== undefined);
  }

  /**
   * Execute a tool
   */
  async executeTool(name: string, input: any): Promise<ToolExecutionResult> {
    const executor = this.toolExecutors.get(name);

    if (!executor) {
      return {
        success: false,
        error: `Tool '${name}' not found`
      };
    }

    try {
      this.logger.info(`Executing tool: ${name}`);
      const result = await executor(input);
      
      return {
        success: true,
        result
      };
    } catch (error: any) {
      this.logger.error(`Tool execution failed: ${name}`, error);
      return {
        success: false,
        error: error.message || "Tool execution failed"
      };
    }
  }

  /**
   * Get tool schemas in OpenAI function calling format
   */
  getToolsForOpenAI(toolNames?: string[]): any[] {
    const tools = toolNames 
      ? this.getTools(toolNames)
      : this.getAllTools();

    return tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }

  /**
   * Get tool schemas in Anthropic Claude format
   */
  getToolsForAnthropic(toolNames?: string[]): any[] {
    const tools = toolNames 
      ? this.getTools(toolNames)
      : this.getAllTools();

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }));
  }

  /**
   * Get tool schemas in Google AI format
   */
  getToolsForGoogle(toolNames?: string[]): any[] {
    const tools = toolNames 
      ? this.getTools(toolNames)
      : this.getAllTools();

    return tools.map(tool => ({
      function_declarations: [{
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }]
    }));
  }

  /**
   * Convert Zod schema to JSON schema
   */
  private zodToJsonSchema(schema: z.ZodObject<any>): any {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zodType = value as z.ZodTypeAny;
      
      // Get description from Zod schema
      const description = (zodType as any)._def?.description || "";

      // Determine type
      let propSchema: any = { description };

      if (zodType instanceof z.ZodString) {
        propSchema.type = "string";
        
        // Check for enum
        if ((zodType as any)._def?.checks) {
          const checks = (zodType as any)._def.checks;
          const enumCheck = checks.find((c: any) => c.kind === 'enum');
          if (enumCheck) {
            propSchema.enum = enumCheck.values;
          }
        }
      } else if (zodType instanceof z.ZodNumber) {
        propSchema.type = "number";
        
        // Add min/max if specified
        const checks = (zodType as any)._def?.checks || [];
        const minCheck = checks.find((c: any) => c.kind === 'min');
        const maxCheck = checks.find((c: any) => c.kind === 'max');
        if (minCheck) propSchema.minimum = minCheck.value;
        if (maxCheck) propSchema.maximum = maxCheck.value;
      } else if (zodType instanceof z.ZodBoolean) {
        propSchema.type = "boolean";
      } else if (zodType instanceof z.ZodArray) {
        propSchema.type = "array";
        propSchema.items = { type: "string" }; // Simplified
      } else if (zodType instanceof z.ZodObject) {
        propSchema.type = "object";
        propSchema.properties = this.zodToJsonSchema(zodType).properties;
      } else if (zodType instanceof z.ZodRecord) {
        propSchema.type = "object";
        propSchema.additionalProperties = true;
      } else if (zodType instanceof z.ZodEnum) {
        propSchema.type = "string";
        propSchema.enum = (zodType as any)._def.values;
      } else {
        propSchema.type = "string"; // Default fallback
      }

      properties[key] = propSchema;

      // Check if required
      if (!(zodType instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 && { required })
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalTools: this.tools.size,
      tools: Array.from(this.tools.keys())
    };
  }
}

/**
 * Global tool registry instance
 */
let globalToolRegistry: ToolRegistry | null = null;

/**
 * Initialize global tool registry
 */
export function initializeToolRegistry(server: McpServer, logger: Logger): ToolRegistry {
  if (!globalToolRegistry) {
    globalToolRegistry = new ToolRegistry(server, logger);
    logger.info("✓ Tool registry initialized");
  }
  return globalToolRegistry;
}

/**
 * Get global tool registry
 */
export function getToolRegistry(): ToolRegistry {
  if (!globalToolRegistry) {
    throw new Error("Tool registry not initialized. Call initializeToolRegistry first.");
  }
  return globalToolRegistry;
}
