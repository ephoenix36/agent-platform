import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { z } from 'zod';

/**
 * Storage configuration schema
 */
export const StorageConfigSchema = z.object({
  version: z.string(),
  created: z.string(),
  storage: z.object({
    root: z.string(),
    format_version: z.string(),
  }),
  features: z.object({
    auto_backup: z.boolean(),
    backup_interval_days: z.number(),
    cache_enabled: z.boolean(),
    cache_ttl_hours: z.number(),
    logging_enabled: z.boolean(),
    log_retention_days: z.number(),
    metrics_enabled: z.boolean(),
  }),
  paths: z.object({
    agents: z.string(),
    skills: z.string(),
    teams: z.string(),
    toolsets: z.string(),
    tools: z.string(),
    workflows: z.string(),
    hooks: z.string(),
    collections: z.string(),
    evaluation: z.string(),
    mutation: z.string(),
    metrics: z.string(),
    projects: z.string(),
    cache: z.string(),
    logs: z.string(),
    backups: z.string(),
  }),
});

export type StorageConfig = z.infer<typeof StorageConfigSchema>;

/**
 * Agent storage formats
 */
export type AgentFormat = 'json' | 'markdown';

/**
 * Agent metadata for markdown format
 */
export const AgentMarkdownFrontmatterSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  model: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  topP: z.number().optional(),
  toolkits: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type AgentMarkdownFrontmatter = z.infer<typeof AgentMarkdownFrontmatterSchema>;

/**
 * Skill schema (enhanced with team, collection, database, and project links)
 */
export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  toolkits: z.array(z.string()),
  systemInstructions: z.string(),
  rules: z.array(z.string()),
  documents: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(),
  databases: z.array(z.string()).optional(),
  agents: z.array(z.string()).optional(),
  teams: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
  evaluationRules: z.record(z.any()).optional(),
  mutationRules: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Skill = z.infer<typeof SkillSchema>;

/**
 * Agent Team schema
 */
export const AgentTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  mode: z.enum(['linear', 'parallel', 'rounds', 'intelligent']).default('linear'),
  agents: z.array(z.object({
    id: z.string(),
    role: z.string().optional(),
    systemPrompt: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
  })),
  maxRounds: z.number().optional(),
  conditions: z.array(z.object({
    check: z.string(),
    action: z.enum(['continue', 'stop', 'branch', 'repeat']),
    branchTo: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AgentTeam = z.infer<typeof AgentTeamSchema>;

/**
 * Tool schema (supports local, remote MCP servers, and scripts)
 */
export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  type: z.enum(['local', 'remote-mcp', 'script', 'builtin']),
  // For local tools
  implementation: z.string().optional(),
  // For remote MCP servers
  mcpServer: z.object({
    name: z.string(),
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  }).optional(),
  // For scripts
  script: z.object({
    language: z.enum(['python', 'javascript', 'typescript', 'powershell', 'bash']),
    path: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  }).optional(),
  // Common properties
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  permissions: z.array(z.string()).optional(),
  toolkits: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Tool = z.infer<typeof ToolSchema>;

/**
 * Toolset schema
 */
export const ToolsetSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  tools: z.array(z.string()),
  instructions: z.string().optional(),
  rules: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Toolset = z.infer<typeof ToolsetSchema>;

/**
 * Hook schema
 */
export const HookSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['tool:before', 'tool:after', 'tool:error', 'agent:before', 'agent:after', 'agent:error', 'workflow:before', 'workflow:after', 'workflow:error', 'system:startup', 'system:shutdown']),
  handler: z.string(), // Code or reference
  enabled: z.boolean().default(true),
  priority: z.number().default(0),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Hook = z.infer<typeof HookSchema>;

/**
 * Workflow schema (enhanced with hooks support)
 */
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  steps: z.array(z.record(z.any())),
  agents: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  hooks: z.object({
    before: z.array(z.string()).optional(),
    after: z.array(z.string()).optional(),
    error: z.array(z.string()).optional(),
    stepBefore: z.array(z.string()).optional(),
    stepAfter: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

/**
 * Project schema (enhanced with hooks support)
 */
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  slug: z.string(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  agents: z.array(z.string()).optional(),
  teams: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  workflows: z.array(z.string()).optional(),
  hooks: z.object({
    onCreate: z.array(z.string()).optional(),
    onUpdate: z.array(z.string()).optional(),
    onComplete: z.array(z.string()).optional(),
    onArchive: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * Persistent Storage Manager
 * Manages all agent platform assets in ~/.agents directory
 */
export class PersistentStorageManager {
  private rootPath: string;
  private config: StorageConfig | null = null;

  constructor(customPath?: string) {
    this.rootPath = customPath || path.join(os.homedir(), '.agents');
  }

  /**
   * Initialize storage (load config, ensure directories exist)
   */
  async initialize(): Promise<void> {
    try {
      // Check if storage exists
      const configPath = path.join(this.rootPath, 'config.json');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);

      if (!configExists) {
        throw new Error(
          `Persistent storage not initialized. Run setup script first:\n` +
          `  pwsh ./scripts/setup-persistent-storage.ps1\n` +
          `Expected location: ${this.rootPath}`
        );
      }

      // Load config
      const configData = await fs.readFile(configPath, 'utf-8');
      this.config = StorageConfigSchema.parse(JSON.parse(configData));

      console.log(`✓ Persistent storage initialized: ${this.rootPath}`);
    } catch (error) {
      console.error(`Failed to initialize persistent storage: ${error}`);
      throw error;
    }
  }

  /**
   * Get full path for a storage area
   */
  getPath(area: keyof StorageConfig['paths'], ...subPaths: string[]): string {
    if (!this.config) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
    return path.join(this.rootPath, this.config.paths[area], ...subPaths);
  }

  /**
   * Get root storage path
   */
  getRootPath(): string {
    return this.rootPath;
  }

  /**
   * Get configuration
   */
  getConfig(): StorageConfig | null {
    return this.config;
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  /**
   * Save agent to persistent storage
   */
  async saveAgent(agent: any, format: AgentFormat = 'json', category: string = 'custom'): Promise<void> {
    const categoryPath = this.getPath('agents', category);
    await fs.mkdir(categoryPath, { recursive: true });

    const now = new Date().toISOString();
    const agentData = {
      ...agent,
      version: agent.version || '1.0.0',
      createdAt: agent.createdAt || now,
      updatedAt: now,
    };

    if (format === 'json') {
      const filePath = path.join(categoryPath, `${agent.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(agentData, null, 2));
    } else {
      const filePath = path.join(categoryPath, `${agent.id}.md`);
      const frontmatter = AgentMarkdownFrontmatterSchema.parse({
        id: agent.id,
        name: agent.name,
        version: agentData.version,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        topP: agent.topP,
        toolkits: agent.toolkits,
        skills: agent.skills,
        metadata: agent.metadata,
      });
      
      const content = `---
${JSON.stringify(frontmatter, null, 2)}
---

# ${agent.name}

${agent.systemPrompt || ''}
`;
      await fs.writeFile(filePath, content);
    }
  }

  /**
   * Load agent from persistent storage
   */
  async loadAgent(id: string, category: string = 'custom'): Promise<any> {
    const categoryPath = this.getPath('agents', category);
    
    // Try JSON first
    const jsonPath = path.join(categoryPath, `${id}.json`);
    if (await fs.access(jsonPath).then(() => true).catch(() => false)) {
      const data = await fs.readFile(jsonPath, 'utf-8');
      return JSON.parse(data);
    }
    
    // Try Markdown
    const mdPath = path.join(categoryPath, `${id}.md`);
    if (await fs.access(mdPath).then(() => true).catch(() => false)) {
      const content = await fs.readFile(mdPath, 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
      if (frontmatterMatch) {
        const frontmatter = JSON.parse(frontmatterMatch[1]);
        const systemPrompt = frontmatterMatch[2].trim();
        return { ...frontmatter, systemPrompt };
      }
    }
    
    throw new Error(`Agent not found: ${id} in category ${category}`);
  }

  /**
   * List all agents
   */
  async listAgents(category?: string): Promise<any[]> {
    const agents: any[] = [];
    const agentsPath = this.getPath('agents');
    
    const categories = category 
      ? [category] 
      : await fs.readdir(agentsPath);
    
    for (const cat of categories) {
      const categoryPath = path.join(agentsPath, cat);
      try {
        const files = await fs.readdir(categoryPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            const agent = JSON.parse(data);
            agents.push({ ...agent, _category: cat, _format: 'json' });
          } else if (file.endsWith('.md')) {
            const content = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
            if (frontmatterMatch) {
              const frontmatter = JSON.parse(frontmatterMatch[1]);
              agents.push({ ...frontmatter, _category: cat, _format: 'markdown' });
            }
          }
        }
      } catch (error) {
        // Category doesn't exist, skip
      }
    }
    
    return agents;
  }

  /**
   * Delete agent
   */
  async deleteAgent(id: string, category: string = 'custom'): Promise<void> {
    const categoryPath = this.getPath('agents', category);
    const jsonPath = path.join(categoryPath, `${id}.json`);
    const mdPath = path.join(categoryPath, `${id}.md`);
    
    try {
      await fs.unlink(jsonPath);
    } catch {}
    
    try {
      await fs.unlink(mdPath);
    } catch {}
  }

  // ============================================================================
  // TEAM OPERATIONS
  // ============================================================================

  /**
   * Save team to persistent storage
   */
  async saveTeam(team: AgentTeam, category: string = 'active'): Promise<void> {
    const categoryPath = this.getPath('teams', category);
    await fs.mkdir(categoryPath, { recursive: true });

    const now = new Date().toISOString();
    const teamData = {
      ...team,
      version: team.version || '1.0.0',
      createdAt: team.createdAt || now,
      updatedAt: now,
    };

    const filePath = path.join(categoryPath, `${team.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(teamData, null, 2));
  }

  /**
   * Load team from persistent storage
   */
  async loadTeam(id: string, category: string = 'active'): Promise<AgentTeam> {
    const categoryPath = this.getPath('teams', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    
    const data = await fs.readFile(filePath, 'utf-8');
    return AgentTeamSchema.parse(JSON.parse(data));
  }

  /**
   * List all teams
   */
  async listTeams(category?: string): Promise<AgentTeam[]> {
    const teams: AgentTeam[] = [];
    const teamsPath = this.getPath('teams');
    
    const categories = category 
      ? [category] 
      : await fs.readdir(teamsPath);
    
    for (const cat of categories) {
      const categoryPath = path.join(teamsPath, cat);
      try {
        const files = await fs.readdir(categoryPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            teams.push(AgentTeamSchema.parse(JSON.parse(data)));
          }
        }
      } catch (error) {
        // Category doesn't exist, skip
      }
    }
    
    return teams;
  }

  /**
   * Delete team
   */
  async deleteTeam(id: string, category: string = 'active'): Promise<void> {
    const categoryPath = this.getPath('teams', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    await fs.unlink(filePath);
  }

  // ============================================================================
  // SKILL OPERATIONS
  // ============================================================================

  /**
   * Save skill to persistent storage
   */
  async saveSkill(skill: Skill, category: string = 'user'): Promise<void> {
    const categoryPath = this.getPath('skills', category);
    await fs.mkdir(categoryPath, { recursive: true });

    const now = new Date().toISOString();
    const skillData = {
      ...skill,
      version: skill.version || '1.0.0',
      createdAt: skill.createdAt || now,
      updatedAt: now,
    };

    const filePath = path.join(categoryPath, `${skill.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(skillData, null, 2));
  }

  /**
   * Load skill from persistent storage
   */
  async loadSkill(id: string, category: string = 'user'): Promise<Skill> {
    const categoryPath = this.getPath('skills', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    
    const data = await fs.readFile(filePath, 'utf-8');
    return SkillSchema.parse(JSON.parse(data));
  }

  /**
   * List all skills
   */
  async listSkills(category?: string): Promise<Skill[]> {
    const skills: Skill[] = [];
    const skillsPath = this.getPath('skills');
    
    const categories = category 
      ? [category] 
      : await fs.readdir(skillsPath);
    
    for (const cat of categories) {
      const categoryPath = path.join(skillsPath, cat);
      try {
        const files = await fs.readdir(categoryPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            skills.push(SkillSchema.parse(JSON.parse(data)));
          }
        }
      } catch (error) {
        // Category doesn't exist, skip
      }
    }
    
    return skills;
  }

  /**
   * Delete skill
   */
  async deleteSkill(id: string, category: string = 'user'): Promise<void> {
    const categoryPath = this.getPath('skills', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    await fs.unlink(filePath);
  }

  // ============================================================================
  // TOOL OPERATIONS
  // ============================================================================

  /**
   * Save tool to persistent storage
   */
  async saveTool(tool: Tool, category: string = 'custom'): Promise<void> {
    const categoryPath = this.getPath('tools', category);
    await fs.mkdir(categoryPath, { recursive: true });

    const now = new Date().toISOString();
    const toolData = {
      ...tool,
      version: tool.version || '1.0.0',
      createdAt: tool.createdAt || now,
      updatedAt: now,
    };

    const filePath = path.join(categoryPath, `${tool.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(toolData, null, 2));
  }

  /**
   * Load tool from persistent storage
   */
  async loadTool(id: string, category: string = 'custom'): Promise<Tool> {
    const categoryPath = this.getPath('tools', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    
    const data = await fs.readFile(filePath, 'utf-8');
    return ToolSchema.parse(JSON.parse(data));
  }

  /**
   * List all tools
   */
  async listTools(category?: string, type?: Tool['type']): Promise<Tool[]> {
    const tools: Tool[] = [];
    const toolsPath = this.getPath('tools');
    
    const categories = category 
      ? [category] 
      : await fs.readdir(toolsPath);
    
    for (const cat of categories) {
      const categoryPath = path.join(toolsPath, cat);
      try {
        const files = await fs.readdir(categoryPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            const tool = ToolSchema.parse(JSON.parse(data));
            if (!type || tool.type === type) {
              tools.push(tool);
            }
          }
        }
      } catch (error) {
        // Category doesn't exist, skip
      }
    }
    
    return tools;
  }

  /**
   * Delete tool
   */
  async deleteTool(id: string, category: string = 'custom'): Promise<void> {
    const categoryPath = this.getPath('tools', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    await fs.unlink(filePath);
  }

  // ============================================================================
  // WORKFLOW OPERATIONS
  // ============================================================================

  /**
   * Save workflow to persistent storage
   */
  async saveWorkflow(workflow: Workflow, category: string = 'active'): Promise<void> {
    const categoryPath = this.getPath('workflows', category);
    await fs.mkdir(categoryPath, { recursive: true });

    const now = new Date().toISOString();
    const workflowData = {
      ...workflow,
      version: workflow.version || '1.0.0',
      createdAt: workflow.createdAt || now,
      updatedAt: now,
    };

    const filePath = path.join(categoryPath, `${workflow.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflowData, null, 2));
  }

  /**
   * Load workflow from persistent storage
   */
  async loadWorkflow(id: string, category: string = 'active'): Promise<Workflow> {
    const categoryPath = this.getPath('workflows', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    
    const data = await fs.readFile(filePath, 'utf-8');
    return WorkflowSchema.parse(JSON.parse(data));
  }

  /**
   * List all workflows
   */
  async listWorkflows(category?: string): Promise<Workflow[]> {
    const workflows: Workflow[] = [];
    const workflowsPath = this.getPath('workflows');
    
    const categories = category 
      ? [category] 
      : await fs.readdir(workflowsPath);
    
    for (const cat of categories) {
      const categoryPath = path.join(workflowsPath, cat);
      try {
        const files = await fs.readdir(categoryPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            workflows.push(WorkflowSchema.parse(JSON.parse(data)));
          }
        }
      } catch (error) {
        // Category doesn't exist, skip
      }
    }
    
    return workflows;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string, category: string = 'active'): Promise<void> {
    const categoryPath = this.getPath('workflows', category);
    const filePath = path.join(categoryPath, `${id}.json`);
    await fs.unlink(filePath);
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  /**
   * Save project to persistent storage
   */
  async saveProject(project: Project, category: string = 'active'): Promise<void> {
    const categoryPath = this.getPath('projects', category);
    await fs.mkdir(categoryPath, { recursive: true });

    const now = new Date().toISOString();
    const projectData = {
      ...project,
      version: project.version || '1.0.0',
      createdAt: project.createdAt || now,
      updatedAt: now,
    };

    const filePath = path.join(categoryPath, `${project.slug}.json`);
    await fs.writeFile(filePath, JSON.stringify(projectData, null, 2));
  }

  /**
   * Load project from persistent storage
   */
  async loadProject(slug: string, category: string = 'active'): Promise<Project> {
    const categoryPath = this.getPath('projects', category);
    const filePath = path.join(categoryPath, `${slug}.json`);
    
    const data = await fs.readFile(filePath, 'utf-8');
    return ProjectSchema.parse(JSON.parse(data));
  }

  /**
   * List all projects
   */
  async listProjects(category?: string): Promise<Project[]> {
    const projects: Project[] = [];
    const projectsPath = this.getPath('projects');
    
    const categories = category 
      ? [category] 
      : await fs.readdir(projectsPath);
    
    for (const cat of categories) {
      const categoryPath = path.join(projectsPath, cat);
      try {
        const files = await fs.readdir(categoryPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryPath, file), 'utf-8');
            projects.push(ProjectSchema.parse(JSON.parse(data)));
          }
        }
      } catch (error) {
        // Category doesn't exist, skip
      }
    }
    
    return projects;
  }

  /**
   * Delete project
   */
  async deleteProject(slug: string, category: string = 'active'): Promise<void> {
    const categoryPath = this.getPath('projects', category);
    const filePath = path.join(categoryPath, `${slug}.json`);
    await fs.unlink(filePath);
  }

  // ============================================================================
  // STATISTICS & UTILITIES
  // ============================================================================

  /**
   * Get storage statistics
   */
  async getStats(): Promise<any> {
    const stats: any = {
      rootPath: this.rootPath,
      areas: {},
    };

    if (!this.config) {
      return stats;
    }

    for (const [area, areaPath] of Object.entries(this.config.paths)) {
      const fullPath = path.join(this.rootPath, areaPath);
      try {
        const categories = await fs.readdir(fullPath);
        let fileCount = 0;
        let totalSize = 0;

        for (const category of categories) {
          const categoryPath = path.join(fullPath, category);
          try {
            const files = await fs.readdir(categoryPath);
            fileCount += files.length;
            
            for (const file of files) {
              const filePath = path.join(categoryPath, file);
              const stat = await fs.stat(filePath);
              if (stat.isFile()) {
                totalSize += stat.size;
              }
            }
          } catch {}
        }

        stats.areas[area] = {
          fileCount,
          totalSize,
          sizeFormatted: `${(totalSize / 1024).toFixed(2)} KB`,
        };
      } catch {
        stats.areas[area] = { fileCount: 0, totalSize: 0, sizeFormatted: '0 KB' };
      }
    }

    return stats;
  }

  /**
   * Create backup of storage
   */
  async createBackup(areas?: string[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = this.getPath('backups', `backup-${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });

    const areasToBackup = areas || Object.keys(this.config?.paths || {});

    for (const area of areasToBackup) {
      if (!this.config?.paths[area as keyof StorageConfig['paths']]) {
        continue;
      }

      const sourcePath = this.getPath(area as keyof StorageConfig['paths']);
      const destPath = path.join(backupDir, area);

      try {
        await fs.cp(sourcePath, destPath, { recursive: true });
      } catch (error) {
        console.warn(`Failed to backup ${area}:`, error);
      }
    }

    return backupDir;
  }
}
