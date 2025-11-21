import { EventBus } from './event-bus.js';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  assignee?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface PMProvider {
  name: string;
  getTasks(filter?: any): Promise<Task[]>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  createTask(task: Omit<Task, 'id'>): Promise<Task>;
}

export class PMBridge {
  private providers: Map<string, PMProvider> = new Map();
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public registerProvider(provider: PMProvider) {
    this.providers.set(provider.name, provider);
    console.log(`[PMBridge] Registered provider: ${provider.name}`);
  }

  /**
   * Poll providers for new tasks and emit events
   * In a real system, this might be webhook-based
   */
  public async sync() {
    for (const [name, provider] of this.providers) {
      try {
        const tasks = await provider.getTasks();
        // Logic to detect *new* tasks would go here.
        // For now, we just emit a sync event.
        this.eventBus.emitEvent('pm:sync', 'DATA', { provider: name, count: tasks.length }, 'system');
      } catch (e) {
        console.error(`[PMBridge] Error syncing ${name}:`, e);
      }
    }
  }

  /**
   * Auto-start a Packet based on a Task
   */
  public async handleTaskCreated(task: Task) {
    // Logic to match task tags/content to a Solution Packet
    // e.g. Tag "bug" -> "Bug Fix Packet"
    
    this.eventBus.emitEvent('task:ingested', 'EXTERNAL', task, 'pm-bridge');
    
    // Example heuristic
    if (task.tags.includes('research')) {
        // Trigger the Research Packet
        // This would call BusinessManager.instantiateSOP(...)
        console.log(`[PMBridge] Detected Research Task: ${task.title}. Triggering Research Packet...`);
    }
  }
}
