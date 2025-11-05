/**
 * Workflow State Management
 * Manages execution state, node states, and context during workflow execution
 */

import {
  WorkflowStatus,
  NodeStatus,
  type ExecutionContext,
  type ExecutionState,
  type WorkflowNode
} from '../types/workflow';

/**
 * StateManager
 * Centralized state management for workflow execution
 */
export class StateManager {
  private state: ExecutionState;

  constructor() {
    this.state = {
      status: WorkflowStatus.DRAFT,
      nodeStates: {},
      context: {
        nodeResults: {},
        variables: {},
        cancelled: false
      },
      progress: 0
    };
  }

  /**
   * Initialize execution state
   */
  initializeExecution(
    workflowId: string,
    executionId: string,
    nodes: WorkflowNode[]
  ): void {
    this.state = {
      workflowId,
      executionId,
      status: WorkflowStatus.RUNNING,
      nodeStates: nodes.reduce((acc, node) => {
        acc[node.id] = NodeStatus.PENDING;
        return acc;
      }, {} as Record<string, NodeStatus>),
      context: {
        workflowId,
        executionId,
        nodeResults: {},
        variables: {},
        startTime: new Date(),
        cancelled: false
      },
      progress: 0
    };
  }

  /**
   * Get current execution state
   */
  getState(): ExecutionState {
    return { ...this.state };
  }

  /**
   * Update workflow status
   */
  setWorkflowStatus(status: WorkflowStatus): void {
    this.state.status = status;
  }

  /**
   * Update node status
   */
  setNodeStatus(nodeId: string, status: NodeStatus): void {
    this.state.nodeStates[nodeId] = status;
    this.state.currentNode = nodeId;
    this.updateProgress();
  }

  /**
   * Store node execution result
   */
  setNodeResult(nodeId: string, result: any): void {
    if (!this.state.context.nodeResults) {
      this.state.context.nodeResults = {};
    }
    this.state.context.nodeResults[nodeId] = result;
  }

  /**
   * Get node result
   */
  getNodeResult(nodeId: string): any {
    return this.state.context.nodeResults?.[nodeId];
  }

  /**
   * Get all node results
   */
  getAllNodeResults(): Record<string, any> {
    return this.state.context.nodeResults ? { ...this.state.context.nodeResults } : {};
  }

  /**
   * Set workflow variable
   */
  setVariable(key: string, value: any): void {
    if (!this.state.context.variables) {
      this.state.context.variables = {};
    }
    this.state.context.variables[key] = value;
  }

  /**
   * Get workflow variable
   */
  getVariable(key: string): any {
    return this.state.context.variables?.[key];
  }

  /**
   * Mark workflow as cancelled
   */
  cancel(): void {
    if (this.state.context) {
      this.state.context.cancelled = true;
    }
    this.state.status = WorkflowStatus.CANCELLED;
  }

  /**
   * Check if execution is cancelled
   */
  isCancelled(): boolean {
    return this.state.context?.cancelled === true;
  }

  /**
   * Get execution context
   */
  getContext(): ExecutionContext {
    return {
      workflowId: this.state.workflowId || '',
      executionId: this.state.executionId || '',
      nodeResults: this.state.context.nodeResults || {},
      variables: this.state.context.variables || {},
      startTime: this.state.context.startTime || new Date(),
      timeout: this.state.context.timeout,
      cancelled: this.state.context.cancelled || false
    };
  }

  /**
   * Update execution progress (0-100)
   */
  private updateProgress(): void {
    const totalNodes = Object.keys(this.state.nodeStates).length;
    if (totalNodes === 0) {
      this.state.progress = 100;
      return;
    }

    const completedNodes = Object.values(this.state.nodeStates).filter(
      status => status === NodeStatus.COMPLETED || status === NodeStatus.SKIPPED
    ).length;

    this.state.progress = Math.round((completedNodes / totalNodes) * 100);
  }

  /**
   * Get execution progress
   */
  getProgress(): number {
    return this.state.progress;
  }

  /**
   * Reset state for new execution
   */
  reset(): void {
    this.state = {
      status: WorkflowStatus.DRAFT,
      nodeStates: {},
      context: {
        nodeResults: {},
        variables: {},
        cancelled: false
      },
      progress: 0
    };
  }
}
