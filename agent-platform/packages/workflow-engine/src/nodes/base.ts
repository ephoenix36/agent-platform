/**
 * Base Node Abstract Class
 * Foundation for all workflow nodes with input/output validation and execution lifecycle
 */

import { z } from 'zod';
import { EventEmitter } from 'events';

/**
 * Node execution context
 * Provides runtime information and utilities to nodes
 */
export interface NodeExecutionContext {
  workflowId: string;
  executionId: string;
  nodeId: string;
  inputs: Record<string, any>;
  config: Record<string, any>;
  metadata: Record<string, any>;
  
  // Utility functions
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  emit: (event: string, data?: any) => void;
  getVariable: (name: string) => any;
  setVariable: (name: string, value: any) => void;
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  outputs: Record<string, any>;
  metadata?: Record<string, any>;
  status: 'success' | 'error' | 'skipped';
  error?: Error;
}

/**
 * Node definition metadata
 */
export interface NodeDefinition {
  type: string;
  displayName: string;
  description: string;
  category: string;
  icon?: string;
  version: string;
  
  // Input/output specifications
  inputs: NodePort[];
  outputs: NodePort[];
  
  // Configuration schema
  configSchema: z.ZodObject<any>;
}

/**
 * Node port (input or output)
 */
export interface NodePort {
  name: string;
  displayName: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required: boolean;
  defaultValue?: any;
  validation?: z.ZodType<any>;
}

/**
 * Node events
 */
export enum NodeEvent {
  EXECUTION_START = 'execution:start',
  EXECUTION_COMPLETE = 'execution:complete',
  EXECUTION_ERROR = 'execution:error',
  VALIDATION_ERROR = 'validation:error',
  CONFIG_CHANGED = 'config:changed'
}

/**
 * Base Node Abstract Class
 * All workflow nodes must extend this class
 */
export abstract class BaseNode extends EventEmitter {
  protected definition: NodeDefinition;
  protected config: Record<string, any> = {};
  protected isInitialized = false;

  constructor() {
    super();
    this.definition = this.define();
  }

  /**
   * Define node metadata, inputs, outputs, and configuration
   * Must be implemented by subclasses
   */
  protected abstract define(): NodeDefinition;

  /**
   * Execute the node's core logic
   * Must be implemented by subclasses
   */
  protected abstract execute(
    context: NodeExecutionContext
  ): Promise<NodeExecutionResult>;

  /**
   * Get node definition
   */
  getDefinition(): NodeDefinition {
    return this.definition;
  }

  /**
   * Set node configuration
   */
  setConfig(config: Record<string, any>): void {
    // Validate configuration against schema
    const validation = this.definition.configSchema.safeParse(config);
    
    if (!validation.success) {
      const error = new Error(`Invalid node configuration: ${validation.error.message}`);
      this.emit(NodeEvent.VALIDATION_ERROR, {
        config,
        errors: validation.error
      });
      throw error;
    }

    this.config = validation.data;
    this.emit(NodeEvent.CONFIG_CHANGED, this.config);
  }

  /**
   * Get node configuration
   */
  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Initialize the node
   * Can be overridden for setup tasks
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.onInitialize();
    this.isInitialized = true;
  }

  /**
   * Cleanup resources
   * Can be overridden for cleanup tasks
   */
  async cleanup(): Promise<void> {
    await this.onCleanup();
    this.isInitialized = false;
  }

  /**
   * Run the node with full lifecycle
   */
  async run(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    // Ensure initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Emit start event
    this.emit(NodeEvent.EXECUTION_START, {
      nodeId: context.nodeId,
      inputs: context.inputs
    });

    try {
      // Validate inputs
      this.validateInputs(context.inputs);

      // Execute node logic
      const result = await this.execute(context);

      // Validate outputs
      if (result.status === 'success') {
        this.validateOutputs(result.outputs);
      }

      // Emit complete event
      this.emit(NodeEvent.EXECUTION_COMPLETE, {
        nodeId: context.nodeId,
        result
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Emit error event
      this.emit(NodeEvent.EXECUTION_ERROR, {
        nodeId: context.nodeId,
        error: err
      });

      return {
        outputs: {},
        status: 'error',
        error: err
      };
    }
  }

  /**
   * Validate input data against port specifications
   */
  protected validateInputs(inputs: Record<string, any>): void {
    for (const port of this.definition.inputs) {
      const value = inputs[port.name];

      // Check required inputs
      if (port.required && value === undefined) {
        throw new Error(`Required input '${port.name}' is missing`);
      }

      // Validate with Zod schema if provided
      if (port.validation && value !== undefined) {
        const result = port.validation.safeParse(value);
        if (!result.success) {
          throw new Error(
            `Invalid input '${port.name}': ${result.error.message}`
          );
        }
      }

      // Type checking (basic)
      if (value !== undefined && port.type !== 'any') {
        this.validateType(value, port.type, port.name);
      }
    }
  }

  /**
   * Validate output data against port specifications
   */
  protected validateOutputs(outputs: Record<string, any>): void {
    for (const port of this.definition.outputs) {
      const value = outputs[port.name];

      // Check required outputs
      if (port.required && value === undefined) {
        throw new Error(`Required output '${port.name}' is missing`);
      }

      // Validate with Zod schema if provided
      if (port.validation && value !== undefined) {
        const result = port.validation.safeParse(value);
        if (!result.success) {
          throw new Error(
            `Invalid output '${port.name}': ${result.error.message}`
          );
        }
      }

      // Type checking (basic)
      if (value !== undefined && port.type !== 'any') {
        this.validateType(value, port.type, port.name);
      }
    }
  }

  /**
   * Basic type validation
   */
  private validateType(value: any, expectedType: string, portName: string): void {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== expectedType) {
      throw new Error(
        `Type mismatch for '${portName}': expected ${expectedType}, got ${actualType}`
      );
    }
  }

  /**
   * Hook for initialization logic
   * Override in subclasses for custom initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default: no-op
  }

  /**
   * Hook for cleanup logic
   * Override in subclasses for custom cleanup
   */
  protected async onCleanup(): Promise<void> {
    // Default: no-op
  }

  /**
   * Helper: Create success result
   */
  protected success(outputs: Record<string, any>, metadata?: Record<string, any>): NodeExecutionResult {
    return {
      outputs,
      metadata,
      status: 'success'
    };
  }

  /**
   * Helper: Create error result
   */
  protected error(error: Error | string, outputs: Record<string, any> = {}): NodeExecutionResult {
    return {
      outputs,
      status: 'error',
      error: error instanceof Error ? error : new Error(error)
    };
  }

  /**
   * Helper: Create skipped result
   */
  protected skip(reason: string): NodeExecutionResult {
    return {
      outputs: {},
      metadata: { skipReason: reason },
      status: 'skipped'
    };
  }
}

/**
 * Typed Base Node with generic config type
 */
export abstract class TypedBaseNode<TConfig extends Record<string, any> = Record<string, any>> extends BaseNode {
  protected declare config: TConfig;

  getConfig(): TConfig {
    return super.getConfig() as TConfig;
  }
}
