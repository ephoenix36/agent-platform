/**
 * Project Management Toolkit
 * 
 * Comprehensive project management system with projects, sprints, tasks,
 * documentation, and memory management.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Toolkit } from '../../types/toolkit.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ProjectManagementService } from './service/project-management-service.js';
import { registerProjectTools } from './tools/project-tools.js';
import { registerSprintTools } from './tools/sprint-tools.js';
import { registerTaskTools } from './tools/task-tools.js';
import { registerDocumentationTools } from './tools/documentation-tools.js';
import { registerMemoryTools } from './tools/memory-tools.js';
import { registerEnhancedDocTools } from './tools/enhanced-documentation-tools.js';
import { registerEpicTools } from './tools/epic-tools.js';
import { registerFeatureTools } from './tools/feature-tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create the full project management toolkit (36 tools - added 5 enhanced doc tools)
 */
export function createProjectManagementToolkit(projectsRoot?: string): Toolkit {
  const service = new ProjectManagementService(projectsRoot);
  const templatesDir = path.join(__dirname, 'templates');
  const now = new Date().toISOString();
  
  return {
    id: 'project-management',
    name: 'Project Management',
    version: '1.0.0',
    description: 'Complete project management system with projects, sprints, tasks, documentation, and memory',
    category: 'project-management',
    
    dependencies: [],
    conflicts: [],
    toolCount: 47,  // 31 original + 5 enhanced docs + 11 epic/feature tools
    enabled: true,
    
    metadata: {
      author: 'MCP Agents Platform',
      created: now,
      updated: now,
      tags: ['project-management', 'agile', 'sprints', 'tasks', 'documentation'],
    },
    
    config: {
      requiresAuth: false,
      defaultEnabled: true,
    },
    
    register: (server: McpServer) => {
      registerProjectTools(server, service);
      registerEpicTools(server, service);
      registerFeatureTools(server, service);
      registerSprintTools(server, service);
      registerTaskTools(server, service);
      registerDocumentationTools(server, service, templatesDir);
      registerMemoryTools(server, service);
      registerEnhancedDocTools(server, service);  // NEW: Enhanced docs
    },
  };
}

/**
 * Create a projects-only toolkit (6 project tools)
 * Lightweight version for just project CRUD operations
 */
export function createProjectsOnlyToolkit(projectsRoot?: string): Toolkit {
  const service = new ProjectManagementService(projectsRoot);
  const now = new Date().toISOString();
  
  return {
    id: 'project-management:projects',
    name: 'Project Management (Projects Only)',
    version: '1.0.0',
    description: 'Project CRUD operations only (lightweight)',
    category: 'project-management',
    
    dependencies: [],
    conflicts: ['project-management'], // Cannot use with full toolkit
    toolCount: 17,
    enabled: false, // Opt-in
    
    metadata: {
      author: 'MCP Agents Platform',
      created: now,
      updated: now,
      tags: ['project-management', 'projects-only', 'lightweight'],
    },
    
    config: {
      requiresAuth: false,
      defaultEnabled: false,
    },
    
    register: (server: McpServer) => {
      registerProjectTools(server, service);
      registerEpicTools(server, service);
      registerFeatureTools(server, service);
    },
  };
}

/**
 * Create a tasks-only toolkit (16 tools: sprints + tasks)
 * For teams that only need sprint and task management
 */
export function createTasksOnlyToolkit(projectsRoot?: string): Toolkit {
  const service = new ProjectManagementService(projectsRoot);
  const now = new Date().toISOString();
  
  return {
    id: 'project-management:tasks',
    name: 'Project Management (Tasks Only)',
    version: '1.0.0',
    description: 'Sprint and task management only (requires project-management:projects)',
    category: 'project-management',
    
    dependencies: ['project-management:projects'], // Needs projects to exist
    conflicts: ['project-management'], // Cannot use with full toolkit
    toolCount: 16,
    enabled: false, // Opt-in
    
    metadata: {
      author: 'MCP Agents Platform',
      created: now,
      updated: now,
      tags: ['project-management', 'tasks', 'sprints'],
    },
    
    config: {
      requiresAuth: false,
      defaultEnabled: false,
    },
    
    register: (server: McpServer) => {
      registerSprintTools(server, service);
      registerTaskTools(server, service);
    },
  };
}

// Export all three toolkits
export default {
  full: createProjectManagementToolkit,
  projectsOnly: createProjectsOnlyToolkit,
  tasksOnly: createTasksOnlyToolkit,
};
