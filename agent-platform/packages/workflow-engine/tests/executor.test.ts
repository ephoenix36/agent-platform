/**
 * Test suite for WorkflowExecutor
 * Defines expected behavior for workflow execution engine
 */

import { WorkflowExecutor } from '../src/engine/executor';
import { WorkflowStatus, type Workflow } from '../src/types/workflow';

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
  });

  describe('Constructor', () => {
    it('should create executor instance', () => {
      expect(executor).toBeInstanceOf(WorkflowExecutor);
    });

    it('should initialize with empty state', () => {
      const state = executor.getState();
      expect(state).toBeDefined();
      expect(state.executionId).toBeUndefined();
    });
  });

  describe('execute()', () => {
    it('should execute simple sequential workflow', async () => {
      const workflow: Workflow = {
        id: 'workflow-1',
        name: 'Simple Sequential Workflow',
        description: 'Two nodes in sequence',
        nodes: [
          {
            id: 'node-1',
            type: 'start',
            position: { x: 0, y: 0 },
            config: { value: 'Hello' },
            inputs: [],
            outputs: ['node-2']
          },
          {
            id: 'node-2',
            type: 'transform',
            position: { x: 200, y: 0 },
            config: { operation: 'uppercase' },
            inputs: ['node-1'],
            outputs: []
          }
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'node-1',
            target: 'node-2'
          }
        ],
        settings: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test'
        }
      };

      const result = await executor.execute(workflow);

      expect(result.status).toBe('completed');
      expect(result.executionId).toBeDefined();
      expect(result.nodeResults).toHaveProperty('node-1');
      expect(result.nodeResults).toHaveProperty('node-2');
    });

    it('should handle workflow with no nodes', async () => {
      const emptyWorkflow: Workflow = {
        id: 'workflow-empty',
        name: 'Empty Workflow',
        description: 'No nodes',
        nodes: [],
        connections: [],
        settings: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test'
        }
      };

      const result = await executor.execute(emptyWorkflow);

      expect(result.status).toBe('completed');
      expect(Object.keys(result.nodeResults)).toHaveLength(0);
    });

    it('should update workflow status during execution', async () => {
      const workflow: Workflow = {
        id: 'workflow-status',
        name: 'Status Test',
        description: 'Test status updates',
        nodes: [
          {
            id: 'node-1',
            type: 'delay',
            position: { x: 0, y: 0 },
            config: { ms: 100 },
            inputs: [],
            outputs: []
          }
        ],
        connections: [],
        settings: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test'
        }
      };

      const executionPromise = executor.execute(workflow);
      
      // Check state immediately (should be running)
      const runningState = executor.getState();
      expect(runningState.status).toBe(WorkflowStatus.RUNNING);

      const result = await executionPromise;
      
      // Check final state
      expect(result.status).toBe('completed');
    });

    it('should handle execution errors gracefully', async () => {
      const failingWorkflow: Workflow = {
        id: 'workflow-fail',
        name: 'Failing Workflow',
        description: 'This workflow will fail',
        nodes: [
          {
            id: 'node-error',
            type: 'error',
            position: { x: 0, y: 0 },
            config: { throwError: true },
            inputs: [],
            outputs: []
          }
        ],
        connections: [],
        settings: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test'
        }
      };

      const result = await executor.execute(failingWorkflow);

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should execute nodes in topological order', async () => {
      const executionOrder: string[] = [];
      
      const workflow: Workflow = {
        id: 'workflow-topo',
        name: 'Topological Order Test',
        description: 'Nodes should execute in dependency order',
        nodes: [
          {
            id: 'node-3',
            type: 'logger',
            position: { x: 400, y: 0 },
            config: { logTo: executionOrder, value: '3' },
            inputs: ['node-1', 'node-2'],
            outputs: []
          },
          {
            id: 'node-1',
            type: 'logger',
            position: { x: 0, y: 0 },
            config: { logTo: executionOrder, value: '1' },
            inputs: [],
            outputs: ['node-3']
          },
          {
            id: 'node-2',
            type: 'logger',
            position: { x: 200, y: 0 },
            config: { logTo: executionOrder, value: '2' },
            inputs: [],
            outputs: ['node-3']
          }
        ],
        connections: [
          { id: 'c1', source: 'node-1', target: 'node-3' },
          { id: 'c2', source: 'node-2', target: 'node-3' }
        ],
        settings: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test'
        }
      };

      await executor.execute(workflow);

      // node-1 and node-2 can execute in any order, but node-3 must be last
      expect(executionOrder).toHaveLength(3);
      expect(executionOrder[2]).toBe('3');
      expect(executionOrder.slice(0, 2).sort()).toEqual(['1', '2']);
    });
  });

  describe('getState()', () => {
    it('should return current execution state', () => {
      const state = executor.getState();
      
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('nodeStates');
      expect(state).toHaveProperty('context');
    });
  });

  describe('cancel()', () => {
    it('should mark workflow as cancelled in state', async () => {
      const longRunningWorkflow: Workflow = {
        id: 'workflow-long',
        name: 'Long Running',
        description: 'Takes a while',
        nodes: [
          {
            id: 'node-delay',
            type: 'delay',
            position: { x: 0, y: 0 },
            config: { ms: 2000 }, // 2 second delay
            inputs: [],
            outputs: []
          }
        ],
        connections: [],
        settings: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test'
        }
      };

      // Start execution but don't await yet
      const executionPromise = executor.execute(longRunningWorkflow);
      
      // Give it time to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Call cancel
      executor.cancel();
      
      // Verify state shows cancelled
      const state = executor.getState();
      expect(state.status).toBe(WorkflowStatus.CANCELLED);
      
      // Clean up - wait for execution to finish
      await executionPromise.catch(() => {
        /* ignore errors */
      });
    });
  });
});
