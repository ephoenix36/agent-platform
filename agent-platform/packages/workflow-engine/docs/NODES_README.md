# Workflow Engine Nodes

Production-ready base classes and utilities for building custom workflow nodes with type-safe validation, lifecycle management, and event-driven execution.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [BaseNode API](#basenode-api)
- [Specialized Node Types](#specialized-node-types)
- [Examples](#examples)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Features

✅ **Type-Safe Validation** - Zod-based input/output validation with runtime type checking  
✅ **Lifecycle Management** - Initialize, execute, and cleanup hooks for resource management  
✅ **Event-Driven Architecture** - Built-in event emission for monitoring and debugging  
✅ **Generic Type Support** - Type-safe configuration with TypedBaseNode<TConfig>  
✅ **Error Handling** - Comprehensive error handling with automatic error event emission  
✅ **Specialized Base Classes** - Pre-configured classes for common patterns (triggers, actions, transforms, etc.)  
✅ **Production Ready** - Fully tested with 47+ unit tests

## Installation

```bash
npm install @agent-platform/workflow-engine
```

## Quick Start

### Creating a Simple Node

```typescript
import { z } from 'zod';
import { BaseNode, NodeDefinition, NodeExecutionContext, NodeExecutionResult } from '@agent-platform/workflow-engine';

class MyCustomNode extends BaseNode {
  // Define node metadata and schema
  protected define(): NodeDefinition {
    return {
      type: 'my-custom-node',
      displayName: 'My Custom Node',
      description: 'Does something awesome',
      category: 'utilities',
      version: '1.0.0',
      inputs: [
        {
          name: 'input1',
          displayName: 'Input 1',
          description: 'First input',
          type: 'string',
          required: true
        }
      ],
      outputs: [
        {
          name: 'result',
          displayName: 'Result',
          description: 'Output result',
          type: 'string',
          required: true
        }
      ],
      configSchema: z.object({
        option1: z.string().default('default-value')
      })
    };
  }

  // Implement execution logic
  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const input = context.inputs.input1 as string;
    const option = this.config.option1 as string;

    context.log(`Processing: ${input} with ${option}`, 'info');

    // Do work
    const result = input.toUpperCase();

    return this.success({ result });
  }
}
```

### Using the Node

```typescript
// Create node instance
const node = new MyCustomNode();

// Configure node
node.setConfig({
  option1: 'custom-value'
});

// Create execution context
const context: NodeExecutionContext = {
  nodeId: 'node-1',
  workflowId: 'workflow-123',
  executionId: 'exec-456',
  inputs: {
    input1: 'hello world'
  },
  config: {},
  metadata: {},
  log: (msg, level) => console.log(`[${level}] ${msg}`),
  emit: (event, data) => console.log(`Event: ${event}`, data),
  getVariable: (name) => null,
  setVariable: (name, value) => {}
};

// Run the node
const result = await node.run(context);
console.log(result);
// {
//   status: 'success',
//   outputs: { result: 'HELLO WORLD' },
//   metadata: undefined
// }
```

## Core Concepts

### Node Definition

Every node must define its metadata, inputs, outputs, and configuration schema:

```typescript
protected define(): NodeDefinition {
  return {
    type: 'unique-node-type',         // Unique identifier
    displayName: 'Display Name',      // UI-friendly name
    description: 'What it does',      // Description
    category: 'actions',              // Category for grouping
    icon: '🎯',                        // Optional icon
    version: '1.0.0',                 // Semantic version
    inputs: [...],                    // Input ports
    outputs: [...],                   // Output ports
    configSchema: z.object({...})     // Zod configuration schema
  };
}
```

### Node Ports

Input and output ports define the data interface:

```typescript
{
  name: 'portName',                  // Unique port identifier
  displayName: 'Port Name',          // UI-friendly name
  description: 'Port description',   // What this port is for
  type: 'string',                    // Data type: string, number, boolean, object, array, any
  required: true,                    // Whether port is required
  defaultValue: 'default',           // Optional default value
  validation: z.string().email()     // Optional Zod validator
}
```

### Execution Context

The context provides runtime information and utilities:

```typescript
interface NodeExecutionContext {
  nodeId: string;                    // Node instance ID
  workflowId: string;                // Parent workflow ID
  executionId: string;               // Execution run ID
  inputs: Record<string, any>;       // Input values
  config: Record<string, any>;       // Runtime configuration
  metadata: Record<string, any>;     // Additional metadata
  
  // Utility functions
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  emit: (event: string, data?: any) => void;
  getVariable: (name: string) => any;
  setVariable: (name: string, value: any) => void;
}
```

### Execution Result

Nodes return a standardized result:

```typescript
interface NodeExecutionResult {
  status: 'success' | 'error' | 'skipped';  // Execution status
  outputs: Record<string, any>;             // Output values
  metadata?: Record<string, any>;           // Optional metadata
  error?: Error;                            // Error if status='error'
}
```

## BaseNode API

### Lifecycle Methods

```typescript
// Called once before first execution
protected async initialize(): Promise<void>

// Hook for initialization logic
protected async onInitialize(): Promise<void>

// Called for cleanup
protected async cleanup(): Promise<void>

// Hook for cleanup logic
protected async onCleanup(): Promise<void>
```

### Execution Methods

```typescript
// Core execution logic (must implement)
protected abstract execute(context: NodeExecutionContext): Promise<NodeExecutionResult>

// Run full lifecycle with validation
async run(context: NodeExecutionContext): Promise<NodeExecutionResult>
```

### Configuration Methods

```typescript
// Set and validate configuration
setConfig(config: Record<string, any>): void

// Get current configuration
getConfig(): Record<string, any>

// Get node definition
getDefinition(): NodeDefinition
```

### Helper Methods

```typescript
// Create success result
protected success(outputs: Record<string, any>, metadata?: Record<string, any>): NodeExecutionResult

// Create error result
protected error(error: Error | string, outputs?: Record<string, any>): NodeExecutionResult

// Create skipped result
protected skip(reason: string): NodeExecutionResult
```

### Event System

Nodes emit events during execution:

```typescript
enum NodeEvent {
  EXECUTION_START = 'execution:start',      // Before execute()
  EXECUTION_COMPLETE = 'execution:complete', // After successful execute()
  EXECUTION_ERROR = 'execution:error',      // On execution error
  VALIDATION_ERROR = 'validation:error',    // On validation failure
  CONFIG_CHANGED = 'config:changed'         // When setConfig() is called
}

// Listen to events
node.on(NodeEvent.EXECUTION_START, ({ nodeId, inputs }) => {
  console.log(`Node ${nodeId} starting with`, inputs);
});

node.on(NodeEvent.EXECUTION_COMPLETE, ({ nodeId, result }) => {
  console.log(`Node ${nodeId} completed with`, result);
});
```

### Input/Output Validation

Automatic validation happens during run():

```typescript
// Input validation
protected validateInputs(inputs: Record<string, any>): void

// Output validation  
protected validateOutputs(outputs: Record<string, any>): void
```

Validation checks:
- Required ports are present
- Port types match expected types
- Custom Zod validators pass (if provided)

## Specialized Node Types

The package includes specialized base classes for common patterns:

### TriggerNode

For nodes that start workflows (webhooks, schedules, events):

```typescript
abstract class TriggerNode extends BaseNode {
  // No inputs (triggers start workflows)
  abstract startListening(): Promise<void>;
  abstract stopListening(): Promise<void>;
}
```

### ActionNode

For nodes that perform actions (HTTP requests, database operations):

```typescript
abstract class ActionNode extends BaseNode {
  // Pre-configured category='actions'
}
```

### TransformNode

For nodes that transform data:

```typescript
abstract class TransformNode extends BaseNode {
  // Pre-configured category='transforms'
}
```

### ConditionNode

For conditional branching:

```typescript
abstract class ConditionNode extends BaseNode {
  abstract evaluateCondition(context: NodeExecutionContext): Promise<boolean>;
  // Pre-configured category='conditions'
}
```

### IteratorNode

For processing arrays:

```typescript
abstract class IteratorNode extends BaseNode {
  abstract processItem(item: any, index: number, context: NodeExecutionContext): Promise<any>;
  // Includes continueOnError support
  // Pre-configured category='iterators'
}
```

### AsyncNode

For operations with retry/timeout logic:

```typescript
abstract class AsyncNode extends BaseNode {
  abstract executeAsync(context: NodeExecutionContext): Promise<NodeExecutionResult>;
  // Built-in retry logic with configurable attempts and delay
  // Timeout support
}
```

### CacheNode

For caching expensive computations:

```typescript
abstract class CacheNode extends BaseNode {
  abstract executeWithoutCache(context: NodeExecutionContext): Promise<NodeExecutionResult>;
  // Built-in TTL-based caching
  // Configurable cache key generation
  clearCache(): void;
}
```

## Examples

See `examples/example-nodes.ts` for comprehensive examples:

1. **HTTP Request Node** - Make HTTP requests with timeout
2. **JSON Transform Node** - Transform JSON data
3. **Webhook Trigger Node** - Start workflows from webhooks
4. **If/Else Condition Node** - Conditional routing
5. **Array Iterator Node** - Process array items
6. **Retry API Call Node** - API calls with retry logic
7. **Data Cache Node** - Cache expensive computations

### Type-Safe Configuration

Use `TypedBaseNode<TConfig>` for type-safe config access:

```typescript
interface MyConfig {
  apiKey: string;
  timeout?: number;
}

class TypedNode extends TypedBaseNode<MyConfig> {
  protected define(): NodeDefinition {
    return {
      type: 'typed-node',
      displayName: 'Typed Node',
      description: 'Type-safe config',
      category: 'utilities',
      version: '1.0.0',
      inputs: [],
      outputs: [],
      configSchema: z.object({
        apiKey: z.string(),
        timeout: z.number().optional()
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    // Type-safe access
    const key = this.config.apiKey;   // string
    const timeout = this.config.timeout || 5000; // number

    return this.success({});
  }
}
```

## Testing

The package includes comprehensive tests. Run them with:

```bash
npm test
```

### Test Coverage

- ✅ Node definition and metadata
- ✅ Configuration validation  
- ✅ Lifecycle management (initialize/cleanup)
- ✅ Input validation (required, types, custom validators)
- ✅ Output validation
- ✅ Execution flow (success, error, skip)
- ✅ Event emission
- ✅ Helper methods
- ✅ TypedBaseNode generic variant

### Writing Tests for Custom Nodes

```typescript
import { NodeExecutionContext } from '@agent-platform/workflow-engine';

describe('MyCustomNode', () => {
  let node: MyCustomNode;
  let context: NodeExecutionContext;

  beforeEach(() => {
    node = new MyCustomNode();
    node.setConfig({ option1: 'test-value' });

    context = {
      nodeId: 'node-1',
      workflowId: 'workflow-1',
      executionId: 'exec-1',
      inputs: { input1: 'test' },
      config: {},
      metadata: {},
      log: jest.fn(),
      emit: jest.fn(),
      getVariable: jest.fn(),
      setVariable: jest.fn()
    };
  });

  it('should execute successfully', async () => {
    const result = await node.run(context);

    expect(result.status).toBe('success');
    expect(result.outputs).toHaveProperty('result');
  });

  it('should validate inputs', async () => {
    const invalidContext = { ...context, inputs: {} };
    const result = await node.run(invalidContext);

    expect(result.status).toBe('error');
  });
});
```

## Best Practices

### 1. Define Clear Schemas

Use descriptive names and detailed descriptions:

```typescript
inputs: [
  {
    name: 'emailAddress',  // Clear, specific name
    displayName: 'Email Address',
    description: 'The recipient email address (must be valid)',
    type: 'string',
    required: true,
    validation: z.string().email()  // Add validation
  }
]
```

### 2. Use Proper Error Handling

Always handle errors gracefully:

```typescript
protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  try {
    const data = await fetchData();
    return this.success({ data });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    context.log(`Failed to fetch: ${err.message}`, 'error');
    return this.error(err);
  }
}
```

### 3. Log Important Actions

Use context.log() for visibility:

```typescript
context.log('Starting API call', 'info');
context.log('Retrying after error', 'warn');
context.log('Fatal error occurred', 'error');
```

### 4. Emit Custom Events

Use context.emit() for monitoring:

```typescript
context.emit('api:request', { url, method });
context.emit('api:response', { statusCode, duration });
```

### 5. Clean Up Resources

Always implement cleanup:

```typescript
protected async onInitialize(): Promise<void> {
  this.connection = await database.connect();
}

protected async onCleanup(): Promise<void> {
  if (this.connection) {
    await this.connection.close();
  }
}
```

### 6. Version Your Nodes

Use semantic versioning:

```typescript
version: '1.0.0'  // Breaking changes -> major
version: '1.1.0'  // New features -> minor
version: '1.0.1'  // Bug fixes -> patch
```

### 7. Provide Defaults

Make nodes easy to use:

```typescript
configSchema: z.object({
  timeout: z.number().min(0).default(30000),
  retries: z.number().min(0).max(10).default(3),
  method: z.enum(['GET', 'POST']).default('GET')
})
```

### 8. Document Everything

Add comprehensive inline documentation:

```typescript
/**
 * Sends an email using SMTP
 * 
 * Features:
 * - HTML and plain text support
 * - Attachment support
 * - Template variables
 * 
 * @example
 * ```typescript
 * const node = new EmailNode();
 * node.setConfig({
 *   smtpHost: 'smtp.gmail.com',
 *   smtpPort: 587
 * });
 * ```
 */
export class EmailNode extends ActionNode {
  // ...
}
```

## Architecture

```
BaseNode (abstract)
├── define() → NodeDefinition
├── execute() → NodeExecutionResult
├── run() → Full lifecycle
├── setConfig() → Validate & store
├── initialize() → Setup
├── cleanup() → Teardown
└── Events → Monitoring

NodeExecutionContext
├── nodeId, workflowId, executionId
├── inputs, config, metadata
└── log(), emit(), getVariable(), setVariable()

NodeExecutionResult
├── status: success | error | skipped
├── outputs: Record<string, any>
├── metadata?: Record<string, any>
└── error?: Error
```

## Contributing

When adding new nodes:

1. Extend `BaseNode` or a specialized class
2. Implement `define()` and `execute()`
3. Add comprehensive tests
4. Document with inline comments
5. Add example to `examples/`
6. Update this README if adding new patterns

## License

MIT

---

**Built with ❤️ for the Agent Platform**
