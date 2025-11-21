import { randomUUID } from 'crypto';
import { EventBus } from './event-bus.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface Skill {
  id: string;
  name: string;
  description: string;
  instructions: string; // The "prompt" part of the skill
  rules: string[]; // List of constraints/rules
  tools: string[]; // Required tools
  knowledge: string[]; // IDs of docs/databases
  agents: string[]; // IDs of sub-agents/delegates
  widgets: string[]; // IDs of associated widgets
  version: string;
  
  // --- New: Interface Definition ---
  inputSchema?: Record<string, any>; // JSON Schema for what this skill accepts
  outputSchema?: Record<string, any>; // JSON Schema for what this skill produces
  configuration?: Record<string, any>; // Tunable parameters (e.g. { "temperature": 0.7 })
  
  performanceHistory: {
    projectId: string;
    score: number; // 0-100
    feedback: string;
    timestamp: string;
  }[];
}

export interface Evaluator {
  id: string;
  name: string;
  description: string;
  criteria: string[]; // e.g. ["Speed", "Accuracy", "Creativity"]
  scoringLogic: string; // Instructions for the Evaluator Agent
}

export class OptimizationManager {
  private skills: Map<string, Skill> = new Map();
  private evaluators: Map<string, Evaluator> = new Map();
  private eventBus: EventBus;
  private storageRoot: string;

  constructor(storageRoot?: string) {
    this.eventBus = EventBus.getInstance();
    this.storageRoot = storageRoot || path.join(os.homedir(), '.agents', 'optimization');
    this.initialize();
  }

  private async initialize() {
    await fs.mkdir(path.join(this.storageRoot, 'skills'), { recursive: true });
    await fs.mkdir(path.join(this.storageRoot, 'evaluators'), { recursive: true });
    await this.loadAll();
  }

  private async loadAll() {
    try {
      // Load Skills
      const skillFiles = await fs.readdir(path.join(this.storageRoot, 'skills'));
      for (const file of skillFiles) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.storageRoot, 'skills', file), 'utf-8');
          const skill = JSON.parse(data) as Skill;
          this.skills.set(skill.id, skill);
        }
      }

      // Load Evaluators
      const evalFiles = await fs.readdir(path.join(this.storageRoot, 'evaluators'));
      for (const file of evalFiles) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(this.storageRoot, 'evaluators', file), 'utf-8');
          const evaluator = JSON.parse(data) as Evaluator;
          this.evaluators.set(evaluator.id, evaluator);
        }
      }
    } catch (error) {
      console.error('Failed to load optimization state:', error);
    }
  }

  private async saveSkill(skill: Skill) {
    await fs.writeFile(
      path.join(this.storageRoot, 'skills', `${skill.id}.json`),
      JSON.stringify(skill, null, 2)
    );
  }

  private async saveEvaluator(evaluator: Evaluator) {
    await fs.writeFile(
      path.join(this.storageRoot, 'evaluators', `${evaluator.id}.json`),
      JSON.stringify(evaluator, null, 2)
    );
  }

  // --- Skill Management ---

  public async createSkill(
    name: string, 
    description: string, 
    instructions: string, 
    tools: string[],
    inputSchema?: Record<string, any>,
    outputSchema?: Record<string, any>,
    configuration?: Record<string, any>,
    rules: string[] = [],
    knowledge: string[] = [],
    agents: string[] = [],
    widgets: string[] = []
  ): Promise<Skill> {
    const id = randomUUID();
    const skill: Skill = {
      id,
      name,
      description,
      instructions,
      tools,
      rules,
      knowledge,
      agents,
      widgets,
      version: '1.0.0',
      inputSchema,
      outputSchema,
      configuration,
      performanceHistory: []
    };
    this.skills.set(id, skill);
    await this.saveSkill(skill);
    this.eventBus.emitEvent('skill:created', 'DATA', { skillId: id, name }, 'system');
    return skill;
  }

  public getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  public listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  public async recordSkillPerformance(skillId: string, projectId: string, score: number, feedback: string): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill ${skillId} not found`);

    skill.performanceHistory.push({
      projectId,
      score,
      feedback,
      timestamp: new Date().toISOString()
    });

    await this.saveSkill(skill);
    this.eventBus.emitEvent('skill:evaluated', 'DATA', { skillId, score, projectId }, 'system');
  }

  public async updateSkillInstructions(skillId: string, newInstructions: string, version: string): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) throw new Error(`Skill ${skillId} not found`);

    skill.instructions = newInstructions;
    skill.version = version;
    await this.saveSkill(skill);
    this.eventBus.emitEvent('skill:updated', 'LIFECYCLE', { skillId, version }, 'system');
  }

  // --- Evaluator Management ---

  public async defineEvaluator(name: string, description: string, criteria: string[], scoringLogic: string): Promise<Evaluator> {
    const id = randomUUID();
    const evaluator: Evaluator = {
      id,
      name,
      description,
      criteria,
      scoringLogic
    };
    this.evaluators.set(id, evaluator);
    await this.saveEvaluator(evaluator);
    return evaluator;
  }

  public listEvaluators(): Evaluator[] {
    return Array.from(this.evaluators.values());
  }
}
