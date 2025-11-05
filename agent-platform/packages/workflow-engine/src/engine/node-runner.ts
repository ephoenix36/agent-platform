/**
 * Node Runner
 * Executes individual workflow nodes with proper error handling and result management
 */

import {
  NodeStatus,
  type WorkflowNode,
  type ExecutionContext
} from '../types/workflow';

/**
 * Result from node execution
 */
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeStatus;
  output: any;
  error?: string;
  executionTimeMs: number;
}

/**
 * Node executor function type
 * Each node type implements this interface
 */
export type NodeExecutor = (
  node: WorkflowNode,
  context: ExecutionContext
) => Promise<any>;

/**
 * NodeRunner
 * Executes individual workflow nodes with proper lifecycle management
 */
export class NodeRunner {
  private nodeExecutors: Map<string, NodeExecutor>;

  constructor() {
    this.nodeExecutors = new Map();
    this.registerBuiltInExecutors();
  }

  /**
   * Register a node executor for a specific node type
   */
  registerExecutor(nodeType: string, executor: NodeExecutor): void {
    this.nodeExecutors.set(nodeType, executor);
  }

  /**
   * Execute a single node
   */
  async executeNode(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      // Get executor for this node type
      const executor = this.nodeExecutors.get(node.type);

      if (!executor) {
        throw new Error(`No executor registered for node type: ${node.type}`);
      }

      // Check for cancellation before execution
      if (context.cancelled) {
        return {
          nodeId: node.id,
          status: NodeStatus.CANCELLED,
          output: null,
          executionTimeMs: 0
        };
      }

      // Execute the node
      const output = await executor(node, context);

      const executionTimeMs = Date.now() - startTime;

      return {
        nodeId: node.id,
        status: NodeStatus.COMPLETED,
        output,
        executionTimeMs
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      return {
        nodeId: node.id,
        status: NodeStatus.FAILED,
        output: null,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs
      };
    }
  }

  /**
   * Check if executor exists for node type
   */
  hasExecutor(nodeType: string): boolean {
    return this.nodeExecutors.has(nodeType);
  }

  /**
   * Get all registered node types
   */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.nodeExecutors.keys());
  }

  /**
   * Register built-in node executors
   * These are simple test/demo executors
   */
  private registerBuiltInExecutors(): void {
    // Start node - simply outputs configured value
    this.registerExecutor('start', async (node) => {
      return node.config.value || 'start';
    });

    // Transform node - simple text transformation
    this.registerExecutor('transform', async (node, context) => {
      const input = this.getInputValue(node, context);
      const operation = node.config.operation || 'passthrough';

      switch (operation) {
        case 'uppercase':
          return String(input).toUpperCase();
        case 'lowercase':
          return String(input).toLowerCase();
        case 'trim':
          return String(input).trim();
        default:
          return input;
      }
    });

    // Delay node - simulates async operation
    this.registerExecutor('delay', async (node, context) => {
      const ms = node.config.ms || 0;
      const checkInterval = 100; // Check for cancellation every 100ms
      let elapsed = 0;

      while (elapsed < ms) {
        // Check if cancelled
        if (context.cancelled) {
          throw new Error('Execution cancelled');
        }

        const sleepTime = Math.min(checkInterval, ms - elapsed);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        elapsed += sleepTime;
      }

      return { delayed: ms };
    });

    // Error node - throws error for testing
    this.registerExecutor('error', async (node) => {
      if (node.config.throwError) {
        throw new Error(node.config.errorMessage || 'Simulated error');
      }
      return { success: true };
    });

    // Logger node - for testing execution order
    this.registerExecutor('logger', async (node) => {
      if (node.config.logTo && Array.isArray(node.config.logTo)) {
        node.config.logTo.push(node.config.value || node.id);
      }
      return { logged: node.config.value };
    });

    // Passthrough node - simple data passing
    this.registerExecutor('passthrough', async (node, context) => {
      return this.getInputValue(node, context);
    });
  }

  /**
   * Helper to get input value from previous nodes
   */
  private getInputValue(node: WorkflowNode, context: ExecutionContext): any {
    if (node.inputs.length === 0) {
      return null;
    }

    // Get result from first input node
    const firstInputNodeId = node.inputs[0];
    return context.nodeResults[firstInputNodeId];
  }
}
