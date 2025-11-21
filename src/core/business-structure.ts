import { randomUUID } from 'crypto';
import { EventBus } from './event-bus.js';
import { ProjectStateManager } from './project-state.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface SOPPhase {
  name: string;
  description: string;
  requiredRoles: string[]; // e.g. ["Copywriter", "Editor"]
  deliverables: string[]; // e.g. ["draft.md", "final.md"]
}

export interface SOP {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  triggerEvent?: string; // If set, auto-instantiates on this event
  phases: SOPPhase[];
  managerInstructions: string; // Template for the Manager Agent
  version: string;
}

export interface Department {
  id: string;
  name: string;
  mission: string;
  headAgentId: string;
  memberAgents: string[]; // IDs of agents in this dept
  subDepartments: string[]; // IDs of sub-departments
}

export class BusinessStructureManager {
  private departments: Map<string, Department> = new Map();
  private sops: Map<string, SOP> = new Map();
  private eventBus: EventBus;
  private projectState: ProjectStateManager;
  private storageRoot: string;

  constructor(projectState: ProjectStateManager, storageRoot?: string) {
    this.eventBus = EventBus.getInstance();
    this.projectState = projectState;
    this.storageRoot = storageRoot || path.join(os.homedir(), '.agents', 'business');
    this.initialize();
  }

  private async initialize() {
    await fs.mkdir(path.join(this.storageRoot, 'departments'), { recursive: true });
    await fs.mkdir(path.join(this.storageRoot, 'sops'), { recursive: true });
    await this.loadAll();
  }

  private async loadAll() {
    try {
      // Load Departments
      const deptFiles = await fs.readdir(path.join(this.storageRoot, 'departments'));
      for (const file of deptFiles) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.storageRoot, 'departments', file), 'utf-8');
          const dept = JSON.parse(data) as Department;
          this.departments.set(dept.id, dept);
        }
      }

      // Load SOPs
      const sopFiles = await fs.readdir(path.join(this.storageRoot, 'sops'));
      for (const file of sopFiles) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.storageRoot, 'sops', file), 'utf-8');
          const sop = JSON.parse(data) as SOP;
          this.sops.set(sop.id, sop);
          
          // Re-register triggers
          if (sop.triggerEvent) {
            this.registerSOPTrigger(sop);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load business structure:', error);
    }
  }

  private async saveDepartment(dept: Department) {
    await fs.writeFile(
      path.join(this.storageRoot, 'departments', `${dept.id}.json`),
      JSON.stringify(dept, null, 2)
    );
  }

  private async saveSOP(sop: SOP) {
    await fs.writeFile(
      path.join(this.storageRoot, 'sops', `${sop.id}.json`),
      JSON.stringify(sop, null, 2)
    );
  }

  // --- Department Management ---

  public async createDepartment(name: string, mission: string, headAgentId: string): Promise<Department> {
    const id = randomUUID();
    const dept: Department = {
      id,
      name,
      mission,
      headAgentId,
      memberAgents: [headAgentId],
      subDepartments: []
    };

    this.departments.set(id, dept);
    await this.saveDepartment(dept);
    this.eventBus.emitEvent('department:created', 'LIFECYCLE', { departmentId: id, name }, 'system');
    return dept;
  }

  public getDepartment(id: string): Department | undefined {
    return this.departments.get(id);
  }

  public listDepartments(): Department[] {
    return Array.from(this.departments.values());
  }

  public async assignAgentToDepartment(deptId: string, agentId: string): Promise<void> {
    const dept = this.departments.get(deptId);
    if (!dept) throw new Error(`Department ${deptId} not found`);
    
    if (!dept.memberAgents.includes(agentId)) {
      dept.memberAgents.push(agentId);
      await this.saveDepartment(dept);
      this.eventBus.emitEvent('department:agent_added', 'LIFECYCLE', { departmentId: deptId, agentId }, 'system');
    }
  }

  // --- SOP Management ---

  public async defineSOP(
    name: string, 
    description: string, 
    departmentId: string, 
    phases: SOPPhase[], 
    managerInstructions: string,
    triggerEvent?: string
  ): Promise<SOP> {
    const id = randomUUID();
    const sop: SOP = {
      id,
      name,
      description,
      departmentId,
      phases,
      managerInstructions,
      triggerEvent,
      version: '1.0.0'
    };

    this.sops.set(id, sop);
    await this.saveSOP(sop);
    this.eventBus.emitEvent('sop:defined', 'DATA', { sopId: id, name }, 'system');

    if (triggerEvent) {
      this.registerSOPTrigger(sop);
    }

    return sop;
  }

  private registerSOPTrigger(sop: SOP) {
    if (!sop.triggerEvent) return;
    
    this.eventBus.subscribe(sop.triggerEvent, async (event) => {
        console.log(`[SOP Auto-Trigger] ${sop.name} triggered by ${sop.triggerEvent}`);
        this.eventBus.emitEvent('sop:triggered', 'LIFECYCLE', { sopId: sop.id, sourceEvent: event.id }, 'system');
        // In a real system, we might auto-instantiate here, but usually we want a human or "Commander" to approve
    });
  }

  public getSOP(id: string): SOP | undefined {
    return this.sops.get(id);
  }

  public listSOPs(departmentId?: string): SOP[] {
    const all = Array.from(this.sops.values());
    if (departmentId) {
      return all.filter(s => s.departmentId === departmentId);
    }
    return all;
  }

  // --- Execution ---

  public instantiateSOP(sopId: string, projectName: string, managerAgentId: string): string {
    const sop = this.sops.get(sopId);
    if (!sop) throw new Error(`SOP ${sopId} not found`);

    // 1. Create the Project
    const project = this.projectState.createProject(projectName, managerAgentId);

    // 2. Hydrate Context with SOP details
    this.projectState.updateStrategicContext(project.id, 'sop_definition', sop, 'system');
    
    // 3. Pre-load instructions
    this.projectState.updateStrategicContext(project.id, 'manager_instructions', sop.managerInstructions, 'system');

    // 4. Emit Start
    this.eventBus.emitEvent('sop:instantiated', 'LIFECYCLE', { 
        sopId, 
        projectId: project.id, 
        managerId: managerAgentId 
    }, 'system');

    return project.id;
  }
}
