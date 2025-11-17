/**
 * Project Management Tools - Task Operations
 * 
 * MCP tools for creating and managing tasks.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';

/**
 * Register task management tools
 */
export function registerTaskTools(
  server: McpServer,
  service: ProjectManagementService
): void {
  
  // ==================== CREATE_TASK ====================
  
  server.tool(
    'pm_create_task',
    'Create a new task in a project (optionally assigned to a sprint)',
    {
      projectSlug: z.string().describe('Project slug'),
      title: z.string().min(1).describe('Task title'),
      description: z.string().describe('Detailed task description'),
      type: z.enum(['feature', 'bug', 'refactor', 'docs', 'test', 'chore', 'research', 'design'] as const)
        .describe('Task type'),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const)
        .describe('Task priority'),
      sprintId: z.string().optional().describe('Sprint ID to assign task to (leave empty for backlog)'),
      assignee: z.string().optional().describe('User assigned to this task'),
      reviewer: z.string().optional().describe('Code reviewer'),
      dueDate: z.string().optional().describe('Due date (ISO 8601)'),
      points: z.number().optional().describe('Story points estimate'),
      hours: z.number().optional().describe('Hour estimate'),
      complexity: z.enum(['low', 'medium', 'high', 'critical'] as const).optional().describe('Complexity level'),
      acceptanceCriteria: z.array(z.string()).optional().describe('List of acceptance criteria'),
      dependencies: z.array(z.string()).optional().describe('Task IDs this task depends on'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
      labels: z.array(z.string()).optional().describe('Labels (e.g., bug, feature, refactor)'),
      parentId: z.string().optional().describe('Parent task ID (for subtasks)'),
      epicRef: z.string().optional().describe('Epic slug or ID to associate'),
      featureRef: z.string().optional().describe('Feature slug or ID to associate'),
    },
    async ({
      projectSlug,
      title,
      description,
      type,
      priority,
      sprintId,
      assignee,
      reviewer,
      dueDate,
      points,
      hours,
      complexity,
      acceptanceCriteria,
      dependencies,
      tags,
      labels,
      parentId,
      epicRef,
      featureRef,
    }) => {
      try {
        let resolvedFeatureId: string | undefined;
        let resolvedEpicId: string | undefined;
        if (featureRef) {
          const feature = service.getFeature(projectSlug, featureRef, epicRef);
          resolvedFeatureId = feature.id;
          resolvedEpicId = feature.epicId;
        } else if (epicRef) {
          const epic = service.getEpic(projectSlug, epicRef);
          resolvedEpicId = epic.id;
        }
        
        const task = service.createTask(projectSlug, {
          projectId: '', // Service will set this
          title,
          description,
          type,
          priority,
          sprintId,
          assignee,
          reviewer,
          dueDate,
          points,
          hours,
          complexity,
          acceptanceCriteria,
          dependencies,
          tags,
          labels,
          parentId,
          epicId: resolvedEpicId,
          featureId: resolvedFeatureId,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                task: {
                  id: task.id,
                  number: task.number,
                  title: task.title,
                  status: task.status,
                  priority: task.priority,
                  type: task.type,
                  assignee: task.assignment.assignee,
                  sprintId: task.sprintId,
                },
                message: `✅ Task ${task.number} "${task.title}" created successfully`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== GET_TASK ====================
  
  server.tool(
    'pm_get_task',
    'Get detailed information about a task',
    {
      projectSlug: z.string().describe('Project slug'),
      taskId: z.string().describe('Task ID'),
    },
    async ({ projectSlug, taskId }) => {
      try {
        const task = service.getTask(projectSlug, taskId);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                task,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== UPDATE_TASK ====================
  
  server.tool(
    'pm_update_task',
    'Update task properties, status, assignment, or estimates',
    {
      projectSlug: z.string().describe('Project slug'),
      taskId: z.string().describe('Task ID'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      status: z.enum(['pending', 'in-progress', 'blocked', 'review', 'complete', 'archived'] as const)
        .optional()
        .describe('Task status'),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const).optional(),
      type: z.enum(['feature', 'bug', 'refactor', 'docs', 'test', 'chore', 'research', 'design'] as const).optional(),
      assignee: z.string().optional().describe('User assigned to this task'),
      reviewer: z.string().optional().describe('Code reviewer'),
      dueDate: z.string().optional().describe('Due date (ISO 8601)'),
      points: z.number().optional().describe('Story points estimate'),
      hours: z.number().optional().describe('Hour estimate'),
      complexity: z.enum(['low', 'medium', 'high', 'critical'] as const).optional(),
      acceptanceCriteria: z.array(z.string()).optional().describe('List of acceptance criteria'),
      tags: z.array(z.string()).optional().describe('Tags'),
      labels: z.array(z.string()).optional().describe('Labels'),
      epicRef: z.union([z.string(), z.null()]).optional().describe('Set/unset epic reference'),
      featureRef: z.union([z.string(), z.null()]).optional().describe('Set/unset feature reference'),
    },
    async ({
      projectSlug,
      taskId,
      title,
      description,
      status,
      priority,
      type,
      assignee,
      reviewer,
      dueDate,
      points,
      hours,
      complexity,
      acceptanceCriteria,
      tags,
      labels,
      epicRef,
      featureRef,
    }) => {
      try {
        let resolvedFeatureId: string | null | undefined;
        if (featureRef !== undefined) {
          resolvedFeatureId = featureRef === null ? null : service.getFeature(projectSlug, featureRef).id;
        }
        let resolvedEpicId: string | null | undefined;
        if (epicRef !== undefined) {
          resolvedEpicId = epicRef === null ? null : service.getEpic(projectSlug, epicRef).id;
        }
        const task = service.updateTask(projectSlug, taskId, {
          title,
          description,
          status,
          priority,
          type,
          assignee,
          reviewer,
          dueDate,
          points,
          hours,
          complexity,
          acceptanceCriteria,
          tags,
          labels,
          epicId: resolvedEpicId,
          featureId: resolvedFeatureId,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                task: {
                  id: task.id,
                  number: task.number,
                  title: task.title,
                  status: task.status,
                  priority: task.priority,
                  timeline: task.timeline,
                },
                message: `✅ Task ${task.number} updated successfully`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== LIST_TASKS ====================
  
  server.tool(
    'pm_list_tasks',
    'List tasks in a project with optional filtering',
    {
      projectSlug: z.string().describe('Project slug'),
      sprintId: z.string().optional().describe('Filter by sprint ID'),
      status: z.enum(['pending', 'in-progress', 'blocked', 'review', 'complete', 'archived'] as const)
        .optional()
        .describe('Filter by status'),
      assignee: z.string().optional().describe('Filter by assignee'),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const).optional(),
      type: z.enum(['feature', 'bug', 'refactor', 'docs', 'test', 'chore', 'research', 'design'] as const).optional(),
      tags: z.array(z.string()).optional().describe('Filter by tags (OR logic)'),
      epicRef: z.string().optional().describe('Filter by epic slug or ID'),
      featureRef: z.string().optional().describe('Filter by feature slug or ID'),
    },
    async ({ projectSlug, sprintId, status, assignee, priority, type, tags, epicRef, featureRef }) => {
      try {
        let filterFeatureId: string | undefined;
        let filterEpicId: string | undefined;
        if (featureRef) {
          const feature = service.getFeature(projectSlug, featureRef, epicRef);
          filterFeatureId = feature.id;
          filterEpicId = feature.epicId;
        } else if (epicRef) {
          const epic = service.getEpic(projectSlug, epicRef);
          filterEpicId = epic.id;
        }
        const tasks = service.listTasks(projectSlug, {
          sprintId,
          status,
          assignee,
          priority,
          type,
          tags,
          epicId: filterEpicId,
          featureId: filterFeatureId,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                total: tasks.length,
                tasks: tasks.map(t => ({
                  id: t.id,
                  number: t.number,
                  title: t.title,
                  status: t.status,
                  priority: t.priority,
                  type: t.type,
                  assignee: t.assignment.assignee,
                  created: t.timeline.created,
                  updated: t.timeline.updated,
                })),
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== MOVE_TASK ====================
  
  server.tool(
    'pm_move_task',
    'Move a task to a different status (convenience wrapper for update_task)',
    {
      projectSlug: z.string().describe('Project slug'),
      taskId: z.string().describe('Task ID'),
      toStatus: z.enum(['pending', 'in-progress', 'blocked', 'review', 'complete', 'archived'] as const)
        .describe('Target status'),
      reason: z.string().optional().describe('Reason for status change'),
    },
    async ({ projectSlug, taskId, toStatus, reason }) => {
      try {
        const task = service.updateTask(projectSlug, taskId, {
          status: toStatus,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                task: {
                  id: task.id,
                  number: task.number,
                  title: task.title,
                  status: task.status,
                  timeline: task.timeline,
                },
                message: `✅ Task ${task.number} moved to ${toStatus}${reason ? `: ${reason}` : ''}`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== ADD_TASK_COMMENT ====================
  
  server.tool(
    'pm_add_task_comment',
    'Add a comment to a task',
    {
      projectSlug: z.string().describe('Project slug'),
      taskId: z.string().describe('Task ID'),
      author: z.string().describe('Comment author'),
      content: z.string().describe('Comment text'),
    },
    async ({ projectSlug, taskId, author, content }) => {
      try {
        const task = service.addComment(projectSlug, taskId, author, content);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                comment: task.tracking.comments[task.tracking.comments.length - 1],
                message: `💬 Comment added to task ${task.number}`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== ADD_TASK_ATTACHMENT ====================
  
  server.tool(
    'pm_add_task_attachment',
    'Add an attachment to a task',
    {
      projectSlug: z.string().describe('Project slug'),
      taskId: z.string().describe('Task ID'),
      name: z.string().describe('Attachment filename'),
      path: z.string().describe('Path to attachment file (relative to sprint/attachments)'),
      type: z.string().describe('MIME type (e.g., image/png, application/pdf)'),
      size: z.number().describe('File size in bytes'),
      uploadedBy: z.string().describe('User who uploaded the file'),
    },
    async ({ projectSlug, taskId, name, path, type, size, uploadedBy }) => {
      try {
        const task = service.addAttachment(projectSlug, taskId, {
          name,
          path,
          type,
          size,
          uploadedBy,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                attachment: task.tracking.attachments[task.tracking.attachments.length - 1],
                message: `📎 Attachment "${name}" added to task ${task.number}`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== CREATE_SUBTASK ====================
  
  server.tool(
    'pm_create_subtask',
    'Create a subtask linked to a parent task',
    {
      projectSlug: z.string().describe('Project slug'),
      parentTaskId: z.string().describe('Parent task ID'),
      title: z.string().min(1).describe('Subtask title'),
      description: z.string().describe('Subtask description'),
      type: z.enum(['feature', 'bug', 'refactor', 'docs', 'test', 'chore', 'research', 'design'] as const)
        .describe('Task type'),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const)
        .describe('Task priority'),
      assignee: z.string().optional().describe('Assigned user'),
      hours: z.number().optional().describe('Hour estimate'),
    },
    async ({ projectSlug, parentTaskId, title, description, type, priority, assignee, hours }) => {
      try {
        const parentTask = service.getTask(projectSlug, parentTaskId);
        
        const subtask = service.createTask(projectSlug, {
          projectId: parentTask.projectId,
          sprintId: parentTask.sprintId,
          title,
          description,
          type,
          priority,
          assignee,
          hours,
          parentId: parentTaskId,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                subtask: {
                  id: subtask.id,
                  number: subtask.number,
                  title: subtask.title,
                  parentId: subtask.relationships.parent,
                },
                message: `✅ Subtask ${subtask.number} created under parent task ${parentTask.number}`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== GET_TASK_DEPENDENCIES ====================
  
  server.tool(
    'pm_get_task_dependencies',
    'Get all tasks that a task depends on or blocks',
    {
      projectSlug: z.string().describe('Project slug'),
      taskId: z.string().describe('Task ID'),
    },
    async ({ projectSlug, taskId }) => {
      try {
        const task = service.getTask(projectSlug, taskId);
        
        // Load dependency tasks
        const dependencies = task.relationships.dependencies.map(depId => {
          try {
            return service.getTask(projectSlug, depId);
          } catch {
            return null;
          }
        }).filter((t): t is NonNullable<typeof t> => t !== null);
        
        // Load blocked tasks
        const blockedTasks = task.relationships.blocks.map(blockId => {
          try {
            return service.getTask(projectSlug, blockId);
          } catch {
            return null;
          }
        }).filter((t): t is NonNullable<typeof t> => t !== null);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                task: {
                  id: task.id,
                  number: task.number,
                  title: task.title,
                },
                dependencies: dependencies.map(d => ({
                  id: d.id,
                  number: d.number,
                  title: d.title,
                  status: d.status,
                })),
                blocks: blockedTasks.map(b => ({
                  id: b.id,
                  number: b.number,
                  title: b.title,
                  status: b.status,
                })),
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
  
  // ==================== BATCH_UPDATE_TASKS ====================
  
  server.tool(
    'pm_batch_update_tasks',
    'Update multiple tasks at once with the same changes',
    {
      projectSlug: z.string().describe('Project slug'),
      taskIds: z.array(z.string()).describe('Array of task IDs to update'),
      updates: z.object({
        status: z.enum(['pending', 'in-progress', 'blocked', 'review', 'complete', 'archived'] as const).optional(),
        priority: z.enum(['critical', 'high', 'medium', 'low'] as const).optional(),
        assignee: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }).describe('Updates to apply to all tasks'),
    },
    async ({ projectSlug, taskIds, updates }) => {
      try {
        const results = await Promise.all(
          taskIds.map(async (taskId) => {
            try {
              const task = service.updateTask(projectSlug, taskId, updates);
              return {
                taskId,
                number: task.number,
                success: true,
              };
            } catch (error: any) {
              return {
                taskId,
                success: false,
                error: error.message,
              };
            }
          })
        );
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                summary: {
                  total: taskIds.length,
                  successful: successful.length,
                  failed: failed.length,
                },
                results,
                message: `✅ Batch update completed: ${successful.length} success, ${failed.length} failed`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
