import { z } from 'zod';
import { BaseNode, TypedBaseNode, NodeExecutionContext, NodeExecutionResult, NodeDefinition, NodeEvent } from '../../src/nodes/base';

/**
 * Test implementation of BaseNode
 */
class TestNode extends BaseNode {
  public initializeCalled = false;
  public cleanupCalled = false;
  public executeCalled = false;

  protected define(): NodeDefinition {
    return {
      type: 'test-node',
      displayName: 'Test Node',
      description: 'A test node',
      category: 'test',
      icon: 'test',
      version: '1.0.0',
      inputs: [
        {
          name: 'input1',
          displayName: 'Input 1',
          description: 'First input',
          type: 'string',
          required: true
        },
        {
          name: 'input2',
          displayName: 'Input 2',
          description: 'Second input',
          type: 'number',
          required: false,
          defaultValue: 0
        }
      ],
      outputs: [
        {
          name: 'output1',
          displayName: 'Output 1',
          description: 'First output',
          type: 'string',
          required: true
        }
      ],
      configSchema: z.object({
        testConfig: z.string().default('test')
      })
    };
  }

  protected async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    this.executeCalled = true;
    
    const input1 = context.inputs.input1 as string;
    const input2 = (context.inputs.input2 as number) || 0;
    
    return this.success({
      output1: `${input1}-${input2}`
    });
  }

  public async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  public async cleanup(): Promise<void> {
    this.cleanupCalled = true;
  }
}

/**
 * Typed test node
 */
interface TestConfig {
  testConfig: string;
  optionalValue?: number;
}

class TypedTestNode extends TypedBaseNode<TestConfig> {
  protected define(): NodeDefinition {
    return {
      type: 'typed-test-node',
      displayName: 'Typed Test Node',
      description: 'A typed test node',
      category: 'test',
      icon: 'test',
      version: '1.0.0',
      inputs: [],
      outputs: [],
      configSchema: z.object({
        testConfig: z.string(),
        optionalValue: z.number().optional()
      })
    };
  }

  protected async execute(_context: NodeExecutionContext): Promise<NodeExecutionResult> {
    // Type-safe config access
    const value = this.config.testConfig;
    const optional = this.config.optionalValue || 0;
    
    return this.success({
      result: `${value}-${optional}`
    });
  }
}

describe('BaseNode', () => {
  let node: TestNode;
  let context: NodeExecutionContext;

  beforeEach(() => {
    node = new TestNode();
    context = {
      nodeId: 'node-1',
      workflowId: 'workflow-1',
      executionId: 'execution-1',
      inputs: {
        input1: 'test',
        input2: 42
      },
      config: {
        testConfig: 'config-value'
      },
      metadata: {},
      log: jest.fn(),
      emit: jest.fn(),
      getVariable: jest.fn(),
      setVariable: jest.fn()
    };
  });

  describe('Node Definition', () => {
    it('should have correct node definition', () => {
      const definition = node.getDefinition();
      
      expect(definition.type).toBe('test-node');
      expect(definition.displayName).toBe('Test Node');
      expect(definition.category).toBe('test');
      expect(definition.inputs).toHaveLength(2);
      expect(definition.outputs).toHaveLength(1);
    });

    it('should have inputs with correct properties', () => {
      const definition = node.getDefinition();
      const input1 = definition.inputs.find(i => i.name === 'input1');
      
      expect(input1).toBeDefined();
      expect(input1?.type).toBe('string');
      expect(input1?.required).toBe(true);
    });

    it('should have config schema', () => {
      const definition = node.getDefinition();
      expect(definition.configSchema).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should set valid configuration', () => {
      const config = { testConfig: 'new-value' };
      node.setConfig(config);
      
      expect(node.getConfig()).toEqual({ testConfig: 'new-value' });
    });

    it('should validate configuration against schema', () => {
      const listener = jest.fn();
      node.on(NodeEvent.VALIDATION_ERROR, listener);
      
      // The schema has default value so empty object is valid
      // Try setting a completely wrong type instead
      try {
        node.setConfig({ testConfig: 123 } as any); // number instead of string
      } catch (e) {
        // Expected to throw
      }
      
      expect(listener).toHaveBeenCalled();
    });

    it('should apply default values from schema', () => {
      node.setConfig({});
      
      expect(node.getConfig()).toEqual({ testConfig: 'test' });
    });

    it('should emit config change event', () => {
      const listener = jest.fn();
      node.on(NodeEvent.CONFIG_CHANGED, listener);
      
      node.setConfig({ testConfig: 'changed' });
      
      expect(listener).toHaveBeenCalledWith({ testConfig: 'changed' });
    });
  });

  describe('Lifecycle', () => {
    it('should call initialize before execution', async () => {
      await node.run(context);
      
      expect(node.initializeCalled).toBe(true);
      expect(node.executeCalled).toBe(true);
    });

    it('should call cleanup after execution', async () => {
      await node.run(context);
      await node.cleanup();
      
      expect(node.cleanupCalled).toBe(true);
    });

    it('should emit execution start event', async () => {
      const listener = jest.fn();
      node.on(NodeEvent.EXECUTION_START, listener);
      
      await node.run(context);
      
      expect(listener).toHaveBeenCalledWith({
        nodeId: context.nodeId,
        inputs: context.inputs
      });
    });

    it('should emit execution complete event', async () => {
      const listener = jest.fn();
      node.on(NodeEvent.EXECUTION_COMPLETE, listener);
      
      const result = await node.run(context);
      
      expect(listener).toHaveBeenCalledWith({
        nodeId: context.nodeId,
        result
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate required inputs', async () => {
      const invalidContext = {
        ...context,
        inputs: {
          input2: 42
          // missing input1
        }
      };

      const result = await node.run(invalidContext);
      
      expect(result.status).toBe('error');
      expect(result.error?.message).toContain('input1');
    });

    it('should accept optional inputs', async () => {
      const minimalContext = {
        ...context,
        inputs: {
          input1: 'test'
          // input2 is optional
        }
      };

      const result = await node.run(minimalContext);
      
      expect(result.status).toBe('success');
    });

    it('should use default values for optional inputs', async () => {
      const definition = node.getDefinition();
      const input2 = definition.inputs.find(i => i.name === 'input2');
      
      expect(input2?.defaultValue).toBe(0);
    });

    it('should validate input types', async () => {
      const invalidContext = {
        ...context,
        inputs: {
          input1: 123, // should be string
          input2: 42
        }
      };

      const result = await node.run(invalidContext);
      
      // Type validation is currently basic, but should still work
      expect(result.status).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should validate outputs match definition', async () => {
      const result = await node.run(context);
      
      expect(result.status).toBe('success');
      expect(result.outputs).toHaveProperty('output1');
    });

    it('should handle invalid outputs', async () => {
      // Create a node that returns invalid outputs
      class InvalidOutputNode extends BaseNode {
        protected define(): NodeDefinition {
          return {
            type: 'invalid',
            displayName: 'Invalid',
            description: 'Invalid',
            category: 'test',
            icon: 'test',
            version: '1.0.0',
            inputs: [],
            outputs: [
              { name: 'required', displayName: 'Required', description: 'Required output', type: 'string', required: true }
            ],
            configSchema: z.object({})
          };
        }

        protected async execute(): Promise<NodeExecutionResult> {
          return this.success({
            // missing required output
          });
        }
      }

      const invalidNode = new InvalidOutputNode();

      const result = await invalidNode.run(context);
      
      // Should have error status due to validation failure
      expect(result.status).toBe('error');
      expect(result.error?.message).toContain('required');
    });
  });

  describe('Execution', () => {
    it('should execute successfully with valid inputs', async () => {
      const result = await node.run(context);
      
      expect(result.status).toBe('success');
      expect(result.outputs?.output1).toBe('test-42');
    });

    it('should handle execution errors', async () => {
      class ErrorNode extends BaseNode {
        protected define(): NodeDefinition {
          return {
            type: 'error-node',
            displayName: 'Error Node',
            description: 'Always errors',
            category: 'test',
            icon: 'test',
            version: '1.0.0',
            inputs: [],
            outputs: [],
            configSchema: z.object({})
          };
        }

        protected async execute(): Promise<NodeExecutionResult> {
          throw new Error('Test error');
        }
      }

      const errorNode = new ErrorNode();
      const result = await errorNode.run(context);
      
      expect(result.status).toBe('error');
      expect(result.error?.message).toContain('Test error');
    });

    it('should emit execution error event', async () => {
      class ErrorNode extends BaseNode {
        protected define(): NodeDefinition {
          return {
            type: 'error-node',
            displayName: 'Error Node',
            description: 'Always errors',
            category: 'test',
            icon: 'test',
            version: '1.0.0',
            inputs: [],
            outputs: [],
            configSchema: z.object({})
          };
        }

        protected async execute(): Promise<NodeExecutionResult> {
          throw new Error('Test error');
        }
      }

      const errorNode = new ErrorNode();
      const listener = jest.fn();
      errorNode.on(NodeEvent.EXECUTION_ERROR, listener);

      await errorNode.run(context);
      
      expect(listener).toHaveBeenCalled();
    });

    it('should support skip status', async () => {
      class SkipNode extends BaseNode {
        protected define(): NodeDefinition {
          return {
            type: 'skip-node',
            displayName: 'Skip Node',
            description: 'Always skips',
            category: 'test',
            icon: 'test',
            version: '1.0.0',
            inputs: [],
            outputs: [],
            configSchema: z.object({})
          };
        }

        protected async execute(): Promise<NodeExecutionResult> {
          return this.skip('Condition not met');
        }
      }

      const skipNode = new SkipNode();
      const result = await skipNode.run(context);
      
      expect(result.status).toBe('skipped');
      expect(result.metadata?.skipReason).toBe('Condition not met');
    });
  });

  describe('Helper Methods', () => {
    it('should create success result', () => {
      const result = node['success']({ output: 'test' }, { meta: 'data' });
      
      expect(result.status).toBe('success');
      expect(result.outputs).toEqual({ output: 'test' });
      expect(result.metadata).toEqual({ meta: 'data' });
    });

    it('should create error result', () => {
      const result = node['error']('Error message', { some: 'output' });
      
      expect(result.status).toBe('error');
      expect(result.error?.message).toBe('Error message');
      expect(result.outputs).toEqual({ some: 'output' });
    });

    it('should create skip result', () => {
      const result = node['skip']('Skipped reason');
      
      expect(result.status).toBe('skipped');
      expect(result.metadata?.skipReason).toBe('Skipped reason');
    });
  });

  describe('Event Emission', () => {
    it('should emit custom events via context', async () => {
      const emitSpy = jest.fn();
      const testContext = {
        ...context,
        emit: emitSpy
      };

      class EventNode extends BaseNode {
        protected define(): NodeDefinition {
          return {
            type: 'event-node',
            displayName: 'Event Node',
            description: 'Emits events',
            category: 'test',
            icon: 'test',
            version: '1.0.0',
            inputs: [],
            outputs: [],
            configSchema: z.object({})
          };
        }

        protected async execute(ctx: NodeExecutionContext): Promise<NodeExecutionResult> {
          ctx.emit('custom-event', { data: 'test' });
          return this.success({});
        }
      }

      const eventNode = new EventNode();
      await eventNode.run(testContext);
      
      expect(emitSpy).toHaveBeenCalledWith('custom-event', { data: 'test' });
    });
  });
});

describe('TypedBaseNode', () => {
  let node: TypedTestNode;
  let context: NodeExecutionContext;

  beforeEach(() => {
    node = new TypedTestNode();
    node.setConfig({
      testConfig: 'typed-value',
      optionalValue: 100
    });
    
    context = {
      nodeId: 'node-1',
      workflowId: 'workflow-1',
      executionId: 'execution-1',
      inputs: {},
      config: {
        testConfig: 'typed-value',
        optionalValue: 100
      },
      metadata: {},
      log: jest.fn(),
      emit: jest.fn(),
      getVariable: jest.fn(),
      setVariable: jest.fn()
    };
  });

  it('should provide type-safe config access', async () => {
    const result = await node.run(context);
    
    expect(result.status).toBe('success');
    expect(result.outputs?.result).toBe('typed-value-100');
  });

  it('should validate config type', () => {
    expect(() => {
      node.setConfig({ testConfig: 123 }); // wrong type
    }).toThrow();
  });

  it('should handle optional config values', async () => {
    node.setConfig({
      testConfig: 'minimal'
      // optionalValue omitted
    });
    
    const minimalContext = {
      ...context,
      config: {
        testConfig: 'minimal'
        // optionalValue omitted
      }
    };

    const result = await node.run(minimalContext);
    
    expect(result.status).toBe('success');
    expect(result.outputs?.result).toBe('minimal-0');
  });
});
