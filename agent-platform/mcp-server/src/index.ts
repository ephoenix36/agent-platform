#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { registerAgentTools } from "./tools/agent-tools.js";
import { registerAPITools } from "./tools/api-tools.js";
import { registerWorkflowTools } from "./tools/workflow-tools.js";
import { registerModelTools } from "./tools/model-tools.js";
import { setupLogging } from "./utils/logging.js";

// Load environment variables
dotenv.config();

// Setup logging
const logger = setupLogging();

/**
 * Main MCP Server for Agent Platform
 * Provides:
 * - AI Agent execution with sampling
 * - Intelligent model selection and configuration
 * - API integrations (Zapier-like functionality)
 * - Workflow orchestration
 */
const server = new McpServer({
  name: process.env.MCP_SERVER_NAME || "agent-platform-mcp",
  version: process.env.MCP_SERVER_VERSION || "1.0.0",
  description: "MCP Server for AI Agent Platform with sampling, model selection, and API integrations"
});

/**
 * Initialize server and register all tools
 */
async function initializeServer() {
  logger.info("Initializing Agent Platform MCP Server...");

  try {
    // Register agent tools (sampling, execution, etc.)
    await registerAgentTools(server, logger);
    logger.info("✓ Agent tools registered");

    // Register model selection and configuration tools
    await registerModelTools(server, logger);
    logger.info("✓ Model tools registered");

    // Register workflow orchestration tools
    await registerWorkflowTools(server, logger);
    logger.info("✓ Workflow tools registered");

    // Register API integration tools (Zapier-like)
    await registerAPITools(server, logger);
    logger.info("✓ API integration tools registered");

    logger.info("All tools registered successfully");
  } catch (error) {
    logger.error("Failed to initialize server:", error);
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
    
    logger.info("🚀 Agent Platform MCP Server started successfully");
    logger.info(`📡 Listening on stdio transport`);
    logger.info(`🤖 Model: ${process.env.DEFAULT_MODEL || 'gpt-4-turbo-preview'}`);
    logger.info(`🌡️  Temperature: ${process.env.DEFAULT_TEMPERATURE || '0.7'}`);

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
