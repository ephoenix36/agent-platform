/**
 * Project Management Tools - Memory & Context Operations
 * 
 * MCP tools for managing project memory, decisions, and context.
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';
import type { ProjectMemory, Decision, LessonLearned, ActivityLog } from '../../../types/project-management.js';

/**
 * Register memory and context management tools
 */
export function registerMemoryTools(
  server: McpServer,
  service: ProjectManagementService
): void {
  
  // ==================== SAVE_PROJECT_DECISION ====================
  
  server.tool(
    'pm_save_decision',
    'Save an important project decision to memory',
    {
      projectSlug: z.string().describe('Project slug'),
      title: z.string().describe('Decision title'),
      description: z.string().describe('Decision description'),
      rationale: z.string().describe('Why this decision was made'),
      author: z.string().describe('Decision maker'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async ({ projectSlug, title, description, rationale, author, tags }) => {
      try {
        const project = service.getProject(projectSlug);
        const memoryPath = path.join(project.paths.memory, 'memory.json');
        
        let memory: ProjectMemory;
        if (fs.existsSync(memoryPath)) {
          memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
        } else {
          memory = {
            decisions: [],
            lessonsLearned: [],
            context: {
              currentPhase: 'planning',
              activeMilestones: [],
              recentChanges: [],
              blockers: [],
              nextSteps: [],
              updated: new Date().toISOString(),
            },
          };
        }
        
        const decision: Decision = {
          id: uuidv4(),
          title,
          description,
          rationale,
          timestamp: new Date().toISOString(),
          author,
          tags: tags || [],
          status: 'accepted',
        };
        
        memory.decisions.push(decision);
        fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                decision,
                message: `✅ Decision "${title}" saved to project memory`,
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
  
  // ==================== SAVE_LESSON_LEARNED ====================
  
  server.tool(
    'pm_save_lesson',
    'Save a lesson learned to project memory',
    {
      projectSlug: z.string().describe('Project slug'),
      title: z.string().describe('Lesson title'),
      description: z.string().describe('Lesson description'),
      category: z.enum(['technical', 'process', 'people', 'tools'] as const).describe('Lesson category'),
      impact: z.enum(['high', 'medium', 'low'] as const).describe('Impact level'),
      author: z.string().describe('Author'),
      tags: z.array(z.string()).optional().describe('Tags for categorization'),
    },
    async ({ projectSlug, title, description, category, impact, author, tags }) => {
      try {
        const project = service.getProject(projectSlug);
        const memoryPath = path.join(project.paths.memory, 'memory.json');
        
        let memory: ProjectMemory;
        if (fs.existsSync(memoryPath)) {
          memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
        } else {
          memory = {
            decisions: [],
            lessonsLearned: [],
            context: {
              currentPhase: 'planning',
              activeMilestones: [],
              recentChanges: [],
              blockers: [],
              nextSteps: [],
              updated: new Date().toISOString(),
            },
          };
        }
        
        const lesson: LessonLearned = {
          id: uuidv4(),
          title,
          description,
          category,
          impact,
          timestamp: new Date().toISOString(),
          author,
          tags: tags || [],
        };
        
        memory.lessonsLearned.push(lesson);
        fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2), 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                lesson,
                message: `✅ Lesson "${title}" saved to project memory`,
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
  
  // ==================== GET_PROJECT_CONTEXT ====================
  
  server.tool(
    'pm_get_context',
    'Get comprehensive project context including memory, standards, and recent activity',
    {
      projectSlug: z.string().describe('Project slug'),
      includeStandards: z.boolean().default(true).describe('Include standards doc'),
      includeRoadmap: z.boolean().default(true).describe('Include roadmap doc'),
      recentActivityLimit: z.number().default(10).describe('Number of recent activities to include'),
    },
    async ({ projectSlug, includeStandards, includeRoadmap, recentActivityLimit }) => {
      try {
        const project = service.getProject(projectSlug);
        
        // Load memory
        const memoryPath = path.join(project.paths.memory, 'memory.json');
        let memory: ProjectMemory | null = null;
        if (fs.existsSync(memoryPath)) {
          memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
        }
        
        // Load standards
        let standards: string | null = null;
        if (includeStandards) {
          const standardsPath = path.join(project.paths.docs, 'STANDARDS.md');
          if (fs.existsSync(standardsPath)) {
            standards = fs.readFileSync(standardsPath, 'utf-8');
          }
        }
        
        // Load roadmap
        let roadmap: string | null = null;
        if (includeRoadmap) {
          const roadmapPath = path.join(project.paths.docs, 'ROADMAP.md');
          if (fs.existsSync(roadmapPath)) {
            roadmap = fs.readFileSync(roadmapPath, 'utf-8');
          }
        }
        
        // Get active sprint
        const sprints = service.listSprints(projectSlug, { status: 'active', limit: 1 });
        const activeSprint = sprints[0] || null;
        
        // Get active tasks
        const activeTasks = service.listTasks(projectSlug, {
          status: 'in-progress',
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                context: {
                  project: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    stats: project.stats,
                  },
                  standards,
                  roadmap,
                  memory,
                  activeSprint: activeSprint ? {
                    number: activeSprint.number,
                    name: activeSprint.name,
                    goals: activeSprint.goals,
                    stats: activeSprint.stats,
                  } : null,
                  activeTasks: activeTasks.map(t => ({
                    id: t.id,
                    number: t.number,
                    title: t.title,
                    priority: t.priority,
                    assignee: t.assignment.assignee,
                  })),
                },
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
  
  // ==================== GET_PROJECT_ACTIVITY ====================
  
  server.tool(
    'pm_get_activity',
    'Get recent project activity log',
    {
      projectSlug: z.string().describe('Project slug'),
      limit: z.number().default(20).describe('Number of activities to return'),
      sprintNumber: z.number().optional().describe('Filter by sprint number'),
    },
    async ({ projectSlug, limit, sprintNumber }) => {
      try {
        const project = service.getProject(projectSlug);
        
        const activities: ActivityLog[] = [];
        
        // If sprint specified, get sprint-specific activity
        if (sprintNumber !== undefined) {
          const sprint = service.getSprint(projectSlug, sprintNumber);
          const logPath = path.join(sprint.paths.root, 'IMPLEMENTATION_LOG.md');
          
          if (fs.existsSync(logPath)) {
            const logContent = fs.readFileSync(logPath, 'utf-8');
            activities.push({
              timestamp: sprint.metadata.updated,
              actor: sprint.metadata.lastModifiedBy,
              action: 'updated',
              resource: {
                type: 'sprint',
                id: sprint.id,
                name: `Sprint ${sprintNumber}`,
              },
              metadata: {
                logPreview: logContent.substring(0, 500),
              },
            });
          }
        }
        
        // Get recent task updates
        const allTasks = service.listTasks(projectSlug);
        const sortedTasks = allTasks
          .sort((a, b) => new Date(b.timeline.updated).getTime() - new Date(a.timeline.updated).getTime())
          .slice(0, limit);
        
        for (const task of sortedTasks) {
          activities.push({
            timestamp: task.timeline.updated,
            actor: task.metadata.lastModifiedBy,
            action: 'updated',
            resource: {
              type: 'task',
              id: task.id,
              name: `${task.number}: ${task.title}`,
            },
            metadata: {
              status: task.status,
            },
          });
        }
        
        // Sort by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                total: activities.length,
                activities: activities.slice(0, limit),
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
