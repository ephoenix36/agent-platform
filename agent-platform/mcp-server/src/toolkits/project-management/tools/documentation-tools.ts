/**
 * Project Management Tools - Documentation Operations
 * 
 * MCP tools for generating and managing project documentation.
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';

/**
 * Register documentation management tools
 */
export function registerDocumentationTools(
  server: McpServer,
  service: ProjectManagementService,
  templatesDir: string
): void {
  
  // ==================== GENERATE_STANDARDS_DOC ====================
  
  server.tool(
    'pm_generate_standards_doc',
    'Generate or update project standards documentation from template',
    {
      projectSlug: z.string().describe('Project slug'),
      content: z.string().optional().describe('Custom content (if not provided, uses template)'),
    },
    async ({ projectSlug, content }) => {
      try {
        const project = service.getProject(projectSlug);
        const docsPath = path.join(project.paths.docs, 'STANDARDS.md');
        
        let docContent: string;
        if (content) {
          docContent = content;
        } else {
          // Load template
          const templatePath = path.join(templatesDir, 'project-standards.md');
          if (fs.existsSync(templatePath)) {
            docContent = fs.readFileSync(templatePath, 'utf-8');
            // Replace placeholders
            docContent = docContent
              .replace(/\{\{project\.name\}\}/g, project.name)
              .replace(/\{\{project\.description\}\}/g, project.description);
          } else {
            docContent = `# ${project.name} - Standards\n\n${project.description}\n\n## Coding Standards\n\nTBD\n\n## Best Practices\n\nTBD\n`;
          }
        }
        
        fs.writeFileSync(docsPath, docContent, 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                path: docsPath,
                message: `✅ Standards documentation generated at ${docsPath}`,
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
  
  // ==================== GENERATE_ROADMAP ====================
  
  server.tool(
    'pm_generate_roadmap',
    'Generate or update project roadmap documentation',
    {
      projectSlug: z.string().describe('Project slug'),
      content: z.string().optional().describe('Custom content (if not provided, uses template)'),
    },
    async ({ projectSlug, content }) => {
      try {
        const project = service.getProject(projectSlug);
        const docsPath = path.join(project.paths.docs, 'ROADMAP.md');
        
        let docContent: string;
        if (content) {
          docContent = content;
        } else {
          const templatePath = path.join(templatesDir, 'project-roadmap.md');
          if (fs.existsSync(templatePath)) {
            docContent = fs.readFileSync(templatePath, 'utf-8');
            docContent = docContent
              .replace(/\{\{project\.name\}\}/g, project.name)
              .replace(/\{\{project\.description\}\}/g, project.description);
          } else {
            docContent = `# ${project.name} - Roadmap\n\n## Vision\n\n${project.description}\n\n## Milestones\n\nTBD\n`;
          }
        }
        
        fs.writeFileSync(docsPath, docContent, 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                path: docsPath,
                message: `✅ Roadmap generated at ${docsPath}`,
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
  
  // ==================== CREATE_ADR ====================
  
  server.tool(
    'pm_create_adr',
    'Create an Architecture Decision Record (ADR)',
    {
      projectSlug: z.string().describe('Project slug'),
      title: z.string().describe('Decision title'),
      status: z.enum(['proposed', 'accepted', 'rejected', 'deprecated', 'superseded'] as const)
        .describe('Decision status'),
      context: z.string().describe('Context and problem statement'),
      decision: z.string().describe('The decision made'),
      consequences: z.string().describe('Consequences of the decision'),
      alternatives: z.string().optional().describe('Alternative options considered'),
    },
    async ({ projectSlug, title, status, context, decision, consequences, alternatives }) => {
      try {
        const project = service.getProject(projectSlug);
        const adrDir = path.join(project.paths.docs, 'adr');
        
        if (!fs.existsSync(adrDir)) {
          fs.mkdirSync(adrDir, { recursive: true });
        }
        
        // Count existing ADRs
        const existing = fs.readdirSync(adrDir).filter(f => f.endsWith('.md')).length;
        const adrNumber = existing + 1;
        const filename = `${String(adrNumber).padStart(4, '0')}-${title.toLowerCase().replace(/[^\w]+/g, '-')}.md`;
        const adrPath = path.join(adrDir, filename);
        
        const docContent = `# ADR ${adrNumber}: ${title}

**Status:** ${status}  
**Date:** ${new Date().toISOString().split('T')[0]}

## Context

${context}

## Decision

${decision}

## Consequences

${consequences}

${alternatives ? `## Alternatives Considered\n\n${alternatives}\n` : ''}
`;
        
        fs.writeFileSync(adrPath, docContent, 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                adrNumber,
                path: adrPath,
                message: `✅ ADR ${adrNumber} created at ${adrPath}`,
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
  
  // ==================== UPDATE_IMPLEMENTATION_LOG ====================
  
  server.tool(
    'pm_update_implementation_log',
    'Add entry to sprint implementation log',
    {
      projectSlug: z.string().describe('Project slug'),
      sprintNumber: z.number().positive().describe('Sprint number'),
      entry: z.string().describe('Log entry (markdown format)'),
    },
    async ({ projectSlug, sprintNumber, entry }) => {
      try {
        const sprint = service.getSprint(projectSlug, sprintNumber);
        const logPath = path.join(sprint.paths.root, 'IMPLEMENTATION_LOG.md');
        
        const timestamp = new Date().toISOString();
        const logEntry = `\n## ${timestamp}\n\n${entry}\n`;
        
        if (fs.existsSync(logPath)) {
          fs.appendFileSync(logPath, logEntry, 'utf-8');
        } else {
          const header = `# Sprint ${sprintNumber} - Implementation Log\n\nProject: ${projectSlug}\nSprint: ${sprint.name}\n`;
          fs.writeFileSync(logPath, header + logEntry, 'utf-8');
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                path: logPath,
                timestamp,
                message: `✅ Implementation log updated for Sprint ${sprintNumber}`,
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
  
  // ==================== GENERATE_RETROSPECTIVE ====================
  
  server.tool(
    'pm_generate_retrospective',
    'Generate sprint retrospective document from template',
    {
      projectSlug: z.string().describe('Project slug'),
      sprintNumber: z.number().positive().describe('Sprint number'),
      whatWentWell: z.array(z.string()).describe('What went well'),
      whatToImprove: z.array(z.string()).describe('What could be improved'),
      actionItems: z.array(z.string()).describe('Action items for next sprint'),
      metrics: z.record(z.union([z.string(), z.number()])).optional().describe('Sprint metrics'),
    },
    async ({ projectSlug, sprintNumber, whatWentWell, whatToImprove, actionItems, metrics }) => {
      try {
        const sprint = service.getSprint(projectSlug, sprintNumber);
        const retroPath = path.join(sprint.paths.root, 'RETROSPECTIVE.md');
        
        let docContent = `# Sprint ${sprintNumber} Retrospective\n\n`;
        docContent += `**Sprint:** ${sprint.name}\n`;
        docContent += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
        
        if (metrics) {
          docContent += `## Metrics\n\n`;
          for (const [key, value] of Object.entries(metrics)) {
            docContent += `- **${key}:** ${value}\n`;
          }
          docContent += `\n`;
        }
        
        docContent += `## ✅ What Went Well\n\n`;
        for (const item of whatWentWell) {
          docContent += `- ${item}\n`;
        }
        
        docContent += `\n## ⚠️ What Could Be Improved\n\n`;
        for (const item of whatToImprove) {
          docContent += `- ${item}\n`;
        }
        
        docContent += `\n## 🎯 Action Items\n\n`;
        for (const item of actionItems) {
          docContent += `- [ ] ${item}\n`;
        }
        
        fs.writeFileSync(retroPath, docContent, 'utf-8');
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                path: retroPath,
                message: `✅ Retrospective generated for Sprint ${sprintNumber}`,
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
