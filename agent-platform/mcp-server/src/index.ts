#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dotenv from "dotenv";
import { setupLogging } from "./utils/logging.js";
import { ToolkitManager } from "./services/toolkit-manager.js";
import { createCoreToolkit } from "./toolkits/core/index.js";
import { agentDevelopmentToolkit } from "./toolkits/agent-development/index.js";
import { workflowToolkit } from "./toolkits/workflow/index.js";
import { modelManagementToolkit } from "./toolkits/model-management/index.js";
import { integrationsToolkit } from "./toolkits/integrations/index.js";
import { taskManagementToolkit } from "./toolkits/task-management/index.js";
import { skillsToolkit } from "./toolkits/skills/index.js";
import { collectionsToolkit } from "./toolkits/collections/index.js";
import { structuredOutputToolkit } from "./toolkits/structured-output/index.js";
import { widgetsToolkit } from "./toolkits/widgets/index.js";
import { hooksToolkit } from "./toolkits/hooks/index.js";
import { mcpConfigManagementToolkit } from "./toolkits/mcp-config-management/index.js";
import { fileOperationsToolkit } from "./toolkits/file-operations/index.js";
import { externalMcpToolkit } from "./toolkits/external-mcp-servers/index.js";
import { usageAnalyticsToolkit } from "./toolkits/usage-analytics/index.js";
import { createProjectManagementToolkit, createProjectsOnlyToolkit, createTasksOnlyToolkit } from "./toolkits/project-management/index.js";
import { persistentStorageToolkit } from "./toolkits/persistent-storage/index.js";
import { HookManager } from "./hooks/HookManager.js";
import { initializeGlobalHooks } from "./utils/hooked-registry.js";
import { initializeToolRegistry } from "./services/tool-registry.js";
import { SamplingClient } from "./services/SamplingClient.js";
import { setMCPSamplingClient } from "./services/sampling-service.js";
import { initializeSkillsService, initializeCollectionService, setToolkitManager } from "./services/service-registry.js";

// Load environment variables
dotenv.config();

// Setup logging
const logger = setupLogging();

// Initialize global hook manager (optional feature)
const hookManager = new HookManager();
initializeGlobalHooks(hookManager);
logger.info("✓ Hook system initialized");

/**
 * Main MCP Server for Agent Platform
 * Provides:
 * - Modular toolkit system with selective loading
 * - AI Agent execution with MCP sampling (uses client's LLM!)
 * - Intelligent model selection and configuration
 * - API integrations (Zapier-like functionality)
 * - Workflow orchestration
 * - Project management (opt-in)
 * - Full tool access for agents via MCP sampling
 */
/**
 * Main MCP Server for Agent Platform
 * Server will REQUEST sampling from the client (VS Code)
 */
const server = new McpServer({
  name: process.env.MCP_SERVER_NAME || "agent-platform-mcp",
  version: process.env.MCP_SERVER_VERSION || "2.1.0",
  description: "MCP Server for AI Agent Platform with modular toolkits, sampling, tool calling, and integrations"
});

logger.info("✓ Server initialized (will request sampling from client)");

// Initialize tool registry for agent tool access
const toolRegistry = initializeToolRegistry(server, logger);
logger.info("✓ Tool registry initialized");

/**
 * Initialize server with toolkit system
 */
async function initializeServer() {
  logger.info("🚀 Initializing Agent Platform MCP Server v2.0...");
  logger.info("📦 Using modular toolkit architecture");

  try {
    // Create toolkit manager
    const toolkitManager = new ToolkitManager(server, logger);
    logger.info("✓ Toolkit manager initialized");
    
    // Register toolkit manager in service registry
    setToolkitManager(toolkitManager);
    
    // Initialize services
    logger.info("\n🔧 Initializing services...");
    
    const skillsService = initializeSkillsService(toolkitManager, logger);
    await skillsService.initialize();
    logger.info("✓ Skills service initialized");
    
    const collectionService = initializeCollectionService(logger);
    logger.info("✓ Collection service initialized");

    // Register all available toolkits
    logger.info("\n📦 Registering toolkits...");
    
    toolkitManager.registerToolkit(createCoreToolkit(toolkitManager));
    toolkitManager.registerToolkit(persistentStorageToolkit);
    toolkitManager.registerToolkit(agentDevelopmentToolkit);
    toolkitManager.registerToolkit(workflowToolkit);
    toolkitManager.registerToolkit(modelManagementToolkit);
    toolkitManager.registerToolkit(integrationsToolkit);
    toolkitManager.registerToolkit(taskManagementToolkit);
    toolkitManager.registerToolkit(skillsToolkit);
    toolkitManager.registerToolkit(collectionsToolkit);
    toolkitManager.registerToolkit(structuredOutputToolkit);
    toolkitManager.registerToolkit(widgetsToolkit);
    toolkitManager.registerToolkit(hooksToolkit);
    toolkitManager.registerToolkit(mcpConfigManagementToolkit);
    toolkitManager.registerToolkit(fileOperationsToolkit);
    toolkitManager.registerToolkit(externalMcpToolkit);
    toolkitManager.registerToolkit(usageAnalyticsToolkit);
    toolkitManager.registerToolkit(createProjectManagementToolkit());
    toolkitManager.registerToolkit(createProjectsOnlyToolkit());
    toolkitManager.registerToolkit(createTasksOnlyToolkit());
    
    logger.info("✓ All toolkits registered");

    // Load enabled toolkits based on manifest
    logger.info("\n🔧 Loading enabled toolkits...");
    await toolkitManager.loadEnabledToolkits();

    // Log toolkit status
    const stats = toolkitManager.getStats();
    logger.info("\n📊 Toolkit Status:");
    logger.info(`   ✓ ${stats.totalLoaded}/${stats.totalRegistered} toolkits loaded`);
    logger.info(`   ✓ ${stats.totalTools} tools available`);
    
    const status = toolkitManager.getToolkitStatus({ loaded: true });
    logger.info("\n📋 Loaded Toolkits:");
    for (const tk of status) {
      logger.info(`   ${tk.loaded ? '✓' : '○'} ${tk.name} (${tk.toolCount} tools)`);
    }

    // Log tool registry status
    const toolStats = toolRegistry.getStats();
    logger.info("\n🔧 Tool Registry:");
    logger.info(`   ✓ ${toolStats.totalTools} tools registered`);
    logger.info(`   ✓ All tools available for agent use via sampling`);

    logger.info("\n✅ Server initialization complete");
  } catch (error) {
    logger.error("❌ Failed to initialize server:", error);
    throw error;
  }
}

/**
 * Start the MCP server
 */
async function main() {
  try {
    // Initialize all tools and resources
    await initializeServer();

    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    // Check if client supports sampling
    const clientCapabilities = (server as any).server?.getClientCapabilities?.();
    logger.info(`✓ Client capabilities:`, JSON.stringify(clientCapabilities, null, 2));
    
    // NOW initialize sampling client after connection
    const underlyingServer = (server as any).server;
    logger.info(`✓ Underlying server type: ${typeof underlyingServer}`);
    logger.info(`✓ Has createMessage: ${typeof underlyingServer?.createMessage}`);
    
    if (!underlyingServer) {
      logger.error("❌ WARNING: Underlying server is null/undefined!");
    } else if (typeof underlyingServer.createMessage !== 'function') {
      logger.error("❌ WARNING: createMessage is not available on server!");
    } else {
      logger.info("✓ createMessage is available - proceeding with sampling client init");
    }
    
    try {
      const samplingClient = new SamplingClient(underlyingServer);
      logger.info(`✓ Sampling client created: ${samplingClient ? 'SUCCESS' : 'NULL'}`);
      setMCPSamplingClient(samplingClient);
      logger.info("✓ MCP sampling client initialized AFTER connection");
      logger.info("✓ setMCPSamplingClient called successfully");
    } catch (samplingError) {
      logger.error("❌ Failed to initialize sampling client:", samplingError);
      throw samplingError;
    }
    
    logger.info("\n✅ Agent Platform MCP Server v2.1 started successfully");
    logger.info("📡 Listening on stdio transport");
    logger.info(`🤖 Sampling Mode: MCP (uses client's LLM - no API keys required!)`);
    logger.info(`   ↳ Fallback to API providers if MCP unavailable`);
    logger.info(`🌡️  Default Temperature: ${process.env.DEFAULT_TEMPERATURE || '0.7'}`);
    logger.info("\n💡 Tip: Use 'list_toolkits' to see available toolkits");
    logger.info("💡 Tip: Use 'enable_toolkit' to load project management features");
    logger.info("💡 Tip: Agents can now use ANY registered tool via sampling!");
    logger.info("💡 Tip: MCP sampling uses YOUR LLM subscription (Claude, GPT, etc.)!");

  } catch (error) {
    logger.error("❌ Server startup failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info("Shutting down server...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info("Shutting down server...");
  process.exit(0);
});

// Start the server
main();
