import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowOptimizer } from '../../src/services/WorkflowOptimizer.js';
import { HookManager } from '../../src/hooks/HookManager.js';
import { TelemetryBridge } from '../../src/telemetry/TelemetryBridge.js';
import { EventEmitter } from 'events';

describe('WorkflowOptimizer', () => {
  let optimizer: WorkflowOptimizer;
  let hookManager: HookManager;
  let telemetryBridge: TelemetryBridge;
  let evolutionEmitter: EventEmitter;

  beforeEach(() => {
    evolutionEmitter = new EventEmitter();
    hookManager = new HookManager();
    telemetryBridge = new TelemetryBridge(evolutionEmitter);
    optimizer = new WorkflowOptimizer({
      hookManager,
      telemetryBridge
    });
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(optimizer).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customOptimizer = new WorkflowOptimizer({
        hookManager,
        telemetryBridge,
        enableOptimization: true,
        historySize: 50
      });
      expect(customOptimizer).toBeDefined();
    });

    it('should integrate with hook manager', () => {
      expect(optimizer.getHookManager()).toBe(hookManager);
    });
  });

  describe('Performance Tracking', () => {
    it('should track workflow execution time', async () => {
      const workflowId = 'test-workflow-1';
      
      optimizer.startWorkflow(workflowId);
      await new Promise(resolve => setTimeout(resolve, 100));
      optimizer.endWorkflow(workflowId);

      const metrics = optimizer.getWorkflowMetrics(workflowId);
      expect(metrics).toBeDefined();
      expect(metrics.duration).toBeGreaterThanOrEqual(100);
    });

    it('should track step execution times', async () => {
      const workflowId = 'test-workflow-2';
      optimizer.startWorkflow(workflowId);

      optimizer.startStep(workflowId, 'step-1', 'agent');
      await new Promise(resolve => setTimeout(resolve, 50));
      optimizer.endStep(workflowId, 'step-1');

      const metrics = optimizer.getWorkflowMetrics(workflowId);
      expect(metrics.steps).toHaveLength(1);
      expect(metrics.steps[0].stepId).toBe('step-1');
      expect(metrics.steps[0].duration).toBeGreaterThanOrEqual(50);
    });

    it('should calculate total execution time across all steps', async () => {
      const workflowId = 'test-workflow-3';
      optimizer.startWorkflow(workflowId);

      optimizer.startStep(workflowId, 'step-1', 'agent');
      await new Promise(resolve => setTimeout(resolve, 30));
      optimizer.endStep(workflowId, 'step-1');

      optimizer.startStep(workflowId, 'step-2', 'transform');
      await new Promise(resolve => setTimeout(resolve, 30));
      optimizer.endStep(workflowId, 'step-2');

      optimizer.endWorkflow(workflowId);

      const metrics = optimizer.getWorkflowMetrics(workflowId);
      expect(metrics.steps).toHaveLength(2);
      expect(metrics.totalStepTime).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Hook Execution', () => {
    it('should execute hooks before workflow start', async () => {
      const beforeHook = jest.fn(async (context) => {
        return { success: true };
      });
      
      hookManager.registerHook({
        id: 'test-before-hook',
        event: 'workflow:before',
        priority: 50,
        handler: beforeHook
      });
      
      await optimizer.executeBeforeWorkflowHooks('test-workflow', { input: 'test' });
      
      expect(beforeHook).toHaveBeenCalled();
      expect(beforeHook).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            workflowId: 'test-workflow',
            context: { input: 'test' }
          })
        })
      );
    });

    it('should execute hooks after workflow completion', async () => {
      const afterHook = jest.fn(async () => ({ success: true }));
      
      hookManager.registerHook({
        id: 'test-after-hook',
        event: 'workflow:after',
        priority: 50,
        handler: afterHook
      });
      
      await optimizer.executeAfterWorkflowHooks('test-workflow', { output: 'result' });
      
      expect(afterHook).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            workflowId: 'test-workflow',
            context: { output: 'result' }
          })
        })
      );
    });

    it('should execute hooks before each step', async () => {
      const stepBeforeHook = jest.fn(async () => ({ success: true }));
      
      hookManager.registerHook({
        id: 'test-step-before-hook',
        event: 'workflow:step:before',
        priority: 50,
        handler: stepBeforeHook
      });
      
      await optimizer.executeBeforeStepHooks('test-workflow', 'step-1', { stepConfig: {} });
      
      expect(stepBeforeHook).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            workflowId: 'test-workflow',
            stepId: 'step-1'
          })
        })
      );
    });

    it('should execute hooks after each step', async () => {
      const stepAfterHook = jest.fn(async () => ({ success: true }));
      
      hookManager.registerHook({
        id: 'test-step-after-hook',
        event: 'workflow:step:after',
        priority: 50,
        handler: stepAfterHook
      });
      
      await optimizer.executeAfterStepHooks('test-workflow', 'step-1', { stepResult: 'success' });
      
      expect(stepAfterHook).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            workflowId: 'test-workflow',
            stepId: 'step-1',
            context: { stepResult: 'success' }
          })
        })
      );
    });

    it('should handle hook execution errors gracefully', async () => {
      const failingHook = jest.fn(async () => {
        throw new Error('Hook failed');
      });
      
      hookManager.registerHook({
        id: 'test-failing-hook',
        event: 'workflow:before',
        priority: 50,
        handler: failingHook
      });
      
      // Should not throw, errors are logged and isolated
      await optimizer.executeBeforeWorkflowHooks('test-workflow', {});
      
      expect(failingHook).toHaveBeenCalled();
    });
  });

  describe('Telemetry Integration', () => {
    it('should emit telemetry event on workflow start', () => {
      const telemetryHandler = jest.fn();
      telemetryBridge.on('telemetry', telemetryHandler);

      optimizer.startWorkflow('test-workflow');

      expect(telemetryHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: expect.stringContaining('workflow.start')
        })
      );
    });

    it('should emit telemetry event on workflow completion', () => {
      const telemetryHandler = jest.fn();
      telemetryBridge.on('telemetry', telemetryHandler);

      optimizer.startWorkflow('test-workflow');
      optimizer.endWorkflow('test-workflow');

      expect(telemetryHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: expect.stringContaining('workflow.complete')
        })
      );
    });

    it('should include performance metrics in telemetry events', async () => {
      const telemetryHandler = jest.fn();
      telemetryBridge.on('telemetry', telemetryHandler);

      optimizer.startWorkflow('test-workflow');
      await new Promise(resolve => setTimeout(resolve, 50));
      optimizer.endWorkflow('test-workflow');

      const completionEvent = telemetryHandler.mock.calls.find(
        call => call[0].eventName.includes('workflow.complete')
      );

      expect(completionEvent).toBeDefined();
      expect(completionEvent[0].data).toHaveProperty('duration');
      expect(completionEvent[0].data.duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Optimization Feedback Loop', () => {
    it('should track execution history', () => {
      optimizer.startWorkflow('workflow-1');
      optimizer.endWorkflow('workflow-1');

      optimizer.startWorkflow('workflow-2');
      optimizer.endWorkflow('workflow-2');

      const history = optimizer.getExecutionHistory();
      expect(history).toHaveLength(2);
      expect(history[0].workflowId).toBe('workflow-1');
      expect(history[1].workflowId).toBe('workflow-2');
    });

    it('should limit history size to configured maximum', () => {
      const limitedOptimizer = new WorkflowOptimizer({
        hookManager,
        telemetryBridge,
        historySize: 3
      });

      // Execute 5 workflows
      for (let i = 1; i <= 5; i++) {
        limitedOptimizer.startWorkflow(`workflow-${i}`);
        limitedOptimizer.endWorkflow(`workflow-${i}`);
      }

      const history = limitedOptimizer.getExecutionHistory();
      expect(history).toHaveLength(3);
      expect(history[0].workflowId).toBe('workflow-3'); // Oldest kept
      expect(history[2].workflowId).toBe('workflow-5'); // Most recent
    });

    it('should provide optimization suggestions based on history', () => {
      // Execute multiple workflows with varying performance
      for (let i = 1; i <= 5; i++) {
        optimizer.startWorkflow(`workflow-${i}`);
        optimizer.startStep(`workflow-${i}`, `step-${i}`, 'agent');
        optimizer.endStep(`workflow-${i}`, `step-${i}`);
        optimizer.endWorkflow(`workflow-${i}`);
      }

      const suggestions = optimizer.getOptimizationSuggestions();
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should detect slow steps and suggest optimizations', async () => {
      optimizer.startWorkflow('workflow-1');
      
      optimizer.startStep('workflow-1', 'fast-step', 'transform');
      await new Promise(resolve => setTimeout(resolve, 10));
      optimizer.endStep('workflow-1', 'fast-step');

      optimizer.startStep('workflow-1', 'slow-step', 'agent');
      await new Promise(resolve => setTimeout(resolve, 200));
      optimizer.endStep('workflow-1', 'slow-step');

      optimizer.endWorkflow('workflow-1');

      const suggestions = optimizer.getOptimizationSuggestions();
      const slowStepSuggestions = suggestions.filter(
        s => s.type === 'slow_step'
      );

      expect(slowStepSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without telemetry bridge', () => {
      const standAloneOptimizer = new WorkflowOptimizer({
        hookManager
      });

      expect(() => {
        standAloneOptimizer.startWorkflow('test-workflow');
        standAloneOptimizer.endWorkflow('test-workflow');
      }).not.toThrow();
    });

    it('should work without hook manager', () => {
      const minimalOptimizer = new WorkflowOptimizer({
        telemetryBridge
      });

      expect(() => {
        minimalOptimizer.startWorkflow('test-workflow');
        minimalOptimizer.endWorkflow('test-workflow');
      }).not.toThrow();
    });

    it('should work with minimal configuration', () => {
      const minimalOptimizer = new WorkflowOptimizer({});

      expect(() => {
        minimalOptimizer.startWorkflow('test-workflow');
        minimalOptimizer.endWorkflow('test-workflow');
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should track errors during workflow execution', () => {
      optimizer.startWorkflow('test-workflow');
      optimizer.recordError('test-workflow', new Error('Step failed'));
      optimizer.endWorkflow('test-workflow');

      const metrics = optimizer.getWorkflowMetrics('test-workflow');
      expect(metrics.errors).toHaveLength(1);
      expect(metrics.errors[0].message).toBe('Step failed');
    });

    it('should emit error telemetry events', () => {
      const telemetryHandler = jest.fn();
      telemetryBridge.on('telemetry', telemetryHandler);

      optimizer.startWorkflow('test-workflow');
      optimizer.recordError('test-workflow', new Error('Test error'));

      const errorEvent = telemetryHandler.mock.calls.find(
        call => call[0].eventName.includes('workflow.error')
      );

      expect(errorEvent).toBeDefined();
    });
  });
});
