import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

export type EventType = 
  | 'LIFECYCLE' 
  | 'EXTERNAL' 
  | 'DATA' 
  | 'PROJECT' 
  | 'TASK'
  | 'UI';

export interface SystemEvent {
  id: string;
  type: EventType;
  name: string; // e.g., 'agent:created', 'email:received'
  payload: any;
  source: string; // Agent ID or System Component
  timestamp: string;
}

export type EventHandler = (event: SystemEvent) => Promise<void> | void;

export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private eventLog: SystemEvent[] = [];
  private readonly MAX_LOG_SIZE = 1000;

  private constructor() {
    super();
    this.setMaxListeners(50); // Allow many agents to subscribe
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public emitEvent(name: string, type: EventType, payload: any, source: string = 'system'): string {
    const event: SystemEvent = {
      id: randomUUID(),
      type,
      name,
      payload,
      source,
      timestamp: new Date().toISOString()
    };

    this.eventLog.unshift(event);
    if (this.eventLog.length > this.MAX_LOG_SIZE) {
      this.eventLog.pop();
    }

    // Emit specific event name
    this.emit(name, event);
    // Emit generic type event
    this.emit(type, event);
    // Emit global wildcard
    this.emit('*', event);

    return event.id;
  }

  public subscribe(eventName: string, handler: EventHandler): void {
    this.on(eventName, handler);
  }

  public unsubscribe(eventName: string, handler: EventHandler): void {
    this.off(eventName, handler);
  }

  public getRecentEvents(limit: number = 10, type?: EventType): SystemEvent[] {
    let events = this.eventLog;
    if (type) {
      events = events.filter(e => e.type === type);
    }
    return events.slice(0, limit);
  }
}
