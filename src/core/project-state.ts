import { randomUUID } from 'crypto';
import { EventBus } from './event-bus.js';

export type ProjectStatus = 'PLANNING' | 'STRATEGY' | 'EXECUTION' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED';
export type AgentStatus = 'IDLE' | 'WORKING' | 'WAITING' | 'OFFLINE';

export interface AgentAssignment {
  agentId: string;
  role: string; // e.g., 'Researcher', 'Copywriter'
  status: AgentStatus;
  currentTask?: string;
}

export interface ProjectHook {
  id: string;
  triggerEvent: string; // e.g., 'task:completed'
  action: 'notify_agent' | 'update_state' | 'run_script';
  target: string; // Agent ID or Script Path
  config?: any;
}

export interface ActiveProject {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  managerAgentId: string; // The "CEO"
  
  // Runtime State
  swarm: Record<string, AgentAssignment>;
  context: {
    objectives: string[];
    constraints: string[];
    strategicData: Record<string, any>; // Research outputs
  };
  
  hooks: ProjectHook[];
  
  createdAt: string;
  updatedAt: string;
}

export class ProjectStateManager {
  private projects: Map<string, ActiveProject> = new Map();
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public createProject(name: string, managerAgentId: string): ActiveProject {
    const id = randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const project: ActiveProject = {
      id,
      name,
      slug,
      status: 'PLANNING',
      managerAgentId,
      swarm: {},
      context: {
        objectives: [],
        constraints: [],
        strategicData: {}
      },
      hooks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.set(id, project);
    this.eventBus.emitEvent('project:created', 'LIFECYCLE', { projectId: id, name }, managerAgentId);
    return project;
  }

  public getProject(id: string): ActiveProject | undefined {
    return this.projects.get(id);
  }

  public updateStatus(id: string, status: ProjectStatus, source: string): ActiveProject {
    const project = this.projects.get(id);
    if (!project) throw new Error(`Project ${id} not found`);

    const oldStatus = project.status;
    project.status = status;
    project.updatedAt = new Date().toISOString();

    this.eventBus.emitEvent('project:status_changed', 'LIFECYCLE', { 
      projectId: id, 
      oldStatus, 
      newStatus: status 
    }, source);

    return project;
  }

  public assignAgent(projectId: string, agentId: string, role: string, source: string): void {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    project.swarm[agentId] = {
      agentId,
      role,
      status: 'IDLE'
    };
    project.updatedAt = new Date().toISOString();

    this.eventBus.emitEvent('project:agent_assigned', 'PROJECT', { 
      projectId, 
      agentId, 
      role 
    }, source);
  }

  public updateStrategicContext(projectId: string, key: string, data: any, source: string): void {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    project.context.strategicData[key] = data;
    project.updatedAt = new Date().toISOString();

    this.eventBus.emitEvent('project:context_updated', 'DATA', { 
      projectId, 
      key 
    }, source);
  }

  public registerHook(projectId: string, triggerEvent: string, action: ProjectHook['action'], target: string, config?: any): string {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const hook: ProjectHook = {
      id: randomUUID(),
      triggerEvent,
      action,
      target,
      config
    };

    project.hooks.push(hook);
    
    // Subscribe to the event bus
    this.eventBus.subscribe(triggerEvent, async (event) => {
      // Filter events relevant to this project if possible (naive implementation for now)
      // In a real system, we'd check if event.payload.projectId matches
      if (event.payload?.projectId && event.payload.projectId !== projectId) return;

      console.log(`[Hook Triggered] ${triggerEvent} -> ${action} on ${target}`);
      // Here we would execute the action (e.g., notify agent)
      // For now, we just emit a hook_executed event
      this.eventBus.emitEvent('hook:executed', 'LIFECYCLE', { hookId: hook.id, eventId: event.id }, 'system');
    });

    return hook.id;
  }
}
