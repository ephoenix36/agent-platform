/**
 * Standard Hooks Usage Examples
 * 
 * This example demonstrates how to use the pre-built standard hooks
 * for logging, metrics, validation, authentication, and instrumentation.
 */

import { 
  LoggingHook, 
  MetricsHook, 
  ValidationHook, 
  AuthHook,
  ToolInstrumentor 
} from '../src/hooks/standard-hooks.js';
import { initializeGlobalHooks } from '../src/utils/hooked-registry.js';

async function main() {
  console.log('=== Standard Hooks Usage Examples ===\n');

  const hookManager = initializeGlobalHooks();

  // Example 1: LoggingHook
  console.log('1. LoggingHook Example');
  console.log('------------------------');

  const loggingHook = new LoggingHook({
    level: 'info',
    includeInput: true,
    includeOutput: true,
    includeMetadata: false,
    maxLength: 1000
  });

  hookManager.registerHook(loggingHook.getHook());

  console.log('  Executing tool with logging...');
  await hookManager.executeHooks('tool:before', {
    event: 'tool:before',
    toolName: 'execute_agent',
    input: { agentId: 'agent-1', prompt: 'Hello, AI!' },
    metadata: { userId: 'user-123' }
  });

  await hookManager.executeHooks('tool:after', {
    event: 'tool:after',
    toolName: 'execute_agent',
    input: { agentId: 'agent-1', prompt: 'Hello, AI!' },
    output: { response: 'Hello! How can I help you?' },
    metadata: { userId: 'user-123' },
    duration: 1250
  });

  console.log();

  // Example 2: MetricsHook
  console.log('2. MetricsHook Example');
  console.log('------------------------');

  hookManager.clearAll();
  
  const metricsHook = new MetricsHook();
  hookManager.registerHook(metricsHook.getHook());

  // Simulate tool executions
  console.log('  Simulating 10 tool executions...');
  for (let i = 0; i < 10; i++) {
    const toolName = i % 2 === 0 ? 'execute_agent' : 'create_task';
    
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName,
      input: { id: `item-${i}` },
      metadata: {}
    });

    // Simulate processing
    const duration = Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, 10));

    await hookManager.executeHooks('tool:after', {
      event: 'tool:after',
      toolName,
      input: { id: `item-${i}` },
      output: { success: true },
      metadata: {},
      duration
    });
  }

  const metrics = metricsHook.getMetrics();
  console.log('  Total executions:', metrics.totalExecutions);
  console.log('  Average duration:', metrics.avgDuration.toFixed(2), 'ms');
  console.log('  Success rate:', (metrics.successRate * 100).toFixed(1), '%');
  console.log();
  console.log('  By tool:');
  for (const [toolName, toolMetrics] of Object.entries(metrics.byTool)) {
    console.log(`    ${toolName}:`);
    console.log(`      Count: ${toolMetrics.count}`);
    console.log(`      Avg duration: ${toolMetrics.avgDuration.toFixed(2)}ms`);
  }

  console.log();

  // Example 3: ValidationHook
  console.log('3. ValidationHook Example');
  console.log('---------------------------');

  hookManager.clearAll();

  const validationHook = new ValidationHook({
    rules: [
      {
        toolName: 'execute_agent',
        validator: (input) => {
          if (!input.agentId) {
            throw new Error('agentId is required');
          }
          if (!input.prompt) {
            throw new Error('prompt is required');
          }
          if (input.prompt.length < 3) {
            throw new Error('prompt must be at least 3 characters');
          }
        }
      },
      {
        toolName: 'create_task',
        validator: (input) => {
          if (!input.taskId) {
            throw new Error('taskId is required');
          }
          if (!input.taskName) {
            throw new Error('taskName is required');
          }
        }
      }
    ]
  });

  hookManager.registerHook(validationHook.getHook());

  // Valid input
  console.log('  Testing valid input...');
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1', prompt: 'Valid prompt' },
      metadata: {}
    });
    console.log('    ✓ Validation passed');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  // Invalid input (missing prompt)
  console.log('  Testing invalid input (missing prompt)...');
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1' },
      metadata: {}
    });
    console.log('    ✓ Validation passed');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  // Invalid input (short prompt)
  console.log('  Testing invalid input (short prompt)...');
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1', prompt: 'Hi' },
      metadata: {}
    });
    console.log('    ✓ Validation passed');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  console.log();

  // Example 4: AuthHook
  console.log('4. AuthHook Example');
  console.log('---------------------');

  hookManager.clearAll();

  // Mock user database
  const users = new Map([
    ['token-admin', { id: 'user-1', roles: ['admin', 'user'] }],
    ['token-user', { id: 'user-2', roles: ['user'] }]
  ]);

  const authHook = new AuthHook({
    authenticator: async (context) => {
      const token = context.metadata?.authToken;
      if (!token) {
        throw new Error('Authentication required');
      }

      const user = users.get(token as string);
      if (!user) {
        throw new Error('Invalid token');
      }

      return { userId: user.id, roles: user.roles };
    },
    authorizer: async (context, authContext) => {
      // Admin-only tools
      const adminTools = ['configure_agent', 'create_workflow'];
      
      if (adminTools.includes(context.toolName)) {
        if (!authContext.roles.includes('admin')) {
          throw new Error('Admin access required');
        }
      }
    },
    exemptTools: ['list_models'] // Public tools
  });

  hookManager.registerHook(authHook.getHook());

  // Admin access
  console.log('  Testing admin access to configure_agent...');
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'configure_agent',
      input: { agentId: 'agent-1', config: {} },
      metadata: { authToken: 'token-admin' }
    });
    console.log('    ✓ Access granted');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  // User access (should fail)
  console.log('  Testing user access to configure_agent...');
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'configure_agent',
      input: { agentId: 'agent-1', config: {} },
      metadata: { authToken: 'token-user' }
    });
    console.log('    ✓ Access granted');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  // No token (should fail)
  console.log('  Testing no token...');
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1', prompt: 'Test' },
      metadata: {}
    });
    console.log('    ✓ Access granted');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  // Exempt tool (no auth required)
  console.log('  Testing exempt tool (list_models)...');
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'list_models',
      input: {},
      metadata: {}
    });
    console.log('    ✓ Access granted (no auth required)');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  console.log();

  // Example 5: ToolInstrumentor (All-in-one)
  console.log('5. ToolInstrumentor Example');
  console.log('-----------------------------');

  hookManager.clearAll();

  const instrumentor = new ToolInstrumentor({
    enableLogging: true,
    enableMetrics: true,
    enableValidation: true,
    customHooks: [
      {
        id: 'rate-limit',
        event: 'tool:before',
        priority: 5,
        handler: async (context) => {
          const userId = context.metadata?.userId as string;
          
          // Mock rate limit check
          if (userId === 'user-spam') {
            throw new Error('Rate limit exceeded');
          }
          
          console.log('    ✓ Rate limit check passed');
          return { success: true };
        }
      }
    ]
  });

  // This registers all standard hooks + custom hooks
  instrumentor.instrumentAll();

  console.log('  All hooks registered. Executing tool...');
  
  try {
    await hookManager.executeHooks('tool:before', {
      event: 'tool:before',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1', prompt: 'Test with all hooks' },
      metadata: { userId: 'user-123' }
    });

    await hookManager.executeHooks('tool:after', {
      event: 'tool:after',
      toolName: 'execute_agent',
      input: { agentId: 'agent-1', prompt: 'Test with all hooks' },
      output: { response: 'Success!' },
      metadata: { userId: 'user-123' },
      duration: 500
    });

    const instrMetrics = instrumentor.getMetrics();
    console.log('  Instrumentor metrics:');
    console.log('    Total executions:', instrMetrics.totalExecutions);
    console.log('    Success rate:', (instrMetrics.successRate * 100).toFixed(1), '%');
  } catch (error: any) {
    console.log('    ✗ Error:', error.message);
  }

  console.log();

  // Summary
  console.log('=== Summary ===');
  console.log('Standard hooks demonstrated:');
  console.log('  1. LoggingHook - Automatic execution logging');
  console.log('  2. MetricsHook - Performance and usage metrics');
  console.log('  3. ValidationHook - Input validation rules');
  console.log('  4. AuthHook - Authentication and authorization');
  console.log('  5. ToolInstrumentor - All-in-one instrumentation');
  console.log();
  console.log('All standard hooks are:');
  console.log('  • Production-ready');
  console.log('  • Configurable');
  console.log('  • Type-safe');
  console.log('  • Fault-tolerant');
  console.log('  • Zero-overhead when not registered');
}

// Run the demo
main().catch(console.error);
