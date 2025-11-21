import { randomUUID } from 'crypto';
import { EventBus } from './event-bus.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface Widget {
  id: string;
  name: string;
  type: 'html' | 'react' | 'iframe' | 'terminal' | 'markdown';
  content: string; // HTML, Code, or URL
  state: Record<string, any>; // Dynamic state
  position: { x: number; y: number; w: number; h: number };
  associatedAgentId?: string;
  associatedPacketId?: string;
}

export class WidgetManager {
  private widgets: Map<string, Widget> = new Map();
  private eventBus: EventBus;
  private storageRoot: string;

  constructor(storageRoot?: string) {
    this.eventBus = EventBus.getInstance();
    this.storageRoot = storageRoot || path.join(os.homedir(), '.agents', 'widgets');
    this.initialize();
  }

  private async initialize() {
    await fs.mkdir(this.storageRoot, { recursive: true });
    // Load persisted widgets if needed
  }

  /**
   * Create or Update a widget on the Canvas
   */
  public async renderWidget(
    name: string, 
    type: Widget['type'], 
    content: string, 
    position?: Widget['position'],
    associatedAgentId?: string
  ): Promise<Widget> {
    // Check if widget exists by name/agent combo to update instead of create
    // For simplicity, we'll create new or update by ID if we had it. 
    // Let's assume agents manage their widget IDs or we return it.
    
    const id = randomUUID();
    const widget: Widget = {
      id,
      name,
      type,
      content,
      state: {},
      position: position || { x: 0, y: 0, w: 4, h: 4 },
      associatedAgentId
    };

    this.widgets.set(id, widget);
    
    // Persist to disk (optional, for session restore)
    await fs.writeFile(path.join(this.storageRoot, `${id}.json`), JSON.stringify(widget, null, 2));

    // Emit event for the UI Server to push to frontend
    this.eventBus.emitEvent('widget:rendered', 'UI', widget, 'system');
    
    return widget;
  }

  public async updateWidgetState(id: string, state: Record<string, any>) {
    const widget = this.widgets.get(id);
    if (!widget) throw new Error(`Widget ${id} not found`);
    
    widget.state = { ...widget.state, ...state };
    this.eventBus.emitEvent('widget:updated', 'UI', widget, 'system');
  }

  public getWidget(id: string): Widget | undefined {
    return this.widgets.get(id);
  }

  public listWidgets(): Widget[] {
    return Array.from(this.widgets.values());
  }
}
