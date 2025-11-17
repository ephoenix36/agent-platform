/**
 * Project Management Tools - Sprint Operations
 * 
 * MCP tools for creating and managing sprints.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';

/**
 * Register sprint management tools
 */
export function registerSprintTools(
  server: McpServer,
  service: ProjectManagementService
): void {
  
  // ==================== CREATE_SPRINT ====================
  
  server.tool(
    'pm_create_sprint',
    'Create a new sprint within a project',
    {
      projectSlug: z.string().describe('Project slug'),
      name: z.string().describe('Sprint name/theme'),
      startDate: z.string().describe('Sprint start date (ISO 8601)'),
      duration: z.number().positive().optional().describe('Sprint duration in days (defaults to project setting)'),
      goals: z.object({
        primary: z.array(z.string()).optional().describe('Must-have objectives'),
        secondary: z.array(z.string()).optional().describe('Nice-to-have objectives'),
        metrics: z.record(z.number()).optional().describe('Success metrics (key-value pairs)'),
      }).optional().describe('Sprint goals'),
    },
    async ({ projectSlug, name, startDate, duration, goals }) => {
      try {
        const sprint = service.createSprint(projectSlug, {
          projectId: '', // Service will set this
          name,
          startDate,
          duration,
          goals,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                sprint: {
                  id: sprint.id,
                  number: sprint.number,
                  name: sprint.name,
                  status: sprint.status,
                  schedule: sprint.schedule,
                  goals: sprint.goals,
                  paths: sprint.paths,
                },
                message: `✅ Sprint ${sprint.number} "${sprint.name}" created successfully`,
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
  
  // ==================== GET_SPRINT ====================
  
  server.tool(
    'pm_get_sprint',
    'Get detailed information about a sprint',
    {
      projectSlug: z.string().describe('Project slug'),
      sprintNumber: z.number().positive().describe('Sprint number (1, 2, 3...)'),
    },
    async ({ projectSlug, sprintNumber }) => {
      try {
        const sprint = service.getSprint(projectSlug, sprintNumber);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                sprint,
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
  
  // ==================== UPDATE_SPRINT ====================
  
  server.tool(
    'pm_update_sprint',
    'Update sprint details, status, or goals',
    {
      projectSlug: z.string().describe('Project slug'),
      sprintNumber: z.number().positive().describe('Sprint number'),
      name: z.string().optional().describe('New sprint name'),
      status: z.enum(['planned', 'active', 'completed', 'archived'] as const)
        .optional()
        .describe('Sprint status'),
      startDate: z.string().optional().describe('New start date (ISO 8601)'),
      endDate: z.string().optional().describe('New end date (ISO 8601)'),
      goals: z.object({
        primary: z.array(z.string()).optional(),
        secondary: z.array(z.string()).optional(),
        metrics: z.record(z.number()).optional(),
      }).optional().describe('Updated goals (merged with existing)'),
    },
    async ({ projectSlug, sprintNumber, name, status, startDate, endDate, goals }) => {
      try {
        const sprint = service.updateSprint(projectSlug, sprintNumber, {
          name,
          status,
          startDate,
          endDate,
          goals,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                sprint,
                message: `✅ Sprint ${sprint.number} "${sprint.name}" updated successfully`,
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
  
  // ==================== LIST_SPRINTS ====================
  
  server.tool(
    'pm_list_sprints',
    'List all sprints in a project with optional filtering',
    {
      projectSlug: z.string().describe('Project slug'),
      status: z.enum(['planned', 'active', 'completed', 'archived'] as const)
        .optional()
        .describe('Filter by sprint status'),
      limit: z.number().positive().optional().describe('Maximum number of sprints to return'),
    },
    async ({ projectSlug, status, limit }) => {
      try {
        const sprints = service.listSprints(projectSlug, {
          status,
          limit,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                total: sprints.length,
                sprints: sprints.map(s => ({
                  id: s.id,
                  number: s.number,
                  name: s.name,
                  status: s.status,
                  schedule: s.schedule,
                  stats: s.stats,
                  goals: s.goals,
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
  
  // ==================== COMPLETE_SPRINT ====================
  
  server.tool(
    'pm_complete_sprint',
    'Mark a sprint as completed and set actual end date',
    {
      projectSlug: z.string().describe('Project slug'),
      sprintNumber: z.number().positive().describe('Sprint number to complete'),
    },
    async ({ projectSlug, sprintNumber }) => {
      try {
        const sprint = service.updateSprint(projectSlug, sprintNumber, {
          status: 'completed',
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                sprint: {
                  id: sprint.id,
                  number: sprint.number,
                  name: sprint.name,
                  status: sprint.status,
                  schedule: sprint.schedule,
                  stats: sprint.stats,
                },
                message: `🎉 Sprint ${sprint.number} "${sprint.name}" marked as completed`,
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
  
  // ==================== ARCHIVE_SPRINT ====================
  
  server.tool(
    'pm_archive_sprint',
    'Archive a sprint (marks as archived but preserves data)',
    {
      projectSlug: z.string().describe('Project slug'),
      sprintNumber: z.number().positive().describe('Sprint number to archive'),
    },
    async ({ projectSlug, sprintNumber }) => {
      try {
        const sprint = service.updateSprint(projectSlug, sprintNumber, {
          status: 'archived',
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                sprint: {
                  id: sprint.id,
                  number: sprint.number,
                  name: sprint.name,
                  status: sprint.status,
                },
                message: `📦 Sprint ${sprint.number} "${sprint.name}" has been archived`,
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
