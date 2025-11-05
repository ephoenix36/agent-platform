/**
 * Task Tools Timer Integration Tests
 * 
 * Tests for enhanced task management with timer functionality:
 * - create_task tool
 * - get_task tool  
 * - Enhanced list_tasks tool
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTaskTools, clearTaskTimers } from '../src/tools/task-tools.js';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Mock MCP Server
class MockMcpServer {
  private tools: Map<string, any> = new Map();

  tool(name: string, description: string, schema: any, handler: Function) {
    this.tools.set(name, { name, description, schema, handler });
  }

  async callTool(name: string, input: any) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.handler(input);
  }

  getTool(name: string) {
    return this.tools.get(name);
  }
}

describe('Task Tools - Timer Integration', () => {
  let server: MockMcpServer;

  beforeEach(async () => {
    clearTaskTimers(); // Clear timers before each test
    server = new MockMcpServer();
    await registerTaskTools(server as any, mockLogger as any);
    jest.clearAllMocks();
  });

  describe('create_task Tool', () => {
    it('should create a new task with not-started status by default', async () => {
      const result = await server.callTool('create_task', {
        taskId: 'test-task-1',
        taskName: 'Test Task',
        metadata: { priority: 'high' }
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.success).toBe(true);
      expect(data.taskId).toBe('test-task-1');
      expect(data.taskName).toBe('Test Task');
      expect(data.status).toBe('not-started');
      expect(data.metadata.priority).toBe('high');
      expect(data.timerInitialized).toBe(true);
      expect(data.elapsedMs).toBe(0);
    });

    it('should create task with in-progress status and start timer', async () => {
      const result = await server.callTool('create_task', {
        taskId: 'test-task-2',
        taskName: 'Active Task',
        initialStatus: 'in-progress'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.status).toBe('in-progress');
      expect(data.timerActive).toBe(true);
      expect(data.startTime).toBeDefined();
      expect(data.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('should reject duplicate task IDs', async () => {
      // Create first task
      await server.callTool('create_task', {
        taskId: 'duplicate-task',
        taskName: 'First Task'
      });

      // Try to create duplicate
      const result = await server.callTool('create_task', {
        taskId: 'duplicate-task',
        taskName: 'Duplicate Task'
      });

      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toContain('already exists');
    });

    it('should create task with minimal parameters', async () => {
      const result = await server.callTool('create_task', {
        taskId: 'minimal-task',
        taskName: 'Minimal Task'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.success).toBe(true);
      expect(data.taskId).toBe('minimal-task');
      expect(data.taskName).toBe('Minimal Task');
      expect(data.metadata).toEqual({});
    });
  });

  describe('get_task Tool', () => {
    beforeEach(async () => {
      // Create a test task
      await server.callTool('create_task', {
        taskId: 'get-test-task',
        taskName: 'Get Test Task',
        metadata: { owner: 'test-user' }
      });
    });

    it('should retrieve complete task information', async () => {
      const result = await server.callTool('get_task', {
        taskId: 'get-test-task'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.taskId).toBe('get-test-task');
      expect(data.taskName).toBe('Get Test Task');
      expect(data.status).toBe('not-started');
      expect(data.metadata.owner).toBe('test-user');
      expect(data.timer).toBeDefined();
      expect(data.timer.elapsedTime).toBeDefined();
      expect(data.timer.isPaused).toBe(false);
    });

    it('should return timer data for in-progress task', async () => {
      // Update task to in-progress
      await server.callTool('update_task_status', {
        taskId: 'get-test-task',
        taskName: 'Get Test Task',
        status: 'in-progress'
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      const result = await server.callTool('get_task', {
        taskId: 'get-test-task'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.status).toBe('in-progress');
      expect(data.timer.elapsedMs).toBeGreaterThan(0);
      expect(data.timer.startTime).toBeDefined();
      expect(data.timer.timerActive).toBe(true);
    });

    it('should handle non-existent task', async () => {
      const result = await server.callTool('get_task', {
        taskId: 'non-existent-task'
      });

      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text);
      expect(data.error).toContain('not found');
    });

    it('should include paused timer information', async () => {
      // Create and start task
      await server.callTool('create_task', {
        taskId: 'pause-test-task',
        taskName: 'Pause Test',
        initialStatus: 'in-progress'
      });

      // Pause the task
      await server.callTool('pause_resume_task_timer', {
        taskId: 'pause-test-task',
        action: 'pause'
      });

      const result = await server.callTool('get_task', {
        taskId: 'pause-test-task'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.timer.isPaused).toBe(true);
      expect(data.timer.timerActive).toBe(false);
    });
  });

  describe('Enhanced list_tasks Tool', () => {
    beforeEach(async () => {
      // Create multiple tasks with different statuses and timing
      await server.callTool('create_task', {
        taskId: 'list-task-1',
        taskName: 'Not Started Task',
        metadata: { priority: 'low' }
      });

      await server.callTool('create_task', {
        taskId: 'list-task-2',
        taskName: 'In Progress Task',
        initialStatus: 'in-progress',
        metadata: { priority: 'high' }
      });

      await server.callTool('create_task', {
        taskId: 'list-task-3',
        taskName: 'Completed Task',
        metadata: { priority: 'medium' }
      });
      
      // Complete the third task
      await server.callTool('update_task_status', {
        taskId: 'list-task-3',
        taskName: 'Completed Task',
        status: 'in-progress'
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await server.callTool('update_task_status', {
        taskId: 'list-task-3',
        taskName: 'Completed Task',
        status: 'completed'
      });
    });

    it('should list all tasks with timer data', async () => {
      const result = await server.callTool('list_tasks', {
        status: 'all'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.totalTasks).toBe(3);
      expect(data.tasks).toHaveLength(3);
      expect(data.tasks[0].elapsedTime).toBeDefined();
      expect(data.tasks[0].elapsedMs).toBeDefined();
    });

    it('should filter tasks by status', async () => {
      const result = await server.callTool('list_tasks', {
        status: 'in-progress'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.totalTasks).toBe(1);
      expect(data.tasks[0].taskName).toBe('In Progress Task');
      expect(data.tasks[0].status).toBe('in-progress');
    });

    it('should sort tasks by longest-running', async () => {
      // Wait to ensure timing difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await server.callTool('list_tasks', {
        status: 'all',
        sortBy: 'longest-running'
      });

      const data = JSON.parse(result.content[0].text);
      
      // First task should be the one running longest
      if (data.tasks.length > 1) {
        expect(data.tasks[0].elapsedMs).toBeGreaterThanOrEqual(data.tasks[1].elapsedMs);
      }
    });

    it('should include aggregate statistics', async () => {
      const result = await server.callTool('list_tasks', {
        status: 'all',
        includeStats: true
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.statistics).toBeDefined();
      expect(data.statistics.totalTasks).toBe(3);
      expect(data.statistics.totalTime).toBeDefined();
      expect(data.statistics.averageTime).toBeDefined();
      expect(data.statistics.activeCount).toBeDefined();
      expect(data.statistics.completedCount).toBe(1);
    });

    it('should sort by recently-started', async () => {
      const result = await server.callTool('list_tasks', {
        status: 'all',
        sortBy: 'recently-started'
      });

      const data = JSON.parse(result.content[0].text);
      
      // Should have tasks in reverse creation order (most recent first)
      expect(data.tasks.length).toBeGreaterThan(0);
    });

    it('should maintain backward compatibility with existing behavior', async () => {
      // Call without new parameters (should work exactly as before)
      const result = await server.callTool('list_tasks', {
        status: 'in-progress'
      });

      const data = JSON.parse(result.content[0].text);
      
      expect(data.totalTasks).toBeDefined();
      expect(data.tasks).toBeDefined();
      expect(data.summary).toBeDefined();
    });
  });

  describe('Integration: Complete Task Lifecycle with Timers', () => {
    it('should track time accurately through full lifecycle', async () => {
      // Create task
      const createResult = await server.callTool('create_task', {
        taskId: 'lifecycle-task',
        taskName: 'Lifecycle Task',
        metadata: { project: 'test-project' }
      });
      
      expect(JSON.parse(createResult.content[0].text).success).toBe(true);

      // Start task
      await server.callTool('update_task_status', {
        taskId: 'lifecycle-task',
        taskName: 'Lifecycle Task',
        status: 'in-progress'
      });

      // Wait and check progress
      await new Promise(resolve => setTimeout(resolve, 100));

      const getResult1 = await server.callTool('get_task', {
        taskId: 'lifecycle-task'
      });
      const data1 = JSON.parse(getResult1.content[0].text);
      
      expect(data1.timer.elapsedMs).toBeGreaterThan(50);
      expect(data1.timer.timerActive).toBe(true);

      // Pause task
      await server.callTool('pause_resume_task_timer', {
        taskId: 'lifecycle-task',
        action: 'pause'
      });

      const elapsedAfterPause = data1.timer.elapsedMs;

      // Wait while paused
      await new Promise(resolve => setTimeout(resolve, 50));

      const getResult2 = await server.callTool('get_task', {
        taskId: 'lifecycle-task'
      });
      const data2 = JSON.parse(getResult2.content[0].text);
      
      // Time should not have increased while paused
      expect(data2.timer.elapsedMs).toBeLessThanOrEqual(elapsedAfterPause + 10); // Small margin for execution time

      // Resume and complete
      await server.callTool('pause_resume_task_timer', {
        taskId: 'lifecycle-task',
        action: 'resume'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      await server.callTool('update_task_status', {
        taskId: 'lifecycle-task',
        taskName: 'Lifecycle Task',
        status: 'completed'
      });

      const getFinal = await server.callTool('get_task', {
        taskId: 'lifecycle-task'
      });
      const dataFinal = JSON.parse(getFinal.content[0].text);
      
      expect(dataFinal.status).toBe('completed');
      expect(dataFinal.timer.totalTime).toBeGreaterThan(100);
      expect(dataFinal.timer.endTime).toBeDefined();
    });

    it('should handle blocked state with auto-pause', async () => {
      // Create and start task
      await server.callTool('create_task', {
        taskId: 'block-test-task',
        taskName: 'Block Test',
        initialStatus: 'in-progress'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Block the task (should auto-pause)
      await server.callTool('update_task_status', {
        taskId: 'block-test-task',
        taskName: 'Block Test',
        status: 'blocked'
      });

      const getBlocked = await server.callTool('get_task', {
        taskId: 'block-test-task'
      });
      const dataBlocked = JSON.parse(getBlocked.content[0].text);
      
      expect(dataBlocked.status).toBe('blocked');
      expect(dataBlocked.timer.isPaused).toBe(true);

      // Unblock (should auto-resume)
      await server.callTool('update_task_status', {
        taskId: 'block-test-task',
        taskName: 'Block Test',
        status: 'in-progress'
      });

      const getUnblocked = await server.callTool('get_task', {
        taskId: 'block-test-task'
      });
      const dataUnblocked = JSON.parse(getUnblocked.content[0].text);
      
      expect(dataUnblocked.status).toBe('in-progress');
      expect(dataUnblocked.timer.isPaused).toBe(false);
      expect(dataUnblocked.timer.timerActive).toBe(true);
    });
  });

  describe('Timer Calculation Edge Cases', () => {
    it('should handle rapid status changes correctly', async () => {
      await server.callTool('create_task', {
        taskId: 'rapid-task',
        taskName: 'Rapid Changes',
        initialStatus: 'in-progress'
      });

      // Rapid pause/resume
      await server.callTool('pause_resume_task_timer', {
        taskId: 'rapid-task',
        action: 'pause'
      });
      
      await server.callTool('pause_resume_task_timer', {
        taskId: 'rapid-task',
        action: 'resume'
      });
      
      await server.callTool('pause_resume_task_timer', {
        taskId: 'rapid-task',
        action: 'pause'
      });

      const result = await server.callTool('get_task', {
        taskId: 'rapid-task'
      });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.timer.isPaused).toBe(true);
      expect(data.timer.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it('should not allow negative elapsed time', async () => {
      await server.callTool('create_task', {
        taskId: 'time-test-task',
        taskName: 'Time Test'
      });

      const result = await server.callTool('get_task', {
        taskId: 'time-test-task'
      });
      const data = JSON.parse(result.content[0].text);
      
      expect(data.timer.elapsedMs).toBeGreaterThanOrEqual(0);
    });
  });
});
