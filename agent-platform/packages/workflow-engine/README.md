# Workflow Engine - Developer Guide

## Quick Start

### Installation

```bash
cd packages/workflow-engine
npm install
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Building

```bash
npm run build         # Compile TypeScript
```

---

## Basic Usage

### 1. Create a Workflow

```typescript
import { Workflow, WorkflowExecutor } from '@agent-platform/workflow-engine';

const workflow: Workflow = {
  id: 'my-first-workflow',
  name: 'Data Processing Pipeline',
  description: 'Transform and analyze data',
  nodes: [
    {
      id: 'input',
      type: 'start',
      position: { x: 0, y: 0 },
      config: { data: { message: 'Hello' } },
      inputs: [],
      outputs: ['transform']
    },
    {
      id: 'transform',
      type: 'transform',
      position: { x: 200, y: 0 },
      config: { operation: 'uppercase' },
      inputs: ['input'],
      outputs: ['output']
    },
    {
      id: 'output',
      type: 'passthrough',
      position: { x: 400, y: 0 },
      config: {},
      inputs: ['transform'],
      outputs: []
    }
  ],
  connections: [
    { id: 'c1', source: 'input', target: 'transform' },
    { id: 'c2', source: 'transform', target: 'output' }
  ],
  settings: {
    timeout: 30000,
    retryOnFailure: true,
    maxRetries: 3
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'developer@example.com'
  }
};
```

### 2. Execute the Workflow

```typescript
const executor = new WorkflowExecutor();

const result = await executor.execute(workflow);

console.log('Status:', result.status);           // 'completed'
console.log('Results:', result.nodeResults);     // { input: ..., transform: ..., output: ... }
console.log('Duration:', result.executionTimeMs); // e.g., 125
```

### 3. Monitor Execution

```typescript
// Start execution
const executionPromise = executor.execute(workflow);

// Check state during execution
const state = executor.getState();
console.log('Status:', state.status);           // 'running'
console.log('Progress:', state.progress);       // 0-100
console.log('Current Node:', state.currentNode); // 'transform'

// Wait for completion
const result = await executionPromise;
```

### 4. Handle Errors

```typescript
try {
  const result = await executor.execute(workflow);
  
  if (result.status === 'failed') {
    console.error('Workflow failed:', result.error);
  } else {
    console.log('Success!');
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### 5. Cancel Execution

```typescript
const executionPromise = executor.execute(longRunningWorkflow);

// Cancel after 5 seconds
setTimeout(() => {
  executor.cancel();
  console.log('Workflow cancelled');
}, 5000);

const result = await executionPromise;
console.log(result.status); // 'cancelled'
```

---

## Creating Custom Nodes

### Basic Custom Node

```typescript
// Register a custom node type
executor.registerNodeExecutor('email-sender', async (node, context) => {
  const { to, subject, body } = node.config;
  
  // Send email (mock)
  console.log(`Sending email to ${to}`);
  
  return {
    sent: true,
    messageId: 'msg-123',
    timestamp: new Date().toISOString()
  };
});
```

### Node with Input Processing

```typescript
executor.registerNodeExecutor('data-filter', async (node, context) => {
  // Get input from previous node
  const inputNodeId = node.inputs[0];
  const inputData = context.nodeResults[inputNodeId];
  
  // Filter data based on config
  const { field, operator, value } = node.config;
  
  const filtered = inputData.filter(item => {
    if (operator === 'equals') return item[field] === value;
    if (operator === 'contains') return item[field].includes(value);
    return true;
  });
  
  return filtered;
});
```

### Async Node with API Call

```typescript
executor.registerNodeExecutor('api-caller', async (node, context) => {
  const { url, method, headers, body } = node.config;
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  const data = await response.json();
  
  return {
    status: response.status,
    data
  };
});
```

### Node with Error Handling

```typescript
executor.registerNodeExecutor('safe-processor', async (node, context) => {
  try {
    // Potentially failing operation
    const result = riskyOperation(node.config);
    return { success: true, result };
  } catch (error) {
    // Handle error gracefully
    if (node.config.continueOnError) {
      return { success: false, error: error.message };
    } else {
      throw error; // Re-throw to fail workflow
    }
  }
});
```

---

## Built-in Node Types

### 1. Start Node
```typescript
{
  type: 'start',
  config: {
    value: any  // Output value
  }
}
```

### 2. Transform Node
```typescript
{
  type: 'transform',
  config: {
    operation: 'uppercase' | 'lowercase' | 'trim'
  }
}
```

### 3. Delay Node
```typescript
{
  type: 'delay',
  config: {
    ms: number  // Milliseconds to delay
  }
}
```

### 4. Logger Node
```typescript
{
  type: 'logger',
  config: {
    logTo: any[],    // Array to log to
    value: any       // Value to log
  }
}
```

### 5. Passthrough Node
```typescript
{
  type: 'passthrough',
  config: {}  // Simply passes input to output
}
```

### 6. Error Node (for testing)
```typescript
{
  type: 'error',
  config: {
    throwError: boolean,
    errorMessage?: string
  }
}
```

---

## Advanced Patterns

### Parallel Execution

```typescript
// Nodes with no dependencies execute in parallel
const workflow: Workflow = {
  nodes: [
    { id: 'start', type: 'start', outputs: ['task1', 'task2', 'task3'] },
    { id: 'task1', type: 'processor', inputs: ['start'], outputs: ['merge'] },
    { id: 'task2', type: 'processor', inputs: ['start'], outputs: ['merge'] },
    { id: 'task3', type: 'processor', inputs: ['start'], outputs: ['merge'] },
    { id: 'merge', type: 'merger', inputs: ['task1', 'task2', 'task3'] }
  ],
  connections: [
    { source: 'start', target: 'task1' },
    { source: 'start', target: 'task2' },
    { source: 'start', target: 'task3' },
    { source: 'task1', target: 'merge' },
    { source: 'task2', target: 'merge' },
    { source: 'task3', target: 'merge' }
  ]
};
// task1, task2, task3 run in parallel!
```

### Diamond Pattern

```typescript
// Process -> Split -> Process A & B in parallel -> Merge
const workflow: Workflow = {
  nodes: [
    { id: 'input', outputs: ['processA', 'processB'] },
    { id: 'processA', inputs: ['input'], outputs: ['merge'] },
    { id: 'processB', inputs: ['input'], outputs: ['merge'] },
    { id: 'merge', inputs: ['processA', 'processB'] }
  ]
};
```

### Error Recovery

```typescript
executor.registerNodeExecutor('resilient-api', async (node, context) => {
  const maxRetries = node.config.maxRetries || 3;
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callAPI(node.config.url);
    } catch (error) {
      lastError = error;
      await delay(1000 * Math.pow(2, attempt)); // Exponential backoff
    }
  }
  
  throw lastError;
});
```

---

## Type Definitions

### Workflow

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: WorkflowSettings;
  metadata: WorkflowMetadata;
  status?: WorkflowStatus;
  startedAt?: string;
  completedAt?: string;
}
```

### WorkflowNode

```typescript
interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
  status?: NodeStatus;
  result?: any;
  error?: string;
}
```

### ExecutionContext

```typescript
interface ExecutionContext {
  workflowId: string;
  executionId: string;
  nodeResults: Record<string, any>;
  variables: Record<string, any>;
  startTime: Date;
  timeout?: number;
  cancelled: boolean;
}
```

---

## Testing Your Nodes

```typescript
import { WorkflowExecutor } from '@agent-platform/workflow-engine';

describe('Custom Email Node', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
    
    // Register your custom node
    executor.registerNodeExecutor('email', async (node, context) => {
      // Your implementation
    });
  });

  it('should send email successfully', async () => {
    const workflow = {
      id: 'test-workflow',
      nodes: [
        {
          id: 'email-node',
          type: 'email',
          config: {
            to: 'user@example.com',
            subject: 'Test',
            body: 'Hello'
          }
        }
      ],
      connections: []
    };

    const result = await executor.execute(workflow);

    expect(result.status).toBe('completed');
    expect(result.nodeResults['email-node'].sent).toBe(true);
  });
});
```

---

## Performance Tips

1. **Keep node execution fast** - Use async I/O, avoid blocking
2. **Leverage parallelization** - Structure workflows with independent branches
3. **Use caching** - Store results in context.variables for reuse
4. **Implement timeouts** - Prevent hanging operations
5. **Monitor state** - Use `getState()` for progress tracking

---

## Troubleshooting

### Workflow doesn't execute
- Check for circular dependencies (will throw error)
- Verify all node IDs in connections exist
- Ensure all required config fields are provided

### Node always fails
- Check error message in result.error
- Verify node executor is registered
- Add try-catch in your node executor

### Can't cancel workflow
- Ensure long-running operations check `context.cancelled`
- Use interruptible operations (check cancellation in loops)

---

## Next Steps

1. Review `WORKFLOW_ENGINE_STATUS.md` for roadmap
2. Check `AssumptionJournal_Workflows.md` for architectural decisions
3. See `DevelopmentJournal_Workflows.md` for implementation details
4. Explore upcoming widget-bridge and extension-system packages

---

## Questions?

See the comprehensive documentation in:
- `/docs/workflow-system/` (coming soon)
- `/docs/architecture/workflow-engine.md` (coming soon)

Or check the test suite for more examples:
- `tests/executor.test.ts`
- `tests/types.test.ts`
