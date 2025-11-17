# 🚀 FINAL DEVELOPMENT DIRECTIVE - SOTA Agent Platform Polish & Extension

**Execution Mode:** Autonomous, Parallel, Test-Driven  
**Quality Target:** World-Class Production System  
**Context Limit:** Unlimited (Full State Maintenance Required)  
**Time Constraint:** None - Prioritize Quality Over Speed

---

## 🎯 MISSION STATEMENT

You are a **World-Class Autonomous Development Orchestrator** tasked with completing the final polish and extension of a revolutionary AI Agent Platform. You will:

1. **Refactor & Organize** the existing codebase for scalability and maintainability
2. **Integrate Database Systems** for persistent storage of platform and user-created components
3. **Optimize MCP Integration** to eliminate context waste and enable direct agent-to-agent communication
4. **Build Production-Grade Components** including agents, tools, workflows, skills, hooks, and widgets
5. **Create Revolutionary Agent Collections** across multiple high-impact domains

---

## 🧬 SYSTEM ARCHITECTURE CONTEXT

### Current Platform Status (92% Production Ready)

**Technology Stack:**
- **Frontend:** Next.js 15 + React + TypeScript + Shadcn UI + Tailwind CSS
- **Backend:** FastAPI (Python) + Node.js (MCP Server)
- **Databases:** PostgreSQL, MongoDB, Redis (via Docker)
- **Infrastructure:** Docker Compose, Turbo Repo (monorepo)
- **MCP Server:** TypeScript-based Model Context Protocol server with 100+ tools

**Existing Capabilities:**
- ✅ Canvas-based UI with drag-and-drop agent composition
- ✅ Voice control with Web Speech API
- ✅ Multi-protocol support (MCP, Agent Protocol, CrewAI, LangChain)
- ✅ Multi-format parsing (Markdown, JSON, YAML, XML)
- ✅ Billing system with Stripe integration (4-tier pricing)
- ✅ Real-time streaming UI with SSE
- ✅ Docker sandbox execution with permission system
- ✅ Advanced MCP toolkits: agents, workflows, skills, hooks, widgets, collections

**File Structure:**
```
Agents/agent-platform/
├── apps/
│   ├── web/           # Next.js frontend
│   ├── api/           # FastAPI backend
│   └── mcp-server/    # THIS NEEDS ORGANIZATION
├── packages/          # Shared libraries
├── docs/              # Documentation
├── tests/             # Test suites
└── local-storage/     # ⚠️ NEEDS IMPLEMENTATION
```

---

## 🎯 PRIMARY OBJECTIVES

### **OBJECTIVE 1: Component Storage Architecture**

**Problem:** Agents, tools, workflows, skills, hooks, widgets, and MCPs lack a structured, scalable storage system.

**Required Implementation:**

#### 1.1 Directory Structure
Create the following directory architecture:

```
local-storage/
├── platform/                    # Platform-provided components (read-only)
│   ├── agents/
│   │   ├── core/               # Essential platform agents
│   │   ├── development/        # Dev-focused agents
│   │   ├── research/           # Research agents
│   │   └── business/           # Business agents
│   ├── tools/
│   │   ├── builtin/            # Core platform tools
│   │   └── mcp/                # MCP-compatible tools
│   ├── workflows/
│   │   ├── templates/          # Pre-built workflow templates
│   │   └── examples/           # Example workflows
│   ├── skills/
│   │   ├── coding/
│   │   ├── research/
│   │   └── communication/
│   ├── hooks/
│   │   ├── lifecycle/          # Lifecycle hooks
│   │   ├── validation/         # Validation hooks
│   │   └── transformation/     # Data transformation hooks
│   └── widgets/
│       ├── ui/                 # UI widgets
│       ├── visualization/      # Data visualization widgets
│       └── forms/              # Form widgets
│
└── user/                        # User-created components (read-write)
    ├── agents/
    ├── tools/
    │   ├── sandbox/            # Sandboxed executable code
    │   └── mcp/                # User MCP servers
    ├── workflows/
    ├── skills/
    ├── hooks/
    └── widgets/
```

#### 1.2 Storage Layer Implementation

**Required Files:**

1. **`packages/storage/src/ComponentStore.ts`**
   - Abstract base class for all component storage
   - CRUD operations (Create, Read, Update, Delete, List)
   - Versioning support
   - Conflict resolution
   - Transaction support

2. **`packages/storage/src/FileSystemStore.ts`**
   - File-based implementation for local development
   - JSON + Markdown format support
   - Watch for file changes (hot reload)

3. **`packages/storage/src/DatabaseStore.ts`**
   - PostgreSQL implementation for production
   - Full-text search support
   - Relational queries for component dependencies

4. **`packages/storage/src/types.ts`**
   - TypeScript interfaces for all component types
   - Zod schemas for validation

**Technical Requirements:**
- ✅ Type-safe with full TypeScript coverage
- ✅ Transaction support for atomic operations
- ✅ Optimistic locking for concurrent edits
- ✅ Automatic backup/versioning
- ✅ Import/export functionality (JSON, ZIP)
- ✅ Migration tools for upgrading component schemas

---

### **OBJECTIVE 2: Database Integration**

**Problem:** Platform lacks persistent storage for runtime data and user-created components.

**Required Implementation:**

#### 2.1 Lightweight Local Database Setup

**Technology Choice:** SQLite + PostgreSQL hybrid
- **SQLite:** Local development, single-user scenarios, fast prototyping
- **PostgreSQL:** Production, multi-user, advanced queries

**Schema Design:**

```sql
-- Core Tables
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB
);

CREATE TABLE components (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,  -- 'agent', 'tool', 'workflow', etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content JSONB NOT NULL,      -- Full component definition
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  storage_path VARCHAR(500),   -- Path in local-storage/
  metadata JSONB,              -- Tags, categories, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE component_executions (
  id UUID PRIMARY KEY,
  component_id UUID REFERENCES components(id),
  user_id UUID REFERENCES users(id),
  input JSONB,
  output JSONB,
  status VARCHAR(50),          -- 'running', 'success', 'error'
  duration_ms INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE component_dependencies (
  id UUID PRIMARY KEY,
  component_id UUID REFERENCES components(id),
  depends_on_id UUID REFERENCES components(id),
  dependency_type VARCHAR(50), -- 'requires', 'recommends', 'conflicts'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collections (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collection_items (
  collection_id UUID REFERENCES collections(id),
  component_id UUID REFERENCES components(id),
  order_index INTEGER,
  PRIMARY KEY (collection_id, component_id)
);

-- Vector storage for semantic search (using pgvector extension)
CREATE TABLE component_embeddings (
  id UUID PRIMARY KEY,
  component_id UUID REFERENCES components(id),
  embedding VECTOR(1536),      -- OpenAI embedding size
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_components_type ON components(type);
CREATE INDEX idx_components_owner ON components(owner_id);
CREATE INDEX idx_components_public ON components(is_public);
CREATE INDEX idx_executions_component ON component_executions(component_id);
CREATE INDEX idx_executions_user ON component_executions(user_id);
CREATE INDEX idx_embeddings_vector ON component_embeddings USING ivfflat (embedding vector_cosine_ops);
```

#### 2.2 ORM Layer

**Required Files:**

1. **`packages/database/src/models/Component.ts`**
   ```typescript
   import { Model } from 'sequelize';
   
   export class Component extends Model {
     id: string;
     ownerId: string;
     type: ComponentType;
     name: string;
     description: string;
     content: ComponentContent;
     version: number;
     isPublic: boolean;
     storagePath: string;
     metadata: Record<string, any>;
     
     // Relations
     dependencies?: Component[];
     dependents?: Component[];
     executions?: ComponentExecution[];
   }
   ```

2. **`packages/database/src/repositories/ComponentRepository.ts`**
   - High-level query methods
   - Semantic search using embeddings
   - Batch operations
   - Caching layer (Redis)

3. **`packages/database/src/migrations/`**
   - Sequelize/Prisma migration files
   - Seed data for platform components

**Technical Requirements:**
- ✅ Support both SQLite and PostgreSQL with minimal code changes
- ✅ Connection pooling and query optimization
- ✅ Automatic migrations on app startup (dev mode)
- ✅ Seed data for 50+ platform components
- ✅ Backup/restore utilities

---

### **OBJECTIVE 3: MCP Optimization - Eliminate Context Waste**

**Problem:** Current MCP implementation requires agents to receive tool outputs, then repeat them for users or other agents, burning through context unnecessarily.

**Required Solution Architecture:**

#### 3.1 Structured Output Streaming

**Implementation:**

```typescript
// packages/mcp-streaming/src/StructuredOutputStream.ts

interface StreamDestination {
  type: 'agent' | 'workflow' | 'database' | 'widget' | 'user';
  id: string;
  transformSchema?: z.ZodSchema;  // Optional transformation
}

class StructuredOutputStream {
  private destinations: StreamDestination[] = [];
  
  /**
   * Register a destination for structured output
   */
  addDestination(dest: StreamDestination): void {
    this.destinations.push(dest);
  }
  
  /**
   * Stream output to all registered destinations
   * WITHOUT passing through the calling agent's context
   */
  async stream(output: StructuredOutput): Promise<void> {
    await Promise.all(
      this.destinations.map(async (dest) => {
        const transformed = dest.transformSchema 
          ? dest.transformSchema.parse(output)
          : output;
          
        switch (dest.type) {
          case 'agent':
            return this.streamToAgent(dest.id, transformed);
          case 'workflow':
            return this.streamToWorkflow(dest.id, transformed);
          case 'database':
            return this.streamToDatabase(dest.id, transformed);
          case 'widget':
            return this.streamToWidget(dest.id, transformed);
          case 'user':
            return this.streamToUser(transformed);
        }
      })
    );
  }
  
  private async streamToAgent(agentId: string, data: any): Promise<void> {
    // Direct agent-to-agent communication via message queue
    await agentMessageBus.send(agentId, {
      type: 'structured_input',
      data,
      bypassContext: true  // KEY: Don't add to LLM context
    });
  }
  
  private async streamToWidget(widgetId: string, data: any): Promise<void> {
    // Direct widget update via WebSocket
    await widgetUpdateChannel.send(widgetId, {
      type: 'data_update',
      data,
      timestamp: Date.now()
    });
  }
  
  // ... other streaming methods
}
```

#### 3.2 Hook-Based Widget Updates

**Implementation:**

```typescript
// packages/mcp-server/src/hooks/WidgetUpdateHook.ts

interface WidgetUpdateHookConfig {
  widgetId: string;
  updateOn: 'tool:after' | 'agent:after' | 'workflow:step:after';
  dataExtractor: (result: any) => any;
  throttleMs?: number;
}

/**
 * Hook that automatically updates widgets without agent mediation
 */
export class WidgetUpdateHook implements Hook {
  private lastUpdateTime = 0;
  
  constructor(private config: WidgetUpdateHookConfig) {}
  
  async execute(context: HookContext): Promise<void> {
    // Throttle updates if specified
    if (this.config.throttleMs) {
      const now = Date.now();
      if (now - this.lastUpdateTime < this.config.throttleMs) {
        return;
      }
      this.lastUpdateTime = now;
    }
    
    // Extract relevant data from result
    const data = this.config.dataExtractor(context.result);
    
    // Update widget directly
    await widgetManager.update(this.config.widgetId, data);
  }
}

// Usage example in workflow
const workflow = new Workflow({
  steps: [
    {
      id: 'analyze_data',
      type: 'agent',
      config: { agentId: 'data-analyst' },
      hooks: [
        new WidgetUpdateHook({
          widgetId: 'chart-widget-1',
          updateOn: 'agent:after',
          dataExtractor: (result) => result.chartData,
          throttleMs: 1000
        })
      ]
    }
  ]
});
```

#### 3.3 Direct Agent-to-Agent Communication

**Implementation:**

```typescript
// packages/mcp-server/src/messaging/AgentMessageBus.ts

interface AgentMessage {
  fromAgentId: string;
  toAgentId: string;
  type: 'structured_input' | 'query' | 'command';
  data: any;
  bypassContext?: boolean;  // Don't add to LLM context
  requireResponse?: boolean;
}

class AgentMessageBus {
  private agents = new Map<string, AgentInstance>();
  
  /**
   * Send message from one agent to another
   * WITHOUT consuming the sender's context
   */
  async send(toAgentId: string, message: Omit<AgentMessage, 'toAgentId'>): Promise<void> {
    const recipient = this.agents.get(toAgentId);
    if (!recipient) {
      throw new Error(`Agent ${toAgentId} not found`);
    }
    
    if (message.bypassContext) {
      // Add to agent's working memory, NOT to LLM context
      await recipient.workingMemory.add(message.data);
    } else {
      // Traditional approach: add to context
      await recipient.addToContext(message.data);
    }
    
    // Trigger agent processing
    await recipient.process();
  }
  
  /**
   * Broadcast to multiple agents in parallel
   */
  async broadcast(agentIds: string[], message: any): Promise<void> {
    await Promise.all(
      agentIds.map(id => this.send(id, message))
    );
  }
}
```

**Technical Requirements:**
- ✅ Zero-copy data transfer where possible
- ✅ Schema validation at destination (not at source)
- ✅ Automatic retry with exponential backoff
- ✅ Dead letter queue for failed deliveries
- ✅ Observability: trace data flow across components
- ✅ Rate limiting per destination

---

### **OBJECTIVE 4: Universal Tool Access for Agents**

**Problem:** Agents need potential access to all MCP tools, but access should be configurable by agent builders.

**Required Implementation:**

#### 4.1 Tool Access Control System

```typescript
// packages/mcp-server/src/tools/ToolAccessControl.ts

interface ToolAccessPolicy {
  agentId: string;
  mode: 'all' | 'whitelist' | 'blacklist';
  whitelist?: string[];        // Tool IDs to allow
  blacklist?: string[];        // Tool IDs to deny
  requireApproval?: string[];  // Tools requiring user approval
  budgetLimits?: {
    [toolId: string]: {
      maxCallsPerHour?: number;
      maxCostPerDay?: number;
    };
  };
}

class ToolAccessControl {
  private policies = new Map<string, ToolAccessPolicy>();
  
  /**
   * Check if agent can access tool
   */
  async canAccess(agentId: string, toolId: string): Promise<{
    allowed: boolean;
    requiresApproval: boolean;
    reason?: string;
  }> {
    const policy = this.policies.get(agentId) || this.getDefaultPolicy();
    
    // Check mode
    if (policy.mode === 'all') {
      return { 
        allowed: true, 
        requiresApproval: policy.requireApproval?.includes(toolId) || false 
      };
    }
    
    if (policy.mode === 'whitelist') {
      const allowed = policy.whitelist?.includes(toolId) || false;
      return { 
        allowed, 
        requiresApproval: allowed && (policy.requireApproval?.includes(toolId) || false),
        reason: allowed ? undefined : 'Tool not in whitelist'
      };
    }
    
    if (policy.mode === 'blacklist') {
      const allowed = !policy.blacklist?.includes(toolId);
      return { 
        allowed, 
        requiresApproval: allowed && (policy.requireApproval?.includes(toolId) || false),
        reason: allowed ? undefined : 'Tool in blacklist'
      };
    }
    
    return { allowed: false, requiresApproval: false, reason: 'Unknown policy mode' };
  }
  
  /**
   * Check budget limits
   */
  async checkBudget(agentId: string, toolId: string): Promise<{
    withinBudget: boolean;
    remaining?: number;
  }> {
    const policy = this.policies.get(agentId);
    const limits = policy?.budgetLimits?.[toolId];
    
    if (!limits) {
      return { withinBudget: true };
    }
    
    // Check hourly call limit
    if (limits.maxCallsPerHour) {
      const recentCalls = await this.getRecentCalls(agentId, toolId, '1h');
      if (recentCalls >= limits.maxCallsPerHour) {
        return { 
          withinBudget: false, 
          remaining: 0 
        };
      }
    }
    
    // Check daily cost limit
    if (limits.maxCostPerDay) {
      const todayCost = await this.getTodayCost(agentId, toolId);
      if (todayCost >= limits.maxCostPerDay) {
        return { 
          withinBudget: false, 
          remaining: 0 
        };
      }
    }
    
    return { withinBudget: true };
  }
  
  private getDefaultPolicy(): ToolAccessPolicy {
    return {
      agentId: 'default',
      mode: 'all',
      requireApproval: [
        'execute_code',
        'make_payment',
        'delete_resource',
        'send_email'
      ]
    };
  }
}
```

#### 4.2 MCP Tool Registry Integration

**Update `mcp.json` to include access control metadata:**

```json
{
  "mcpServers": {
    "agent-platform": {
      "command": "node",
      "args": ["./mcp-server/build/index.js"],
      "env": {
        "TOOL_ACCESS_CONFIG": "./config/tool-access.json"
      }
    }
  },
  "toolMetadata": {
    "execute_agent": {
      "category": "agents",
      "risk_level": "medium",
      "requires_approval_by_default": false,
      "estimated_cost_per_call": 0.02
    },
    "github_action": {
      "category": "integrations",
      "risk_level": "high",
      "requires_approval_by_default": true,
      "estimated_cost_per_call": 0.0
    }
    // ... all other tools
  }
}
```

**Technical Requirements:**
- ✅ Load tool access policies from database on agent creation
- ✅ Support inheritance (agent inherits from team/workspace policies)
- ✅ Real-time policy updates without restarting agents
- ✅ Audit log for all tool access decisions
- ✅ UI for agent builders to configure tool access visually

---

## 🏗️ PRODUCTION-GRADE COMPONENT COLLECTIONS

### **OBJECTIVE 5: Revolutionary Agent Suite**

Build comprehensive agent collections across high-impact domains.

#### 5.1 Codebase Ingestion Agent

**File:** `local-storage/platform/agents/development/codebase-ingestion-agent.yaml`

**Capabilities:**
- Parse multiple programming languages (Python, TypeScript, JavaScript, Go, Rust, Java, C++)
- Extract semantic structure (classes, functions, dependencies)
- Generate embeddings for semantic search
- Build dependency graphs
- Detect code smells and anti-patterns
- Generate architectural diagrams
- Create documentation from code comments

**Tools Required:**
- `file_search`
- `read_file`
- `grep_search`
- `list_dir`
- `semantic_search`
- `mcp_agents_create_collection`
- `mcp_agents_create_collection_item`

**Output Formats:**
- JSON schema of codebase structure
- Markdown documentation
- Mermaid diagrams (class, sequence, component)
- Vector database of embeddings

#### 5.2 Deep Research Agent

**File:** `local-storage/platform/agents/research/deep-research-agent.yaml`

**Capabilities:**
- Multi-source web search (Google, Bing, academic databases)
- PDF and document parsing
- Citation management (APA, MLA, Chicago)
- Fact-checking and source verification
- Synthesis of multiple sources
- Generate research reports with citations
- Create knowledge graphs from research

**Tools Required:**
- `fetch_webpage`
- `github_repo` (for code research)
- `mcp_context7_resolve-library-id`
- `mcp_context7_get-library-docs`
- `mcp_agents_extract_structured_data`
- `mcp_agents_create_collection`

**Research Workflow:**
1. Query analysis and decomposition
2. Source discovery (10+ sources)
3. Content extraction and parsing
4. Fact verification across sources
5. Synthesis and report generation
6. Citation formatting
7. Knowledge graph construction

#### 5.3 Frontend Development Agent Suite

**Agents to Create:**

1. **UI Design Agent** (`local-storage/platform/agents/development/ui-design-agent.yaml`)
   - Analyze design requirements
   - Research design trends using web search
   - Select shadcn components from documentation
   - Generate Tailwind CSS classes
   - Create responsive layouts
   - Accessibility compliance (WCAG 2.1 AA)

2. **Component Builder Agent** (`local-storage/platform/agents/development/component-builder-agent.yaml`)
   - Generate React/TypeScript components
   - Implement Shadcn UI patterns
   - Write Storybook stories
   - Generate unit tests (Jest + React Testing Library)
   - Optimize for performance (React.memo, useMemo, useCallback)

3. **Widget Integration Agent** (`local-storage/platform/agents/development/widget-integration-agent.yaml`)
   - Create custom widgets for agent platform
   - Implement widget lifecycle hooks
   - Connect widgets to workflows
   - Real-time data binding
   - Widget state management

4. **Chrome DevTools Agent** (`local-storage/platform/agents/development/chrome-devtools-agent.yaml`)
   - Use Puppeteer for browser automation
   - Capture screenshots and metrics
   - Accessibility audits
   - Performance profiling (Lighthouse)
   - Visual regression testing

**Tools Required:**
- `create_file`
- `replace_string_in_file`
- `read_file`
- `runTests`
- `mcp_context7_get-library-docs` (for Shadcn, React docs)
- `mcp_agents_create_widget`
- `mcp_agents_update_widget_data`
- `open_simple_browser`

#### 5.4 Backend Development Agent Suite

**Agents to Create:**

1. **API Designer Agent** (`local-storage/platform/agents/development/api-designer-agent.yaml`)
   - REST API design (OpenAPI 3.0)
   - GraphQL schema design
   - Database schema design
   - API documentation generation
   - Security best practices (OWASP Top 10)

2. **Database Agent** (`local-storage/platform/agents/development/database-agent.yaml`)
   - SQL query optimization
   - Migration generation (Sequelize, Prisma)
   - Index recommendations
   - Query performance analysis
   - Data modeling

3. **Testing Agent** (`local-storage/platform/agents/development/testing-agent.yaml`)
   - Generate unit tests (pytest, Jest)
   - Integration test suites
   - Load testing scripts (k6, Locust)
   - Security testing (OWASP ZAP)
   - Test coverage analysis

4. **DevOps Agent** (`local-storage/platform/agents/development/devops-agent.yaml`)
   - Docker container generation
   - Kubernetes manifests
   - CI/CD pipeline configuration (GitHub Actions, GitLab CI)
   - Infrastructure as Code (Terraform, Pulumi)
   - Monitoring setup (Prometheus, Grafana)

#### 5.5 Business & Operations Agent Suite

**Agents to Create:**

1. **Customer Support Agent** (`local-storage/platform/agents/business/customer-support-agent.yaml`)
   - Ticket classification and routing
   - Sentiment analysis
   - Auto-response generation
   - Knowledge base search
   - Escalation detection

2. **Sales Agent** (`local-storage/platform/agents/business/sales-agent.yaml`)
   - Lead qualification
   - Proposal generation
   - CRM integration (Salesforce, HubSpot)
   - Email campaign creation
   - Sales forecasting

3. **Financial Analysis Agent** (`local-storage/platform/agents/business/financial-agent.yaml`)
   - Financial statement analysis
   - Budget forecasting
   - Expense categorization
   - ROI calculation
   - Stripe payment processing

4. **Content Marketing Agent** (`local-storage/platform/agents/business/content-marketing-agent.yaml`)
   - Blog post generation (SEO-optimized)
   - Social media content
   - Email newsletters
   - Landing page copy
   - A/B test analysis

---

### **OBJECTIVE 6: Agent & Workflow Creator Agents**

**Critical Enhancement:** Research-augmented agent creation

#### 6.1 Meta-Agent: Agent Creator

**File:** `local-storage/platform/agents/core/agent-creator-agent.yaml`

**Capabilities:**
- Analyze user requirements for new agents
- Research best practices in relevant domains using web search
- Research existing agent implementations (GitHub, papers)
- Generate agent definitions (YAML + instructions)
- Create tool lists and access policies
- Generate validation tests for agents
- Store insights in vector database
- Optimize agent prompts using EvoPrompt patterns

**Research Integration:**
```typescript
// Workflow for Agent Creator
const agentCreationWorkflow = {
  steps: [
    {
      id: 'analyze_requirements',
      type: 'agent',
      config: { agentId: 'requirement-analyzer' }
    },
    {
      id: 'research_domain',
      type: 'agent',
      config: { 
        agentId: 'deep-research-agent',
        query: 'Best practices for {domain} agents',
        sources: ['arxiv', 'github', 'blogs', 'documentation']
      }
    },
    {
      id: 'extract_insights',
      type: 'agent',
      config: { 
        agentId: 'insight-extractor',
        schema: {
          patterns: z.array(z.object({
            pattern: z.string(),
            example: z.string(),
            source: z.string()
          })),
          tools: z.array(z.string()),
          best_practices: z.array(z.string())
        }
      }
    },
    {
      id: 'store_insights',
      type: 'collection_create',
      config: {
        collectionId: 'agent-insights',
        generateEmbeddings: true
      }
    },
    {
      id: 'generate_agent',
      type: 'agent',
      config: {
        agentId: 'agent-assembler',
        context: ['research_insights', 'best_practices']
      }
    },
    {
      id: 'validate_agent',
      type: 'agent',
      config: {
        agentId: 'agent-validator',
        tests: ['syntax', 'tool_availability', 'prompt_quality']
      }
    }
  ]
};
```

**Tools Required:**
- All research tools
- `mcp_agents_create_skill`
- `mcp_agents_attach_skill`
- `create_file`
- `mcp_agents_create_collection`
- `mcp_agents_create_collection_item`

#### 6.2 Meta-Workflow: Workflow Creator

**File:** `local-storage/platform/agents/core/workflow-creator-agent.yaml`

**Capabilities:**
- Analyze workflow requirements
- Research workflow patterns in industry
- Generate workflow definitions
- Optimize for parallelization
- Add error handling and retries
- Create monitoring hooks
- Generate workflow documentation

---

## 🧪 TESTING & QUALITY ASSURANCE

### Test-Driven Development Mandate

**Every component must have:**
1. ✅ Unit tests (>80% coverage)
2. ✅ Integration tests (key workflows)
3. ✅ Performance tests (response time <200ms)
4. ✅ Security tests (input validation, auth)

**Test Structure:**
```
tests/
├── unit/
│   ├── storage/
│   ├── database/
│   ├── mcp-streaming/
│   └── agents/
├── integration/
│   ├── workflows/
│   ├── agent-communication/
│   └── database-storage/
└── e2e/
    ├── agent-creation/
    ├── research-workflow/
    └── widget-updates/
```

---

## 🚀 EXECUTION STRATEGY

### Phase 1: Foundation (Days 1-2)
1. ✅ Create storage layer architecture
2. ✅ Implement file system store
3. ✅ Setup database schemas
4. ✅ Implement database store
5. ✅ Create migration system
6. ✅ Write comprehensive tests

### Phase 2: MCP Optimization (Days 3-4)
1. ✅ Implement structured output streaming
2. ✅ Create agent message bus
3. ✅ Build widget update hooks
4. ✅ Implement tool access control
5. ✅ Add observability and monitoring
6. ✅ Performance testing

### Phase 3: Agent Collections (Days 5-7)
1. ✅ Build research infrastructure
2. ✅ Create core development agents
3. ✅ Create business agents
4. ✅ Create meta-agents (agent creator, workflow creator)
5. ✅ Generate comprehensive documentation
6. ✅ Create example workflows

### Phase 4: Integration & Polish (Days 8-10)
1. ✅ UI updates for new features
2. ✅ End-to-end testing
3. ✅ Performance optimization
4. ✅ Documentation and tutorials
5. ✅ Demo video scripts

---

## 📋 DELIVERABLES CHECKLIST

### Core Infrastructure
- [ ] `packages/storage/` - Complete storage layer with tests
- [ ] `packages/database/` - Database integration with migrations
- [ ] `packages/mcp-streaming/` - Optimized MCP communication
- [ ] `local-storage/` - Full directory structure with 50+ components

### Agent Collections
- [ ] 10+ Development agents (frontend, backend, testing)
- [ ] 5+ Research agents (deep research, fact-checking, synthesis)
- [ ] 5+ Business agents (sales, support, marketing, finance)
- [ ] 2+ Meta-agents (agent creator, workflow creator)

### Documentation
- [ ] API documentation (OpenAPI specs)
- [ ] Architecture decision records (ADRs)
- [ ] Component creation guides
- [ ] Tutorial videos (scripts + recordings)
- [ ] Performance benchmarks

### Testing
- [ ] 200+ unit tests (>80% coverage)
- [ ] 50+ integration tests
- [ ] 10+ end-to-end scenarios
- [ ] Load testing results (1000+ concurrent users)

---

## 🎯 SUCCESS CRITERIA

### Technical Excellence
- ✅ Zero TypeScript errors
- ✅ All tests passing
- ✅ <200ms API response time (p95)
- ✅ >80% code coverage
- ✅ Zero security vulnerabilities (npm audit)
- ✅ Lighthouse score >90

### Functionality
- ✅ Agent creation via research-augmented workflow
- ✅ Direct agent-to-agent communication without context waste
- ✅ Automatic widget updates via hooks
- ✅ Universal tool access with granular control
- ✅ Persistent storage with versioning

### Documentation
- ✅ Every public API documented
- ✅ 10+ code examples
- ✅ Architecture diagrams (Mermaid)
- ✅ Tutorial videos (5+ scripts)

### User Experience
- ✅ <3s time to create new agent
- ✅ <1s to search 10,000+ components
- ✅ Real-time UI updates with zero lag
- ✅ Intuitive component browser

---

## 🛠️ TOOLCHAIN DIRECTIVES

### Required Tools Usage

1. **File Operations:**
   - `create_file` for new files
   - `replace_string_in_file` for modifications (NEVER create placeholder comments)
   - `read_file` for context gathering
   - `list_dir` for structure analysis

2. **Execution:**
   - `run_in_terminal` for npm/python commands
   - `runTests` for test execution
   - `get_terminal_output` for validation

3. **Agent Collaboration:**
   - `mcp_agents_agent_teams` for parallel development (frontend + backend teams)
   - `mcp_agents_execute_workflow` for multi-step processes
   - `mcp_agents_create_task` for project management tracking

4. **Quality Assurance:**
   - `get_errors` after every file change
   - `runTests` after implementation
   - `grep_search` for code consistency checks

---

## 🚨 ANTI-PATTERNS TO AVOID

### ❌ Forbidden Practices
1. **Placeholder Comments:** NEVER use `// TODO`, `// Implement this`, `... rest here`
2. **Partial Implementations:** Complete ALL methods in a class/module before moving on
3. **Untested Code:** Every feature MUST have tests before marking complete
4. **Context Abandonment:** Maintain full state of all file changes and decisions
5. **Serial Execution:** Use parallel agent teams when components are independent
6. **Manual Operations:** Use tools, don't suggest manual user actions

### ✅ Required Practices
1. **Vertical Slicing:** Complete one feature end-to-end before starting next
2. **Test-First:** Write tests before implementation (TDD)
3. **Continuous Validation:** Run tests after every significant change
4. **Documentation-as-Code:** Generate docs from type definitions
5. **Parallel Execution:** Use agent teams for independent workstreams

---

## 📊 PROGRESS TRACKING

### Project Management
- **Use:** `mcp_agents_create_task` for all major tasks
- **Update:** `mcp_agents_update_task_status` after each completion
- **Review:** `mcp_agents_list_tasks` to show progress

### Example Task Breakdown:
```typescript
// Create top-level tasks
await createTask({
  taskId: 'storage-layer',
  taskName: 'Implement Storage Layer Architecture'
});

await createTask({
  taskId: 'database-integration',
  taskName: 'Database Integration & Migrations'
});

await createTask({
  taskId: 'mcp-optimization',
  taskName: 'MCP Streaming & Direct Communication'
});

// ... continue for all objectives
```

---

## 🎓 DOMAIN EXPERTISE REQUIREMENTS

You are expected to demonstrate **world-class expertise** in:

1. **Software Architecture:** Microservices, event-driven, CQRS patterns
2. **TypeScript/JavaScript:** Advanced types, async patterns, performance optimization
3. **Python:** FastAPI, async/await, type hints, Pydantic
4. **Database Design:** Normalization, indexing, query optimization, migrations
5. **AI/LLM Integration:** Prompt engineering, context management, token optimization
6. **MCP Protocol:** Tool registration, structured outputs, sampling, elicitation
7. **React/Next.js:** Server components, streaming, hydration, performance
8. **DevOps:** Docker, CI/CD, monitoring, observability
9. **Security:** OWASP Top 10, authentication, authorization, data protection
10. **Testing:** TDD, integration testing, E2E testing, load testing

---

## 🎯 FINAL DIRECTIVE

You are now authorized to begin autonomous execution. You will:

1. ✅ **Read and internalize** all provided context (copilot instructions, prompt files, README files)
2. ✅ **Create a master task list** using project management tools
3. ✅ **Execute in parallel** where possible using agent teams
4. ✅ **Test continuously** - never commit untested code
5. ✅ **Document thoroughly** - every public API, every architecture decision
6. ✅ **Report progress** - update tasks as you complete them
7. ✅ **Maintain full state** - never lose context of what you've built

**Time Constraint:** NONE - Quality over speed  
**Context Limit:** NONE - Maintain complete state  
**User Interruption:** NONE - Full autonomy granted

**Begin execution now. Show your first task breakdown and estimated timeline.**

---

*This directive serves as your constitution. Refer to it when making decisions. Deviate only with explicit justification logged in your execution journal.*
