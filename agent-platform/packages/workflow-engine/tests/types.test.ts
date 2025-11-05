/**
 * Test suite for workflow engine core types
 * These tests define the expected structure and validation of workflow definitions
 */

import { 
  WorkflowSchema,
  WorkflowNodeSchema,
  WorkflowConnectionSchema,
  WorkflowStatus,
  NodeStatus,
  type Workflow,
  type WorkflowNode,
  type WorkflowConnection
} from '../src/types/workflow';

describe('Workflow Types', () => {
  describe('WorkflowNode Schema', () => {
    it('should validate a valid workflow node', () => {
      const validNode: WorkflowNode = {
        id: 'node-1',
        type: 'http',
        position: { x: 100, y: 100 },
        config: {
          method: 'GET',
          url: 'https://api.example.com'
        },
        inputs: [],
        outputs: ['node-2']
      };

      expect(() => WorkflowNodeSchema.parse(validNode)).not.toThrow();
    });

    it('should reject node without required fields', () => {
      const invalidNode = {
        id: 'node-1',
        type: 'http'
        // Missing position, config, inputs, outputs
      };

      expect(() => WorkflowNodeSchema.parse(invalidNode)).toThrow();
    });

    it('should validate node with complex config', () => {
      const nodeWithComplexConfig: WorkflowNode = {
        id: 'node-openai',
        type: 'openai',
        position: { x: 200, y: 200 },
        config: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          prompt: 'Generate a summary'
        },
        inputs: ['node-1'],
        outputs: []
      };

      expect(() => WorkflowNodeSchema.parse(nodeWithComplexConfig)).not.toThrow();
    });
  });

  describe('WorkflowConnection Schema', () => {
    it('should validate a valid connection', () => {
      const validConnection: WorkflowConnection = {
        id: 'conn-1',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'output',
        targetHandle: 'input'
      };

      expect(() => WorkflowConnectionSchema.parse(validConnection)).not.toThrow();
    });

    it('should allow optional handles', () => {
      const connectionWithoutHandles: WorkflowConnection = {
        id: 'conn-2',
        source: 'node-1',
        target: 'node-2'
      };

      expect(() => WorkflowConnectionSchema.parse(connectionWithoutHandles)).not.toThrow();
    });
  });

  describe('Workflow Schema', () => {
    it('should validate a complete workflow', () => {
      const validWorkflow: Workflow = {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 0, y: 0 },
            config: {},
            inputs: [],
            outputs: ['node-2']
          },
          {
            id: 'node-2',
            type: 'http',
            position: { x: 200, y: 0 },
            config: { method: 'GET', url: 'https://api.example.com' },
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
        settings: {
          timeout: 30000,
          retryOnFailure: true,
          maxRetries: 3
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test-user',
          tags: ['test', 'example']
        }
      };

      expect(() => WorkflowSchema.parse(validWorkflow)).not.toThrow();
    });

    it('should validate workflow with status', () => {
      const workflowWithStatus: Workflow = {
        id: 'workflow-2',
        name: 'Running Workflow',
        description: 'A running workflow',
        nodes: [],
        connections: [],
        settings: {},
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'user-1'
        },
        status: WorkflowStatus.RUNNING
      };

      expect(() => WorkflowSchema.parse(workflowWithStatus)).not.toThrow();
      expect(workflowWithStatus.status).toBe(WorkflowStatus.RUNNING);
    });

    it('should require minimum fields', () => {
      const invalidWorkflow = {
        id: 'workflow-3',
        name: 'Incomplete Workflow'
        // Missing required fields
      };

      expect(() => WorkflowSchema.parse(invalidWorkflow)).toThrow();
    });
  });

  describe('Workflow Status Enum', () => {
    it('should have all expected status values', () => {
      expect(WorkflowStatus.DRAFT).toBe('draft');
      expect(WorkflowStatus.ACTIVE).toBe('active');
      expect(WorkflowStatus.RUNNING).toBe('running');
      expect(WorkflowStatus.PAUSED).toBe('paused');
      expect(WorkflowStatus.COMPLETED).toBe('completed');
      expect(WorkflowStatus.FAILED).toBe('failed');
    });
  });

  describe('Node Status Enum', () => {
    it('should have all expected status values', () => {
      expect(NodeStatus.PENDING).toBe('pending');
      expect(NodeStatus.RUNNING).toBe('running');
      expect(NodeStatus.COMPLETED).toBe('completed');
      expect(NodeStatus.FAILED).toBe('failed');
      expect(NodeStatus.SKIPPED).toBe('skipped');
    });
  });
});
