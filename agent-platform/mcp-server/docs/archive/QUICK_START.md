# 🚀 Quick Start Guide - Integrated Agent Platform

## Get Started in 5 Minutes

### 1. Start the Server

```powershell
cd C:\Users\ephoe\Documents\Coding_Projects\Agents\agent-platform\mcp-server
pnpm build
pnpm start
```

You should see:
```
✓ Hook system initialized
✓ Tool registry initialized
✓ Toolkit manager initialized
✓ 6/6 toolkits loaded
✓ 50+ tools available
✓ Tool registry: 50+ tools registered
✅ Agent Platform MCP Server v2.1 started successfully
```

---

## 🎯 Common Use Cases

### Use Case 1: Agent with Tool Access

```typescript
import { performSampling } from './services/sampling-service.js';

const result = await performSampling({
  messages: [
    { role: "user", content: "Create 3 tasks for our sprint planning" }
  ],
  model: "gpt-4",
  enabledTools: [
    "create_task",
    "update_task_status",
    "list_tasks"
  ],
  toolChoice: "auto"
});

console.log(result.content);
// Agent autonomously creates tasks using MCP tools!
```

**What happens:**
1. Agent receives your request
2. Sees available tools (create_task, etc.)
3. Decides which tools to use
4. Executes tools to create tasks
5. Returns structured results

---

### Use Case 2: Execute an Optimized Workflow

```typescript
import { EnhancedWorkflowEngine } from './services/EnhancedWorkflowEngine.js';

const engine = new EnhancedWorkflowEngine(
  hookManager,
  telemetryBridge,
  optimizer,
  logger
);

const result = await engine.executeWorkflow({
  id: 'sprint-setup',
  name: 'Sprint Planning Workflow',
  steps: [
    {
      id: 'create-backlog',
      type: 'agent',
      config: {
        agentId: 'backlog-manager',
        systemPrompt: 'Analyze requirements and create backlog items'
      },
      retryPolicy: { maxAttempts: 3, backoffMs: 1000 }
    },
    {
      id: 'estimate-tasks',
      type: 'agent',
      config: {
        agentId: 'estimator',
        systemPrompt: 'Provide story point estimates'
      }
    },
    {
      id: 'create-tasks',
      type: 'agent',
      config: {
        agentId: 'task-creator',
        systemPrompt: 'Create tasks in project management system'
      },
      onError: 'notify-team'  // Jump to error handler if fails
    }
  ],
  optimization: {
    enabled: true,
    objectives: ['minimize_duration', 'maximize_quality']
  }
});

// Check optimization suggestions
if (result.optimizationSuggestions?.length > 0) {
  console.log('💡 Suggestions:', result.optimizationSuggestions);
}
```

**What happens:**
1. Workflow executes each step in order
2. Full telemetry captured (timing, success/failure)
3. Errors automatically retried
4. Hooks execute before/after each step
5. Optimization analysis runs
6. Suggestions generated for improvement

---

### Use Case 3: Evolutionary Optimization

```typescript
import { EvoSuiteWorkflowOptimizer } from './services/EvoSuiteWorkflowOptimizer.js';

const evoOptimizer = new EvoSuiteWorkflowOptimizer(logger, telemetryBridge);

// Register evaluators
evoOptimizer.registerEvaluator({
  id: 'speed',
  name: 'Speed Evaluator',
  evaluate: async (result) => ({
    speed_score: 1.0 - (result.duration / 10000)  // Normalize
  })
});

evoOptimizer.registerEvaluator({
  id: 'quality',
  name: 'Quality Evaluator',
  evaluate: async (result) => ({
    quality_score: calculateQuality(result.steps)
  })
});

// Run evolution
const optimized = await evoOptimizer.optimize(baseWorkflow, {
  populationSize: 20,
  maxGenerations: 50,
  mutationRate: 0.1,
  crossoverRate: 0.7,
  eliteCount: 3,
  objectives: {
    minimize_duration: 3000,
    maximize_quality: 0.95
  },
  evaluators: ['speed', 'quality']
});

// Get best solutions (Pareto front)
console.log(`Found ${optimized.bestAssets.length} optimal workflows`);
for (const asset of optimized.bestAssets) {
  console.log('Fitness:', asset.fitness);
  console.log('Genome:', asset.genome);
}
```

**What happens:**
1. Creates population of workflow variations
2. Evaluates each with custom evaluators
3. Evolves through generations (mutation + crossover)
4. Tracks fitness across multiple objectives
5. Converges to Pareto-optimal solutions
6. Returns best trade-offs between speed and quality

---

## 🔧 Essential Commands

### Tool Access

```typescript
import { getToolRegistry } from './services/tool-registry.js';

const registry = getToolRegistry();

// List all tools
const allTools = registry.getAllTools();
console.log(`${allTools.length} tools available`);

// Get tools in OpenAI format
const openAITools = registry.getToolsForOpenAI(['create_task', 'update_task_status']);

// Execute a tool
const result = await registry.executeTool('create_task', {
  taskId: 'TASK-1',
  taskName: 'Implement feature X',
  status: 'in-progress'
});
```

### Telemetry

```typescript
import { TelemetryBridge } from './telemetry/TelemetryBridge.js';

// TelemetryBridge auto-listens to events
const telemetry = new TelemetryBridge(eventEmitter, { enabled: true });
telemetry.start();

// Get metrics
const metrics = telemetry.getMetrics();
console.log('Counters:', metrics.counters);
console.log('Gauges:', metrics.gauges);
console.log('Histograms:', metrics.histograms);
```

### Hooks

```typescript
import { HookManager } from './hooks/HookManager.js';

const hookManager = new HookManager();

// Register a hook
hookManager.registerHook({
  id: 'my-validator',
  event: 'workflow:before',
  priority: 90,
  type: 'validation',
  handler: async (context) => {
    // Validate workflow
    if (!context.input.steps || context.input.steps.length === 0) {
      throw new Error('Workflow must have steps');
    }
    return { continue: true };
  }
});

// Execute hooks
await hookManager.executeHooks('workflow:before', {
  event: 'workflow:before',
  input: workflowConfig,
  metadata: {}
});
```

---

## 📊 Monitoring

### Check System Health

```typescript
// Get workflow optimizer stats
const optimizerStats = optimizer.getStats();
console.log('Active workflows:', optimizerStats.activeWorkflows);
console.log('Execution history:', optimizerStats.executionHistory.length);

// Get engine stats
const engineStats = engine.getStatistics();
console.log('Active executions:', engineStats.activeExecutions);
console.log('Registered evaluators:', engineStats.registeredEvaluators);

// Get telemetry metrics
const metrics = telemetryBridge.getMetrics();
console.log('Total events:', Object.keys(metrics.counters).length);
```

### View Optimization History

```typescript
const history = optimizer.getExecutionHistory();
for (const execution of history) {
  console.log(`Workflow: ${execution.workflowId}`);
  console.log(`Duration: ${execution.duration}ms`);
  console.log(`Steps: ${execution.steps.length}`);
  console.log(`Errors: ${execution.errors.length}`);
}
```

---

## 🎓 Advanced Patterns

### Pattern 1: Conditional Workflow

```typescript
const workflow = {
  id: 'conditional',
  name: 'Smart Workflow',
  steps: [
    {
      id: 'validate',
      type: 'agent',
      config: { agentId: 'validator' },
      onSuccess: 'process',
      onError: 'fix-errors'
    },
    {
      id: 'fix-errors',
      type: 'agent',
      config: { agentId: 'error-fixer' },
      onSuccess: 'validate'  // Retry validation
    },
    {
      id: 'process',
      type: 'agent',
      config: { agentId: 'processor' },
      skipIf: 'context.variables.skipProcessing === true'
    }
  ]
};
```

### Pattern 2: Custom Mutation

```typescript
evoOptimizer.registerMutation({
  id: 'custom',
  name: 'Custom Mutation',
  category: 'hybrid',
  weight: 1.0,
  mutate: async (asset) => {
    const mutated = JSON.parse(JSON.stringify(asset));
    
    // Your custom logic
    for (const step of mutated.genome.steps) {
      if (step.type === 'agent') {
        // Modify agent configuration
        step.config.temperature *= 1.1;
      }
    }
    
    mutated.id = `mutated_${Date.now()}`;
    mutated.generation = asset.generation + 1;
    return mutated;
  }
});
```

### Pattern 3: Multi-Evaluator

```typescript
const evaluators = [
  {
    id: 'speed',
    evaluate: async (r) => ({ speed: 1.0 - (r.duration / 10000) })
  },
  {
    id: 'cost',
    evaluate: async (r) => ({ cost: 1.0 - (countTokens(r) / 1000) })
  },
  {
    id: 'quality',
    evaluate: async (r) => ({ quality: analyzeQuality(r) })
  },
  {
    id: 'reliability',
    evaluate: async (r) => ({ reliability: r.status === 'completed' ? 1.0 : 0.0 })
  }
];

for (const evaluator of evaluators) {
  evoOptimizer.registerEvaluator(evaluator);
}
```

---

## 🐛 Troubleshooting

### Problem: Tools not available to agent

**Solution:**
```typescript
// Check tool registry
const registry = getToolRegistry();
const stats = registry.getStats();
console.log(`${stats.totalTools} tools registered`);

// Verify tools in sampling
const result = await performSampling({
  enabledTools: ["create_task"],  // ✅ Explicitly list tools
  // ...
});
```

### Problem: Workflow not executing

**Solution:**
```typescript
// Check workflow definition
console.log('Steps:', workflow.steps.length);

// Verify step executors registered
const stats = engine.getStatistics();
console.log('Step types:', stats.registeredStepTypes);

// Enable debug logging
logger.level = 'debug';
```

### Problem: Optimization not converging

**Solution:**
```typescript
// Increase population size
config.populationSize = 50;  // Was 20

// Increase mutation rate
config.mutationRate = 0.2;  // Was 0.1

// Add more evaluators
// More objectives = better search space coverage
```

---

## 📚 Next Steps

1. **Read Full Docs:**
   - `TOOL_ACCESS_COMPLETE.md` - Tool system
   - `WORKFLOW_ENGINE_INTEGRATION.md` - Workflow details
   - `ARCHITECTURE_DIAGRAMS.md` - System architecture

2. **Explore Examples:**
   - Tool access examples
   - Workflow patterns
   - Optimization strategies

3. **Customize:**
   - Add custom evaluators
   - Register mutation strategies
   - Create workflow templates

4. **Monitor:**
   - Set up telemetry dashboard
   - Track performance metrics
   - Analyze optimization results

---

## 🎉 You're Ready!

The system is fully integrated and production-ready. Start building amazing agent workflows!

**Key Features Available:**
- ✅ 50+ tools for agents
- ✅ 4 AI providers
- ✅ Full telemetry
- ✅ Hook system
- ✅ Evolutionary optimization
- ✅ Multi-objective evaluation
- ✅ Error resilience
- ✅ Async execution

**Happy building! 🚀**
