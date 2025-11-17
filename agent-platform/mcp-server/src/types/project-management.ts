/**
 * Project Management System Type Definitions
 * 
 * Comprehensive type system for managing projects, sprints, tasks,
 * and associated documentation in an MCP server environment.
 */

// ===== PROJECT TYPES =====

export interface Project {
  id: string;                         // UUID
  slug: string;                       // URL-friendly name (kebab-case)
  name: string;                       // Display name
  description: string;                // Brief description
  status: ProjectStatus;
  
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  stats: ProjectStats;
  paths: ProjectPaths;
}

export interface ProjectMetadata {
  created: string;                    // ISO 8601 timestamp
  updated: string;                    // ISO 8601 timestamp
  owner: string;                      // Creator/owner identifier
  contributors: string[];             // List of contributor IDs
  tags: string[];                     // Categorization tags
  version: string;                    // Semver version
}

export interface ProjectSettings {
  sprintDuration: number;             // Days (default: 14)
  timezone: string;                   // IANA timezone
  defaultAssignee?: string;           // Auto-assign tasks
  requireApproval: boolean;           // Require approval for completion
  autoArchiveDays?: number;           // Auto-archive after N days
  templateType?: TemplateType;        // Default template type
}

export interface ProjectStats {
  totalSprints: number;
  activeSprints: number;
  totalTasks: number;
  completedTasks: number;
  activeContributors: number;
  totalEpics?: number;
  activeEpics?: number;
  totalFeatures?: number;
  completedFeatures?: number;
}

export interface ProjectPaths {
  root: string;                       // Absolute path to project
  docs: string;                       // Documentation directory
  memory: string;                     // Memory storage
  sprints: string;                    // Sprints directory
  archived: string;                   // Archived content
  epics: string;                      // Epics + features directory
}

export type ProjectStatus = 
  | "active"                          // Currently being worked on
  | "on-hold"                         // Temporarily paused
  | "completed"                       // Finished successfully
  | "archived";                       // No longer active

export type TemplateType =
  | "typescript-react"
  | "python-fastapi"
  | "rust"
  | "nodejs"
  | "custom";

// ===== PROJECT REGISTRY =====

export interface ProjectRegistry {
  version: string;                    // Registry schema version
  updated: string;                    // Last update timestamp
  projects: {
    [slug: string]: ProjectRegistryEntry;
  };
}

export interface ProjectRegistryEntry {
  id: string;
  name: string;
  status: ProjectStatus;
  path: string;                       // Relative path
  created: string;
  updated: string;
}

// ===== SPRINT TYPES =====

export interface Sprint {
  id: string;                         // UUID
  number: number;                     // Sequential number (1, 2, 3...)
  name: string;                       // Sprint name/theme
  projectId: string;                  // Parent project ID
  status: SprintStatus;
  
  schedule: SprintSchedule;
  goals: SprintGoals;
  stats: SprintStats;
  metadata: SprintMetadata;
  paths: SprintPaths;
}

export interface SprintSchedule {
  startDate: string;                  // ISO 8601
  endDate: string;                    // ISO 8601
  duration: number;                   // Days
  actualStartDate?: string;           // When work actually began
  actualEndDate?: string;             // When work actually finished
}

export interface SprintGoals {
  primary: string[];                  // Must-have objectives
  secondary: string[];                // Nice-to-have objectives
  metrics: Record<string, number>;    // Success metrics
}

export interface SprintStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  archivedTasks: number;
  totalPoints?: number;               // Story points
  completedPoints?: number;
  velocity?: number;                  // Points per day
}

export interface SprintMetadata {
  created: string;
  updated: string;
  createdBy: string;
  lastModifiedBy: string;
}

export interface SprintPaths {
  root: string;
  tasks: string;
  attachments: string;
}

export type SprintStatus =
  | "planned"                         // Not started
  | "active"                          // Currently running
  | "completed"                       // Successfully finished
  | "archived";                       // Moved to archive

// ===== TASK TYPES =====

export interface Task {
  id: string;                         // UUID
  number: string;                     // TASK-001 format
  projectId: string;
  sprintId?: string;                  // Optional sprint assignment
  epicId?: string;                    // Optional epic linkage
  featureId?: string;                 // Optional feature linkage
  
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  
  assignment: TaskAssignment;
  estimates: TaskEstimates;
  relationships: TaskRelationships;
  timeline: TaskTimeline;
  metadata: TaskMetadata;
  tracking: TaskTracking;
  acceptance: TaskAcceptance;
  context: TaskContext;
}

export interface TaskAssignment {
  assignee?: string;                  // Assigned to
  reviewer?: string;                  // Code reviewer
  dueDate?: string;                   // ISO 8601
}

export interface TaskEstimates {
  points?: number;                    // Story points
  hours?: number;                     // Hour estimate
  complexity: Complexity;             // low | medium | high | critical
}

export interface TaskRelationships {
  parent?: string;                    // Parent task ID (for subtasks)
  children: string[];                 // Subtask IDs
  dependencies: string[];             // Blocked by these tasks
  blocks: string[];                   // This task blocks these
  relatedTo: string[];                // Related tasks
}

// ===== EPIC & FEATURE TYPES =====

export interface Epic {
  id: string;
  slug: string;
  projectId: string;
  name: string;
  objective: string;
  status: EpicStatus;
  owner: string;
  priority: TaskPriority;
  tags: string[];
  metrics: Record<string, number>;
  successCriteria: string[];
  stats: EpicStats;
  timeline: EpicTimeline;
  paths: EpicPaths;
  relationships: EpicRelationships;
}

export type EpicStatus = "planned" | "active" | "completed" | "archived";

export interface EpicStats {
  totalFeatures: number;
  completedFeatures: number;
  totalTasks: number;
  completedTasks: number;
}

export interface EpicTimeline {
  created: string;
  updated: string;
  started?: string;
  completed?: string;
}

export interface EpicPaths {
  root: string;
  features: string;
}

export interface EpicRelationships {
  featureIds: string[];
  taskIds: string[];
}

export interface Feature {
  id: string;
  slug: string;
  projectId: string;
  epicId: string;
  name: string;
  goal: string;
  status: FeatureStatus;
  owner?: string;
  priority: TaskPriority;
  tags: string[];
  overview: FeatureOverview;
  requirements: FeatureRequirements;
  acceptance: string[];
  metrics: Record<string, number>;
  stats: FeatureStats;
  timeline: FeatureTimeline;
  paths: FeaturePaths;
  relationships: FeatureRelationships;
}

export type FeatureStatus =
  | "proposed"
  | "in-progress"
  | "ready"
  | "blocked"
  | "complete"
  | "archived";

export interface FeatureOverview {
  summary: string;
  motivation?: string;
  goals: string[];
}

export interface FeatureRequirements {
  functional: string[];
  nonFunctional: string[];
}

export interface FeatureStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
}

export interface FeatureTimeline {
  created: string;
  updated: string;
  started?: string;
  completed?: string;
}

export interface FeaturePaths {
  root: string;
}

export interface FeatureRelationships {
  taskIds: string[];
  relatedFeatureIds: string[];
}

export interface FeatureProgress {
  featureId: string;
  featureSlug: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  details: {
    pending: number;
    review: number;
    archived: number;
  };
}

export interface TaskTimeline {
  created: string;                    // ISO 8601
  updated: string;
  started?: string;                   // When moved to in-progress
  completed?: string;                 // When marked complete
  archived?: string;                  // When archived
}

export interface TaskMetadata {
  createdBy: string;
  lastModifiedBy: string;
  tags: string[];
  labels: string[];                   // bug, feature, refactor, etc.
  milestoneId?: string;
}

export interface TaskTracking {
  timeSpent?: number;                 // Minutes
  comments: Comment[];
  changes: ChangeLog[];
  attachments: Attachment[];
}

export interface TaskAcceptance {
  criteria: string[];                 // Acceptance criteria
  testsPassing?: boolean;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface TaskContext {
  filesChanged?: string[];            // Related file paths
  linesOfCode?: number;
  pullRequestUrl?: string;
  commitHashes?: string[];
}

export type TaskStatus = 
  | "pending"                         // Not started
  | "in-progress"                     // Currently being worked
  | "blocked"                         // Cannot proceed
  | "review"                          // Awaiting review
  | "complete"                        // Finished
  | "archived";                       // Archived

export type TaskPriority = 
  | "critical"                        // P0 - Urgent
  | "high"                            // P1 - Important
  | "medium"                          // P2 - Normal
  | "low";                            // P3 - Nice to have

export type TaskType =
  | "feature"                         // New functionality
  | "bug"                             // Bug fix
  | "refactor"                        // Code improvement
  | "docs"                            // Documentation
  | "test"                            // Testing
  | "chore"                           // Maintenance
  | "research"                        // Investigation
  | "design";                         // UI/UX design

export type Complexity = "low" | "medium" | "high" | "critical";

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

export interface ChangeLog {
  timestamp: string;
  author: string;
  field: string;                      // What changed
  oldValue: any;
  newValue: any;
  reason?: string;
}

export interface Attachment {
  id: string;
  name: string;
  path: string;                       // Relative to sprint/attachments
  type: string;                       // MIME type
  size: number;                       // Bytes
  uploadedBy: string;
  uploadedAt: string;
}

// ===== MEMORY & CONTEXT TYPES =====

export interface ProjectMemory {
  decisions: Decision[];
  lessonsLearned: LessonLearned[];
  context: ProjectContext;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  rationale: string;
  timestamp: string;
  author: string;
  tags: string[];
  status: "proposed" | "accepted" | "rejected" | "superseded";
  supersededBy?: string;
}

export interface LessonLearned {
  id: string;
  title: string;
  description: string;
  category: string;                   // technical | process | people | tools
  impact: "high" | "medium" | "low";
  timestamp: string;
  author: string;
  tags: string[];
}

export interface ProjectContext {
  currentPhase: string;
  activeMilestones: string[];
  recentChanges: ContextChange[];
  blockers: string[];
  nextSteps: string[];
  updated: string;
}

export interface ContextChange {
  timestamp: string;
  type: "feature" | "decision" | "blocker" | "milestone";
  description: string;
  impact: "high" | "medium" | "low";
}

// ===== DOCUMENTATION TYPES =====

export interface ADR {
  number: number;
  title: string;
  status: "proposed" | "accepted" | "deprecated" | "superseded";
  date: string;
  context: string;
  decision: string;
  consequences: string;
  alternatives?: string[];
  supersededBy?: number;
}

export interface ImplementationLogEntry {
  date: string;
  author: string;
  summary: string;
  tasksCompleted: string[];
  blockers?: string[];
  notes?: string;
}

export interface Retrospective {
  sprintId: string;
  date: string;
  participants: string[];
  
  achievements: string[];
  challenges: string[];
  improvements: string[];
  
  metrics: {
    velocity: number;
    completionRate: number;
    qualityScore?: number;
  };
  
  actionItems: ActionItem[];
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate?: string;
  status: "pending" | "in-progress" | "complete";
}

// ===== QUERY & FILTER TYPES =====

export interface ProjectQuery {
  filters?: {
    status?: ProjectStatus[];
    tags?: string[];
    owner?: string;
    search?: string;
  };
  sortBy?: "name" | "created" | "updated" | "activity";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface SprintQuery {
  projectId?: string;
  filters?: {
    status?: SprintStatus[];
    startDate?: { from?: string; to?: string };
  };
  sortBy?: "number" | "startDate" | "endDate";
  sortOrder?: "asc" | "desc";
  limit?: number;
}

export interface TaskQuery {
  projectId?: string;
  sprintId?: string;
  filters?: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    type?: TaskType[];
    assignee?: string;
    tags?: string[];
    hasBlockers?: boolean;
    overdue?: boolean;
    parentId?: string;
  };
  sortBy?: "priority" | "created" | "updated" | "dueDate" | "number";
  sortOrder?: "asc" | "desc";
  groupBy?: "status" | "priority" | "assignee" | "sprint" | "type";
  limit?: number;
  offset?: number;
}

// ===== METRICS & ANALYTICS =====

export interface ProjectMetrics {
  velocity: VelocityMetrics;
  quality: QualityMetrics;
  efficiency: EfficiencyMetrics;
  health: HealthMetrics;
}

export interface VelocityMetrics {
  current: number;                    // Points per day
  average: number;                    // Historical average
  trend: "up" | "down" | "stable";
  history: { date: string; value: number }[];
}

export interface QualityMetrics {
  defectRate: number;                 // Bugs per feature
  reworkRate: number;                 // % tasks reopened
  testCoverage: number;               // %
  codeReviewScore?: number;
}

export interface EfficiencyMetrics {
  cycleTime: number;                  // Hours from start to complete
  leadTime: number;                   // Hours from creation to complete
  wipLimit: number;                   // Current WIP count
  throughput: number;                 // Tasks completed per week
}

export interface HealthMetrics {
  overdueTasks: number;
  blockedTasks: number;
  criticalBugs: number;
  technicalDebtPoints?: number;
}

// ===== ACTIVITY & AUDIT =====

export interface ActivityLog {
  timestamp: string;
  actor: string;
  action: ActivityAction;
  resource: {
    type: "project" | "sprint" | "task" | "document";
    id: string;
    name: string;
  };
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "archived"
  | "restored"
  | "moved"
  | "assigned"
  | "commented"
  | "approved"
  | "completed";

// ===== ERROR TYPES =====

export class ProjectManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProjectManagementError';
  }
}

export class ProjectNotFoundError extends ProjectManagementError {
  constructor(identifier: string) {
    super(
      `Project not found: ${identifier}`,
      'PROJECT_NOT_FOUND',
      { identifier }
    );
  }
}

export class SprintNotFoundError extends ProjectManagementError {
  constructor(identifier: string) {
    super(
      `Sprint not found: ${identifier}`,
      'SPRINT_NOT_FOUND',
      { identifier }
    );
  }
}

export class TaskNotFoundError extends ProjectManagementError {
  constructor(identifier: string) {
    super(
      `Task not found: ${identifier}`,
      'TASK_NOT_FOUND',
      { identifier }
    );
  }
}

export class EpicNotFoundError extends ProjectManagementError {
  constructor(identifier: string) {
    super(
      `Epic not found: ${identifier}`,
      'EPIC_NOT_FOUND',
      { identifier }
    );
  }
}

export class FeatureNotFoundError extends ProjectManagementError {
  constructor(identifier: string) {
    super(
      `Feature not found: ${identifier}`,
      'FEATURE_NOT_FOUND',
      { identifier }
    );
  }
}

export class SprintActiveError extends ProjectManagementError {
  constructor(sprintId: string) {
    super(
      `Cannot modify active sprint: ${sprintId}`,
      'SPRINT_ACTIVE',
      { sprintId }
    );
  }
}

export class TaskDependencyError extends ProjectManagementError {
  constructor(taskId: string, dependencyId: string) {
    super(
      `Cannot complete task ${taskId}: dependency ${dependencyId} not complete`,
      'TASK_DEPENDENCY_NOT_MET',
      { taskId, dependencyId }
    );
  }
}

export class ValidationError extends ProjectManagementError {
  constructor(field: string, message: string) {
    super(
      `Validation error for ${field}: ${message}`,
      'VALIDATION_ERROR',
      { field, message }
    );
  }
}

export class PermissionError extends ProjectManagementError {
  constructor(action: string, resource: string) {
    super(
      `Permission denied: cannot ${action} ${resource}`,
      'PERMISSION_DENIED',
      { action, resource }
    );
  }
}

// ===== UTILITY TYPES =====

export interface CreateProjectInput {
  name: string;
  description: string;
  owner: string;
  tags?: string[];
  sprintDuration?: number;
  timezone?: string;
  templateType?: TemplateType;
  initializeTemplates?: boolean;
}

export interface CreateSprintInput {
  projectId: string;
  name: string;
  startDate: string;
  duration?: number;
  goals?: {
    primary?: string[];
    secondary?: string[];
    metrics?: Record<string, number>;
  };
}

export interface CreateTaskInput {
  projectId: string;
  sprintId?: string;
  epicId?: string;
  featureId?: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  assignee?: string;
  reviewer?: string;
  dueDate?: string;
  points?: number;
  hours?: number;
  complexity?: Complexity;
  acceptanceCriteria?: string[];
  dependencies?: string[];
  tags?: string[];
  labels?: string[];
  parentId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  settings?: Partial<ProjectSettings>;
}

export interface UpdateSprintInput {
  name?: string;
  status?: SprintStatus;
  startDate?: string;
  endDate?: string;
  goals?: Partial<SprintGoals>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assignee?: string;
  reviewer?: string;
  dueDate?: string;
  points?: number;
  hours?: number;
  complexity?: Complexity;
  acceptanceCriteria?: string[];
  tags?: string[];
  labels?: string[];
  epicId?: string | null;
  featureId?: string | null;
}

export interface CreateEpicInput {
  name: string;
  objective: string;
  owner: string;
  tags?: string[];
  priority?: TaskPriority;
  successCriteria?: string[];
  metrics?: Record<string, number>;
}

export interface UpdateEpicInput {
  name?: string;
  objective?: string;
  status?: EpicStatus;
  owner?: string;
  priority?: TaskPriority;
  tags?: string[];
  successCriteria?: string[];
  metrics?: Record<string, number>;
}

export interface CreateFeatureInput {
  epicId?: string;
  name: string;
  goal: string;
  owner?: string;
  tags?: string[];
  priority?: TaskPriority;
  overview?: Partial<FeatureOverview>;
  requirements?: Partial<FeatureRequirements>;
  acceptance?: string[];
  metrics?: Record<string, number>;
}

export interface UpdateFeatureInput {
  name?: string;
  goal?: string;
  status?: FeatureStatus;
  owner?: string;
  tags?: string[];
  priority?: TaskPriority;
  overview?: Partial<FeatureOverview>;
  requirements?: Partial<FeatureRequirements>;
  acceptance?: string[];
  metrics?: Record<string, number>;
}

export interface MoveTaskInput {
  taskId: string;
  toStatus: TaskStatus;
  reason?: string;
  notify?: boolean;
}

export interface BatchUpdateTasksInput {
  taskIds: string[];
  updates: UpdateTaskInput;
}

// ===== RESPONSE TYPES =====

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ListSprintsResponse {
  sprints: Sprint[];
  total: number;
}

export interface ListTasksResponse {
  tasks: Task[];
  total: number;
  grouped?: {
    [key: string]: Task[];
  };
}

export interface ProjectContextResponse {
  project: Project;
  standards?: string;
  roadmap?: string;
  memory: ProjectMemory;
  activeSprint?: Sprint;
  activeTasks: Task[];
  recentChanges: ActivityLog[];
  metrics: ProjectMetrics;
}

export interface SearchResult {
  type: "project" | "sprint" | "task" | "document";
  id: string;
  title: string;
  description: string;
  path: string;
  highlights?: string[];
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  executionTime: number;
}
