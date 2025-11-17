# MCP Toolkit Architecture - Modular Tool Loading System

## Problem Statement

As the MCP server grows with multiple tool suites (agents, workflows, tasks, projects, billing, etc.), presenting all tools to every client becomes problematic:

1. **Cognitive Overload**: Agents see 50+ tools when they only need 5-10
2. **Performance**: Loading all tools increases initialization time
3. **Security**: Not all tools should be available to all users/agents
4. **Discovery**: Hard to find relevant tools in a large list
5. **Maintenance**: Changes to one toolkit shouldn't affect others

## Solution: Modular Toolkit System

### Architecture Overview

```
MCP Server
├── Core Toolkits (Always Loaded)
│   └── Server management, health checks
│
├── Optional Toolkits (Selectively Loaded)
│   ├── Project Management Toolkit
│   │   ├── Projects (6 tools)
│   │   ├── Sprints (6 tools)
│   │   ├── Tasks (10 tools)
│   │   ├── Documentation (5 tools)
│   │   └── Memory (4 tools)
│   │
│   ├── Agent Development Toolkit
│   │   ├── Agent Execution (4 tools)
│   │   ├── Agent Collaboration (2 tools)
│   │   └── Agent Configuration (2 tools)
│   │
│   ├── Workflow Toolkit
│   │   ├── Workflow Execution (2 tools)
│   │   └── Workflow Templates (2 tools)
│   │
│   ├── Model Management Toolkit
│   │   ├── Model Selection (2 tools)
│   │   └── Model Optimization (1 tool)
│   │
│   ├── Billing Toolkit
│   │   └── Stripe Integration (5 tools)
│   │
│   ├── Integration Toolkit
│   │   ├── GitHub (1 tool)
│   │   ├── Slack (1 tool)
│   │   └── Stripe (1 tool)
│   │
│   └── Task Management Toolkit (Legacy)
│       └── Simple Tasks (6 tools)
│
└── Custom Toolkits (User-Defined)
    └── Plugin system for extensions
```

---

## Implementation Design

### 1. Toolkit Registry System

```typescript
// src/types/toolkit.ts

export interface Toolkit {
  id: string;                         // Unique identifier (e.g., "project-management")
  name: string;                       // Display name
  description: string;                // What this toolkit does
  version: string;                    // Semver version
  category: ToolkitCategory;
  
  dependencies?: string[];            // Required toolkit IDs
  conflicts?: string[];               // Incompatible toolkit IDs
  
  tools: ToolDefinition[];            // Tool registrations
  enabled: boolean;                   // Default enabled state
  
  metadata: {
    author: string;
    created: string;
    updated: string;
    tags: string[];
  };
  
  config?: ToolkitConfig;             // Optional configuration
}

export type ToolkitCategory =
  | "core"                            // Always loaded
  | "project-management"
  | "agent-development"
  | "workflow"
  | "integration"
  | "billing"
  | "custom";

export interface ToolDefinition {
  name: string;
  group?: string;                     // Optional sub-grouping
  handler: ToolHandler;
  schema: z.ZodObject<any>;
  description: string;
}

export interface ToolkitConfig {
  requiresAuth?: boolean;
  defaultEnabled?: boolean;
  permissions?: string[];
}

// Toolkit manifest for selective loading
export interface ToolkitManifest {
  version: string;
  updated: string;
  toolkits: {
    [id: string]: {
      enabled: boolean;
      autoLoad: boolean;              // Load on server start
      lazyLoad: boolean;               // Load on first use
      config?: Record<string, any>;
    };
  };
}
```

### 2. Toolkit Manager

```typescript
// src/services/toolkit-manager.ts

export class ToolkitManager {
  private registeredToolkits: Map<string, Toolkit> = new Map();
  private loadedToolkits: Set<string> = new Set();
  private server: Server;
  private manifest: ToolkitManifest;
  
  constructor(server: Server) {
    this.server = server;
    this.manifest = this.loadManifest();
  }
  
  /**
   * Register a toolkit (doesn't load tools yet)
   */
  registerToolkit(toolkit: Toolkit): void {
    // Validate dependencies
    this.validateDependencies(toolkit);
    
    // Check for conflicts
    this.checkConflicts(toolkit);
    
    // Store in registry
    this.registeredToolkits.set(toolkit.id, toolkit);
    
    logger.info(`Registered toolkit: ${toolkit.name} (${toolkit.tools.length} tools)`);
  }
  
  /**
   * Load a toolkit's tools into the MCP server
   */
  async loadToolkit(toolkitId: string): Promise<void> {
    const toolkit = this.registeredToolkits.get(toolkitId);
    if (!toolkit) {
      throw new Error(`Toolkit not found: ${toolkitId}`);
    }
    
    if (this.loadedToolkits.has(toolkitId)) {
      logger.warn(`Toolkit already loaded: ${toolkitId}`);
      return;
    }
    
    // Load dependencies first
    if (toolkit.dependencies) {
      for (const depId of toolkit.dependencies) {
        if (!this.loadedToolkits.has(depId)) {
          await this.loadToolkit(depId);
        }
      }
    }
    
    // Register all tools with MCP server
    for (const toolDef of toolkit.tools) {
      this.server.tool(
        toolDef.name,
        toolDef.description,
        toolDef.schema.shape,
        toolDef.handler
      );
    }
    
    this.loadedToolkits.add(toolkitId);
    logger.info(`✓ Loaded toolkit: ${toolkit.name} (${toolkit.tools.length} tools)`);
  }
  
  /**
   * Unload a toolkit (remove its tools)
   */
  async unloadToolkit(toolkitId: string): Promise<void> {
    // Check if any loaded toolkits depend on this
    for (const [id, toolkit] of this.registeredToolkits) {
      if (this.loadedToolkits.has(id) && toolkit.dependencies?.includes(toolkitId)) {
        throw new Error(`Cannot unload ${toolkitId}: required by ${id}`);
      }
    }
    
    this.loadedToolkits.delete(toolkitId);
    logger.info(`Unloaded toolkit: ${toolkitId}`);
    
    // Note: MCP doesn't support dynamic tool removal, so this is tracked state only
    // Tools remain registered but toolkit is marked as unloaded
  }
  
  /**
   * Load all enabled toolkits based on manifest
   */
  async loadEnabledToolkits(): Promise<void> {
    const toLoad: string[] = [];
    
    // Core toolkits always load
    for (const [id, toolkit] of this.registeredToolkits) {
      if (toolkit.category === "core") {
        toLoad.push(id);
      }
    }
    
    // Load enabled toolkits from manifest
    for (const [id, config] of Object.entries(this.manifest.toolkits)) {
      if (config.enabled && config.autoLoad) {
        toLoad.push(id);
      }
    }
    
    // Load in dependency order
    const sorted = this.topologicalSort(toLoad);
    for (const id of sorted) {
      await this.loadToolkit(id);
    }
  }
  
  /**
   * Get information about available and loaded toolkits
   */
  getToolkitStatus(): ToolkitStatus[] {
    const status: ToolkitStatus[] = [];
    
    for (const [id, toolkit] of this.registeredToolkits) {
      status.push({
        id: toolkit.id,
        name: toolkit.name,
        description: toolkit.description,
        category: toolkit.category,
        toolCount: toolkit.tools.length,
        loaded: this.loadedToolkits.has(id),
        enabled: this.manifest.toolkits[id]?.enabled ?? false,
        dependencies: toolkit.dependencies ?? [],
      });
    }
    
    return status;
  }
  
  /**
   * Enable/disable a toolkit in manifest
   */
  async setToolkitEnabled(toolkitId: string, enabled: boolean): Promise<void> {
    if (!this.manifest.toolkits[toolkitId]) {
      this.manifest.toolkits[toolkitId] = {
        enabled,
        autoLoad: true,
        lazyLoad: false,
      };
    } else {
      this.manifest.toolkits[toolkitId].enabled = enabled;
    }
    
    await this.saveManifest();
    
    if (enabled) {
      await this.loadToolkit(toolkitId);
    } else {
      await this.unloadToolkit(toolkitId);
    }
  }
  
  /**
   * Get all tools from a specific toolkit
   */
  getToolkitTools(toolkitId: string): string[] {
    const toolkit = this.registeredToolkits.get(toolkitId);
    return toolkit ? toolkit.tools.map(t => t.name) : [];
  }
  
  /**
   * Find which toolkit provides a specific tool
   */
  findToolkitForTool(toolName: string): string | undefined {
    for (const [id, toolkit] of this.registeredToolkits) {
      if (toolkit.tools.some(t => t.name === toolName)) {
        return id;
      }
    }
    return undefined;
  }
  
  // Private helper methods
  
  private loadManifest(): ToolkitManifest {
    const manifestPath = path.join(process.cwd(), '.toolkit-manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }
    
    // Default manifest
    return {
      version: "1.0.0",
      updated: new Date().toISOString(),
      toolkits: {},
    };
  }
  
  private async saveManifest(): Promise<void> {
    const manifestPath = path.join(process.cwd(), '.toolkit-manifest.json');
    this.manifest.updated = new Date().toISOString();
    
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(this.manifest, null, 2),
      'utf-8'
    );
  }
  
  private validateDependencies(toolkit: Toolkit): void {
    if (!toolkit.dependencies) return;
    
    for (const depId of toolkit.dependencies) {
      if (!this.registeredToolkits.has(depId)) {
        throw new Error(
          `Toolkit ${toolkit.id} depends on ${depId}, which is not registered`
        );
      }
    }
  }
  
  private checkConflicts(toolkit: Toolkit): void {
    if (!toolkit.conflicts) return;
    
    for (const conflictId of toolkit.conflicts) {
      if (this.loadedToolkits.has(conflictId)) {
        throw new Error(
          `Toolkit ${toolkit.id} conflicts with already loaded ${conflictId}`
        );
      }
    }
  }
  
  private topologicalSort(ids: string[]): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected: ${id}`);
      }
      
      visiting.add(id);
      const toolkit = this.registeredToolkits.get(id);
      
      if (toolkit?.dependencies) {
        for (const depId of toolkit.dependencies) {
          visit(depId);
        }
      }
      
      visiting.delete(id);
      visited.add(id);
      sorted.push(id);
    };
    
    for (const id of ids) {
      visit(id);
    }
    
    return sorted;
  }
}

export interface ToolkitStatus {
  id: string;
  name: string;
  description: string;
  category: ToolkitCategory;
  toolCount: number;
  loaded: boolean;
  enabled: boolean;
  dependencies: string[];
}
```

### 3. Updated Project Management Toolkit

```typescript
// src/toolkits/project-management/index.ts

import { Toolkit } from '../../types/toolkit.js';
import { registerProjectTools } from './tools/project-tools.js';
import { registerSprintTools } from './tools/sprint-tools.js';
import { registerTaskTools } from './tools/task-tools.js';
import { registerDocTools } from './tools/documentation-tools.js';
import { registerMemoryTools } from './tools/memory-tools.js';

export const projectManagementToolkit: Toolkit = {
  id: "project-management",
  name: "Project Management",
  description: "Comprehensive project, sprint, and task management with documentation",
  version: "1.0.0",
  category: "project-management",
  
  enabled: false,                     // Opt-in by default
  
  tools: [
    ...registerProjectTools(),        // 6 tools
    ...registerSprintTools(),         // 6 tools
    ...registerTaskTools(),           // 10 tools
    ...registerDocTools(),            // 5 tools
    ...registerMemoryTools(),         // 4 tools
  ],
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-05",
    tags: ["project", "tasks", "sprints", "documentation"],
  },
  
  config: {
    requiresAuth: false,
    defaultEnabled: false,
    permissions: ["read", "write", "delete"],
  },
};

// Export sub-toolkits for granular loading
export const projectToolkit: Toolkit = {
  id: "project-management:projects",
  name: "Projects Only",
  description: "Project creation and management tools only",
  version: "1.0.0",
  category: "project-management",
  enabled: false,
  tools: registerProjectTools(),
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-05",
    tags: ["project"],
  },
};

export const taskToolkit: Toolkit = {
  id: "project-management:tasks",
  name: "Tasks Only",
  description: "Task management tools only",
  version: "1.0.0",
  category: "project-management",
  enabled: false,
  tools: registerTaskTools(),
  dependencies: ["project-management:projects"], // Tasks need projects
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-05",
    updated: "2025-11-05",
    tags: ["tasks"],
  },
};
```

### 4. Server Integration with Selective Loading

```typescript
// src/index.ts

import { ToolkitManager } from './services/toolkit-manager.js';

// Import all toolkits
import { projectManagementToolkit, projectToolkit, taskToolkit } from './toolkits/project-management/index.js';
import { agentToolkit } from './toolkits/agent-development/index.js';
import { workflowToolkit } from './toolkits/workflow/index.js';
import { modelToolkit } from './toolkits/model-management/index.js';
import { billingToolkit } from './toolkits/billing/index.js';
import { integrationToolkit } from './toolkits/integrations/index.js';
import { taskManagementToolkit } from './toolkits/task-management/index.js'; // Legacy

async function main() {
  const server = new Server(/* ... */);
  const toolkitManager = new ToolkitManager(server);
  
  // Register all available toolkits
  logger.info("📦 Registering toolkits...");
  
  // Full toolkits
  toolkitManager.registerToolkit(projectManagementToolkit);
  toolkitManager.registerToolkit(agentToolkit);
  toolkitManager.registerToolkit(workflowToolkit);
  toolkitManager.registerToolkit(modelToolkit);
  toolkitManager.registerToolkit(billingToolkit);
  toolkitManager.registerToolkit(integrationToolkit);
  toolkitManager.registerToolkit(taskManagementToolkit);
  
  // Granular toolkits (for selective loading)
  toolkitManager.registerToolkit(projectToolkit);
  toolkitManager.registerToolkit(taskToolkit);
  
  // Load enabled toolkits based on manifest
  logger.info("🔧 Loading enabled toolkits...");
  await toolkitManager.loadEnabledToolkits();
  
  // Log status
  const status = toolkitManager.getToolkitStatus();
  logger.info(`📊 Toolkit Status:`);
  for (const tk of status) {
    const icon = tk.loaded ? "✓" : "○";
    logger.info(`  ${icon} ${tk.name} (${tk.toolCount} tools) - ${tk.loaded ? "Loaded" : "Available"}`);
  }
  
  // Store toolkit manager globally for dynamic loading
  (server as any).toolkitManager = toolkitManager;
  
  // Start server
  await server.connect(transport);
  logger.info("🚀 MCP Server started with selective toolkit loading");
}
```

---

## 5. Management Tools

Add meta-tools for managing toolkits:

```typescript
// src/toolkits/core/toolkit-management.ts

export function registerToolkitManagementTools(manager: ToolkitManager) {
  return [
    {
      name: "list_toolkits",
      description: "List all available and loaded toolkits",
      schema: z.object({
        category: z.string().optional(),
        onlyLoaded: z.boolean().optional(),
      }),
      handler: async (input) => {
        const status = manager.getToolkitStatus();
        
        let filtered = status;
        if (input.category) {
          filtered = status.filter(tk => tk.category === input.category);
        }
        if (input.onlyLoaded) {
          filtered = filtered.filter(tk => tk.loaded);
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              toolkits: filtered,
              totalAvailable: status.length,
              totalLoaded: status.filter(tk => tk.loaded).length,
            }, null, 2)
          }]
        };
      },
    },
    
    {
      name: "enable_toolkit",
      description: "Enable and load a toolkit",
      schema: z.object({
        toolkitId: z.string(),
      }),
      handler: async (input) => {
        await manager.setToolkitEnabled(input.toolkitId, true);
        
        return {
          content: [{
            type: "text",
            text: `Toolkit ${input.toolkitId} enabled and loaded`
          }]
        };
      },
    },
    
    {
      name: "disable_toolkit",
      description: "Disable a toolkit (unload its tools)",
      schema: z.object({
        toolkitId: z.string(),
      }),
      handler: async (input) => {
        await manager.setToolkitEnabled(input.toolkitId, false);
        
        return {
          content: [{
            type: "text",
            text: `Toolkit ${input.toolkitId} disabled`
          }]
        };
      },
    },
    
    {
      name: "get_toolkit_tools",
      description: "List all tools provided by a specific toolkit",
      schema: z.object({
        toolkitId: z.string(),
      }),
      handler: async (input) => {
        const tools = manager.getToolkitTools(input.toolkitId);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              toolkit: input.toolkitId,
              tools,
              count: tools.length,
            }, null, 2)
          }]
        };
      },
    },
  ];
}
```

---

## 6. Default Toolkit Manifest

```json
// .toolkit-manifest.json

{
  "version": "1.0.0",
  "updated": "2025-11-05T00:00:00Z",
  "toolkits": {
    "agent-development": {
      "enabled": true,
      "autoLoad": true,
      "lazyLoad": false,
      "config": {}
    },
    "workflow": {
      "enabled": true,
      "autoLoad": true,
      "lazyLoad": false
    },
    "model-management": {
      "enabled": true,
      "autoLoad": true,
      "lazyLoad": false
    },
    "project-management": {
      "enabled": false,
      "autoLoad": false,
      "lazyLoad": true,
      "config": {
        "defaultSprintDuration": 14,
        "autoArchiveDays": 90
      }
    },
    "project-management:projects": {
      "enabled": false,
      "autoLoad": false,
      "lazyLoad": true
    },
    "project-management:tasks": {
      "enabled": false,
      "autoLoad": false,
      "lazyLoad": true
    },
    "billing": {
      "enabled": false,
      "autoLoad": false,
      "lazyLoad": true
    },
    "integrations": {
      "enabled": false,
      "autoLoad": false,
      "lazyLoad": true
    },
    "task-management": {
      "enabled": true,
      "autoLoad": true,
      "lazyLoad": false,
      "config": {
        "note": "Legacy system, will be deprecated in favor of project-management"
      }
    }
  }
}
```

---

## Usage Patterns

### For Agents - Selective Tool Loading

```typescript
// Agent can query available toolkits first
const toolkits = await client.callTool("list_toolkits", {
  onlyLoaded: false
});

// Agent decides it needs project management
await client.callTool("enable_toolkit", {
  toolkitId: "project-management"
});

// Now agent has access to all 31 project management tools
const project = await client.callTool("create_project", {
  name: "My New Project",
  description: "...",
  owner: "agent-001"
});
```

### For Users - Lightweight Configuration

```typescript
// User only wants simple task tracking (not full projects)
await client.callTool("enable_toolkit", {
  toolkitId: "project-management:tasks"
});

// Gets just the 10 task tools, not all 31 project management tools
```

### For Developers - Easy Extension

```typescript
// Create custom toolkit
const myCustomToolkit: Toolkit = {
  id: "my-company:crm",
  name: "CRM Integration",
  category: "custom",
  tools: [
    /* ... */
  ],
  dependencies: ["integrations"], // Requires base integration toolkit
};

// Register and enable
toolkitManager.registerToolkit(myCustomToolkit);
await toolkitManager.loadToolkit("my-company:crm");
```

---

## Benefits

### 1. **Performance**
- Only load tools that are actually needed
- Faster server initialization
- Reduced memory footprint

### 2. **Usability**
- Agents see relevant tools only
- Better tool discovery
- Clearer organization

### 3. **Flexibility**
- Mix and match toolkit components
- Enable features on-demand
- Easy to add new toolkits

### 4. **Maintainability**
- Clear boundaries between features
- Independent versioning
- Easier testing

### 5. **Security**
- Granular permission control
- Disable sensitive tools when not needed
- Audit trail of enabled features

---

## Migration Path

### Phase 1: Implement Toolkit System (Current)
- Create ToolkitManager
- Refactor existing tools into toolkits
- Add management tools

### Phase 2: Implement Project Management (Next)
- Build as separate toolkit
- Default disabled
- Easy to enable when needed

### Phase 3: Optimize Existing Toolkits
- Break agent-development into sub-toolkits
- Create workflow:basic and workflow:advanced
- Separate billing from core

### Phase 4: Plugin System
- Allow external toolkit registration
- Marketplace for community toolkits
- Version compatibility checking

---

## Implementation Priority

1. ✅ **Core Types** - Toolkit interfaces
2. ✅ **ToolkitManager** - Registry and loading logic
3. ✅ **Management Tools** - list_toolkits, enable_toolkit, etc.
4. ✅ **Refactor Existing** - Move current tools into toolkits
5. ✅ **Project Management** - Implement as modular toolkit
6. ✅ **Documentation** - Update guides
7. ✅ **Testing** - Verify toolkit loading

---

## Next Steps

With this architecture:
1. All existing tools stay functional
2. Project management is opt-in (31 tools only when needed)
3. Easy to add more toolkits in future
4. Agents can query and enable tools dynamically
5. Clear separation of concerns

**Proceed with full Option A implementation using this modular architecture?**
