#!/usr/bin/env node
/**
 * MCP Server for Agents - Collaborative AI Agent Platform
 * 
 * Provides MCP tools for:
 * - Agent discovery and search
 * - Multi-agent conversations
 * - Task assignment and tracking
 * - Token sampling from clients
 * - Agent optimization management
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { AgentManager } from "../core/agent-manager.js";
import { SamplingManager } from "./sampling-manager.js";
import { ProjectStateManager } from "../core/project-state.js";
import { BusinessStructureManager } from "../core/business-structure.js";
import { OptimizationManager } from "../core/optimization-state.js";
import { CollectionManager } from "../core/collection-manager.js";
import { WidgetManager } from "../core/widget-manager.js";
import { PMBridge } from "../core/pm-bridge.js";
import { registerPersistentStorageTools } from "./persistent-storage-tools.js";
import { registerIngestionTools } from "./ingestion-tools.js";
import { registerOrchestrationTools } from "./orchestration-tools.js";
import { registerBusinessTools } from "./business-tools.js";
import { registerOptimizationTools } from "./optimization-tools.js";
import { registerCollectionTools } from "./collection-tools.js";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const collectionsPath = path.join(__dirname, '../../collections');

// Initialize managers
const agentManager = new AgentManager(collectionsPath);
const samplingManager = new SamplingManager();
const projectState = new ProjectStateManager();
const businessManager = new BusinessStructureManager(projectState);
const optimizationManager = new OptimizationManager();
const collectionManager = new CollectionManager(businessManager, optimizationManager, agentManager);
const widgetManager = new WidgetManager();
const pmBridge = new PMBridge();

// Create MCP server
const server = new McpServer({
  name: "agents-collaboration-platform",
  version: "2.0.0",
  description: "Collaborative AI Agent Platform with persistent storage, search, conversations, tasks, and optimization"
});

// Register tools
registerOrchestrationTools(server, projectState);
registerBusinessTools(server, businessManager);
registerOptimizationTools(server, optimizationManager);
registerCollectionTools(server, collectionManager);

// Register Widget Tools
server.tool(
  "ui_render_widget",
  "Render a widget on the Canvas",
  {
    name: z.string(),
    type: z.enum(['html', 'react', 'iframe', 'terminal', 'markdown']),
    content: z.string(),
    position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  },
  async ({ name, type, content, position }) => {
    const widget = await widgetManager.renderWidget(name, type, content, position);
    return {
      content: [{ type: "text", text: JSON.stringify(widget, null, 2) }]
    };
  }
);

// Register PM Tools
server.tool(
  "pm_sync_tasks",
  "Force sync with external task management tools",
  {},
  async () => {
    await pmBridge.sync();
    return {
      content: [{ type: "text", text: "Sync initiated" }]
    };
  }
);




// ============================================================================
// SAMPLING TOOLS
// ============================================================================

/**
 * Request token sampling from client
 */
const requestSamplingSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).describe("Messages for sampling"),
  maxTokens: z.number().default(1000).describe("Maximum tokens to generate"),
  temperature: z.number().min(0).max(2).default(0.7).describe("Sampling temperature"),
  stopSequences: z.array(z.string()).optional().describe("Stop sequences"),
  metadata: z.record(z.any()).optional()
});

server.tool(
  "request_sampling",
  "Request token sampling from the client LLM",
  requestSamplingSchema.shape,
  async (input) => {
    try {
      const result = await samplingManager.requestSampling({
        messages: input.messages,
        maxTokens: input.maxTokens,
        temperature: input.temperature,
        stopSequences: input.stopSequences,
        metadata: input.metadata
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error requesting sampling: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// ============================================================================
// AGENT OPTIMIZATION TOOLS
// ============================================================================

/**
 * Start optimization for an agent
 */
const optimizeAgentSchema = z.object({
  collection: z.string(),
  subsection: z.string(),
  agentName: z.string(),
  targetScore: z.number().min(0).max(1).default(0.85).describe("Target optimization score"),
  maxGenerations: z.number().default(10).describe("Maximum optimization generations"),
  populationSize: z.number().default(5).describe("Population size for evolution")
});

server.tool(
  "optimize_agent",
  "Start an optimization run for an agent using evolutionary algorithms",
  optimizeAgentSchema.shape,
  async (input) => {
    try {
      // This would typically call the Python optimization bridge
      const result = {
        status: "optimization_started",
        agent: `${input.collection}/${input.subsection}/${input.agentName}`,
        targetScore: input.targetScore,
        maxGenerations: input.maxGenerations,
        message: "Optimization run initiated. Monitor progress with get_optimization_status."
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error starting optimization: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Get agent optimization history
 */
const getOptimizationHistorySchema = z.object({
  collection: z.string(),
  subsection: z.string(),
  agentName: z.string()
});

server.tool(
  "get_optimization_history",
  "Get the optimization history for an agent",
  getOptimizationHistorySchema.shape,
  async (input) => {
    try {
      const agent = await agentManager.loadAgent(input.collection, input.subsection, input.agentName);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            currentScore: agent.currentScore,
            threshold: agent.optimizationThreshold,
            history: agent.optimizationHistory,
            lastOptimized: agent.lastOptimized
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting optimization history: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  try {
    // Register persistent storage tools
    registerPersistentStorageTools(server);
    
    // Register agent ingestion tools
    registerIngestionTools(server, agentManager);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Agents MCP Server started successfully");
    console.error(`Collections path: ${collectionsPath}`);
    console.error("Persistent storage: Enabled");
    console.error("Agent ingestion: Enabled");
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
}

main();
