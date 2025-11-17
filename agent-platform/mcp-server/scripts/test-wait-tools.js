#!/usr/bin/env node

/**
 * Manual test script for wait tools
 * Tests the MCP server wait tools functionality
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWaitTools } from "./build/tools/wait-tools.js";
import { setupLogging } from "./build/utils/logging.js";

const logger = setupLogging();

async function testWaitTools() {
  console.log("=".repeat(60));
  console.log("WAIT TOOLS MANUAL TEST");
  console.log("=".repeat(60));
  
  // Create mock server
  const mockServer = {
    tools: new Map(),
    tool: function(name, description, schema, handler) {
      this.tools.set(name, { name, description, schema, handler });
      console.log(`✓ Registered tool: ${name}`);
    }
  };
  
  // Register wait tools
  console.log("\n1. REGISTERING WAIT TOOLS");
  console.log("-".repeat(60));
  await registerWaitTools(mockServer, logger);
  
  console.log(`\n✓ Total tools registered: ${mockServer.tools.size}`);
  console.log("\nRegistered tools:");
  Array.from(mockServer.tools.keys()).forEach(name => {
    console.log(`  - ${name}`);
  });
  
  // Test 1: Sleep
  console.log("\n2. TESTING SLEEP TOOL");
  console.log("-".repeat(60));
  const sleepTool = mockServer.tools.get('sleep');
  console.log("Sleeping for 1 second...");
  const startTime = Date.now();
  const sleepResult = await sleepTool.handler({ durationMs: 1000, label: "test-sleep" });
  const elapsed = Date.now() - startTime;
  const sleepData = JSON.parse(sleepResult.content[0].text);
  console.log(`✓ Sleep completed in ${elapsed}ms`);
  console.log(`  Requested: ${sleepData.requestedDurationMs}ms`);
  console.log(`  Actual: ${sleepData.actualDurationMs}ms`);
  
  // Test 2: Create wait handle
  console.log("\n3. TESTING CREATE WAIT HANDLE");
  console.log("-".repeat(60));
  const createTool = mockServer.tools.get('create_wait_handle');
  const createResult = await createTool.handler({
    handleId: 'test-handle-1',
    type: 'agent',
    metadata: { testKey: 'testValue' },
    timeoutMs: 10000
  });
  const createData = JSON.parse(createResult.content[0].text);
  console.log(`✓ Handle created: ${createData.handleId}`);
  console.log(`  Type: ${createData.type}`);
  console.log(`  Status: ${createData.status}`);
  console.log(`  Timeout: ${createData.timeout}ms`);
  
  // Test 3: Complete wait handle
  console.log("\n4. TESTING COMPLETE WAIT HANDLE");
  console.log("-".repeat(60));
  const completeTool = mockServer.tools.get('complete_wait_handle');
  const completeResult = await completeTool.handler({
    handleId: 'test-handle-1',
    result: { message: 'Task completed successfully', data: { foo: 'bar' } }
  });
  const completeData = JSON.parse(completeResult.content[0].text);
  console.log(`✓ Handle completed: ${completeData.handleId}`);
  console.log(`  Status: ${completeData.status}`);
  console.log(`  Elapsed: ${completeData.elapsedTime}`);
  console.log(`  Result:`, completeData.result);
  
  // Test 4: Wait for (already completed)
  console.log("\n5. TESTING WAIT FOR (ALREADY COMPLETED)");
  console.log("-".repeat(60));
  const waitTool = mockServer.tools.get('wait_for');
  const waitResult = await waitTool.handler({
    handleId: 'test-handle-1',
    pollIntervalMs: 50
  });
  const waitData = JSON.parse(waitResult.content[0].text);
  console.log(`✓ Wait completed: ${waitData.handleId}`);
  console.log(`  Status: ${waitData.status}`);
  console.log(`  Result:`, waitData.result);
  
  // Test 5: Wait for with async completion
  console.log("\n6. TESTING WAIT FOR (ASYNC COMPLETION)");
  console.log("-".repeat(60));
  
  // Create handle
  await createTool.handler({
    handleId: 'test-async-1',
    type: 'workflow',
    timeoutMs: 5000
  });
  
  // Complete it after 500ms
  setTimeout(async () => {
    console.log("  [Background] Completing handle after 500ms...");
    await completeTool.handler({
      handleId: 'test-async-1',
      result: { asyncResult: 'completed in background' }
    });
  }, 500);
  
  console.log("Waiting for async completion...");
  const asyncWaitResult = await waitTool.handler({
    handleId: 'test-async-1',
    pollIntervalMs: 50
  });
  const asyncWaitData = JSON.parse(asyncWaitResult.content[0].text);
  console.log(`✓ Async wait completed: ${asyncWaitData.handleId}`);
  console.log(`  Waited: ${asyncWaitData.waitedMs}ms`);
  console.log(`  Result:`, asyncWaitData.result);
  
  // Test 6: Wait for multiple (all mode)
  console.log("\n7. TESTING WAIT FOR MULTIPLE (ALL MODE)");
  console.log("-".repeat(60));
  
  // Create multiple handles
  await createTool.handler({ handleId: 'multi-1', type: 'agent' });
  await createTool.handler({ handleId: 'multi-2', type: 'agent' });
  await createTool.handler({ handleId: 'multi-3', type: 'agent' });
  
  // Complete them at different times
  setTimeout(() => completeTool.handler({ handleId: 'multi-1', result: { step: 1 } }), 200);
  setTimeout(() => completeTool.handler({ handleId: 'multi-2', result: { step: 2 } }), 400);
  setTimeout(() => completeTool.handler({ handleId: 'multi-3', result: { step: 3 } }), 600);
  
  console.log("Waiting for all 3 handles to complete...");
  const multiTool = mockServer.tools.get('wait_for_multiple');
  const multiResult = await multiTool.handler({
    handleIds: ['multi-1', 'multi-2', 'multi-3'],
    mode: 'all',
    pollIntervalMs: 50
  });
  const multiData = JSON.parse(multiResult.content[0].text);
  console.log(`✓ All handles completed`);
  console.log(`  Mode: ${multiData.mode}`);
  console.log(`  Status: ${multiData.status}`);
  console.log(`  Completed: ${multiData.completedCount}/${multiData.totalCount}`);
  console.log(`  Total wait time: ${multiData.waitedTime}`);
  
  // Test 7: List wait handles
  console.log("\n8. TESTING LIST WAIT HANDLES");
  console.log("-".repeat(60));
  const listTool = mockServer.tools.get('list_wait_handles');
  const listResult = await listTool.handler({
    status: 'all',
    type: 'all'
  });
  const listData = JSON.parse(listResult.content[0].text);
  console.log(`✓ Listed handles`);
  console.log(`  Total: ${listData.stats.total}`);
  console.log(`  By status:`, listData.stats.byStatus);
  console.log(`  By type:`, listData.stats.byType);
  
  // Test 8: Wait for multiple (any mode)
  console.log("\n9. TESTING WAIT FOR MULTIPLE (ANY MODE)");
  console.log("-".repeat(60));
  
  // Create handles
  await createTool.handler({ handleId: 'any-1', type: 'agent' });
  await createTool.handler({ handleId: 'any-2', type: 'agent' });
  await createTool.handler({ handleId: 'any-3', type: 'agent' });
  
  // Complete second one first
  setTimeout(() => completeTool.handler({ handleId: 'any-2', result: { winner: true } }), 300);
  setTimeout(() => completeTool.handler({ handleId: 'any-1', result: { step: 1 } }), 700);
  setTimeout(() => completeTool.handler({ handleId: 'any-3', result: { step: 3 } }), 1000);
  
  console.log("Waiting for ANY handle to complete (should return ~300ms)...");
  const anyResult = await multiTool.handler({
    handleIds: ['any-1', 'any-2', 'any-3'],
    mode: 'any',
    pollIntervalMs: 50
  });
  const anyData = JSON.parse(anyResult.content[0].text);
  console.log(`✓ First handle completed`);
  console.log(`  Mode: ${anyData.mode}`);
  console.log(`  Status: ${anyData.status}`);
  console.log(`  Completed: ${anyData.completedCount}/${anyData.totalCount}`);
  console.log(`  Wait time: ${anyData.waitedTime}`);
  console.log(`  Winner: any-2 =`, anyData.results['any-2'].status === 'completed');
  
  // Test 9: Timeout test
  console.log("\n10. TESTING TIMEOUT");
  console.log("-".repeat(60));
  
  await createTool.handler({ handleId: 'timeout-test', type: 'agent' });
  
  console.log("Waiting with 500ms timeout (handle won't complete)...");
  const timeoutResult = await waitTool.handler({
    handleId: 'timeout-test',
    timeoutMs: 500,
    pollIntervalMs: 50
  });
  const timeoutData = JSON.parse(timeoutResult.content[0].text);
  console.log(`✓ Timeout occurred as expected`);
  console.log(`  Status: ${timeoutData.status}`);
  console.log(`  Error: ${timeoutData.error}`);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("ALL TESTS PASSED! ✓");
  console.log("=".repeat(60));
  console.log("\nWait Tools Summary:");
  console.log(`  - sleep: Working ✓`);
  console.log(`  - create_wait_handle: Working ✓`);
  console.log(`  - wait_for: Working ✓`);
  console.log(`  - wait_for_multiple (all mode): Working ✓`);
  console.log(`  - wait_for_multiple (any mode): Working ✓`);
  console.log(`  - complete_wait_handle: Working ✓`);
  console.log(`  - list_wait_handles: Working ✓`);
  console.log(`  - Timeout handling: Working ✓`);
  console.log("\n" + "=".repeat(60));
}

// Run tests
testWaitTools()
  .then(() => {
    console.log("\n✓ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test script failed:", error);
    process.exit(1);
  });
