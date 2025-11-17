import { HookManager } from '../hooks/HookManager.js';
import { TelemetryBridge } from '../telemetry/TelemetryBridge.js';
import { EventEmitter } from 'events';

/**
 * Configuration for WorkflowOptimizer
 */
export interface WorkflowOptimizerConfig {
  hookManager?: HookManager;
  telemetryBridge?: TelemetryBridge;
  enableOptimization?: boolean;
  historySize?: number;
}

/**
 * Metrics for a workflow step
 */
interface StepMetrics {
  stepId: string;
  stepType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * Metrics for a complete workflow execution
 */
export interface WorkflowMetrics {
  workflowId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  steps: StepMetrics[];
  totalStepTime?: number;
  errors: Array<{ message: string; timestamp: number }>;
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  type: 'slow_step' | 'frequent_error' | 'inefficient_workflow';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: any;
}

/**
 * WorkflowOptimizer provides performance tracking, hook execution,
 * and optimization feedback for workflow executions.
 */
export class WorkflowOptimizer {
  private hookManager?: HookManager;
  private telemetryBridge?: TelemetryBridge;
  private enableOptimization: boolean;
  private historySize: number;
  
  private activeWorkflows: Map<string, WorkflowMetrics>;
  private executionHistory: WorkflowMetrics[];
  private eventEmitter: EventEmitter;

  constructor(config: WorkflowOptimizerConfig) {
    this.hookManager = config.hookManager;
    this.telemetryBridge = config.telemetryBridge;
    this.enableOptimization = config.enableOptimization ?? true;
    this.historySize = config.historySize ?? 100;
    
    this.activeWorkflows = new Map();
    this.executionHistory = [];
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Get the hook manager instance
   */
  getHookManager(): HookManager | undefined {
    return this.hookManager;
  }

  /**
   * Start tracking a workflow execution
   */
  startWorkflow(workflowId: string): void {
    const metrics: WorkflowMetrics = {
      workflowId,
      startTime: Date.now(),
      steps: [],
      errors: []
    };

    this.activeWorkflows.set(workflowId, metrics);

    // Emit telemetry event
    this.emitTelemetryEvent('workflow.start', {
      workflowId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * End tracking a workflow execution
   */
  endWorkflow(workflowId: string): void {
    const metrics = this.activeWorkflows.get(workflowId);
    if (!metrics) return;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    
    // Calculate total step time
    metrics.totalStepTime = metrics.steps.reduce(
      (total, step) => total + (step.duration || 0),
      0
    );

    // Move to history
    this.executionHistory.push(metrics);
    
    // Limit history size
    if (this.executionHistory.length > this.historySize) {
      this.executionHistory.shift();
    }

    this.activeWorkflows.delete(workflowId);

    // Emit telemetry event
    this.emitTelemetryEvent('workflow.complete', {
      workflowId,
      duration: metrics.duration,
      stepCount: metrics.steps.length,
      totalStepTime: metrics.totalStepTime,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Start tracking a workflow step
   */
  startStep(workflowId: string, stepId: string, stepType: string): void {
    const metrics = this.activeWorkflows.get(workflowId);
    if (!metrics) return;

    const stepMetrics: StepMetrics = {
      stepId,
      stepType,
      startTime: Date.now()
    };

    metrics.steps.push(stepMetrics);
  }

  /**
   * End tracking a workflow step
   */
  endStep(workflowId: string, stepId: string): void {
    const metrics = this.activeWorkflows.get(workflowId);
    if (!metrics) return;

    const step = metrics.steps.find(s => s.stepId === stepId);
    if (!step) return;

    step.endTime = Date.now();
    step.duration = step.endTime - step.startTime;
  }

  /**
   * Get metrics for a workflow
   */
  getWorkflowMetrics(workflowId: string): WorkflowMetrics | undefined {
    // Check active workflows first
    const activeMetrics = this.activeWorkflows.get(workflowId);
    if (activeMetrics) return activeMetrics;

    // Check history
    return this.executionHistory.find(m => m.workflowId === workflowId);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): WorkflowMetrics[] {
    return [...this.executionHistory];
  }

  /**
   * Execute hooks before workflow starts
   */
  async executeBeforeWorkflowHooks(
    workflowId: string,
    context: any
  ): Promise<void> {
    if (!this.hookManager) return;

    try {
      await this.hookManager.executeHooks('workflow:before', {
        event: 'workflow:before',
        input: { workflowId, context },
        metadata: {}
      });
    } catch (error) {
      // Errors are logged by HookManager, don't rethrow
      console.error('Error executing before workflow hooks:', error);
    }
  }

  /**
   * Execute hooks after workflow completes
   */
  async executeAfterWorkflowHooks(
    workflowId: string,
    context: any
  ): Promise<void> {
    if (!this.hookManager) return;

    try {
      await this.hookManager.executeHooks('workflow:after', {
        event: 'workflow:after',
        input: { workflowId, context },
        metadata: {}
      });
    } catch (error) {
      console.error('Error executing after workflow hooks:', error);
    }
  }

  /**
   * Execute hooks before a workflow step
   */
  async executeBeforeStepHooks(
    workflowId: string,
    stepId: string,
    context: any
  ): Promise<void> {
    if (!this.hookManager) return;

    try {
      await this.hookManager.executeHooks('workflow:step:before', {
        event: 'workflow:step:before',
        input: { workflowId, stepId, context },
        metadata: {}
      });
    } catch (error) {
      console.error('Error executing before step hooks:', error);
    }
  }

  /**
   * Execute hooks after a workflow step
   */
  async executeAfterStepHooks(
    workflowId: string,
    stepId: string,
    context: any
  ): Promise<void> {
    if (!this.hookManager) return;

    try {
      await this.hookManager.executeHooks('workflow:step:after', {
        event: 'workflow:step:after',
        input: { workflowId, stepId, context },
        metadata: {}
      });
    } catch (error) {
      console.error('Error executing after step hooks:', error);
    }
  }

  /**
   * Record an error during workflow execution
   */
  recordError(workflowId: string, error: Error): void {
    const metrics = this.activeWorkflows.get(workflowId);
    if (!metrics) return;

    metrics.errors.push({
      message: error.message,
      timestamp: Date.now()
    });

    // Emit telemetry event
    this.emitTelemetryEvent('workflow.error', {
      workflowId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get optimization suggestions based on execution history
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    if (!this.enableOptimization) return [];

    const suggestions: OptimizationSuggestion[] = [];

    // Analyze for slow steps (>100ms)
    for (const workflow of this.executionHistory) {
      for (const step of workflow.steps) {
        if (step.duration && step.duration > 100) {
          suggestions.push({
            type: 'slow_step',
            severity: step.duration > 500 ? 'high' : 'medium',
            message: `Step "${step.stepId}" is slow (${step.duration}ms)`,
            details: {
              workflowId: workflow.workflowId,
              stepId: step.stepId,
              stepType: step.stepType,
              duration: step.duration
            }
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Emit a telemetry event
   */
  private emitTelemetryEvent(eventName: string, data: any): void {
    if (!this.telemetryBridge) return;

    try {
      this.telemetryBridge.emit('telemetry', {
        eventName,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Don't let telemetry errors break workflow execution
      console.error('Error emitting telemetry event:', error);
    }
  }
}
