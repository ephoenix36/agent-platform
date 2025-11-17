/**
 * Tool Access Integration Test
 * 
 * Verifies that agents can access and use MCP tools through sampling.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { initializeToolRegistry, getToolRegistry } from '../src/services/tool-registry.js';
import { setupLogging } from '../src/utils/logging.js';
import { z } from 'zod';

describe('Tool Access for Agents', () => {
  let server: McpServer;
  let logger: ReturnType<typeof setupLogging>;
  
  beforeAll(() => {
    server = new McpServer({
      name: 'test-server',
      version: '1.0.0'
    });
    
    logger = setupLogging();
    
    // Initialize tool registry
    initializeToolRegistry(server, logger);
  });

  describe('Tool Registry', () => {
    it('should initialize successfully', () => {
      const registry = getToolRegistry();
      expect(registry).toBeDefined();
    });

    it('should register tools with schemas', () => {
      const registry = getToolRegistry();
      
      const testSchema = z.object({
        input: z.string().describe("Test input"),
        count: z.number().optional().describe("Optional count")
      });

      registry.registerTool(
        "test_tool",
        "A test tool for verification",
        testSchema,
        async (input) => {
          return { success: true, input: input.input };
        }
      );

      const tool = registry.getTool("test_tool");
      expect(tool).toBeDefined();
      expect(tool?.name).toBe("test_tool");
      expect(tool?.description).toBe("A test tool for verification");
    });

    it('should convert Zod schema to JSON schema', () => {
      const registry = getToolRegistry();
      
      const tool = registry.getTool("test_tool");
      expect(tool?.inputSchema.type).toBe("object");
      expect(tool?.inputSchema.properties).toHaveProperty("input");
      expect(tool?.inputSchema.properties).toHaveProperty("count");
      expect(tool?.inputSchema.properties.input.type).toBe("string");
      expect(tool?.inputSchema.properties.count.type).toBe("number");
    });

    it('should execute registered tools', async () => {
      const registry = getToolRegistry();
      
      const result = await registry.executeTool("test_tool", {
        input: "hello world",
        count: 5
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ success: true, input: "hello world" });
    });

    it('should handle tool execution errors', async () => {
      const registry = getToolRegistry();
      
      const result = await registry.executeTool("nonexistent_tool", {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Multi-Provider Tool Formats', () => {
    it('should generate OpenAI format', () => {
      const registry = getToolRegistry();
      
      const openAITools = registry.getToolsForOpenAI(["test_tool"]);
      
      expect(openAITools).toHaveLength(1);
      expect(openAITools[0]).toHaveProperty("type", "function");
      expect(openAITools[0].function).toHaveProperty("name", "test_tool");
      expect(openAITools[0].function).toHaveProperty("description");
      expect(openAITools[0].function).toHaveProperty("parameters");
    });

    it('should generate Anthropic format', () => {
      const registry = getToolRegistry();
      
      const anthropicTools = registry.getToolsForAnthropic(["test_tool"]);
      
      expect(anthropicTools).toHaveLength(1);
      expect(anthropicTools[0]).toHaveProperty("name", "test_tool");
      expect(anthropicTools[0]).toHaveProperty("description");
      expect(anthropicTools[0]).toHaveProperty("input_schema");
    });

    it('should generate Google AI format', () => {
      const registry = getToolRegistry();
      
      const googleTools = registry.getToolsForGoogle(["test_tool"]);
      
      expect(googleTools).toHaveLength(1);
      expect(googleTools[0]).toHaveProperty("function_declarations");
      expect(googleTools[0].function_declarations[0]).toHaveProperty("name", "test_tool");
    });
  });

  describe('Tool Discovery', () => {
    it('should list all registered tools', () => {
      const registry = getToolRegistry();
      
      const allTools = registry.getAllTools();
      expect(allTools.length).toBeGreaterThan(0);
      expect(allTools.some(t => t.name === "test_tool")).toBe(true);
    });

    it('should get specific tools by name', () => {
      const registry = getToolRegistry();
      
      const tools = registry.getTools(["test_tool"]);
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("test_tool");
    });

    it('should filter out non-existent tools', () => {
      const registry = getToolRegistry();
      
      const tools = registry.getTools(["test_tool", "nonexistent"]);
      expect(tools).toHaveLength(1);
    });
  });

  describe('Integration with Sampling', () => {
    it('should provide tools that can be passed to sampling', () => {
      const registry = getToolRegistry();
      
      // Simulate getting tools for an agent execution
      const enabledTools = ["test_tool"];
      const openAIFormat = registry.getToolsForOpenAI(enabledTools);
      
      expect(openAIFormat).toHaveLength(1);
      
      // This would be passed to the sampling service
      // performSampling({ ..., enabledTools, ... })
      // The sampling service would use getToolsForOpenAI/Anthropic/Google
    });
  });

  describe('Statistics', () => {
    it('should provide registry statistics', () => {
      const registry = getToolRegistry();
      
      const stats = registry.getStats();
      expect(stats.totalTools).toBeGreaterThan(0);
      expect(stats.tools).toBeInstanceOf(Array);
      expect(stats.tools).toContain("test_tool");
    });
  });
});
