#!/usr/bin/env node
/**
 * Test script for Agents MCP Server
 * 
 * This script demonstrates how to use the MCP server tools
 * and can be used for testing and validation.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMCPServer() {
  console.log("Starting MCP Server test...\n");

  // Create client
  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  // Start server process
  const serverPath = path.join(__dirname, "../dist/mcp/server.js");
  const serverProcess = spawn("node", [serverPath]);

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  try {
    await client.connect(transport);
    console.log("✓ Connected to MCP server\n");

    // Test 1: List collections
    console.log("Test 1: Listing collections...");
    const collectionsResult = await client.callTool("list_collections", {});
    console.log("Collections:", collectionsResult.content[0].text);
    console.log("✓ Test 1 passed\n");

    // Test 2: Search agents
    console.log("Test 2: Searching for research agents...");
    const searchResult = await client.callTool("search_agents", {
      collection: "research",
      limit: 3,
    });
    console.log("Search results:", searchResult.content[0].text);
    console.log("✓ Test 2 passed\n");

    // Test 3: Create conversation
    console.log("Test 3: Creating a test conversation...");
    const conversationResult = await client.callTool("create_conversation", {
      agents: [
        {
          collection: "research",
          subsection: "literature-review",
          agentName: "literature-synthesizer",
          role: "synthesizer",
        },
      ],
      topic: "Test conversation topic",
      maxRounds: 3,
    });
    console.log("Conversation created:", conversationResult.content[0].text);
    console.log("✓ Test 3 passed\n");

    // Test 4: Create task
    console.log("Test 4: Creating a test task...");
    const taskResult = await client.callTool("create_task", {
      title: "Test Task",
      description: "This is a test task for validation",
      assignedAgents: [
        {
          collection: "research",
          subsection: "literature-review",
          agentName: "literature-synthesizer",
        },
      ],
      priority: "medium",
    });
    console.log("Task created:", taskResult.content[0].text);
    console.log("✓ Test 4 passed\n");

    // Test 5: List conversations
    console.log("Test 5: Listing conversations...");
    const conversationsResult = await client.callTool("list_conversations", {
      status: "active",
      limit: 10,
    });
    console.log("Conversations:", conversationsResult.content[0].text);
    console.log("✓ Test 5 passed\n");

    // Test 6: List tasks
    console.log("Test 6: Listing tasks...");
    const tasksResult = await client.callTool("list_tasks", {
      status: "all",
      limit: 10,
    });
    console.log("Tasks:", tasksResult.content[0].text);
    console.log("✓ Test 6 passed\n");

    console.log("\n✅ All tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

// Run tests
testMCPServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
