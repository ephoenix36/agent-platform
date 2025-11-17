/**
 * Complete Optimization Workflow Example
 * 
 * This example demonstrates a complete end-to-end optimization workflow
 * combining all advanced features: hooks, sampling, optimization, telemetry,
 * and workflow execution.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { OptimizationService } from '../src/services/OptimizationService.js';
import { SamplingClient } from '../src/services/SamplingClient.js';
import { TelemetryBridge } from '../src/telemetry/TelemetryBridge.js';
import { WorkflowOptimizer } from '../src/workflow/WorkflowOptimizer.js';
import { MetricsHook } from '../src/hooks/standard-hooks.js';
import { initializeGlobalHooks } from '../src/utils/hooked-registry.js';

async function main() {
  console.log('=== Complete Optimization Workflow ===\n');

  // Step 1: Initialize all services
  console.log('1. Initializing Services');
  console.log('---------------------------');

  // Create MCP server
  const server = new Server(
    { name: 'optimization-workflow', version: '1.0.0' },
    { capabilities: { sampling: {} } }
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('  ✓ MCP server initialized');

  // Initialize hook system
  const hookManager = initializeGlobalHooks();
  console.log('  ✓ Hook manager initialized');

  // Create sampling client
  const samplingClient = new SamplingClient(server);
  console.log('  ✓ Sampling client created');

  // Create optimization service
  const optimizationService = new OptimizationService({
    populationSize: 20,
    generations: 5,
    mutationRate: 0.1
  });
  console.log('  ✓ Optimization service created');

  // Create workflow optimizer
  const workflowOptimizer = new WorkflowOptimizer(hookManager);
  console.log('  ✓ Workflow optimizer created');

  // Setup telemetry bridge
  const telemetryBridge = new TelemetryBridge(optimizationService, {
    enabled: true
  });
  console.log('  ✓ Telemetry bridge configured');

  console.log();

  // Step 2: Register hooks for monitoring
  console.log('2. Registering Monitoring Hooks');
  console.log('----------------------------------');

  const metricsHook = new MetricsHook();
  hookManager.registerHook(metricsHook.getHook());
  console.log('  ✓ Metrics hook registered');

  hookManager.registerHook({
    id: 'workflow-tracker',
    event: 'workflow:before',
    priority: 10,
    handler: async (context) => {
      console.log(`  → Starting workflow: ${context.workflowId}`);
      return { success: true };
    }
  });

  hookManager.registerHook({
    id: 'workflow-completion',
    event: 'workflow:after',
    priority: 10,
    handler: async (context) => {
      console.log(`  → Completed workflow: ${context.workflowId} (${context.duration}ms)`);
      return { success: true };
    }
  });
  console.log('  ✓ Workflow hooks registered');

  console.log();

  // Step 3: Define optimization problem
  console.log('3. Defining Optimization Problem');
  console.log('-----------------------------------');

  // Problem: Optimize agent parameters (temperature, maxTokens) to minimize response time
  // while maintaining quality threshold
  
  const agentConfig = {
    id: 'content-generator',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful content generator',
    temperature: 0.7, // Will be optimized
    maxTokens: 500    // Will be optimized
  };

  console.log('  Agent to optimize:', agentConfig.id);
  console.log('  Parameters to optimize: temperature, maxTokens');
  console.log();

  // Step 4: Create evaluation workflow
  console.log('4. Creating Evaluation Workflow');
  console.log('----------------------------------');

  const evaluationWorkflow = {
    id: 'content-eval-workflow',
    name: 'Content Quality Evaluation',
    steps: [
      {
        id: 'generate',
        name: 'Generate Content',
        type: 'agent' as const,
        config: {
          agentId: agentConfig.id,
          prompt: 'Write a short product description'
        }
      },
      {
        id: 'evaluate',
        name: 'Evaluate Quality',
        type: 'transform' as const,
        config: {
          operation: 'quality-check'
        }
      }
    ]
  };

  console.log('  ✓ Workflow defined with', evaluationWorkflow.steps.length, 'steps');
  console.log();

  // Step 5: Define evaluator function
  console.log('5. Defining Evaluator Function');
  console.log('----------------------------------');

  const evaluator = async (genome: number[]) => {
    const [temperature, maxTokens] = genome;
    
    console.log(`  Testing: temp=${temperature.toFixed(2)}, tokens=${Math.round(maxTokens)}`);

    // Update agent config
    const testConfig = {
      ...agentConfig,
      temperature,
      maxTokens: Math.round(maxTokens)
    };

    try {
      // Simulate workflow execution
      const startTime = Date.now();
      
      // In a real scenario, this would execute the actual workflow
      // For demo, we'll simulate with a mock evaluation
      const simulatedDuration = 1000 + (temperature * 500) + (maxTokens / 10);
      const qualityScore = Math.max(0, 1 - Math.abs(temperature - 0.5)) * 0.8 + 
                          (maxTokens > 300 && maxTokens < 700 ? 0.2 : 0);
      
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work

      const duration = Date.now() - startTime;
      
      // Fitness = quality score - (duration penalty)
      // We want high quality and low duration
      const fitness = qualityScore * 100 - (simulatedDuration / 100);
      
      console.log(`    → Quality: ${qualityScore.toFixed(2)}, Duration: ${simulatedDuration.toFixed(0)}ms, Fitness: ${fitness.toFixed(2)}`);
      
      return fitness;
    } catch (error) {
      console.log('    → Evaluation failed');
      return -1000; // Heavy penalty for failures
    }
  };

  console.log('  ✓ Evaluator function created');
  console.log();

  // Step 6: Setup telemetry monitoring
  console.log('6. Setting Up Telemetry');
  console.log('-------------------------');

  let generationCount = 0;
  
  telemetryBridge.on('telemetry', (event) => {
    if (event.type === 'evosuite.optimization.start') {
      console.log('  📊 Optimization started');
    }
    if (event.type === 'evosuite.optimization.generation') {
      generationCount++;
      console.log(`  📊 Generation ${generationCount} complete`);
    }
    if (event.type === 'evosuite.optimization.complete') {
      console.log('  📊 Optimization complete');
    }
  });

  telemetryBridge.start();
  console.log('  ✓ Telemetry bridge active');
  console.log();

  // Step 7: Run optimization
  console.log('7. Running Optimization');
  console.log('-------------------------');
  console.log('  This will take a few seconds...\n');

  const optimizationStart = Date.now();
  
  try {
    const result = await optimizationService.optimize({
      evaluator,
      populationSize: 10,
      generations: 3,
      genomeDimension: 2,
      genomeRange: [
        [0.1, 1.0],    // temperature range
        [100, 1000]    // maxTokens range
      ]
    });

    const optimizationDuration = Date.now() - optimizationStart;

    console.log();
    console.log('  ✓ Optimization complete!');
    console.log();
    console.log('  Results:');
    console.log('    Original temperature:', agentConfig.temperature);
    console.log('    Optimized temperature:', result.bestIndividual[0].toFixed(3));
    console.log();
    console.log('    Original maxTokens:', agentConfig.maxTokens);
    console.log('    Optimized maxTokens:', Math.round(result.bestIndividual[1]));
    console.log();
    console.log('    Best fitness score:', result.bestScore.toFixed(2));
    console.log('    Generations run:', result.generations);
    console.log('    Total time:', (optimizationDuration / 1000).toFixed(2), 'seconds');

  } catch (error: any) {
    console.log('  ✗ Optimization failed:', error.message);
  }

  console.log();

  // Step 8: Get telemetry metrics
  console.log('8. Telemetry Metrics');
  console.log('----------------------');

  const metrics = telemetryBridge.getMetrics();
  console.log('  Total sessions:', metrics.totalSessions);
  console.log('  Total events:', metrics.totalEvents);
  console.log('  Event types:');
  for (const [type, count] of Object.entries(metrics.eventTypeDistribution)) {
    console.log(`    ${type}: ${count}`);
  }

  if (metrics.sessions.length > 0) {
    const session = metrics.sessions[0];
    console.log('  Session duration:', session.duration, 'ms');
  }

  console.log();

  // Step 9: Get hook metrics
  console.log('9. Hook Execution Metrics');
  console.log('---------------------------');

  const hookMetrics = metricsHook.getMetrics();
  console.log('  Total tool executions:', hookMetrics.totalExecutions);
  console.log('  Average duration:', hookMetrics.avgDuration.toFixed(2), 'ms');
  console.log('  Success rate:', (hookMetrics.successRate * 100).toFixed(1), '%');

  if (Object.keys(hookMetrics.byTool).length > 0) {
    console.log('  By tool:');
    for (const [tool, toolMetrics] of Object.entries(hookMetrics.byTool)) {
      console.log(`    ${tool}: ${toolMetrics.count} calls, ${toolMetrics.avgDuration.toFixed(2)}ms avg`);
    }
  }

  console.log();

  // Summary
  console.log('=== Workflow Summary ===');
  console.log();
  console.log('This example demonstrated:');
  console.log('  1. Complete service initialization (MCP, hooks, sampling, optimization)');
  console.log('  2. Hook registration for monitoring and telemetry');
  console.log('  3. Optimization problem definition (agent parameter tuning)');
  console.log('  4. Workflow-based evaluation');
  console.log('  5. Custom evaluator function');
  console.log('  6. Real-time telemetry monitoring');
  console.log('  7. Evolutionary optimization execution');
  console.log('  8. Comprehensive metrics collection');
  console.log('  9. Performance analytics');
  console.log();
  console.log('Key integrations:');
  console.log('  • Hooks → Workflow tracking and metrics');
  console.log('  • Sampling → Agent execution');
  console.log('  • Optimization → Parameter tuning via evolution');
  console.log('  • Telemetry → Event monitoring and observability');
  console.log('  • Workflow → Multi-step evaluation pipeline');
  console.log();
  console.log('Production use cases:');
  console.log('  • Optimize LLM parameters for cost/quality tradeoffs');
  console.log('  • Tune agent configurations for specific tasks');
  console.log('  • A/B test different prompt strategies');
  console.log('  • Monitor and improve workflow performance');
  console.log('  • Track system health with telemetry');

  // Cleanup
  telemetryBridge.stop();
}

// Run the workflow
main().catch(console.error);
