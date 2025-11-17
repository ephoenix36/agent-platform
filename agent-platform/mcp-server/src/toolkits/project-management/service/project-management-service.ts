/**
 * Project Management Service
 * 
 * Core service for managing projects, sprints, tasks, and documentation.
 * Aligned with the comprehensive type system in project-management.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  ProjectStatus,
  ProjectRegistry,
  ProjectRegistryEntry,
  Sprint,
  SprintStatus,
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  Complexity,
  Epic,
  EpicStatus,
  Feature,
  FeatureStatus,
  FeatureProgress,
  CreateProjectInput,
  CreateSprintInput,
  CreateTaskInput,
  CreateEpicInput,
  CreateFeatureInput,
  UpdateProjectInput,
  UpdateSprintInput,
  UpdateTaskInput,
  UpdateEpicInput,
  UpdateFeatureInput,
  Comment,
  Attachment,
} from '../../../types/project-management.js';

import {
  ProjectNotFoundError,
  SprintNotFoundError,
  TaskNotFoundError,
  EpicNotFoundError,
  FeatureNotFoundError,
  SprintActiveError,
  ValidationError,
} from '../../../types/project-management.js';

/**
 * Core service for project management operations
 */
export class ProjectManagementService {
  private projectsRoot: string;
  private registryPath: string;
  private taskCounter: Map<string, number> = new Map();
  
  constructor(projectsRoot?: string) {
    this.projectsRoot = projectsRoot || path.join(process.cwd(), 'projects');
    this.registryPath = path.join(this.projectsRoot, '.registry.json');
    this.ensureDirectory(this.projectsRoot);
  }
  
  // ==================== FILESYSTEM UTILITIES ====================
  
  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  private readJSON<T>(filePath: string): T {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }
  
  private writeJSON<T>(filePath: string, data: T): void {
    const dir = path.dirname(filePath);
    this.ensureDirectory(dir);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
  
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  private getNextTaskNumber(projectId: string): string {
    const current = this.taskCounter.get(projectId) || 0;
    const next = current + 1;
    this.taskCounter.set(projectId, next);
    return `TASK-${String(next).padStart(3, '0')}`;
  }
  
  // ==================== REGISTRY MANAGEMENT ====================
  
  private loadRegistry(): ProjectRegistry {
    if (!fs.existsSync(this.registryPath)) {
      const registry: ProjectRegistry = {
        version: '1.0.0',
        updated: new Date().toISOString(),
        projects: {},
      };
      this.writeJSON(this.registryPath, registry);
      return registry;
    }
    return this.readJSON<ProjectRegistry>(this.registryPath);
  }
  
  private saveRegistry(registry: ProjectRegistry): void {
    registry.updated = new Date().toISOString();
    this.writeJSON(this.registryPath, registry);
  }
  
  private addToRegistry(project: Project): void {
    const registry = this.loadRegistry();
    const entry: ProjectRegistryEntry = {
      id: project.id,
      name: project.name,
      status: project.status,
      path: project.slug,
      created: project.metadata.created,
      updated: project.metadata.updated,
    };
    registry.projects[project.slug] = entry;
    this.saveRegistry(registry);
  }
  
  private updateRegistryEntry(slug: string, updates: Partial<ProjectRegistryEntry>): void {
    const registry = this.loadRegistry();
    if (registry.projects[slug]) {
      registry.projects[slug] = { ...registry.projects[slug], ...updates };
      this.saveRegistry(registry);
    }
  }
  
  private removeFromRegistry(slug: string): void {
    const registry = this.loadRegistry();
    delete registry.projects[slug];
    this.saveRegistry(registry);
  }
  
  // ==================== PROJECT CRUD ====================
  
  /**
   * Create a new project
   */
  createProject(input: CreateProjectInput): Project {
    const slug = this.slugify(input.name);
    const registry = this.loadRegistry();
    
    if (registry.projects[slug]) {
      throw new ValidationError('slug', `Project with slug '${slug}' already exists`);
    }
    
    const now = new Date().toISOString();
    const projectId = uuidv4();
    
    const projectRoot = path.join(this.projectsRoot, slug);
    
    const project: Project = {
      id: projectId,
      slug,
      name: input.name,
      description: input.description,
      status: 'active',
      
      metadata: {
        created: now,
        updated: now,
        owner: input.owner,
        contributors: [input.owner],
        tags: input.tags || [],
        version: '0.1.0',
      },
      
      settings: {
        sprintDuration: input.sprintDuration || 14,
        timezone: input.timezone || 'UTC',
        defaultAssignee: undefined,
        requireApproval: false,
        autoArchiveDays: undefined,
        templateType: input.templateType,
      },
      
      stats: {
        totalSprints: 0,
        activeSprints: 0,
        totalTasks: 0,
        completedTasks: 0,
        activeContributors: 1,
        totalEpics: 0,
        activeEpics: 0,
        totalFeatures: 0,
        completedFeatures: 0,
      },
      
      paths: {
        root: projectRoot,
        docs: path.join(projectRoot, 'docs'),
        memory: path.join(projectRoot, 'memory'),
        sprints: path.join(projectRoot, 'sprints'),
        archived: path.join(projectRoot, '.archived'),
        epics: path.join(projectRoot, 'epics'),
      },
    };
    
    // Create directory structure
    this.ensureDirectory(project.paths.root);
    this.ensureDirectory(project.paths.docs);
    this.ensureDirectory(project.paths.memory);
    this.ensureDirectory(project.paths.sprints);
    this.ensureDirectory(project.paths.archived);
    this.ensureDirectory(project.paths.epics);
    this.ensureDirectory(path.join(project.paths.root, 'backlog'));
    
    // Save project
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);
    
    // Add to registry
    this.addToRegistry(project);
    
    return project;
  }
  
  /**
   * Get a project by slug
   */
  getProject(slug: string): Project {
    const registry = this.loadRegistry();
    const entry = registry.projects[slug];
    
    if (!entry) {
      throw new ProjectNotFoundError(slug);
    }
    
    const projectPath = path.join(this.projectsRoot, entry.path, 'project.json');
    if (!fs.existsSync(projectPath)) {
      throw new ProjectNotFoundError(slug);
    }
    
    const project = this.readJSON<Project>(projectPath);
    this.ensureProjectStructure(project);
    return project;
  }
  
  /**
   * Update a project
   */
  updateProject(slug: string, updates: UpdateProjectInput): Project {
    const project = this.getProject(slug);
    
    if (updates.name) project.name = updates.name;
    if (updates.description) project.description = updates.description;
    if (updates.status) project.status = updates.status;
    if (updates.tags) project.metadata.tags = updates.tags;
    if (updates.settings) {
      project.settings = { ...project.settings, ...updates.settings };
    }
    
    project.metadata.updated = new Date().toISOString();
    
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);
    
    this.updateRegistryEntry(slug, {
      name: project.name,
      status: project.status,
      updated: project.metadata.updated,
    });
    
    return project;
  }
  
  /**
   * List all projects
   */
  listProjects(filters?: {
    status?: ProjectStatus;
    owner?: string;
    tags?: string[];
    search?: string;
  }): Project[] {
    const registry = this.loadRegistry();
    let projects = Object.values(registry.projects).map((entry: ProjectRegistryEntry) =>
      this.getProject(entry.path)
    );
    
    if (filters?.status) {
      projects = projects.filter(p => p.status === filters.status);
    }
    if (filters?.owner) {
      projects = projects.filter(p => p.metadata.owner === filters.owner);
    }
    if (filters?.tags && filters.tags.length > 0) {
      projects = projects.filter(p =>
        filters.tags!.some(tag => p.metadata.tags.includes(tag))
      );
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      projects = projects.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    return projects;
  }
  
  /**
   * Archive a project
   */
  archiveProject(slug: string): Project {
    return this.updateProject(slug, { status: 'archived' });
  }
  
  /**
   * Delete a project
   */
  deleteProject(slug: string): void {
    const project = this.getProject(slug);
    
    if (fs.existsSync(project.paths.root)) {
      fs.rmSync(project.paths.root, { recursive: true, force: true });
    }
    
    this.removeFromRegistry(slug);
  }
  
  // ==================== SPRINT CRUD ====================
  
  /**
   * Create a new sprint
   */
  createSprint(projectSlug: string, input: CreateSprintInput): Sprint {
    const project = this.getProject(projectSlug);
    
    const now = new Date().toISOString();
    const sprintNumber = project.stats.totalSprints + 1;
    const sprintId = uuidv4();
    
    const duration = input.duration || project.settings.sprintDuration;
    const startDate = input.startDate;
    const endDate = new Date(new Date(startDate).getTime() + duration * 24 * 60 * 60 * 1000).toISOString();
    
    const sprintRoot = path.join(project.paths.sprints, `sprint-${sprintNumber}`);
    
    const sprint: Sprint = {
      id: sprintId,
      number: sprintNumber,
      name: input.name,
      projectId: project.id,
      status: 'planned',
      
      schedule: {
        startDate,
        endDate,
        duration,
        actualStartDate: undefined,
        actualEndDate: undefined,
      },
      
      goals: {
        primary: input.goals?.primary || [],
        secondary: input.goals?.secondary || [],
        metrics: input.goals?.metrics || {},
      },
      
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        archivedTasks: 0,
      },
      
      metadata: {
        created: now,
        updated: now,
        createdBy: project.metadata.owner,
        lastModifiedBy: project.metadata.owner,
      },
      
      paths: {
        root: sprintRoot,
        tasks: path.join(sprintRoot, 'tasks'),
        attachments: path.join(sprintRoot, 'attachments'),
      },
    };
    
    // Create directories
    this.ensureDirectory(sprint.paths.root);
    this.ensureDirectory(sprint.paths.tasks);
    this.ensureDirectory(sprint.paths.attachments);
    
    // Save sprint
    this.writeJSON(path.join(sprint.paths.root, 'sprint.json'), sprint);
    
    // Update project
    project.stats.totalSprints++;
    project.metadata.updated = now;
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);
    this.updateRegistryEntry(projectSlug, { updated: now });
    
    return sprint;
  }
  
  /**
   * Get a sprint
   */
  getSprint(projectSlug: string, sprintNumber: number): Sprint {
    const project = this.getProject(projectSlug);
    const sprintPath = path.join(
      project.paths.sprints,
      `sprint-${sprintNumber}`,
      'sprint.json'
    );
    
    if (!fs.existsSync(sprintPath)) {
      throw new SprintNotFoundError(`${projectSlug}-sprint-${sprintNumber}`);
    }
    
    return this.readJSON<Sprint>(sprintPath);
  }
  
  /**
   * Update a sprint
   */
  updateSprint(projectSlug: string, sprintNumber: number, updates: UpdateSprintInput): Sprint {
    const sprint = this.getSprint(projectSlug, sprintNumber);
    const now = new Date().toISOString();
    
    if (updates.name) sprint.name = updates.name;
    if (updates.status) {
      sprint.status = updates.status;
      
      if (updates.status === 'active' && !sprint.schedule.actualStartDate) {
        sprint.schedule.actualStartDate = now;
      }
      if (updates.status === 'completed' && !sprint.schedule.actualEndDate) {
        sprint.schedule.actualEndDate = now;
      }
    }
    if (updates.startDate) sprint.schedule.startDate = updates.startDate;
    if (updates.endDate) sprint.schedule.endDate = updates.endDate;
    if (updates.goals) {
      sprint.goals = { ...sprint.goals, ...updates.goals };
    }
    
    sprint.metadata.updated = now;
    
    this.writeJSON(path.join(sprint.paths.root, 'sprint.json'), sprint);
    
    return sprint;
  }
  
  /**
   * List sprints
   */
  listSprints(projectSlug: string, filters?: {
    status?: SprintStatus;
    limit?: number;
  }): Sprint[] {
    const project = this.getProject(projectSlug);
    const sprintsDir = project.paths.sprints;
    
    if (!fs.existsSync(sprintsDir)) {
      return [];
    }
    
    let sprints: Sprint[] = [];
    const entries = fs.readdirSync(sprintsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('sprint-')) {
        const sprintPath = path.join(sprintsDir, entry.name, 'sprint.json');
        if (fs.existsSync(sprintPath)) {
          sprints.push(this.readJSON<Sprint>(sprintPath));
        }
      }
    }
    
    sprints.sort((a, b) => b.number - a.number);
    
    if (filters?.status) {
      sprints = sprints.filter(s => s.status === filters.status);
    }
    if (filters?.limit) {
      sprints = sprints.slice(0, filters.limit);
    }
    
    return sprints;
  }

  // ==================== EPIC CRUD ====================

  createEpic(projectSlug: string, input: CreateEpicInput): Epic {
    const project = this.getProject(projectSlug);
    const slug = this.slugify(input.name);
    const epicDir = path.join(project.paths.epics, slug);
    const epicFile = path.join(epicDir, 'epic.json');

    if (fs.existsSync(epicFile)) {
      throw new ValidationError('name', `Epic with slug '${slug}' already exists in project ${projectSlug}`);
    }

    const now = new Date().toISOString();
    const epic: Epic = {
      id: uuidv4(),
      slug,
      projectId: project.id,
      name: input.name,
      objective: input.objective,
      status: 'planned',
      owner: input.owner,
      priority: input.priority || 'medium',
      tags: input.tags || [],
      metrics: input.metrics || {},
      successCriteria: input.successCriteria || [],
      stats: {
        totalFeatures: 0,
        completedFeatures: 0,
        totalTasks: 0,
        completedTasks: 0,
      },
      timeline: {
        created: now,
        updated: now,
      },
      paths: {
        root: epicDir,
        features: path.join(epicDir, 'features'),
      },
      relationships: {
        featureIds: [],
        taskIds: [],
      },
    };

    this.ensureDirectory(epic.paths.root);
    this.ensureDirectory(epic.paths.features);
    this.writeJSON(epicFile, epic);

    project.stats.totalEpics = (project.stats.totalEpics || 0) + 1;
    project.metadata.updated = now;
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);

    return epic;
  }

  getEpic(projectSlug: string, epicRef: string): Epic {
    const project = this.getProject(projectSlug);
    const { epic } = this.resolveEpicReference(project, epicRef);
    return epic;
  }

  listEpics(projectSlug: string, filters?: {
    status?: EpicStatus;
    tags?: string[];
    search?: string;
  }): Epic[] {
    const project = this.getProject(projectSlug);
    let epics = this.loadAllEpics(project);

    if (filters?.status) {
      epics = epics.filter(e => e.status === filters.status);
    }
    if (filters?.tags && filters.tags.length > 0) {
      epics = epics.filter(e => filters.tags!.some(tag => e.tags.includes(tag)));
    }
    if (filters?.search) {
      const needle = filters.search.toLowerCase();
      epics = epics.filter(e =>
        e.name.toLowerCase().includes(needle) ||
        e.objective.toLowerCase().includes(needle)
      );
    }

    return epics;
  }

  updateEpic(projectSlug: string, epicRef: string, updates: UpdateEpicInput): Epic {
    const project = this.getProject(projectSlug);
    const { epic, epicPath } = this.resolveEpicReference(project, epicRef);
    const now = new Date().toISOString();
    const previousStatus = epic.status;

    if (updates.name) epic.name = updates.name;
    if (updates.objective) epic.objective = updates.objective;
    if (updates.owner) epic.owner = updates.owner;
    if (updates.priority) epic.priority = updates.priority;
    if (updates.tags) epic.tags = updates.tags;
    if (updates.successCriteria) epic.successCriteria = updates.successCriteria;
    if (updates.metrics) epic.metrics = updates.metrics;
    if (updates.status && updates.status !== epic.status) {
      epic.status = updates.status;
      if (updates.status === 'active' && !epic.timeline.started) {
        epic.timeline.started = now;
      }
      if (updates.status === 'completed' && !epic.timeline.completed) {
        epic.timeline.completed = now;
      }
      this.adjustEpicCounters(project, previousStatus, updates.status);
    }

    epic.timeline.updated = now;
    this.writeJSON(epicPath, epic);

    project.metadata.updated = now;
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);

    return epic;
  }

  // ==================== FEATURE CRUD ====================

  createFeature(projectSlug: string, epicRef: string, input: CreateFeatureInput): Feature {
    const project = this.getProject(projectSlug);
    const { epic, epicPath } = this.resolveEpicReference(project, epicRef);
    const slug = this.slugify(input.name);
    const featureDir = path.join(epic.paths.features, slug);
    const featureFile = path.join(featureDir, 'feature.json');

    if (fs.existsSync(featureFile)) {
      throw new ValidationError('name', `Feature with slug '${slug}' already exists under epic '${epic.slug}'`);
    }

    const now = new Date().toISOString();
    const feature: Feature = {
      id: uuidv4(),
      slug,
      projectId: project.id,
      epicId: epic.id,
      name: input.name,
      goal: input.goal,
      status: 'proposed',
      owner: input.owner,
      priority: input.priority || 'medium',
      tags: input.tags || [],
      overview: {
        summary: input.overview?.summary || input.goal,
        motivation: input.overview?.motivation,
        goals: input.overview?.goals || [],
      },
      requirements: {
        functional: input.requirements?.functional || [],
        nonFunctional: input.requirements?.nonFunctional || [],
      },
      acceptance: input.acceptance || [],
      metrics: input.metrics || {},
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
      },
      timeline: {
        created: now,
        updated: now,
      },
      paths: {
        root: featureDir,
      },
      relationships: {
        taskIds: [],
        relatedFeatureIds: [],
      },
    };

    this.ensureDirectory(feature.paths.root);
    this.writeJSON(featureFile, feature);

    epic.relationships.featureIds.push(feature.id);
    epic.stats.totalFeatures++;
    epic.timeline.updated = now;
    this.writeJSON(epicPath, epic);

    project.stats.totalFeatures = (project.stats.totalFeatures || 0) + 1;
    project.metadata.updated = now;
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);

    return feature;
  }

  getFeature(projectSlug: string, featureRef: string, epicRef?: string): Feature {
    const project = this.getProject(projectSlug);
    const { feature } = this.resolveFeatureReference(project, featureRef, epicRef);
    return feature;
  }

  listFeatures(projectSlug: string, filters?: {
    status?: FeatureStatus;
    epicRef?: string;
    tags?: string[];
  }): Feature[] {
    const project = this.getProject(projectSlug);
    const epics = filters?.epicRef
      ? [this.resolveEpicReference(project, filters.epicRef).epic]
      : this.loadAllEpics(project);

    let features = epics.flatMap(epic => this.loadFeaturesForEpic(epic));

    if (filters?.status) {
      features = features.filter(f => f.status === filters.status);
    }
    if (filters?.tags && filters.tags.length > 0) {
      features = features.filter(f => filters.tags!.some(tag => f.tags.includes(tag)));
    }

    return features;
  }

  updateFeature(projectSlug: string, featureRef: string, updates: UpdateFeatureInput, epicRef?: string): Feature {
    const project = this.getProject(projectSlug);
    const { feature, featurePath, epic, epicPath } = this.resolveFeatureReference(project, featureRef, epicRef);
    const now = new Date().toISOString();
    const previousStatus = feature.status;

    if (updates.name) feature.name = updates.name;
    if (updates.goal) feature.goal = updates.goal;
    if (updates.owner !== undefined) feature.owner = updates.owner;
    if (updates.priority) feature.priority = updates.priority;
    if (updates.tags) feature.tags = updates.tags;
    if (updates.overview) {
      feature.overview = {
        summary: updates.overview.summary ?? feature.overview.summary,
        motivation: updates.overview.motivation ?? feature.overview.motivation,
        goals: updates.overview.goals ?? feature.overview.goals,
      };
    }
    if (updates.requirements) {
      feature.requirements = {
        functional: updates.requirements.functional ?? feature.requirements.functional,
        nonFunctional: updates.requirements.nonFunctional ?? feature.requirements.nonFunctional,
      };
    }
    if (updates.acceptance) {
      feature.acceptance = updates.acceptance;
    }
    if (updates.metrics) {
      feature.metrics = updates.metrics;
    }
    if (updates.status && updates.status !== feature.status) {
      feature.status = updates.status;
      if (updates.status === 'in-progress' && !feature.timeline.started) {
        feature.timeline.started = now;
      }
      if (updates.status === 'complete' && !feature.timeline.completed) {
        feature.timeline.completed = now;
      }
      this.adjustFeatureCounters(project, epic, previousStatus, updates.status);
    }

    feature.timeline.updated = now;
    this.writeJSON(featurePath, feature);

    epic.timeline.updated = now;
    this.writeJSON(epicPath, epic);

    project.metadata.updated = now;
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);

    return feature;
  }

  linkTaskToFeature(projectSlug: string, featureRef: string, taskId: string, epicRef?: string): { feature: Feature; task: Task } {
    const project = this.getProject(projectSlug);
    this.detachTaskFromAllFeatures(project, projectSlug, taskId);
    const { feature, featurePath, epic, epicPath } = this.resolveFeatureReference(project, featureRef, epicRef);
    const task = this.getTask(projectSlug, taskId);

    task.featureId = feature.id;
    task.epicId = epic.id;
    task.timeline.updated = new Date().toISOString();
    const taskPath = this.getTaskPath(projectSlug, task);
    this.writeJSON(taskPath, task);

    if (!feature.relationships.taskIds.includes(task.id)) {
      feature.relationships.taskIds.push(task.id);
    }
    if (!epic.relationships.taskIds.includes(task.id)) {
      epic.relationships.taskIds.push(task.id);
    }

    const breakdown = this.computeTaskBreakdown(projectSlug, feature.relationships.taskIds);
    feature.stats.totalTasks = breakdown.total;
    feature.stats.completedTasks = breakdown.completed;
    feature.stats.inProgressTasks = breakdown.inProgress;

    const epicBreakdown = this.computeTaskBreakdown(projectSlug, epic.relationships.taskIds);
    epic.stats.totalTasks = epicBreakdown.total;
    epic.stats.completedTasks = epicBreakdown.completed;

    this.writeJSON(featurePath, feature);
    this.writeJSON(epicPath, epic);

    return { feature, task };
  }

  getFeatureProgress(projectSlug: string, featureRef: string, epicRef?: string): FeatureProgress {
    const project = this.getProject(projectSlug);
    const { feature } = this.resolveFeatureReference(project, featureRef, epicRef);
    const breakdown = this.computeTaskBreakdown(projectSlug, feature.relationships.taskIds);
    const progress = breakdown.total === 0 ? 0 : breakdown.completed / breakdown.total;
    return {
      featureId: feature.id,
      featureSlug: feature.slug,
      progress,
      totalTasks: breakdown.total,
      completedTasks: breakdown.completed,
      inProgressTasks: breakdown.inProgress,
      blockedTasks: breakdown.blocked,
      details: {
        pending: breakdown.pending,
        review: breakdown.review,
        archived: breakdown.archived,
      },
    };
  }
  
  // ==================== TASK CRUD ====================
  
  /**
   * Create a new task
   */
  createTask(projectSlug: string, input: CreateTaskInput): Task {
    const project = this.getProject(projectSlug);
    const now = new Date().toISOString();
    const taskId = uuidv4();
    const taskNumber = this.getNextTaskNumber(project.id);
    
    // If sprint ID provided, verify it exists
    let sprint: Sprint | undefined;
    if (input.sprintId) {
      const sprints = this.listSprints(projectSlug);
      sprint = sprints.find(s => s.id === input.sprintId);
      if (!sprint) {
        throw new SprintNotFoundError(input.sprintId);
      }
    }

    let resolvedEpicId = input.epicId;
    let resolvedFeatureId = input.featureId;
    if (resolvedFeatureId) {
      const { feature } = this.resolveFeatureReference(project, resolvedFeatureId);
      resolvedFeatureId = feature.id;
      resolvedEpicId = feature.epicId;
    }
    if (resolvedEpicId) {
      const { epic } = this.resolveEpicReference(project, resolvedEpicId);
      resolvedEpicId = epic.id;
    }
    
    const task: Task = {
      id: taskId,
      number: taskNumber,
      projectId: project.id,
      sprintId: input.sprintId,
      epicId: resolvedEpicId,
      featureId: resolvedFeatureId,
      
      title: input.title,
      description: input.description,
      status: 'pending',
      priority: input.priority,
      type: input.type,
      
      assignment: {
        assignee: input.assignee,
        reviewer: input.reviewer,
        dueDate: input.dueDate,
      },
      
      estimates: {
        points: input.points,
        hours: input.hours,
        complexity: input.complexity || 'medium',
      },
      
      relationships: {
        parent: input.parentId,
        children: [],
        dependencies: input.dependencies || [],
        blocks: [],
        relatedTo: [],
      },
      
      timeline: {
        created: now,
        updated: now,
        started: undefined,
        completed: undefined,
        archived: undefined,
      },
      
      metadata: {
        createdBy: project.metadata.owner,
        lastModifiedBy: project.metadata.owner,
        tags: input.tags || [],
        labels: input.labels || [],
        milestoneId: undefined,
      },
      
      tracking: {
        timeSpent: undefined,
        comments: [],
        changes: [],
        attachments: [],
      },
      
      acceptance: {
        criteria: input.acceptanceCriteria || [],
        testsPassing: undefined,
        approved: undefined,
        approvedBy: undefined,
        approvedAt: undefined,
      },
      
      context: {
        filesChanged: undefined,
        linesOfCode: undefined,
        pullRequestUrl: undefined,
        commitHashes: undefined,
      },
    };
    
    // Save task
    const tasksDir = sprint ? sprint.paths.tasks : path.join(project.paths.root, 'backlog');
    this.ensureDirectory(tasksDir);
    this.writeJSON(path.join(tasksDir, `${taskId}.json`), task);

    if (resolvedFeatureId) {
      this.linkTaskToFeature(projectSlug, resolvedFeatureId, task.id);
    }
    
    // Update stats
    project.stats.totalTasks++;
    this.writeJSON(path.join(project.paths.root, 'project.json'), project);
    
    if (sprint) {
      sprint.stats.totalTasks++;
      sprint.stats.pendingTasks++;
      this.writeJSON(path.join(sprint.paths.root, 'sprint.json'), sprint);
    }
    
    return task;
  }
  
  /**
   * Get a task by ID
   */
  getTask(projectSlug: string, taskId: string): Task {
    const project = this.getProject(projectSlug);
    
    // Search in backlog
    const backlogPath = path.join(project.paths.root, 'backlog', `${taskId}.json`);
    if (fs.existsSync(backlogPath)) {
      return this.readJSON<Task>(backlogPath);
    }
    
    // Search in all sprints
    const sprints = this.listSprints(projectSlug);
    for (const sprint of sprints) {
      const taskPath = path.join(sprint.paths.tasks, `${taskId}.json`);
      if (fs.existsSync(taskPath)) {
        return this.readJSON<Task>(taskPath);
      }
    }
    
    throw new TaskNotFoundError(taskId);
  }
  
  /**
   * Update a task
   */
  updateTask(projectSlug: string, taskId: string, updates: UpdateTaskInput): Task {
    const project = this.getProject(projectSlug);
    const task = this.getTask(projectSlug, taskId);
    const now = new Date().toISOString();
    let featureToLink: string | undefined;
    let shouldDetachFeature = false;
    
    if (updates.title) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status) {
      const oldStatus = task.status;
      task.status = updates.status;
      
      if (updates.status === 'in-progress' && !task.timeline.started) {
        task.timeline.started = now;
      }
      if (updates.status === 'complete' && !task.timeline.completed) {
        task.timeline.completed = now;
      }
      if (updates.status === 'archived' && !task.timeline.archived) {
        task.timeline.archived = now;
      }
      
      // Update sprint stats
      if (task.sprintId) {
        this.updateSprintStats(projectSlug, task.sprintId, oldStatus, updates.status);
      }
    }
    if (updates.priority) task.priority = updates.priority;
    if (updates.type) task.type = updates.type;
    if (updates.assignee !== undefined) task.assignment.assignee = updates.assignee;
    if (updates.reviewer !== undefined) task.assignment.reviewer = updates.reviewer;
    if (updates.dueDate !== undefined) task.assignment.dueDate = updates.dueDate;
    if (updates.points !== undefined) task.estimates.points = updates.points;
    if (updates.hours !== undefined) task.estimates.hours = updates.hours;
    if (updates.complexity) task.estimates.complexity = updates.complexity;
    if (updates.acceptanceCriteria) task.acceptance.criteria = updates.acceptanceCriteria;
    if (updates.tags) task.metadata.tags = updates.tags;
    if (updates.labels) task.metadata.labels = updates.labels;
    if (updates.featureId !== undefined) {
      if (updates.featureId === null) {
        task.featureId = undefined;
        if (updates.epicId === undefined) {
          task.epicId = undefined;
        }
        shouldDetachFeature = true;
      } else {
        const { feature } = this.resolveFeatureReference(project, updates.featureId);
        task.featureId = feature.id;
        task.epicId = feature.epicId;
        featureToLink = feature.id;
      }
    }
    if (updates.epicId !== undefined && updates.featureId === undefined) {
      if (updates.epicId === null) {
        task.epicId = undefined;
      } else {
        const { epic } = this.resolveEpicReference(project, updates.epicId);
        task.epicId = epic.id;
      }
    }
    
    task.timeline.updated = now;
    
    // Save task
    const taskPath = this.getTaskPath(projectSlug, task);
    this.writeJSON(taskPath, task);
    if (featureToLink) {
      this.linkTaskToFeature(projectSlug, featureToLink, task.id);
    } else if (shouldDetachFeature) {
      this.detachTaskFromAllFeatures(project, projectSlug, task.id);
    }
    
    return task;
  }
  
  /**
   * List tasks
   */
  listTasks(projectSlug: string, filters?: {
    sprintId?: string;
    status?: TaskStatus;
    assignee?: string;
    priority?: TaskPriority;
    type?: TaskType;
    tags?: string[];
    epicId?: string;
    featureId?: string;
  }): Task[] {
    const project = this.getProject(projectSlug);
    let tasks: Task[] = [];
    
    // Load from backlog
    const backlogPath = path.join(project.paths.root, 'backlog');
    if (fs.existsSync(backlogPath)) {
      const files = fs.readdirSync(backlogPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          tasks.push(this.readJSON<Task>(path.join(backlogPath, file)));
        }
      }
    }
    
    // Load from sprints
    const sprints = this.listSprints(projectSlug);
    for (const sprint of sprints) {
      if (filters?.sprintId && sprint.id !== filters.sprintId) continue;
      
      const tasksDir = sprint.paths.tasks;
      if (fs.existsSync(tasksDir)) {
        const files = fs.readdirSync(tasksDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            tasks.push(this.readJSON<Task>(path.join(tasksDir, file)));
          }
        }
      }
    }
    
    // Apply filters
    if (filters?.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters?.assignee) {
      tasks = tasks.filter(t => t.assignment.assignee === filters.assignee);
    }
    if (filters?.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }
    if (filters?.type) {
      tasks = tasks.filter(t => t.type === filters.type);
    }
    if (filters?.tags && filters.tags.length > 0) {
      tasks = tasks.filter(t =>
        filters.tags!.some(tag => t.metadata.tags.includes(tag))
      );
    }
    if (filters?.featureId) {
      tasks = tasks.filter(t => t.featureId === filters.featureId);
    }
    if (filters?.epicId) {
      tasks = tasks.filter(t => t.epicId === filters.epicId);
    }
    
    return tasks;
  }
  
  /**
   * Add comment to task
   */
  addComment(projectSlug: string, taskId: string, author: string, content: string): Task {
    const task = this.getTask(projectSlug, taskId);
    
    const comment: Comment = {
      id: uuidv4(),
      author,
      content,
      timestamp: new Date().toISOString(),
      edited: false,
    };
    
    task.tracking.comments.push(comment);
    task.timeline.updated = new Date().toISOString();
    
    const taskPath = this.getTaskPath(projectSlug, task);
    this.writeJSON(taskPath, task);
    
    return task;
  }
  
  /**
   * Add attachment to task
   */
  addAttachment(
    projectSlug: string,
    taskId: string,
    attachment: Omit<Attachment, 'id' | 'uploadedAt'>
  ): Task {
    const task = this.getTask(projectSlug, taskId);
    
    const fullAttachment: Attachment = {
      ...attachment,
      id: uuidv4(),
      uploadedAt: new Date().toISOString(),
    };
    
    task.tracking.attachments.push(fullAttachment);
    task.timeline.updated = new Date().toISOString();
    
    const taskPath = this.getTaskPath(projectSlug, task);
    this.writeJSON(taskPath, task);
    
    return task;
  }
  
  // ==================== HELPER METHODS ====================

  private loadAllEpics(project: Project): Epic[] {
    const epicsDir = project.paths.epics;
    if (!fs.existsSync(epicsDir)) {
      this.ensureDirectory(epicsDir);
      return [];
    }

    const entries = fs.readdirSync(epicsDir, { withFileTypes: true });
    const epics: Epic[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const epicPath = path.join(epicsDir, entry.name, 'epic.json');
      if (fs.existsSync(epicPath)) {
        epics.push(this.readJSON<Epic>(epicPath));
      }
    }
    return epics;
  }

  private loadFeaturesForEpic(epic: Epic): Feature[] {
    if (!fs.existsSync(epic.paths.features)) {
      this.ensureDirectory(epic.paths.features);
      return [];
    }
    const entries = fs.readdirSync(epic.paths.features, { withFileTypes: true });
    const features: Feature[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const featurePath = path.join(epic.paths.features, entry.name, 'feature.json');
      if (fs.existsSync(featurePath)) {
        features.push(this.readJSON<Feature>(featurePath));
      }
    }
    return features;
  }

  private resolveEpicReference(project: Project, reference: string): { epic: Epic; epicPath: string } {
    const directPath = path.join(project.paths.epics, reference, 'epic.json');
    if (fs.existsSync(directPath)) {
      return { epic: this.readJSON<Epic>(directPath), epicPath: directPath };
    }

    const epics = this.loadAllEpics(project);
    for (const epic of epics) {
      if (epic.id === reference) {
        const epicPath = path.join(project.paths.epics, epic.slug, 'epic.json');
        return { epic, epicPath };
      }
    }

    throw new EpicNotFoundError(reference);
  }

  private resolveFeatureReference(
    project: Project,
    reference: string,
    epicRef?: string
  ): { epic: Epic; epicPath: string; feature: Feature; featurePath: string } {
    if (epicRef) {
      const { epic, epicPath } = this.resolveEpicReference(project, epicRef);
      const result = this.findFeatureWithinEpic(epic, reference);
      if (result) {
        return { epic, epicPath, feature: result.feature, featurePath: result.featurePath };
      }
    }

    const epics = this.loadAllEpics(project);
    for (const epic of epics) {
      const result = this.findFeatureWithinEpic(epic, reference);
      if (result) {
        const epicPath = path.join(project.paths.epics, epic.slug, 'epic.json');
        return { epic, epicPath, feature: result.feature, featurePath: result.featurePath };
      }
    }

    throw new FeatureNotFoundError(reference);
  }

  private findFeatureWithinEpic(epic: Epic, reference: string): { feature: Feature; featurePath: string } | null {
    const directPath = path.join(epic.paths.features, reference, 'feature.json');
    if (fs.existsSync(directPath)) {
      return { feature: this.readJSON<Feature>(directPath), featurePath: directPath };
    }

    const features = this.loadFeaturesForEpic(epic);
    for (const feature of features) {
      if (feature.id === reference) {
        const featurePath = path.join(epic.paths.features, feature.slug, 'feature.json');
        return { feature, featurePath };
      }
    }

    return null;
  }

  private adjustEpicCounters(project: Project, oldStatus: EpicStatus, newStatus: EpicStatus): void {
    if (!project.stats.activeEpics) project.stats.activeEpics = 0;
    if (oldStatus === 'active') {
      project.stats.activeEpics = Math.max(0, project.stats.activeEpics - 1);
    }
    if (newStatus === 'active') {
      project.stats.activeEpics += 1;
    }
  }

  private adjustFeatureCounters(project: Project, epic: Epic, oldStatus: FeatureStatus, newStatus: FeatureStatus): void {
    if (oldStatus === 'complete') {
      epic.stats.completedFeatures = Math.max(0, epic.stats.completedFeatures - 1);
      if (project.stats.completedFeatures !== undefined) {
        project.stats.completedFeatures = Math.max(0, (project.stats.completedFeatures || 0) - 1);
      }
    }
    if (newStatus === 'complete') {
      epic.stats.completedFeatures += 1;
      project.stats.completedFeatures = (project.stats.completedFeatures || 0) + 1;
    }
  }

  private computeTaskBreakdown(projectSlug: string, taskIds: string[]) {
    const breakdown = {
      total: 0,
      completed: 0,
      inProgress: 0,
      blocked: 0,
      pending: 0,
      review: 0,
      archived: 0,
    };

    for (const taskId of taskIds) {
      try {
        const task = this.getTask(projectSlug, taskId);
        breakdown.total += 1;
        switch (task.status) {
          case 'complete':
            breakdown.completed += 1;
            break;
          case 'in-progress':
            breakdown.inProgress += 1;
            break;
          case 'blocked':
            breakdown.blocked += 1;
            break;
          case 'review':
            breakdown.review += 1;
            break;
          case 'archived':
            breakdown.archived += 1;
            break;
          default:
            breakdown.pending += 1;
        }
      } catch (error) {
        // Ignore missing tasks (they may have been deleted)
        continue;
      }
    }

    return breakdown;
  }

  private detachTaskFromAllFeatures(project: Project, projectSlug: string, taskId: string): void {
    const epics = this.loadAllEpics(project);
    for (const epic of epics) {
      let epicChanged = false;
      const features = this.loadFeaturesForEpic(epic);
      for (const feature of features) {
        const idx = feature.relationships.taskIds.indexOf(taskId);
        if (idx >= 0) {
          feature.relationships.taskIds.splice(idx, 1);
          const breakdown = this.computeTaskBreakdown(projectSlug, feature.relationships.taskIds);
          feature.stats.totalTasks = breakdown.total;
          feature.stats.completedTasks = breakdown.completed;
          feature.stats.inProgressTasks = breakdown.inProgress;
          const featurePath = path.join(epic.paths.features, feature.slug, 'feature.json');
          this.writeJSON(featurePath, feature);
          epicChanged = true;
        }
      }

      const epicTaskIdx = epic.relationships.taskIds.indexOf(taskId);
      if (epicTaskIdx >= 0) {
        epic.relationships.taskIds.splice(epicTaskIdx, 1);
        const breakdown = this.computeTaskBreakdown(projectSlug, epic.relationships.taskIds);
        epic.stats.totalTasks = breakdown.total;
        epic.stats.completedTasks = breakdown.completed;
        epicChanged = true;
      }

      if (epicChanged) {
        const epicPath = path.join(project.paths.epics, epic.slug, 'epic.json');
        this.writeJSON(epicPath, epic);
      }
    }
  }

  private ensureProjectStructure(project: Project): void {
    let updated = false;
    if (!project.paths.epics) {
      project.paths.epics = path.join(project.paths.root, 'epics');
      updated = true;
    }
    this.ensureDirectory(project.paths.epics);
    this.ensureDirectory(path.join(project.paths.root, 'backlog'));

    if (project.stats.totalEpics === undefined) {
      project.stats.totalEpics = 0;
      updated = true;
    }
    if (project.stats.activeEpics === undefined) {
      project.stats.activeEpics = 0;
      updated = true;
    }
    if (project.stats.totalFeatures === undefined) {
      project.stats.totalFeatures = 0;
      updated = true;
    }
    if (project.stats.completedFeatures === undefined) {
      project.stats.completedFeatures = 0;
      updated = true;
    }

    if (updated) {
      const projectPath = path.join(project.paths.root, 'project.json');
      this.writeJSON(projectPath, project);
    }
  }
  
  private getTaskPath(projectSlug: string, task: Task): string {
    const project = this.getProject(projectSlug);
    
    if (!task.sprintId) {
      return path.join(project.paths.root, 'backlog', `${task.id}.json`);
    }
    
    const sprints = this.listSprints(projectSlug);
    const sprint = sprints.find(s => s.id === task.sprintId);
    
    if (!sprint) {
      throw new SprintNotFoundError(task.sprintId);
    }
    
    return path.join(sprint.paths.tasks, `${task.id}.json`);
  }
  
  private updateSprintStats(
    projectSlug: string,
    sprintId: string,
    oldStatus: TaskStatus,
    newStatus: TaskStatus
  ): void {
    const sprints = this.listSprints(projectSlug);
    const sprint = sprints.find(s => s.id === sprintId);
    
    if (!sprint) return;
    
    // Decrement old status
    if (oldStatus === 'pending') sprint.stats.pendingTasks--;
    else if (oldStatus === 'in-progress') sprint.stats.inProgressTasks--;
    else if (oldStatus === 'complete') sprint.stats.completedTasks--;
    else if (oldStatus === 'archived') sprint.stats.archivedTasks--;
    
    // Increment new status
    if (newStatus === 'pending') sprint.stats.pendingTasks++;
    else if (newStatus === 'in-progress') sprint.stats.inProgressTasks++;
    else if (newStatus === 'complete') sprint.stats.completedTasks++;
    else if (newStatus === 'archived') sprint.stats.archivedTasks++;
    
    this.writeJSON(path.join(sprint.paths.root, 'sprint.json'), sprint);
  }
}
