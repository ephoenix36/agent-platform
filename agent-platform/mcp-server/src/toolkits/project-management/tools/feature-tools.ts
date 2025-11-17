/**
 * Project Management Tools - Feature Operations
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';

const featureStatusEnum = z.enum(['proposed', 'in-progress', 'ready', 'blocked', 'complete', 'archived'] as const);

export function registerFeatureTools(
  server: McpServer,
  service: ProjectManagementService,
): void {
  server.tool(
    'pm_create_feature',
    'Create a feature within an epic (supports overview, requirements, and acceptance)',
    {
      projectSlug: z.string().describe('Project slug'),
      epicRef: z.string().describe('Epic slug or ID'),
      name: z.string().min(1).describe('Feature name'),
      goal: z.string().describe('Feature goal'),
      owner: z.string().optional().describe('Feature owner'),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const).optional(),
      tags: z.array(z.string()).optional(),
      overview: z.object({
        summary: z.string().optional(),
        motivation: z.string().optional(),
        goals: z.array(z.string()).optional(),
      }).optional().describe('High-level overview details'),
      requirements: z.object({
        functional: z.array(z.string()).optional(),
        nonFunctional: z.array(z.string()).optional(),
      }).optional().describe('Requirement breakdown'),
      acceptance: z.array(z.string()).optional().describe('Acceptance criteria'),
      metrics: z.record(z.number()).optional().describe('Feature-specific metrics'),
    },
    async ({ projectSlug, epicRef, name, goal, owner, priority, tags, overview, requirements, acceptance, metrics }) => {
      try {
        const feature = service.createFeature(projectSlug, epicRef, {
          name,
          goal,
          owner,
          priority,
          tags,
          overview,
          requirements,
          acceptance,
          metrics,
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, feature, message: `✅ Feature "${feature.name}" created` }, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2) }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_get_feature',
    'Get detailed feature information',
    {
      projectSlug: z.string().describe('Project slug'),
      featureRef: z.string().describe('Feature slug or ID'),
      epicRef: z.string().optional().describe('Optional epic slug/ID for faster lookup'),
    },
    async ({ projectSlug, featureRef, epicRef }) => {
      try {
        const feature = service.getFeature(projectSlug, featureRef, epicRef);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, feature }, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2) }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_list_features',
    'List features, optionally filtering by epic/status/tags',
    {
      projectSlug: z.string().describe('Project slug'),
      epicRef: z.string().optional().describe('Epic slug or ID'),
      status: featureStatusEnum.optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ projectSlug, epicRef, status, tags }) => {
      try {
        const features = service.listFeatures(projectSlug, { epicRef, status, tags });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, total: features.length, features }, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2) }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_update_feature',
    'Update feature metadata, requirements, or status',
    {
      projectSlug: z.string().describe('Project slug'),
      featureRef: z.string().describe('Feature slug or ID'),
      epicRef: z.string().optional().describe('Epic slug or ID of the feature'),
      name: z.string().optional(),
      goal: z.string().optional(),
      owner: z.string().optional(),
      priority: z.enum(['critical', 'high', 'medium', 'low'] as const).optional(),
      status: featureStatusEnum.optional(),
      tags: z.array(z.string()).optional(),
      overview: z.object({
        summary: z.string().optional(),
        motivation: z.string().optional(),
        goals: z.array(z.string()).optional(),
      }).optional(),
      requirements: z.object({
        functional: z.array(z.string()).optional(),
        nonFunctional: z.array(z.string()).optional(),
      }).optional(),
      acceptance: z.array(z.string()).optional(),
      metrics: z.record(z.number()).optional(),
    },
    async ({ projectSlug, featureRef, epicRef, name, goal, owner, priority, status, tags, overview, requirements, acceptance, metrics }) => {
      try {
        const feature = service.updateFeature(projectSlug, featureRef, {
          name,
          goal,
          owner,
          priority,
          status,
          tags,
          overview,
          requirements,
          acceptance,
          metrics,
        }, epicRef);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, feature, message: `✅ Feature ${feature.slug} updated` }, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2) }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_link_task_to_feature',
    'Associate an existing task with a feature (and its epic)',
    {
      projectSlug: z.string().describe('Project slug'),
      featureRef: z.string().describe('Feature slug or ID'),
      taskId: z.string().describe('Task ID to link'),
      epicRef: z.string().optional().describe('Epic slug/ID for disambiguation'),
    },
    async ({ projectSlug, featureRef, taskId, epicRef }) => {
      try {
        const result = service.linkTaskToFeature(projectSlug, featureRef, taskId, epicRef);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, feature: result.feature, task: result.task, message: `🔗 Task ${result.task.number} linked to feature ${result.feature.slug}` }, null, 2),
          }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2) }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'pm_get_feature_progress',
    'Summarize progress for a feature based on linked tasks',
    {
      projectSlug: z.string().describe('Project slug'),
      featureRef: z.string().describe('Feature slug or ID'),
      epicRef: z.string().optional(),
    },
    async ({ projectSlug, featureRef, epicRef }) => {
      try {
        const progress = service.getFeatureProgress(projectSlug, featureRef, epicRef);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, progress }, null, 2) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' }, null, 2) }],
          isError: true,
        };
      }
    },
  );
}
