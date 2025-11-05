/**
 * Workflow Executor
 * Main orchestration engine for workflow execution
 * Handles topological sorting, node execution, state management, and error handling
 */

import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowStatus,
  NodeStatus,
  type Workflow,
  type WorkflowNode,
  type WorkflowExecutionResult
} from '../types/workflow';
import { StateManager } from './state';
import { NodeRunner } from './node-runner';

/**
 * WorkflowExecutor
 * Orchestrates workflow execution with proper state management and error handling
 */
export class WorkflowExecutor {
  private stateManager: StateManager;
  private nodeRunner: NodeRunner;

  constructor() {
    this.stateManager = new StateManager();
    this.nodeRunner = new NodeRunner();
  }

  /**
   * Execute a complete workflow
   */
  async execute(workflow: Workflow): Promise<WorkflowExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      // Initialize execution state
      this.stateManager.initializeExecution(
        workflow.id,
        executionId,
        workflow.nodes
      );

      // Handle empty workflow
      if (workflow.nodes.length === 0) {
        return this.createResult(
          workflow.id,
          executionId,
          'completed',
          {},
          startTime
        );
      }

      // Get execution order (topological sort)
      const executionOrder = this.getExecutionOrder(workflow);

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        // Check for cancellation
        if (this.stateManager.isCancelled()) {
          return this.createResult(
            workflow.id,
            executionId,
            'cancelled',
            this.stateManager.getAllNodeResults(),
            startTime
          );
        }

        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) {
          throw new Error(`Node ${nodeId} not found in workflow`);
        }

        // Update node status to running
        this.stateManager.setNodeStatus(nodeId, NodeStatus.RUNNING);

        // Execute the node
        const result = await this.nodeRunner.executeNode(
          node,
          this.stateManager.getContext()
        );

        // Update node status based on result
        this.stateManager.setNodeStatus(nodeId, result.status);

        // Store result if successful
        if (result.status === NodeStatus.COMPLETED) {
          this.stateManager.setNodeResult(nodeId, result.output);
        } else if (result.status === NodeStatus.FAILED) {
          // Handle node failure
          this.stateManager.setWorkflowStatus(WorkflowStatus.FAILED);
          return this.createResult(
            workflow.id,
            executionId,
            'failed',
            this.stateManager.getAllNodeResults(),
            startTime,
            result.error
          );
        }
      }

      // All nodes completed successfully
      this.stateManager.setWorkflowStatus(WorkflowStatus.COMPLETED);

      return this.createResult(
        workflow.id,
        executionId,
        'completed',
        this.stateManager.getAllNodeResults(),
        startTime
      );
    } catch (error) {
      // Handle unexpected errors
      this.stateManager.setWorkflowStatus(WorkflowStatus.FAILED);

      return this.createResult(
        workflow.id,
        executionId,
        'failed',
        this.stateManager.getAllNodeResults(),
        startTime,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Get current execution state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Cancel running workflow
   */
  cancel(): void {
    this.stateManager.cancel();
  }

  /**
   * Register custom node executor
   */
  registerNodeExecutor(nodeType: string, executor: (node: WorkflowNode, context: any) => Promise<any>): void {
    this.nodeRunner.registerExecutor(nodeType, executor);
  }

  /**
   * Get execution order using topological sort
   * Ensures nodes execute in dependency order
   */
  private getExecutionOrder(workflow: Workflow): string[] {
    const { nodes, connections } = workflow;

    // Build adjacency list (dependencies)
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build graph from connections
    connections.forEach(conn => {
      const deps = graph.get(conn.source) || [];
      deps.push(conn.target);
      graph.set(conn.source, deps);

      inDegree.set(conn.target, (inDegree.get(conn.target) || 0) + 1);
    });

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with no dependencies
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const dependents = graph.get(nodeId) || [];
      dependents.forEach(dependent => {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);

        if (newDegree === 0) {
          queue.push(dependent);
        }
      });
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains circular dependencies');
    }

    return result;
  }

  /**
   * Create execution result object
   */
  private createResult(
    workflowId: string,
    executionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    nodeResults: Record<string, any>,
    startTime: number,
    error?: string
  ): WorkflowExecutionResult {
    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;

    return {
      executionId,
      workflowId,
      status,
      nodeResults,
      executionTimeMs,
      error,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date(endTime).toISOString()
    };
  }
}
