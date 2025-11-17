/**
 * Project Management Tools - Epic Operations
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';

const epicStatusEnum = z.enum(['planned', 'active', 'completed', 'archived'] as const);

export function registerEpicTools(
  server: McpServer,
  service: ProjectManagementService,
): void {
  server.tool(
    'pm_create_epic',
    'Create a new epic under a project to group features and tasks',
    {
      projectSlug: z.string().describe('Project slug'),
      name: z.string().min(1).describe('Epic name'),
      objective: z.string().describe('Primary objective for this epic'),
      owner: z.string().describe('Epic owner/lead'),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const).optional().describe('Priority weighting'),
      tags: z.array(z.string()).optional().describe('Tags for filtering'),
      successCriteria: z.array(z.string()).optional().describe('Definition of epic success'),
      metrics: z.record(z.number()).optional().describe('Key metric baselines'),
    },
    async ({ projectSlug, name, objective, owner, priority, tags, successCriteria, metrics }) => {
      try {
        const epic = service.createEpic(projectSlug, {
          name,
          objective,
          owner,
          priority,
          tags,
          successCriteria,
          metrics,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              epic,
              message: `✅ Epic "${epic.name}" created for project ${projectSlug}`,
            }, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2),
          }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_get_epic',
    'Get detailed information about an epic by slug or ID',
    {
      projectSlug: z.string().describe('Project slug'),
      epicRef: z.string().describe('Epic slug or ID'),
    },
    async ({ projectSlug, epicRef }) => {
      try {
        const epic = service.getEpic(projectSlug, epicRef);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, epic }, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2),
          }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_list_epics',
    'List epics in a project with optional filters',
    {
      projectSlug: z.string().describe('Project slug'),
      status: epicStatusEnum.optional().describe('Filter by status'),
      tags: z.array(z.string()).optional().describe('Filter by tags (OR logic)'),
      search: z.string().optional().describe('Match name/objective text'),
    },
    async ({ projectSlug, status, tags, search }) => {
      try {
        const epics = service.listEpics(projectSlug, { status, tags, search });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, total: epics.length, epics }, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2),
          }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_update_epic',
    'Update epic metadata, ownership, or status',
    {
      projectSlug: z.string().describe('Project slug'),
      epicRef: z.string().describe('Epic slug or ID'),
      name: z.string().optional().describe('New name'),
      objective: z.string().optional().describe('Updated objective'),
      owner: z.string().optional().describe('New owner'),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const).optional(),
      status: epicStatusEnum.optional().describe('Lifecycle status'),
      tags: z.array(z.string()).optional().describe('Replace tag list'),
      successCriteria: z.array(z.string()).optional().describe('Updated success checklist'),
      metrics: z.record(z.number()).optional().describe('Updated metric targets'),
    },
    async ({ projectSlug, epicRef, name, objective, owner, priority, status, tags, successCriteria, metrics }) => {
      try {
        const epic = service.updateEpic(projectSlug, epicRef, {
          name,
          objective,
          owner,
          priority,
          status,
          tags,
          successCriteria,
          metrics,
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, epic, message: `✅ Epic ${epic.slug} updated` }, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2),
          }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_complete_epic',
    'Mark an epic as completed (moves to completed status)',
    {
      projectSlug: z.string().describe('Project slug'),
      epicRef: z.string().describe('Epic slug or ID'),
    },
    async ({ projectSlug, epicRef }) => {
      try {
        const epic = service.updateEpic(projectSlug, epicRef, { status: 'completed' });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, epic, message: `🏁 Epic ${epic.slug} completed` }, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2),
          }],
          isError: true,
        };
      }
    },
  );
}
