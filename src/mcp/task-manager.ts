/**
 * Task Manager for Agent Task Assignment and Tracking
 * 
 * Manages task creation, assignment, progress tracking, and completion
 * for collaborative agent work.
 */

import { randomUUID } from 'crypto';

export interface AgentReference {
  collection: string;
  subsection: string;
  agentName: string;
  role?: string;
}

export interface TaskUpdate {
  timestamp: string;
  status: string;
  progress?: number;
  notes?: string;
  updatedBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgents: AgentReference[];
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  dueDate?: string;
  requiredCapabilities?: string[];
  dependencies?: string[]; // Task IDs
  updates: TaskUpdate[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface CreateTaskParams {
  title: string;
  description: string;
  assignedAgents: AgentReference[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  requiredCapabilities?: string[];
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface ListTasksParams {
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  assignedTo?: AgentReference;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  limit?: number;
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();

  /**
   * Create a new task
   */
  async createTask(params: CreateTaskParams): Promise<Task> {
    const task: Task = {
      id: randomUUID(),
      title: params.title,
      description: params.description,
      assignedAgents: params.assignedAgents,
      status: 'pending',
      priority: params.priority || 'medium',
      progress: 0,
      dueDate: params.dueDate,
      requiredCapabilities: params.requiredCapabilities,
      dependencies: params.dependencies,
      updates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: params.metadata
    };

    this.tasks.set(task.id, task);
    return task;
  }

  /**
   * Update task status and progress
   */
  async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled',
    progress?: number,
    notes?: string
  ): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const update: TaskUpdate = {
      timestamp: new Date().toISOString(),
      status,
      progress,
      notes
    };

    task.status = status;
    if (progress !== undefined) {
      task.progress = Math.max(0, Math.min(100, progress));
    }
    task.updates.push(update);
    task.updatedAt = new Date().toISOString();

    if (status === 'completed') {
      task.completedAt = new Date().toISOString();
      task.progress = 100;
    }

    return task;
  }

  /**
   * Get task details
   */
  async getTask(taskId: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    return task;
  }

  /**
   * List tasks with optional filters
   */
  async listTasks(params: ListTasksParams = {}): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (params.status) {
      tasks = tasks.filter(t => t.status === params.status);
    }

    if (params.assignedTo) {
      tasks = tasks.filter(t => 
        t.assignedAgents.some(a => 
          a.collection === params.assignedTo!.collection &&
          a.subsection === params.assignedTo!.subsection &&
          a.agentName === params.assignedTo!.agentName
        )
      );
    }

    if (params.priority) {
      tasks = tasks.filter(t => t.priority === params.priority);
    }

    // Sort by priority and due date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date (if available)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Finally by creation date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return tasks.slice(0, params.limit || 20);
  }

  /**
   * Assign additional agents to a task
   */
  async assignAgents(taskId: string, agents: AgentReference[]): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Add agents that aren't already assigned
    for (const agent of agents) {
      const isAlreadyAssigned = task.assignedAgents.some(a =>
        a.collection === agent.collection &&
        a.subsection === agent.subsection &&
        a.agentName === agent.agentName
      );

      if (!isAlreadyAssigned) {
        task.assignedAgents.push(agent);
      }
    }

    task.updatedAt = new Date().toISOString();
    return task;
  }

  /**
   * Add a task update/note
   */
  async addUpdate(taskId: string, notes: string, updatedBy?: string): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const update: TaskUpdate = {
      timestamp: new Date().toISOString(),
      status: task.status,
      progress: task.progress,
      notes,
      updatedBy
    };

    task.updates.push(update);
    task.updatedAt = new Date().toISOString();

    return task;
  }

  /**
   * Check if task dependencies are completed
   */
  async checkDependencies(taskId: string): Promise<{ ready: boolean; blockedBy: string[] }> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!task.dependencies || task.dependencies.length === 0) {
      return { ready: true, blockedBy: [] };
    }

    const blockedBy: string[] = [];
    for (const depId of task.dependencies) {
      const depTask = this.tasks.get(depId);
      if (!depTask || depTask.status !== 'completed') {
        blockedBy.push(depId);
      }
    }

    return {
      ready: blockedBy.length === 0,
      blockedBy
    };
  }

  /**
   * Get task summary
   */
  async getSummary(taskId: string): Promise<string> {
    const task = await this.getTask(taskId);

    const assignedNames = task.assignedAgents
      .map(a => `${a.agentName}${a.role ? ` (${a.role})` : ''}`)
      .join(', ');

    return `Task: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Progress: ${task.progress}%
Assigned to: ${assignedNames}
Created: ${task.createdAt}
${task.dueDate ? `Due: ${task.dueDate}` : ''}
Updates: ${task.updates.length}`;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    if (!this.tasks.has(taskId)) {
      throw new Error(`Task ${taskId} not found`);
    }
    this.tasks.delete(taskId);
  }

  /**
   * Get tasks by agent
   */
  async getTasksByAgent(agentRef: AgentReference): Promise<Task[]> {
    return this.listTasks({ assignedTo: agentRef });
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date();
    const tasks = Array.from(this.tasks.values());

    return tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    );
  }
}
