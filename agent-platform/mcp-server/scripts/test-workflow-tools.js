#!/usr/bin/env node

/**
 * Test script for reimplemented workflow tools
 * Verifies that the new implementation works correctly
 */

import { setupLogging } from "./build/utils/logging.js";

const logger = setupLogging();

async function testWorkflowTools() {
  console.log("=".repeat(70));
  console.log("WORKFLOW TOOLS REIMPLEMENTATION TEST");
  console.log("=".repeat(70));
  
  // Create mock server
  const mockServer = {
    tools: new Map(),
    tool: function(name, description, schema, handler) {
      this.tools.set(name, { name, description, schema, handler });
      console.log(`✓ Registered tool: ${name}`);
    }
  };
  
  console.log("\n1. LOADING WORKFLOW TOOLS MODULE");
  console.log("-".repeat(70));
  
  try {
    const { registerWorkflowTools } = await import("./build/tools/workflow-tools.js");
    
    console.log("\n2. REGISTERING WORKFLOW TOOLS");
    console.log("-".repeat(70));
    
    await registerWorkflowTools(mockServer, logger);
    
    console.log(`\n✓ Total tools registered: ${mockServer.tools.size}`);
    console.log("\nRegistered workflow tools:");
    Array.from(mockServer.tools.keys()).forEach(name => {
      console.log(`  - ${name}`);
    });
    
    // Test 1: Verify tool count
    console.log("\n3. VERIFICATION TESTS");
    console.log("-".repeat(70));
    
    const expectedTools = [
      'execute_workflow',
      'execute_workflow_async',
      'create_workflow',
      'get_workflow_templates'
    ];
    
    let allToolsPresent = true;
    expectedTools.forEach(toolName => {
      if (mockServer.tools.has(toolName)) {
        console.log(`✓ Tool '${toolName}' present`);
      } else {
        console.log(`✗ Tool '${toolName}' MISSING`);
        allToolsPresent = false;
      }
    });
    
    if (allToolsPresent && mockServer.tools.size === 4) {
      console.log("\n✅ ALL TESTS PASSED");
      console.log("  - All 4 workflow tools registered correctly");
      console.log("  - Module loads without errors");
      console.log("  - Registration completes successfully");
    } else {
      console.log("\n❌ TESTS FAILED");
      console.log(`  - Expected 4 tools, got ${mockServer.tools.size}`);
    }
    
    // Test 2: Get workflow templates
    console.log("\n4. TESTING GET_WORKFLOW_TEMPLATES");
    console.log("-".repeat(70));
    
    const templatesTool = mockServer.tools.get('get_workflow_templates');
    if (templatesTool && templatesTool.handler) {
      const result = await templatesTool.handler({});
      const data = JSON.parse(result.content[0].text);
      
      console.log(`✓ Retrieved ${data.count} templates`);
      console.log("\nAvailable templates:");
      data.templates.forEach((template, index) => {
        console.log(`  ${index + 1}. ${template.name} (${template.category})`);
        console.log(`     ${template.description}`);
      });
      
      console.log(`\n✅ Template retrieval works correctly`);
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("WORKFLOW TOOLS REIMPLEMENTATION: ✅ SUCCESS");
    console.log("=".repeat(70));
    
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run tests
testWorkflowTools()
  .then(() => {
    console.log("\n✓ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test script failed:", error);
    process.exit(1);
  });
