/**
 * Enhanced Workflow Engine
 * 
 * Integrates workflow execution with:
 * - Full telemetry and monitoring
 * - EvoSuite-based optimization
 * - Hook system for extensibility
 * - Multi-objective evaluation
 * - Async execution with proper tracking
 * - Universal EvoAssets support
 */

import { EventEmitter } from 'events';
import { HookManager } from '../hooks/HookManager.js';
import { TelemetryBridge } from '../telemetry/TelemetryBridge.js';
import { WorkflowOptimizer, type WorkflowMetrics } from './WorkflowOptimizer.js';
import { Logger } from '../utils/logging.js';

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  variables: Record<string, any>;
  results: Map<string, any>;
  startTime: number;
  metadata: Record<string, any>;
}

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  id: string;
  type: string;
  config: Record<string, any>;
  dependencies?: string[];
  
  // Advanced features
  steps?: WorkflowStep[];  // For nested workflows
  onSuccess?: string;      // Jump to step on success
  onError?: string;        // Jump to step on error
  condition?: string;      // Conditional execution
  skipIf?: string;         // Skip condition
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
  timeout?: number;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  input?: any;
  context?: Record<string, any>;
  
  // Optimization configuration
  optimization?: {
    enabled: boolean;
    objectives: string[];        // e.g., ['minimize_duration', 'maximize_success_rate']
    constraints?: Record<string, any>;
    evoSuiteConfig?: {
      populationSize?: number;
      maxGenerations?: number;
      mutationRate?: number;
      crossoverRate?: number;
    };
  };
}

/**
 * Step execution result
 */
export interface StepResult {
  stepId: string;
  status: 'success' | 'failure' | 'skipped';
  output?: any;
  error?: Error;
  duration: number;
  metrics?: Record<string, number>;
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  workflowId: string;
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  steps: StepResult[];
  duration: number;
  metrics: WorkflowMetrics;
  optimizationSuggestions?: any[];
}

/**
 * Evaluator plugin for multi-objective optimization
 */
export interface EvaluatorPlugin {
  id: string;
  name: string;
  evaluate(result: WorkflowExecutionResult): Promise<Record<string, number>>;
}

/**
 * Enhanced Workflow Engine with full integration
 */
export class EnhancedWorkflowEngine extends EventEmitter {
  private hookManager: HookManager;
  private telemetryBridge: TelemetryBridge;
  private optimizer: WorkflowOptimizer;
  private logger: Logger;
  
  private activeExecutions: Map<string, WorkflowContext>;
  private evaluators: Map<string, EvaluatorPlugin>;
  private stepExecutors: Map<string, (step: WorkflowStep, context: WorkflowContext) => Promise<any>>;
  
  constructor(
    hookManager: HookManager,
    telemetryBridge: TelemetryBridge,
    optimizer: WorkflowOptimizer,
    logger: Logger
  ) {
    super();
    this.hookManager = hookManager;
    this.telemetryBridge = telemetryBridge;
    this.optimizer = optimizer;
    this.logger = logger;
    
    this.activeExecutions = new Map();
    this.evaluators = new Map();
    this.stepExecutors = new Map();
    
    this.registerDefaultStepExecutors();
  }

  /**
   * Register an evaluator plugin
   */
  registerEvaluator(evaluator: EvaluatorPlugin): void {
    this.evaluators.set(evaluator.id, evaluator);
    this.logger.info(`Registered evaluator: ${evaluator.name}`);
    
    // Emit telemetry event (TelemetryBridge will listen)
    this.emit('evaluator.registered', {
      evaluatorId: evaluator.id,
      evaluatorName: evaluator.name
    });
  }

  /**
   * Register a step executor
   */
  registerStepExecutor(
    type: string,
    executor: (step: WorkflowStep, context: WorkflowContext) => Promise<any>
  ): void {
    this.stepExecutors.set(type, executor);
    this.logger.debug(`Registered step executor for type: ${type}`);
  }

  /**
   * Execute a workflow with full telemetry and optimization
   */
  async executeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Create execution context
    const context: WorkflowContext = {
      workflowId: workflow.id,
      executionId,
      variables: workflow.context || {},
      results: new Map(),
      startTime,
      metadata: {
        name: workflow.name,
        totalSteps: workflow.steps.length
      }
    };

    this.activeExecutions.set(executionId, context);

    // Start workflow tracking
    this.optimizer.startWorkflow(executionId);

    // Emit workflow start event
    this.emitWorkflowEvent('workflow:start', {
      workflowId: workflow.id,
      executionId,
      name: workflow.name,
      stepCount: workflow.steps.length
    });

    // Execute workflow:before hooks
    await this.executeHooks('workflow:before', {
      workflow,
      context
    });

    try {
      // Execute steps
      const stepResults: StepResult[] = [];
      
      for (const step of workflow.steps) {
        // Check for skip condition
        if (step.skipIf && this.evaluateCondition(step.skipIf, context)) {
          stepResults.push({
            stepId: step.id,
            status: 'skipped',
            duration: 0
          });
          continue;
        }

        // Execute step with full instrumentation
        const stepResult = await this.executeStep(step, context);
        stepResults.push(stepResult);

        // Handle step failure
        if (stepResult.status === 'failure') {
          if (step.onError) {
            // Jump to error handler step
            const errorStep = workflow.steps.find(s => s.id === step.onError);
            if (errorStep) {
              const errorStepResult = await this.executeStep(errorStep, context);
              stepResults.push(errorStepResult);
            }
          } else {
            // Fail workflow
            break;
          }
        }

        // Handle step success with conditional jump
        if (stepResult.status === 'success' && step.onSuccess) {
          const nextStep = workflow.steps.find(s => s.id === step.onSuccess);
          if (nextStep) {
            const index = workflow.steps.indexOf(nextStep);
            workflow.steps.splice(0, index);  // Jump to next step
          }
        }
      }

      // Complete workflow
      const duration = Date.now() - startTime;
      this.optimizer.endWorkflow(executionId);

      const result: WorkflowExecutionResult = {
        workflowId: workflow.id,
        executionId,
        status: stepResults.every(s => s.status === 'success' || s.status === 'skipped') 
          ? 'completed' 
          : 'failed',
        steps: stepResults,
        duration,
        metrics: this.optimizer.getWorkflowMetrics(executionId)!
      };

      // Run evaluators if optimization enabled
      if (workflow.optimization?.enabled) {
        result.optimizationSuggestions = await this.runOptimization(workflow, result);
      }

      // Execute workflow:after hooks
      await this.executeHooks('workflow:after', {
        workflow,
        context,
        result
      });

      // Emit completion event
      this.emitWorkflowEvent('workflow:complete', {
        workflowId: workflow.id,
        executionId,
        status: result.status,
        duration
      });

      return result;

    } catch (error: any) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error);
      
      // Record failure
      this.optimizer.endWorkflow(executionId);
      this.emit('workflow.failed', {
        workflowId: workflow.id,
        executionId,
        error: error.message
      });

      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Execute a single step with full instrumentation
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext
  ): Promise<StepResult> {
    const stepStartTime = Date.now();

    // Start step tracking
    this.optimizer.startStep(context.executionId, step.id, step.type);

    // Emit step start event
    this.emitWorkflowEvent('step:start', {
      workflowId: context.workflowId,
      executionId: context.executionId,
      stepId: step.id,
      stepType: step.type
    });

    // Execute step:before hooks
    await this.executeHooks('step:before', {
      step,
      context
    });

    try {
      // Get step executor
      const executor = this.stepExecutors.get(step.type);
      if (!executor) {
        throw new Error(`No executor registered for step type: ${step.type}`);
      }

      // Execute with timeout if specified
      let output;
      if (step.timeout) {
        output = await this.executeWithTimeout(
          () => executor(step, context),
          step.timeout
        );
      } else {
        output = await executor(step, context);
      }

      // Store result in context
      context.results.set(step.id, output);

      const duration = Date.now() - stepStartTime;

      // Complete step tracking
      this.optimizer.endStep(context.executionId, step.id);

      // Execute step:after hooks
      await this.executeHooks('step:after', {
        step,
        context,
        output,
        duration
      });

      // Emit step complete event
      this.emitWorkflowEvent('step:complete', {
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        status: 'success',
        duration
      });

      return {
        stepId: step.id,
        status: 'success',
        output,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - stepStartTime;

      // Record error
      this.optimizer.recordError(context.executionId, error.message);
      
      // Emit error event
      this.emitWorkflowEvent('step:error', {
        workflowId: context.workflowId,
        executionId: context.executionId,
        stepId: step.id,
        error: error.message,
        duration
      });

      // Execute step:error hooks
      await this.executeHooks('step:error', {
        step,
        context,
        error
      });

      // Handle retry policy
      if (step.retryPolicy) {
        return await this.retryStep(step, context, error, step.retryPolicy);
      }

      return {
        stepId: step.id,
        status: 'failure',
        error,
        duration
      };
    }
  }

  /**
   * Retry step execution with backoff
   */
  private async retryStep(
    step: WorkflowStep,
    context: WorkflowContext,
    lastError: Error,
    retryPolicy: { maxAttempts: number; backoffMs: number }
  ): Promise<StepResult> {
    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      this.logger.info(`Retrying step ${step.id}, attempt ${attempt}/${retryPolicy.maxAttempts}`);
      
      // Wait with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, retryPolicy.backoffMs * Math.pow(2, attempt - 1))
      );

      try {
        return await this.executeStep(step, context);
      } catch (error: any) {
        lastError = error;
        if (attempt === retryPolicy.maxAttempts) {
          break;
        }
      }
    }

    // All retries failed
    return {
      stepId: step.id,
      status: 'failure',
      error: lastError,
      duration: 0
    };
  }

  /**
   * Run optimization using evaluators and EvoSuite
   */
  private async runOptimization(
    workflow: WorkflowDefinition,
    result: WorkflowExecutionResult
  ): Promise<any[]> {
    const suggestions = [];

    // Run all registered evaluators
    for (const [id, evaluator] of this.evaluators.entries()) {
      try {
        const scores = await evaluator.evaluate(result);
        
        // Emit evaluation results
        this.emit('evaluation.scores', {
          scores,
          evaluatorId: id,
          workflowId: workflow.id
        });

        // Generate suggestions based on scores
        for (const [objective, score] of Object.entries(scores)) {
          if (score < 0.7) {  // Threshold for generating suggestions
            suggestions.push({
              type: 'optimization',
              evaluator: id,
              objective,
              score,
              message: `${objective} score (${score.toFixed(2)}) is below target`
            });
          }
        }
      } catch (error: any) {
        this.logger.error(`Evaluator ${id} failed:`, error);
      }
    }

    // Get standard optimization suggestions
    const standardSuggestions = this.optimizer.getOptimizationSuggestions();
    suggestions.push(...standardSuggestions);

    return suggestions;
  }

  /**
   * Execute hooks for a specific event
   */
  private async executeHooks(event: string, data: any): Promise<void> {
    // Map generic event names to HookEvent types
    const hookEventMap: Record<string, string> = {
      'workflow:before': 'workflow:before',
      'workflow:after': 'workflow:after',
      'step:before': 'workflow:step:before',
      'step:after': 'workflow:step:after',
      'step:error': 'tool:error'  // Map to tool:error for now
    };

    const hookEvent = hookEventMap[event];
    if (!hookEvent) {
      this.logger.warn(`No hook mapping for event: ${event}`);
      return;
    }

    try {
      await this.hookManager.executeHooks(hookEvent as any, data);
    } catch (error: any) {
      this.logger.error(`Hook execution failed for ${event}:`, error);
    }
  }

  /**
   * Emit workflow event to telemetry
   */
  private emitWorkflowEvent(event: string, data: any): void {
    // Emit to local listeners
    this.emit(event, data);
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Step timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    try {
      // Simple expression evaluation (can be enhanced with a proper parser)
      const fn = new Function('context', 'variables', `return ${condition}`);
      return fn(context, context.variables);
    } catch (error) {
      this.logger.warn(`Failed to evaluate condition: ${condition}`);
      return false;
    }
  }

  /**
   * Register default step executors
   */
  private registerDefaultStepExecutors(): void {
    // These will be implemented by workflow-tools.ts integration
    this.logger.debug('Default step executors will be registered by workflow tools');
  }

  /**
   * Get active execution context
   */
  getExecutionContext(executionId: string): WorkflowContext | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflow(executionId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (!context) {
      throw new Error(`Execution ${executionId} not found`);
    }

    // Record cancellation
    this.emit('workflow.cancelled', {
      workflowId: context.workflowId,
      executionId
    });

    this.activeExecutions.delete(executionId);
    this.emit('workflow:cancelled', { executionId });
  }

  /**
   * Get workflow statistics
   */
  getStatistics() {
    return {
      activeExecutions: this.activeExecutions.size,
      registeredEvaluators: this.evaluators.size,
      registeredStepTypes: this.stepExecutors.size
    };
  }
}
