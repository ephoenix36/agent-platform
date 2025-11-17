/**
 * Project Management Tools - Project Operations
 * 
 * MCP tools for creating and managing projects.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';
import {
  ProjectStatus,
  TemplateType,
} from '../../../types/project-management.js';

/**
 * Register project management tools
 */
export function registerProjectTools(
  server: McpServer,
  service: ProjectManagementService
): void {
  
  // ==================== CREATE_PROJECT ====================
  
  server.tool(
    'pm_create_project',
    'Create a new project with directory structure, metadata, and settings',
    {
      name: z.string().min(1).describe('Project name (will be slugified for filesystem)'),
      description: z.string().describe('Brief description of the project'),
      owner: z.string().describe('Owner/creator identifier'),
      tags: z.array(z.string()).optional().describe('Categorization tags'),
      sprintDuration: z.number().positive().default(14).describe('Default sprint duration in days'),
      timezone: z.string().default('UTC').describe('Project timezone (IANA format)'),
      templateType: z.enum(['typescript-react', 'python-fastapi', 'rust', 'nodejs', 'custom'] as const)
        .optional()
        .describe('Project template type'),
      initializeTemplates: z.boolean().default(true).describe('Generate starter documentation'),
    },
    async ({ name, description, owner, tags, sprintDuration, timezone, templateType, initializeTemplates }) => {
      try {
        const project = service.createProject({
          name,
          description,
          owner,
          tags,
          sprintDuration,
          timezone,
          templateType,
          initializeTemplates,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                project: {
                  id: project.id,
                  slug: project.slug,
                  name: project.name,
                  description: project.description,
                  status: project.status,
                  owner: project.metadata.owner,
                  created: project.metadata.created,
                  paths: project.paths,
                },
                message: `✅ Project "${project.name}" created successfully at ${project.paths.root}`,
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
  
  // ==================== GET_PROJECT ====================
  
  server.tool(
    'pm_get_project',
    'Get detailed information about a project by slug',
    {
      slug: z.string().describe('Project slug (URL-friendly identifier)'),
    },
    async ({ slug }) => {
      try {
        const project = service.getProject(slug);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                project,
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
  
  // ==================== UPDATE_PROJECT ====================
  
  server.tool(
    'pm_update_project',
    'Update project metadata, settings, or status',
    {
      slug: z.string().describe('Project slug'),
      name: z.string().optional().describe('New project name'),
      description: z.string().optional().describe('New description'),
      status: z.enum(['active', 'on-hold', 'completed', 'archived'] as const)
        .optional()
        .describe('Project status'),
      tags: z.array(z.string()).optional().describe('New tags (replaces existing)'),
      settings: z.object({
        sprintDuration: z.number().positive().optional(),
        timezone: z.string().optional(),
        defaultAssignee: z.string().optional(),
        requireApproval: z.boolean().optional(),
        autoArchiveDays: z.number().positive().optional(),
        templateType: z.enum(['typescript-react', 'python-fastapi', 'rust', 'nodejs', 'custom'] as const).optional(),
      }).optional().describe('Project settings to update'),
    },
    async ({ slug, name, description, status, tags, settings }) => {
      try {
        const project = service.updateProject(slug, {
          name,
          description,
          status,
          tags,
          settings,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                project,
                message: `✅ Project "${project.name}" updated successfully`,
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
  
  // ==================== LIST_PROJECTS ====================
  
  server.tool(
    'pm_list_projects',
    'List all projects with optional filtering',
    {
      status: z.enum(['active', 'on-hold', 'completed', 'archived'] as const)
        .optional()
        .describe('Filter by project status'),
      owner: z.string().optional().describe('Filter by owner'),
      tags: z.array(z.string()).optional().describe('Filter by tags (OR logic)'),
      search: z.string().optional().describe('Search in name and description'),
    },
    async ({ status, owner, tags, search }) => {
      try {
        const projects = service.listProjects({
          status,
          owner,
          tags,
          search,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                total: projects.length,
                projects: projects.map(p => ({
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  description: p.description,
                  status: p.status,
                  owner: p.metadata.owner,
                  created: p.metadata.created,
                  updated: p.metadata.updated,
                  stats: p.stats,
                  tags: p.metadata.tags,
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
  
  // ==================== ARCHIVE_PROJECT ====================
  
  server.tool(
    'pm_archive_project',
    'Archive a project (marks as archived but preserves data)',
    {
      slug: z.string().describe('Project slug to archive'),
    },
    async ({ slug }) => {
      try {
        const project = service.archiveProject(slug);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                project: {
                  id: project.id,
                  slug: project.slug,
                  name: project.name,
                  status: project.status,
                },
                message: `📦 Project "${project.name}" has been archived`,
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
  
  // ==================== DELETE_PROJECT ====================
  
  server.tool(
    'pm_delete_project',
    'Permanently delete a project and all its data (WARNING: Cannot be undone)',
    {
      slug: z.string().describe('Project slug to delete'),
      confirm: z.boolean().describe('Must be true to confirm deletion'),
    },
    async ({ slug, confirm }) => {
      try {
        if (!confirm) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Deletion not confirmed. Set confirm=true to proceed.',
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
        
        // Get project name before deletion
        const project = service.getProject(slug);
        const projectName = project.name;
        
        service.deleteProject(slug);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `🗑️ Project "${projectName}" has been permanently deleted`,
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
