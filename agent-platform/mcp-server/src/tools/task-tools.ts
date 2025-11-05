import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";

/**
 * Task timer tracking interface
 */
interface TaskTimer {
  taskId: string;
  taskName: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  startTime?: Date;
  endTime?: Date;
  totalTime?: number; // in milliseconds
  pausedTime?: number; // in milliseconds
  isPaused?: boolean;
  pauseStart?: Date;
  metadata?: Record<string, any>;
}

/**
 * In-memory task timer storage
 * In production, this would be persisted to a database
 */
const taskTimers = new Map<string, TaskTimer>();

/**
 * Clear all task timers (for testing purposes)
 */
export function clearTaskTimers() {
  taskTimers.clear();
}

/**
 * Update task status schema
 */
const updateTaskStatusSchema = z.object({
  taskId: z.string().describe("Unique identifier for the task"),
  taskName: z.string().describe("Human-readable name for the task"),
  status: z.enum(['not-started', 'in-progress', 'completed', 'blocked']).describe("New status for the task"),
  metadata: z.record(z.any()).optional().describe("Additional metadata about the task"),
  autoTimer: z.boolean().optional().default(true).describe("Automatically manage timer based on status changes")
});

/**
 * Get task timer info schema
 */
const getTaskTimerSchema = z.object({
  taskId: z.string().describe("Unique identifier for the task")
});

/**
 * List all tasks schema
 */
const listTasksSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed', 'blocked', 'all']).optional().default('all').describe("Filter tasks by status"),
  sortBy: z.enum(['longest-running', 'recently-started', 'recently-completed']).optional().describe("Sort tasks by time-based criteria"),
  includeStats: z.boolean().optional().default(false).describe("Include aggregate statistics about task timing")
});

/**
 * Pause/Resume task timer schema
 */
const pauseResumeTimerSchema = z.object({
  taskId: z.string().describe("Unique identifier for the task"),
  action: z.enum(['pause', 'resume']).describe("Action to perform on the timer")
});

/**
 * Create task schema
 */
const createTaskSchema = z.object({
  taskId: z.string().describe("Unique identifier for the task"),
  taskName: z.string().describe("Human-readable name for the task"),
  initialStatus: z.enum(['not-started', 'in-progress']).optional().default('not-started').describe("Initial status for the task"),
  metadata: z.record(z.any()).optional().default({}).describe("Additional metadata about the task")
});

/**
 * Get task schema
 */
const getTaskSchema = z.object({
  taskId: z.string().describe("Unique identifier for the task")
});

/**
 * Calculate elapsed time for a task
 */
function calculateElapsedTime(timer: TaskTimer): number {
  if (!timer.startTime) return 0;
  
  let elapsed = 0;
  const now = new Date();
  
  if (timer.endTime) {
    // Task is completed
    elapsed = timer.endTime.getTime() - timer.startTime.getTime();
  } else if (timer.isPaused && timer.pauseStart) {
    // Task is paused
    elapsed = timer.pauseStart.getTime() - timer.startTime.getTime();
  } else if (timer.status === 'in-progress') {
    // Task is currently running
    elapsed = now.getTime() - timer.startTime.getTime();
  }
  
  // Subtract any paused time
  if (timer.pausedTime) {
    elapsed -= timer.pausedTime;
  }
  
  return Math.max(0, elapsed);
}

/**
 * Format elapsed time for human readability
 */
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Register task management tools with timer integration
 */
export async function registerTaskTools(server: McpServer, logger: Logger) {
  
  // ===== CREATE TASK =====
  server.tool(
    "create_task",
    "Create a new task with timer initialization. Use this to explicitly create a task before starting work on it.",
    createTaskSchema.shape,
    async (input) => {
      try {
        // Validate and apply defaults
        const validated = createTaskSchema.parse(input);
        const { taskId, taskName, initialStatus, metadata } = validated;
        
        // Check if task already exists
        if (taskTimers.has(taskId)) {
          logger.error(`Task ${taskId} already exists`);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Task ${taskId} already exists. Use update_task_status to modify existing tasks.`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        // Create task timer with initial status
        const now = new Date();
        const timer: TaskTimer = {
          taskId,
          taskName,
          status: initialStatus,
          metadata: metadata || {},
          pausedTime: 0,
          isPaused: false
        };
        
        // If starting as in-progress, initialize the timer
        if (initialStatus === 'in-progress') {
          timer.startTime = now;
        }
        
        taskTimers.set(taskId, timer);
        
        logger.info(`Created task ${taskId} with status ${initialStatus}`);
        
        const elapsedMs = calculateElapsedTime(timer);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              taskId,
              taskName,
              status: initialStatus,
              metadata: timer.metadata,
              timerInitialized: true,
              timerActive: initialStatus === 'in-progress',
              startTime: timer.startTime?.toISOString(),
              elapsedMs,
              elapsedTime: formatElapsedTime(elapsedMs)
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error creating task", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
  
  // ===== GET TASK =====
  server.tool(
    "get_task",
    "Retrieve complete information about a task including timer data",
    getTaskSchema.shape,
    async (input) => {
      try {
        const { taskId } = input;
        
        const timer = taskTimers.get(taskId);
        
        if (!timer) {
          logger.error(`Task ${taskId} not found`);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: `Task ${taskId} not found`
              }, null, 2)
            }],
            isError: true
          };
        }
        
        const elapsedMs = calculateElapsedTime(timer);
        const elapsedTime = formatElapsedTime(elapsedMs);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              taskId: timer.taskId,
              taskName: timer.taskName,
              status: timer.status,
              metadata: timer.metadata || {},
              timer: {
                elapsedMs,
                elapsedTime,
                isPaused: timer.isPaused || false,
                timerActive: timer.status === 'in-progress' && !timer.isPaused,
                startTime: timer.startTime?.toISOString(),
                endTime: timer.endTime?.toISOString(),
                totalTime: timer.totalTime,
                pausedTime: timer.pausedTime
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error("Error getting task", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
  
  // ===== UPDATE TASK STATUS WITH AUTO-TIMER =====
  server.tool(
    "update_task_status",
    "Update task status with automatic time tracking. Starts timer on 'in-progress', stops on 'completed'",
    updateTaskStatusSchema.shape,
    async (input) => {
      try {
        // Validate and apply defaults
        const validated = updateTaskStatusSchema.parse(input);
        const { taskId, taskName, status, metadata, autoTimer } = validated;
        
        // Get or create task timer
        let timer = taskTimers.get(taskId);
        
        if (!timer) {
          timer = {
            taskId,
            taskName,
            status: 'not-started',
            metadata: metadata || {}
          };
          taskTimers.set(taskId, timer);
          logger.info(`Created new task: ${taskName} (${taskId})`);
        }
        
        const previousStatus = timer.status;
        const now = new Date();
        
        // Handle timer based on status change
        if (autoTimer) {
          // Starting work
          if (status === 'in-progress' && previousStatus !== 'in-progress') {
            if (!timer.startTime) {
              timer.startTime = now;
              logger.info(`⏱️  Started timer for task: ${taskName}`);
            }
            timer.isPaused = false;
          }
          
          // Completing work
          if (status === 'completed' && previousStatus !== 'completed') {
            timer.endTime = now;
            timer.totalTime = calculateElapsedTime(timer);
            logger.info(`✅ Completed task: ${taskName} in ${formatElapsedTime(timer.totalTime)}`);
          }
          
          // Blocking task (auto-pause timer)
          if (status === 'blocked' && previousStatus !== 'blocked') {
            if (!timer.isPaused) {
              timer.isPaused = true;
              timer.pauseStart = now;
              logger.info(`⏸️  Paused timer for blocked task: ${taskName}`);
            }
          }
          
          // Unblocking task (auto-resume timer)
          if (status === 'in-progress' && previousStatus === 'blocked') {
            if (timer.isPaused && timer.pauseStart) {
              const pauseDuration = now.getTime() - timer.pauseStart.getTime();
              timer.pausedTime = (timer.pausedTime || 0) + pauseDuration;
              timer.isPaused = false;
              timer.pauseStart = undefined;
              logger.info(`▶️  Resumed timer for task: ${taskName}`);
            }
          }
        }
        
        // Update task
        timer.status = status;
        timer.taskName = taskName;
        if (metadata) {
          timer.metadata = { ...timer.metadata, ...metadata };
        }
        
        const elapsed = calculateElapsedTime(timer);
        const formattedTime = formatElapsedTime(elapsed);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              taskId,
              taskName,
              previousStatus,
              newStatus: status,
              timerActive: status === 'in-progress' && !timer.isPaused,
              isPaused: timer.isPaused || false,
              elapsedTime: formattedTime,
              elapsedMs: elapsed,
              startTime: timer.startTime?.toISOString(),
              endTime: timer.endTime?.toISOString(),
              metadata: timer.metadata,
              message: `Task "${taskName}" status updated: ${previousStatus} → ${status}${autoTimer ? ` (timer: ${formattedTime})` : ''}`
            }, null, 2)
          }]
        };
        
      } catch (error: any) {
        logger.error("Failed to update task status:", error);
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // ===== GET TASK TIMER INFO =====
  server.tool(
    "get_task_timer",
    "Get detailed timing information for a task",
    getTaskTimerSchema.shape,
    async (input) => {
      try {
        const timer = taskTimers.get(input.taskId);
        
        if (!timer) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Task not found",
                taskId: input.taskId
              }, null, 2)
            }],
            isError: true
          };
        }
        
        const elapsed = calculateElapsedTime(timer);
        const formattedTime = formatElapsedTime(elapsed);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              taskId: timer.taskId,
              taskName: timer.taskName,
              status: timer.status,
              isPaused: timer.isPaused || false,
              elapsedTime: formattedTime,
              elapsedMs: elapsed,
              totalPausedMs: timer.pausedTime || 0,
              totalPausedTime: formatElapsedTime(timer.pausedTime || 0),
              startTime: timer.startTime?.toISOString(),
              endTime: timer.endTime?.toISOString(),
              metadata: timer.metadata
            }, null, 2)
          }]
        };
        
      } catch (error: any) {
        logger.error("Failed to get task timer:", error);
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  // ===== LIST ALL TASKS =====
  server.tool(
    "list_tasks",
    "List all tasks with their current status and timing. Supports time-based sorting and aggregate statistics.",
    listTasksSchema.shape,
    async (input) => {
      try {
        const allTasks = Array.from(taskTimers.values());
        const filteredTasks = input.status === 'all' 
          ? allTasks 
          : allTasks.filter(t => t.status === input.status);
        
        const taskList = filteredTasks.map(timer => {
          const elapsed = calculateElapsedTime(timer);
          return {
            taskId: timer.taskId,
            taskName: timer.taskName,
            status: timer.status,
            isPaused: timer.isPaused || false,
            elapsedTime: formatElapsedTime(elapsed),
            elapsedMs: elapsed,
            startTime: timer.startTime?.toISOString(),
            endTime: timer.endTime?.toISOString(),
            metadata: timer.metadata
          };
        });
        
        // Apply sorting if specified
        if (input.sortBy) {
          switch (input.sortBy) {
            case 'longest-running':
              taskList.sort((a, b) => b.elapsedMs - a.elapsedMs);
              break;
            case 'recently-started':
              taskList.sort((a, b) => {
                const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
                const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
                return bTime - aTime; // Most recent first
              });
              break;
            case 'recently-completed':
              taskList.sort((a, b) => {
                const aTime = a.endTime ? new Date(a.endTime).getTime() : 0;
                const bTime = b.endTime ? new Date(b.endTime).getTime() : 0;
                return bTime - aTime; // Most recent first
              });
              break;
          }
        } else {
          // Default sort by status priority: in-progress, blocked, not-started, completed
          const statusPriority = { 'in-progress': 0, 'blocked': 1, 'not-started': 2, 'completed': 3 };
          taskList.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
        }
        
        const response: any = {
          totalTasks: taskList.length,
          filter: input.status,
          sortBy: input.sortBy,
          tasks: taskList,
          summary: {
            'not-started': taskList.filter(t => t.status === 'not-started').length,
            'in-progress': taskList.filter(t => t.status === 'in-progress').length,
            'completed': taskList.filter(t => t.status === 'completed').length,
            'blocked': taskList.filter(t => t.status === 'blocked').length
          }
        };
        
        // Add statistics if requested
        if (input.includeStats) {
          const activeTasks = taskList.filter(t => t.status === 'in-progress' && !t.isPaused);
          const completedTasks = taskList.filter(t => t.status === 'completed');
          
          const totalTime = taskList.reduce((sum, task) => sum + task.elapsedMs, 0);
          const averageTime = taskList.length > 0 ? totalTime / taskList.length : 0;
          const completedTotalTime = completedTasks.reduce((sum, task) => sum + task.elapsedMs, 0);
          const completedAverageTime = completedTasks.length > 0 ? completedTotalTime / completedTasks.length : 0;
          
          response.statistics = {
            totalTasks: taskList.length,
            activeCount: activeTasks.length,
            pausedCount: taskList.filter(t => t.isPaused).length,
            completedCount: completedTasks.length,
            totalTime: formatElapsedTime(totalTime),
            totalTimeMs: totalTime,
            averageTime: formatElapsedTime(averageTime),
            averageTimeMs: Math.round(averageTime),
            completedAverageTime: formatElapsedTime(completedAverageTime),
            completedAverageTimeMs: Math.round(completedAverageTime)
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(response, null, 2)
          }]
        };
        
      } catch (error: any) {
        logger.error("Failed to list tasks:", error);
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== PAUSE/RESUME TASK TIMER =====
  server.tool(
    "pause_resume_task_timer",
    "Manually pause or resume a task timer without changing status",
    pauseResumeTimerSchema.shape,
    async (input) => {
      try {
        const timer = taskTimers.get(input.taskId);
        
        if (!timer) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Task not found",
                taskId: input.taskId
              }, null, 2)
            }],
            isError: true
          };
        }
        
        const now = new Date();
        
        if (input.action === 'pause') {
          if (timer.isPaused) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  message: "Timer is already paused",
                  taskId: timer.taskId,
                  taskName: timer.taskName
                }, null, 2)
              }]
            };
          }
          
          timer.isPaused = true;
          timer.pauseStart = now;
          logger.info(`⏸️  Manually paused timer for: ${timer.taskName}`);
          
        } else if (input.action === 'resume') {
          if (!timer.isPaused) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  message: "Timer is not paused",
                  taskId: timer.taskId,
                  taskName: timer.taskName
                }, null, 2)
              }]
            };
          }
          
          if (timer.pauseStart) {
            const pauseDuration = now.getTime() - timer.pauseStart.getTime();
            timer.pausedTime = (timer.pausedTime || 0) + pauseDuration;
          }
          
          timer.isPaused = false;
          timer.pauseStart = undefined;
          logger.info(`▶️  Manually resumed timer for: ${timer.taskName}`);
        }
        
        const elapsed = calculateElapsedTime(timer);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              taskId: timer.taskId,
              taskName: timer.taskName,
              action: input.action,
              isPaused: timer.isPaused,
              elapsedTime: formatElapsedTime(elapsed),
              message: `Timer ${input.action}d for task "${timer.taskName}"`
            }, null, 2)
          }]
        };
        
      } catch (error: any) {
        logger.error("Failed to pause/resume timer:", error);
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
  
  logger.info("✓ Task tools with timer integration registered");
}
