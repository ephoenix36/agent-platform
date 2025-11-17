/**
 * Hook System Demonstration
 * 
 * This example shows how to use the hook system to enhance tool execution
 * with validation, logging, metrics, and custom logic.
 */

import { HookManager } from '../src/hooks/index.js';
import { 
  LoggingHook, 
  MetricsHook, 
  ValidationHook 
} from '../src/hooks/standard-hooks.js';
import { initializeGlobalHooks } from '../src/utils/hooked-registry.js';

async function main() {
  console.log('=== Hook System Demo ===\n');

  // Initialize global hook manager
  const hookManager = initializeGlobalHooks();

  // Example 1: Basic validation hook
  console.log('1. Validation Hook Example');
  console.log('----------------------------');
  
  hookManager.registerHook({
    id: 'validate-user-input',
    event: 'tool:before',
    priority: 10,
    type: 'validation',
    handler: async (context) => {
      console.log(`  Validating input for ${context.toolName}...`);
      
      if (context.toolName === 'execute_agent') {
        if (!context.input.agentId) {
          throw new Error('agentId is required');
        }
        if (!context.input.prompt) {
          throw new Error('prompt is required');
        }
      }
      
      console.log('  ✓ Validation passed');
      return { success: true };
    }
  });

  // Simulate tool execution
  await hookManager.executeHooks('tool:before', {
    event: 'tool:before',
    toolName: 'execute_agent',
    input: { agentId: 'agent-1', prompt: 'Hello!' },
    metadata: {}
  });

  console.log();

  // Example 2: Transform hook (add timestamp)
  console.log('2. Transform Hook Example');
  console.log('---------------------------');

  hookManager.registerHook({
    id: 'add-timestamp',
    event: 'tool:before',
    priority: 20,
    type: 'transform',
    handler: async (context) => {
      console.log('  Adding timestamp to input...');
      
      return {
        success: true,
        transformedInput: {
          ...context.input,
          timestamp: new Date().toISOString()
        }
      };
    }
  });

  const transformResult = await hookManager.executeHooks('tool:before', {
    event: 'tool:before',
    toolName: 'create_task',
    input: { taskId: 'task-1', taskName: 'My Task' },
    metadata: {}
  });

  console.log('  Transformed input:', transformResult.context.input);
  console.log();

  // Example 3: Metrics hook
  console.log('3. Metrics Hook Example');
  console.log('-------------------------');

  const metricsHook = new MetricsHook();
  hookManager.registerHook(metricsHook.getHook());

  // Simulate multiple tool executions
  for (let i = 0; i < 5; i++) {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1', prompt: `Request ${i + 1}` },
      metadata: {}
    });

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    await hookManager.executeHooks('tool:after', {
      event: 'tool:after',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1', prompt: `Request ${i + 1}` },
      output: { result: `Response ${i + 1}` },
      metadata: {},
      duration: Math.random() * 1000
    });
  }

  const metrics = metricsHook.getMetrics();
  console.log('  Total executions:', metrics.totalExecutions);
  console.log('  Average duration:', metrics.avgDuration.toFixed(2), 'ms');
  console.log();

  // Example 4: Error handling hook
  console.log('4. Error Handling Hook Example');
  console.log('--------------------------------');

  hookManager.registerHook({
    id: 'error-logger',
    event: 'tool:error',
    priority: 10,
    handler: async (context) => {
      console.log(`  ✗ Error in ${context.toolName}:`, context.error?.message);
      console.log('  Input that caused error:', context.input);
      
      // You could send to error tracking service here
      // await sendToSentry(context.error);
      
      return { success: true };
    }
  });

  // Simulate error
  await hookManager.executeHooks('tool:error', {
    event: 'tool:error',
    toolName: 'api_call',
    input: { url: 'https://invalid-api.example.com', method: 'GET' },
    error: new Error('Network timeout'),
    metadata: {}
  });

  console.log();

  // Example 5: Priority ordering
  console.log('5. Priority Ordering Example');
  console.log('------------------------------');

  hookManager.registerHook({
    id: 'first',
    event: 'tool:before',
    priority: 5,
    handler: async () => {
      console.log('  → Hook 1 (priority 5)');
      return { success: true };
    }
  });

  hookManager.registerHook({
    id: 'second',
    event: 'tool:before',
    priority: 10,
    handler: async () => {
      console.log('  → Hook 2 (priority 10)');
      return { success: true };
    }
  });

  hookManager.registerHook({
    id: 'third',
    event: 'tool:before',
    priority: 15,
    handler: async () => {
      console.log('  → Hook 3 (priority 15)');
      return { success: true };
    }
  });

  await hookManager.executeHooks('tool:before', {
    event: 'tool:before',
    toolName: 'test_tool',
    input: {},
    metadata: {}
  });

  console.log();

  // Example 6: Context abortion
  console.log('6. Context Abortion Example');
  console.log('-----------------------------');

  hookManager.registerHook({
    id: 'conditional-abort',
    event: 'tool:before',
    priority: 8,
    handler: async (context) => {
      if (context.input.shouldAbort) {
        console.log('  ⚠ Aborting execution (shouldAbort=true)');
        context.abort();
      } else {
        console.log('  ✓ Execution allowed');
      }
      return { success: true };
    }
  });

  await hookManager.executeHooks('tool:before', {
    event: 'tool:before',
    toolName: 'execute_agent',
    input: { shouldAbort: false },
    metadata: {}
  });

  const abortedResult = await hookManager.executeHooks('tool:before', {
    event: 'tool:before',
    toolName: 'execute_agent',
    input: { shouldAbort: true },
    metadata: {}
  });

  console.log('  Context aborted?', abortedResult.context.isAborted);
  console.log();

  // Example 7: Logging hook
  console.log('7. Logging Hook Example');
  console.log('-------------------------');

  const loggingHook = new LoggingHook({
    level: 'info',
    includeInput: true,
    includeOutput: true
  });

  // Clear previous hooks for clean demo
  hookManager.clearAll();
  hookManager.registerHook(loggingHook.getHook());

  await hookManager.executeHooks('tool:before', {
    event: 'tool:before',
    toolName: 'create_task',
    input: { taskId: 'task-1', taskName: 'Demo Task' },
    metadata: {}
  });

  await hookManager.executeHooks('tool:after', {
    event: 'tool:after',
    toolName: 'create_task',
    input: { taskId: 'task-1', taskName: 'Demo Task' },
    output: { success: true, taskId: 'task-1' },
    metadata: {},
    duration: 45
  });

  console.log();

  // Summary
  console.log('=== Summary ===');
  console.log('This demo showed:');
  console.log('  1. Input validation hooks');
  console.log('  2. Data transformation hooks');
  console.log('  3. Performance metrics collection');
  console.log('  4. Error handling and logging');
  console.log('  5. Priority-based execution order');
  console.log('  6. Context abortion mechanism');
  console.log('  7. Standard logging hook');
  console.log();
  console.log('All hooks are:');
  console.log('  • Async-capable');
  console.log('  • Fault-tolerant (errors isolated)');
  console.log('  • Timeout-enforced (500ms default)');
  console.log('  • Zero-overhead when not registered');
}

// Run the demo
main().catch(console.error);
