# Local Storage Architecture
## Standardized Storage for MCP Tools, Agents, and Workflows

### Directory Structure

```
Agents/agent-platform/
├── local-storage/
│   ├── README.md                    # This file
│   ├── .gitignore                   # Ignore user data
│   ├── index.json                   # Master index of all items
│   │
│   ├── agents/                      # Downloaded agents
│   │   ├── index.json              # Agent registry
│   │   ├── {agent-id}/
│   │   │   ├── manifest.json       # Agent metadata
│   │   │   ├── config.json         # Agent configuration
│   │   │   ├── prompts/           # System prompts
│   │   │   ├── tools/             # Associated tools
│   │   │   └── workflows/         # Associated workflows
│   │   │
│   │   └── website-builder-pro/
│   │       ├── manifest.json
│   │       ├── config.json
│   │       └── ... 
│   │
│   ├── workflows/                   # Downloaded workflows
│   │   ├── index.json              # Workflow registry
│   │   ├── {workflow-id}/
│   │   │   ├── manifest.json       # Workflow metadata
│   │   │   ├── definition.json     # Workflow steps/graph
│   │   │   ├── agents/            # Referenced agents
│   │   │   └── tools/             # Referenced tools
│   │   │
│   │   └── marketing-funnel/
│   │       ├── manifest.json
│   │       ├── definition.json
│   │       └── ...
│   │
│   ├── tools/                       # Downloaded MCP tools
│   │   ├── index.json              # Tool registry
│   │   ├── {tool-id}/
│   │   │   ├── manifest.json       # Tool metadata
│   │   │   ├── schema.json         # MCP tool schema
│   │   │   ├── implementation/     # Tool code (if local)
│   │   │   └── config.json         # Tool configuration
│   │   │
│   │   └── stripe-connector/
│   │       ├── manifest.json
│   │       ├── schema.json
│   │       └── ...
│   │
│   ├── templates/                   # User templates
│   │   ├── agent-templates/
│   │   ├── workflow-templates/
│   │   └── tool-templates/
│   │
│   └── cache/                       # Runtime cache
│       ├── marketplace-data.json   # Cached marketplace listings
│       ├── user-data.json         # User preferences/favorites
│       └── recent-items.json      # Recently used items
```

---

## File Format Specifications

### Agent Manifest (`agents/{id}/manifest.json`)

```json
{
  "id": "website-builder-pro",
  "version": "1.2.3",
  "name": "Website Builder Pro",
  "description": "Complete website creation from concept to deployment",
  "author": {
    "name": "BuilderAI Labs",
    "email": "support@builderai.com",
    "url": "https://builderai.com"
  },
  "category": "productivity",
  "tags": ["web-design", "deployment", "seo"],
  "rating": 4.9,
  "downloads": 15432,
  "created_at": "2024-01-15T00:00:00Z",
  "updated_at": "2025-10-01T00:00:00Z",
  "source": "marketplace",
  "marketplace_url": "https://marketplace.example.com/agents/website-builder-pro",
  "dependencies": {
    "tools": ["stripe-connector", "database-query"],
    "workflows": []
  },
  "pricing": {
    "model": "per_run",
    "amount": 2.5,
    "currency": "USD"
  },
  "verified": true,
  "security_score": 98.7
}
```

### Agent Config (`agents/{id}/config.json`)

```json
{
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 4000,
  "system_prompt_file": "prompts/main.txt",
  "tools": [
    {
      "id": "web-scraper",
      "enabled": true
    },
    {
      "id": "code-generator",
      "enabled": true
    }
  ],
  "settings": {
    "auto_deploy": true,
    "seo_optimization": true,
    "responsive_design": true
  },
  "execution": {
    "timeout_seconds": 300,
    "retry_attempts": 3,
    "parallel_execution": false
  }
}
```

### Workflow Definition (`workflows/{id}/definition.json`)

```json
{
  "id": "marketing-funnel",
  "version": "2.0.1",
  "name": "Complete Marketing Funnel",
  "steps": [
    {
      "id": "step-1",
      "type": "agent",
      "agent_id": "content-creator",
      "config": {
        "prompt": "Create engaging marketing content",
        "output_format": "markdown"
      },
      "next": ["step-2"]
    },
    {
      "id": "step-2",
      "type": "tool",
      "tool_id": "email-sender",
      "config": {
        "template": "newsletter",
        "batch_size": 100
      },
      "next": ["step-3"]
    },
    {
      "id": "step-3",
      "type": "condition",
      "condition": "response_rate > 0.1",
      "if_true": ["step-4"],
      "if_false": ["step-5"]
    }
  ],
  "triggers": {
    "schedule": "0 9 * * 1",
    "events": ["new_subscriber"]
  },
  "variables": {
    "target_audience": "B2B SaaS",
    "budget": 1000
  }
}
```

### MCP Tool Schema (`tools/{id}/schema.json`)

```json
{
  "id": "stripe-connector",
  "version": "3.1.0",
  "name": "Stripe Payment Connector",
  "description": "Secure Stripe integration for payments",
  "type": "mcp",
  "protocol": "1.0.0",
  "tools": [
    {
      "name": "create_payment",
      "description": "Create a new payment",
      "inputSchema": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "number",
            "description": "Amount in cents"
          },
          "currency": {
            "type": "string",
            "description": "Currency code (USD, EUR, etc.)"
          }
        },
        "required": ["amount", "currency"]
      }
    },
    {
      "name": "list_subscriptions",
      "description": "List all active subscriptions",
      "inputSchema": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "number",
            "description": "Number of results to return"
          }
        }
      }
    }
  ],
  "authentication": {
    "type": "api_key",
    "key_name": "STRIPE_SECRET_KEY"
  }
}
```

### Master Index (`local-storage/index.json`)

```json
{
  "version": "1.0.0",
  "last_updated": "2025-11-01T12:00:00Z",
  "counts": {
    "agents": 5,
    "workflows": 3,
    "tools": 8
  },
  "agents": [
    {
      "id": "website-builder-pro",
      "name": "Website Builder Pro",
      "version": "1.2.3",
      "path": "agents/website-builder-pro",
      "last_used": "2025-11-01T10:00:00Z",
      "favorite": true
    }
  ],
  "workflows": [
    {
      "id": "marketing-funnel",
      "name": "Complete Marketing Funnel",
      "version": "2.0.1",
      "path": "workflows/marketing-funnel",
      "last_used": "2025-10-30T14:00:00Z",
      "favorite": false
    }
  ],
  "tools": [
    {
      "id": "stripe-connector",
      "name": "Stripe Payment Connector",
      "version": "3.1.0",
      "path": "tools/stripe-connector",
      "last_used": "2025-11-01T09:00:00Z",
      "favorite": true
    }
  ]
}
```

---

## TypeScript Types

### Core Types

```typescript
// local-storage/types.ts

export interface LocalStorageIndex {
  version: string;
  last_updated: string;
  counts: {
    agents: number;
    workflows: number;
    tools: number;
  };
  agents: LocalStorageItem[];
  workflows: LocalStorageItem[];
  tools: LocalStorageItem[];
}

export interface LocalStorageItem {
  id: string;
  name: string;
  version: string;
  path: string;
  last_used: string;
  favorite: boolean;
}

export interface AgentManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  author: {
    name: string;
    email: string;
    url: string;
  };
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  created_at: string;
  updated_at: string;
  source: 'marketplace' | 'custom' | 'imported';
  marketplace_url?: string;
  dependencies: {
    tools: string[];
    workflows: string[];
  };
  pricing: {
    model: 'free' | 'per_run' | 'subscription' | 'one_time' | 'tiered';
    amount?: number;
    currency?: string;
  };
  verified: boolean;
  security_score: number;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt_file: string;
  tools: Array<{
    id: string;
    enabled: boolean;
  }>;
  settings: Record<string, any>;
  execution: {
    timeout_seconds: number;
    retry_attempts: number;
    parallel_execution: boolean;
  };
}

export interface WorkflowDefinition {
  id: string;
  version: string;
  name: string;
  steps: WorkflowStep[];
  triggers: {
    schedule?: string; // cron format
    events?: string[];
  };
  variables: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: 'agent' | 'tool' | 'condition' | 'loop' | 'parallel' | 'human';
  agent_id?: string;
  tool_id?: string;
  config: Record<string, any>;
  next?: string[];
  condition?: string;
  if_true?: string[];
  if_false?: string[];
}

export interface MCPToolSchema {
  id: string;
  version: string;
  name: string;
  description: string;
  type: 'mcp' | 'custom';
  protocol: string;
  tools: MCPTool[];
  authentication?: {
    type: 'api_key' | 'oauth' | 'none';
    key_name?: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
```

---

## Storage Manager API

### Implementation

```typescript
// local-storage/StorageManager.ts

import fs from 'fs/promises';
import path from 'path';
import { LocalStorageIndex, AgentManifest, WorkflowDefinition, MCPToolSchema } from './types';

export class LocalStorageManager {
  private basePath: string;

  constructor(basePath: string = './local-storage') {
    this.basePath = basePath;
  }

  // Initialize storage structure
  async initialize(): Promise<void> {
    const dirs = [
      '',
      'agents',
      'workflows',
      'tools',
      'templates/agent-templates',
      'templates/workflow-templates',
      'templates/tool-templates',
      'cache',
    ];

    for (const dir of dirs) {
      const fullPath = path.join(this.basePath, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }

    // Create initial index if it doesn't exist
    const indexPath = path.join(this.basePath, 'index.json');
    try {
      await fs.access(indexPath);
    } catch {
      const initialIndex: LocalStorageIndex = {
        version: '1.0.0',
        last_updated: new Date().toISOString(),
        counts: { agents: 0, workflows: 0, tools: 0 },
        agents: [],
        workflows: [],
        tools: [],
      };
      await fs.writeFile(indexPath, JSON.stringify(initialIndex, null, 2));
    }
  }

  // Read master index
  async getIndex(): Promise<LocalStorageIndex> {
    const indexPath = path.join(this.basePath, 'index.json');
    const data = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(data);
  }

  // Update master index
  async updateIndex(index: LocalStorageIndex): Promise<void> {
    const indexPath = path.join(this.basePath, 'index.json');
    index.last_updated = new Date().toISOString();
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  // ===== AGENTS =====

  async saveAgent(manifest: AgentManifest, config: any): Promise<void> {
    const agentPath = path.join(this.basePath, 'agents', manifest.id);
    await fs.mkdir(agentPath, { recursive: true });
    await fs.mkdir(path.join(agentPath, 'prompts'), { recursive: true });
    await fs.mkdir(path.join(agentPath, 'tools'), { recursive: true });
    await fs.mkdir(path.join(agentPath, 'workflows'), { recursive: true });

    await fs.writeFile(
      path.join(agentPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    await fs.writeFile(
      path.join(agentPath, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Update index
    const index = await this.getIndex();
    const existingIndex = index.agents.findIndex((a) => a.id === manifest.id);
    const item = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      path: `agents/${manifest.id}`,
      last_used: new Date().toISOString(),
      favorite: existingIndex >= 0 ? index.agents[existingIndex].favorite : false,
    };

    if (existingIndex >= 0) {
      index.agents[existingIndex] = item;
    } else {
      index.agents.push(item);
      index.counts.agents++;
    }

    await this.updateIndex(index);
  }

  async getAgent(id: string): Promise<{ manifest: AgentManifest; config: any } | null> {
    const agentPath = path.join(this.basePath, 'agents', id);
    try {
      const manifestData = await fs.readFile(path.join(agentPath, 'manifest.json'), 'utf-8');
      const configData = await fs.readFile(path.join(agentPath, 'config.json'), 'utf-8');
      return {
        manifest: JSON.parse(manifestData),
        config: JSON.parse(configData),
      };
    } catch {
      return null;
    }
  }

  async deleteAgent(id: string): Promise<void> {
    const agentPath = path.join(this.basePath, 'agents', id);
    await fs.rm(agentPath, { recursive: true, force: true });

    const index = await this.getIndex();
    index.agents = index.agents.filter((a) => a.id !== id);
    index.counts.agents = index.agents.length;
    await this.updateIndex(index);
  }

  // ===== WORKFLOWS =====

  async saveWorkflow(manifest: any, definition: WorkflowDefinition): Promise<void> {
    const workflowPath = path.join(this.basePath, 'workflows', definition.id);
    await fs.mkdir(workflowPath, { recursive: true });
    await fs.mkdir(path.join(workflowPath, 'agents'), { recursive: true });
    await fs.mkdir(path.join(workflowPath, 'tools'), { recursive: true });

    await fs.writeFile(
      path.join(workflowPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    await fs.writeFile(
      path.join(workflowPath, 'definition.json'),
      JSON.stringify(definition, null, 2)
    );

    // Update index
    const index = await this.getIndex();
    const existingIndex = index.workflows.findIndex((w) => w.id === definition.id);
    const item = {
      id: definition.id,
      name: definition.name,
      version: definition.version,
      path: `workflows/${definition.id}`,
      last_used: new Date().toISOString(),
      favorite: existingIndex >= 0 ? index.workflows[existingIndex].favorite : false,
    };

    if (existingIndex >= 0) {
      index.workflows[existingIndex] = item;
    } else {
      index.workflows.push(item);
      index.counts.workflows++;
    }

    await this.updateIndex(index);
  }

  async getWorkflow(id: string): Promise<{ manifest: any; definition: WorkflowDefinition } | null> {
    const workflowPath = path.join(this.basePath, 'workflows', id);
    try {
      const manifestData = await fs.readFile(path.join(workflowPath, 'manifest.json'), 'utf-8');
      const definitionData = await fs.readFile(path.join(workflowPath, 'definition.json'), 'utf-8');
      return {
        manifest: JSON.parse(manifestData),
        definition: JSON.parse(definitionData),
      };
    } catch {
      return null;
    }
  }

  // ===== TOOLS =====

  async saveTool(manifest: any, schema: MCPToolSchema): Promise<void> {
    const toolPath = path.join(this.basePath, 'tools', schema.id);
    await fs.mkdir(toolPath, { recursive: true });
    await fs.mkdir(path.join(toolPath, 'implementation'), { recursive: true });

    await fs.writeFile(
      path.join(toolPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    await fs.writeFile(
      path.join(toolPath, 'schema.json'),
      JSON.stringify(schema, null, 2)
    );

    // Update index
    const index = await this.getIndex();
    const existingIndex = index.tools.findIndex((t) => t.id === schema.id);
    const item = {
      id: schema.id,
      name: schema.name,
      version: schema.version,
      path: `tools/${schema.id}`,
      last_used: new Date().toISOString(),
      favorite: existingIndex >= 0 ? index.tools[existingIndex].favorite : false,
    };

    if (existingIndex >= 0) {
      index.tools[existingIndex] = item;
    } else {
      index.tools.push(item);
      index.counts.tools++;
    }

    await this.updateIndex(index);
  }

  async getTool(id: string): Promise<{ manifest: any; schema: MCPToolSchema } | null> {
    const toolPath = path.join(this.basePath, 'tools', id);
    try {
      const manifestData = await fs.readFile(path.join(toolPath, 'manifest.json'), 'utf-8');
      const schemaData = await fs.readFile(path.join(toolPath, 'schema.json'), 'utf-8');
      return {
        manifest: JSON.parse(manifestData),
        schema: JSON.parse(schemaData),
      };
    } catch {
      return null;
    }
  }

  // ===== UTILITY =====

  async markAsFavorite(type: 'agents' | 'workflows' | 'tools', id: string, favorite: boolean): Promise<void> {
    const index = await this.getIndex();
    const item = index[type].find((i) => i.id === id);
    if (item) {
      item.favorite = favorite;
      await this.updateIndex(index);
    }
  }

  async updateLastUsed(type: 'agents' | 'workflows' | 'tools', id: string): Promise<void> {
    const index = await this.getIndex();
    const item = index[type].find((i) => i.id === id);
    if (item) {
      item.last_used = new Date().toISOString();
      await this.updateIndex(index);
    }
  }
}
```

---

## Usage Examples

### Downloading from Marketplace

```typescript
import { LocalStorageManager } from './local-storage/StorageManager';

const storage = new LocalStorageManager();

// Download an agent from marketplace
async function downloadAgent(marketplaceId: string) {
  // Fetch from marketplace API
  const response = await fetch(`https://marketplace.example.com/api/agents/${marketplaceId}`);
  const data = await response.json();

  const manifest = {
    id: data.id,
    version: data.version,
    name: data.name,
    description: data.description,
    author: data.author,
    category: data.category,
    tags: data.tags,
    rating: data.rating,
    downloads: data.downloads,
    created_at: data.created_at,
    updated_at: data.updated_at,
    source: 'marketplace' as const,
    marketplace_url: `https://marketplace.example.com/agents/${data.id}`,
    dependencies: data.dependencies,
    pricing: data.pricing,
    verified: data.verified,
    security_score: data.security_score,
  };

  const config = data.config;

  await storage.saveAgent(manifest, config);
  console.log(`Agent ${manifest.name} downloaded successfully!`);
}

// List all local agents
async function listLocalAgents() {
  const index = await storage.getIndex();
  console.log('Local Agents:', index.agents);
}

// Get a specific agent
async function loadAgent(id: string) {
  const agent = await storage.getAgent(id);
  if (agent) {
    console.log('Loaded agent:', agent.manifest.name);
    console.log('Config:', agent.config);
  }
}
```

---

## .gitignore Configuration

```gitignore
# Local Storage - User Data
local-storage/agents/*/
local-storage/workflows/*/
local-storage/tools/*/
local-storage/cache/
local-storage/index.json

# Keep structure
!local-storage/agents/.gitkeep
!local-storage/workflows/.gitkeep
!local-storage/tools/.gitkeep
!local-storage/templates/
```

---

## Benefits

### 1. **Organized Structure**
- Clear separation between agents, workflows, and tools
- Self-contained packages with all dependencies
- Easy to browse and manage

### 2. **Version Control**
- Track versions of downloaded items
- Easy rollback to previous versions
- Update management

### 3. **Offline Capability**
- All downloaded items available offline
- Fast access without network calls
- Cached marketplace data

### 4. **Dependency Management**
- Track dependencies between items
- Automatic dependency resolution
- Prevent broken references

### 5. **Performance**
- Fast local file access
- Indexed searches
- Cached frequently used items

### 6. **Privacy & Security**
- User data stays local
- No tracking of usage
- Secure storage of credentials

---

## Future Enhancements

1. **Import/Export**
   - Export collections to share with others
   - Import shared collections

2. **Sync**
   - Optional cloud sync between devices
   - Conflict resolution

3. **Versioning**
   - Full version history
   - Diff between versions

4. **Search**
   - Full-text search across all items
   - Tag-based filtering

5. **Analytics**
   - Usage statistics
   - Performance metrics

---

## Migration Guide

### From Current Structure

If you have existing agents/tools/workflows, run the migration script:

```typescript
// migration/migrate-to-local-storage.ts

import { LocalStorageManager } from '../local-storage/StorageManager';

async function migrate() {
  const storage = new LocalStorageManager();
  await storage.initialize();

  // Migrate existing agents
  // ... migration logic ...

  console.log('Migration complete!');
}

migrate();
```

---

**Last Updated:** November 1, 2025
**Version:** 1.0.0
