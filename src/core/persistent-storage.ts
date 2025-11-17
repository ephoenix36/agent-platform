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

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  /**
   * Save agent (supports JSON and Markdown formats)
   */
  async saveAgent(agent: any, format: AgentFormat = 'json', category: string = 'custom'): Promise<void> {
    const agentPath = this.getPath('agents', category);
    await fs.mkdir(agentPath, { recursive: true });

    const timestamp = new Date().toISOString();
    agent.updatedAt = timestamp;
    if (!agent.createdAt) {
      agent.createdAt = timestamp;
    }

    if (format === 'json') {
      const filePath = path.join(agentPath, `${agent.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(agent, null, 2));
    } else if (format === 'markdown') {
      const filePath = path.join(agentPath, `${agent.id}.md`);
      const frontmatter = AgentMarkdownFrontmatterSchema.parse({
        id: agent.id,
        name: agent.name,
        version: agent.version || '1.0.0',
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        topP: agent.topP,
        toolkits: agent.toolkits,
        skills: agent.skills,
        metadata: agent.metadata,
      });

      const content = [
        '---',
        ...Object.entries(frontmatter).map(([key, value]) => 
          typeof value === 'object' 
            ? `${key}:\n${JSON.stringify(value, null, 2).split('\n').map(l => '  ' + l).join('\n')}`
            : `${key}: ${value}`
        ),
        '---',
        '',
        '# System Prompt',
        '',
        agent.systemPrompt || '',
      ].join('\n');

      await fs.writeFile(filePath, content);
    }
  }

  /**
   * Load agent (auto-detects format)
   */
  async loadAgent(id: string, category: string = 'custom'): Promise<any> {
    const agentPath = this.getPath('agents', category);

    // Try JSON first
    const jsonPath = path.join(agentPath, `${id}.json`);
    const jsonExists = await fs.access(jsonPath).then(() => true).catch(() => false);
    
    if (jsonExists) {
      const data = await fs.readFile(jsonPath, 'utf-8');
      return JSON.parse(data);
    }

    // Try Markdown
    const mdPath = path.join(agentPath, `${id}.md`);
    const mdExists = await fs.access(mdPath).then(() => true).catch(() => false);
    
    if (mdExists) {
      const data = await fs.readFile(mdPath, 'utf-8');
      return this.parseMarkdownAgent(data);
    }

    throw new Error(`Agent not found: ${id} in category ${category}`);
  }

  /**
   * List agents in a category
   */
  async listAgents(category?: string): Promise<any[]> {
    const agents: any[] = [];
    const categories = category ? [category] : ['configured', 'marketplace', 'custom', 'templates'];

    for (const cat of categories) {
      const agentPath = this.getPath('agents', cat);
      const exists = await fs.access(agentPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(agentPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(agentPath, file), 'utf-8');
          agents.push({ ...JSON.parse(data), _category: cat, _format: 'json' });
        } else if (file.endsWith('.md')) {
          const data = await fs.readFile(path.join(agentPath, file), 'utf-8');
          agents.push({ ...this.parseMarkdownAgent(data), _category: cat, _format: 'markdown' });
        }
      }
    }

    return agents;
  }

  /**
   * Delete agent
   */
  async deleteAgent(id: string, category: string = 'custom'): Promise<void> {
    const agentPath = this.getPath('agents', category);
    
    const jsonPath = path.join(agentPath, `${id}.json`);
    const mdPath = path.join(agentPath, `${id}.md`);

    await fs.unlink(jsonPath).catch(() => {});
    await fs.unlink(mdPath).catch(() => {});
  }

  // ============================================================================
  // SKILL OPERATIONS
  // ============================================================================

  async saveSkill(skill: Skill, category: string = 'user'): Promise<void> {
    const skillPath = this.getPath('skills', category);
    await fs.mkdir(skillPath, { recursive: true });

    const timestamp = new Date().toISOString();
    skill.updatedAt = timestamp;
    if (!skill.createdAt) {
      skill.createdAt = timestamp;
    }

    const filePath = path.join(skillPath, `${skill.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(skill, null, 2));
  }

  async loadSkill(id: string, category: string = 'user'): Promise<Skill> {
    const skillPath = this.getPath('skills', category, `${id}.json`);
    const data = await fs.readFile(skillPath, 'utf-8');
    return SkillSchema.parse(JSON.parse(data));
  }

  async listSkills(category?: string): Promise<Skill[]> {
    const skills: Skill[] = [];
    const categories = category ? [category] : ['system', 'user', 'marketplace', 'templates'];

    for (const cat of categories) {
      const skillPath = this.getPath('skills', cat);
      const exists = await fs.access(skillPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(skillPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(skillPath, file), 'utf-8');
          skills.push(SkillSchema.parse(JSON.parse(data)));
        }
      }
    }

    return skills;
  }

  // ============================================================================
  // TOOLSET OPERATIONS
  // ============================================================================

  async saveToolset(toolset: Toolset, category: string = 'custom'): Promise<void> {
    const toolsetPath = this.getPath('toolsets', category);
    await fs.mkdir(toolsetPath, { recursive: true });

    const timestamp = new Date().toISOString();
    toolset.updatedAt = timestamp;
    if (!toolset.createdAt) {
      toolset.createdAt = timestamp;
    }

    const filePath = path.join(toolsetPath, `${toolset.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(toolset, null, 2));
  }

  async loadToolset(id: string, category: string = 'custom'): Promise<Toolset> {
    const toolsetPath = this.getPath('toolsets', category, `${id}.json`);
    const data = await fs.readFile(toolsetPath, 'utf-8');
    return ToolsetSchema.parse(JSON.parse(data));
  }

  async listToolsets(category?: string): Promise<Toolset[]> {
    const toolsets: Toolset[] = [];
    const categories = category ? [category] : ['core', 'custom', 'marketplace', 'external-mcp'];

    for (const cat of categories) {
      const toolsetPath = this.getPath('toolsets', cat);
      const exists = await fs.access(toolsetPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(toolsetPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(toolsetPath, file), 'utf-8');
          toolsets.push(ToolsetSchema.parse(JSON.parse(data)));
        }
      }
    }

    return toolsets;
  }

  // ============================================================================
  // HOOK OPERATIONS
  // ============================================================================

  async saveHook(hook: Hook, category: string = 'system'): Promise<void> {
    const hookPath = this.getPath('hooks', category);
    await fs.mkdir(hookPath, { recursive: true });

    const timestamp = new Date().toISOString();
    hook.updatedAt = timestamp;
    if (!hook.createdAt) {
      hook.createdAt = timestamp;
    }

    const filePath = path.join(hookPath, `${hook.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(hook, null, 2));
  }

  async loadHook(id: string, category: string = 'system'): Promise<Hook> {
    const hookPath = this.getPath('hooks', category, `${id}.json`);
    const data = await fs.readFile(hookPath, 'utf-8');
    return HookSchema.parse(JSON.parse(data));
  }

  async listHooks(category?: string, type?: Hook['type']): Promise<Hook[]> {
    const hooks: Hook[] = [];
    const categories = category ? [category] : ['tool', 'agent', 'workflow', 'system'];

    for (const cat of categories) {
      const hookPath = this.getPath('hooks', cat);
      const exists = await fs.access(hookPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(hookPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(hookPath, file), 'utf-8');
          const hook = HookSchema.parse(JSON.parse(data));
          if (!type || hook.type === type) {
            hooks.push(hook);
          }
        }
      }
    }

    return hooks;
  }

  // ============================================================================
  // WORKFLOW OPERATIONS
  // ============================================================================

  async saveWorkflow(workflow: Workflow, category: string = 'active'): Promise<void> {
    const workflowPath = this.getPath('workflows', category);
    await fs.mkdir(workflowPath, { recursive: true });

    const timestamp = new Date().toISOString();
    workflow.updatedAt = timestamp;
    if (!workflow.createdAt) {
      workflow.createdAt = timestamp;
    }

    const filePath = path.join(workflowPath, `${workflow.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
  }

  async loadWorkflow(id: string, category: string = 'active'): Promise<Workflow> {
    const workflowPath = this.getPath('workflows', category, `${id}.json`);
    const data = await fs.readFile(workflowPath, 'utf-8');
    return WorkflowSchema.parse(JSON.parse(data));
  }

  async listWorkflows(category?: string): Promise<Workflow[]> {
    const workflows: Workflow[] = [];
    const categories = category ? [category] : ['active', 'templates', 'history'];

    for (const cat of categories) {
      const workflowPath = this.getPath('workflows', cat);
      const exists = await fs.access(workflowPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(workflowPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(workflowPath, file), 'utf-8');
          workflows.push(WorkflowSchema.parse(JSON.parse(data)));
        }
      }
    }

    return workflows;
  }

  // ============================================================================
  // AGENT TEAM OPERATIONS
  // ============================================================================

  async saveTeam(team: AgentTeam, category: string = 'active'): Promise<void> {
    const teamPath = this.getPath('teams', category);
    await fs.mkdir(teamPath, { recursive: true });

    const timestamp = new Date().toISOString();
    team.updatedAt = timestamp;
    if (!team.createdAt) {
      team.createdAt = timestamp;
    }

    const filePath = path.join(teamPath, `${team.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(team, null, 2));
  }

  async loadTeam(id: string, category: string = 'active'): Promise<AgentTeam> {
    const teamPath = this.getPath('teams', category, `${id}.json`);
    const data = await fs.readFile(teamPath, 'utf-8');
    return AgentTeamSchema.parse(JSON.parse(data));
  }

  async listTeams(category?: string): Promise<AgentTeam[]> {
    const teams: AgentTeam[] = [];
    const categories = category ? [category] : ['active', 'archived', 'templates'];

    for (const cat of categories) {
      const teamPath = this.getPath('teams', cat);
      const exists = await fs.access(teamPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(teamPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(teamPath, file), 'utf-8');
          teams.push(AgentTeamSchema.parse(JSON.parse(data)));
        }
      }
    }

    return teams;
  }

  async deleteTeam(id: string, category: string = 'active'): Promise<void> {
    const teamPath = this.getPath('teams', category, `${id}.json`);
    await fs.unlink(teamPath);
  }

  // ============================================================================
  // TOOL OPERATIONS
  // ============================================================================

  async saveTool(tool: Tool, category: string = 'custom'): Promise<void> {
    const toolPath = this.getPath('tools', category);
    await fs.mkdir(toolPath, { recursive: true });

    const timestamp = new Date().toISOString();
    tool.updatedAt = timestamp;
    if (!tool.createdAt) {
      tool.createdAt = timestamp;
    }

    const filePath = path.join(toolPath, `${tool.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(tool, null, 2));
  }

  async loadTool(id: string, category: string = 'custom'): Promise<Tool> {
    const toolPath = this.getPath('tools', category, `${id}.json`);
    const data = await fs.readFile(toolPath, 'utf-8');
    return ToolSchema.parse(JSON.parse(data));
  }

  async listTools(category?: string, type?: Tool['type']): Promise<Tool[]> {
    const tools: Tool[] = [];
    const categories = category ? [category] : ['builtin', 'local', 'remote-mcp', 'script', 'custom'];

    for (const cat of categories) {
      const toolPath = this.getPath('tools', cat);
      const exists = await fs.access(toolPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(toolPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(toolPath, file), 'utf-8');
          const tool = ToolSchema.parse(JSON.parse(data));
          if (!type || tool.type === type) {
            tools.push(tool);
          }
        }
      }
    }

    return tools;
  }

  async deleteTool(id: string, category: string = 'custom'): Promise<void> {
    const toolPath = this.getPath('tools', category, `${id}.json`);
    await fs.unlink(toolPath);
  }

  // ============================================================================
  // PROJECT OPERATIONS
  // ============================================================================

  async saveProject(project: Project, category: string = 'active'): Promise<void> {
    const projectPath = this.getPath('projects', category);
    await fs.mkdir(projectPath, { recursive: true });

    const timestamp = new Date().toISOString();
    project.updatedAt = timestamp;
    if (!project.createdAt) {
      project.createdAt = timestamp;
    }

    const filePath = path.join(projectPath, `${project.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(project, null, 2));
  }

  async loadProject(id: string, category: string = 'active'): Promise<Project> {
    const projectPath = this.getPath('projects', category, `${id}.json`);
    const data = await fs.readFile(projectPath, 'utf-8');
    return ProjectSchema.parse(JSON.parse(data));
  }

  async listProjects(category?: string, status?: Project['status']): Promise<Project[]> {
    const projects: Project[] = [];
    const categories = category ? [category] : ['active', 'archived', 'templates'];

    for (const cat of categories) {
      const projectPath = this.getPath('projects', cat);
      const exists = await fs.access(projectPath).then(() => true).catch(() => false);
      
      if (!exists) continue;

      const files = await fs.readdir(projectPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(projectPath, file), 'utf-8');
          const project = ProjectSchema.parse(JSON.parse(data));
          if (!status || project.status === status) {
            projects.push(project);
          }
        }
      }
    }

    return projects;
  }

  async deleteProject(id: string, category: string = 'active'): Promise<void> {
    const projectPath = this.getPath('projects', category, `${id}.json`);
    await fs.unlink(projectPath);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Parse markdown agent file
   */
  private parseMarkdownAgent(content: string): any {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('Invalid markdown agent format: missing frontmatter');
    }

    const frontmatter: any = {};
    const frontmatterLines = frontmatterMatch[1].split('\n');
    
    let currentKey: string | null = null;
    let currentValue: string[] = [];

    for (const line of frontmatterLines) {
      if (line.match(/^\w+:/)) {
        if (currentKey) {
          frontmatter[currentKey] = currentValue.join('\n').trim();
        }
        const [key, ...valueParts] = line.split(':');
        currentKey = key.trim();
        currentValue = [valueParts.join(':').trim()];
      } else if (currentKey) {
        currentValue.push(line);
      }
    }

    if (currentKey) {
      frontmatter[currentKey] = currentValue.join('\n').trim();
    }

    // Parse systemPrompt from body
    const body = content.substring(frontmatterMatch[0].length).trim();
    const systemPromptMatch = body.match(/# System Prompt\n\n([\s\S]*)/);
    const systemPrompt = systemPromptMatch ? systemPromptMatch[1].trim() : '';

    return {
      ...frontmatter,
      systemPrompt,
    };
  }

  /**
   * Create backup of storage area
   */
  async createBackup(areas?: Array<keyof StorageConfig['paths']>): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.getPath('backups', 'manual', timestamp);
    await fs.mkdir(backupPath, { recursive: true });

    const areasToBackup = areas || Object.keys(this.config!.paths).filter(k => k !== 'backups' && k !== 'cache' && k !== 'logs') as Array<keyof StorageConfig['paths']>;

    for (const area of areasToBackup) {
      const sourcePath = this.getPath(area);
      const destPath = path.join(backupPath, area);
      
      const exists = await fs.access(sourcePath).then(() => true).catch(() => false);
      if (exists) {
        await this.copyDirectory(sourcePath, destPath);
      }
    }

    return backupPath;
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<any> {
    const stats: any = {
      root: this.rootPath,
      config: this.config,
      areas: {},
    };

    if (!this.config) {
      return stats;
    }

    for (const [area, relativePath] of Object.entries(this.config.paths)) {
      const areaPath = path.join(this.rootPath, relativePath);
      const exists = await fs.access(areaPath).then(() => true).catch(() => false);
      
      if (exists) {
        const files = await this.countFiles(areaPath);
        const size = await this.getDirectorySize(areaPath);
        stats.areas[area] = { files, size };
      } else {
        stats.areas[area] = { files: 0, size: 0 };
      }
    }

    return stats;
  }

  private async countFiles(dir: string): Promise<number> {
    let count = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += await this.countFiles(fullPath);
      } else {
        count++;
      }
    }

    return count;
  }

  private async getDirectorySize(dir: string): Promise<number> {
    let size = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        size += await this.getDirectorySize(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        size += stat.size;
      }
    }

    return size;
  }
}
