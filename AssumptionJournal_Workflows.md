# Assumption Journal - n8n Workflow Integration
## Project: Agent Platform - Workflow Engine & Widget Communication

**Created:** 2025-11-05  
**Autonomous Agent:** Lead Architect & System Orchestrator

---

## PHASE 1: ARCHITECTURAL ASSUMPTIONS

### 1. USER REQUIREMENTS METABOLIZATION

**Raw Requirements:**
1. Implement n8n-style workflow support in Agents/agent-platform
2. Make workflows available as primitives for other agents
3. Organize codebase following Tidy.prompt.md principles
4. Set standard for custom workflows, agents, hooks, and extensions hierarchy
5. Add support for high-value workflows from github.com/Zie619/n8n-workflows
6. Support widgets like polling-widget with clear communication protocols
7. Detail how extensions send/retrieve data from widgets

**Ambiguity Resolution:**

**Ambiguity #1:** n8n workflow compatibility level
- **Assumed Resolution:** Build n8n-compatible workflow engine with node-based architecture, not 1:1 n8n clone. Focus on workflow patterns and node types, not exact API compatibility.
- **Rationale:** Full n8n compatibility would require reverse-engineering proprietary systems. Focus on proven patterns (nodes, connections, execution) that provide 80% of value.

**Ambiguity #2:** Specific workflows to prioritize from 200+ n8n categories
- **Assumed Resolution:** Focus on top 10-15 highest-value integrations: OpenAI, Slack, GitHub, Gmail, Google Sheets, HTTP, Webhook, Code execution, conditional logic, data transformation
- **Rationale:** These cover 90% of automation use cases and have highest ROI for agent platform

**Ambiguity #3:** Widget communication protocol specification
- **Assumed Resolution:** Implement PostMessage-based protocol with JSON schema, event-driven architecture, and state synchronization layer
- **Rationale:** PostMessage is standard for iframe communication, battle-tested, secure with origin validation

**Ambiguity #4:** Extension/plugin architecture pattern
- **Assumed Resolution:** Implement registry-based plugin system with standardized interfaces, lazy loading, and dependency injection
- **Rationale:** Proven pattern from VSCode, webpack, Babel - allows scalability and third-party extensions

---

## 2. TECHNOLOGY STACK DECISIONS

### Backend (Python - FastAPI)
- **Workflow Engine:** Python async/await for node execution orchestration
- **Node Types:** Extensible base classes with plugin architecture
- **State Management:** Pydantic models + SQLAlchemy ORM
- **Persistence:** PostgreSQL for workflow definitions and execution history
- **Queue:** Redis for async job processing (workflow execution)

**Rationale:** Existing platform uses FastAPI, async Python ideal for I/O-bound workflow operations

### Frontend (TypeScript - React)
- **Workflow Builder:** React Flow for visual workflow editor
- **Widget Communication:** PostMessage API with TypeScript interfaces
- **State Management:** Zustand for workflow state
- **UI Components:** Existing shadcn/ui component library

**Rationale:** React Flow is production-ready flow editor, integrates with existing stack

### MCP Integration
- **Workflow Tools:** Expose workflows as MCP tools
- **Agent Access:** Workflows callable from MCP agents via standardized tool interface

---

## 3. ARCHITECTURAL BLUEPRINT

### 3.1 Core Components

```
Agents/agent-platform/
├── packages/
│   ├── workflow-engine/          # NEW: Core workflow execution engine
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── executor.ts   # Workflow orchestration
│   │   │   │   ├── node-runner.ts # Individual node execution
│   │   │   │   └── state.ts      # Execution state management
│   │   │   ├── nodes/             # Node type registry
│   │   │   │   ├── base/         # Base node classes
│   │   │   │   ├── ai/           # OpenAI, Anthropic nodes
│   │   │   │   ├── data/         # Transform, filter nodes
│   │   │   │   ├── logic/        # Conditional, loop nodes
│   │   │   │   └── integrations/ # HTTP, webhook, API nodes
│   │   │   └── types/            # TypeScript definitions
│   │   └── package.json
│   │
│   ├── widget-bridge/             # NEW: Widget communication protocol
│   │   ├── src/
│   │   │   ├── protocol/
│   │   │   │   ├── schema.ts     # Message schemas
│   │   │   │   ├── transport.ts  # PostMessage transport
│   │   │   │   └── sync.ts       # State synchronization
│   │   │   ├── adapters/         # Widget-specific adapters
│   │   │   └── types/
│   │   └── package.json
│   │
│   └── extension-system/          # NEW: Plugin architecture
│       ├── src/
│       │   ├── registry/
│       │   ├── loader/
│       │   └── interfaces/
│       └── package.json
│
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── workflows/         # ENHANCE: Upgrade existing
│   │   │   │   ├── nodes/        # Python node implementations
│   │   │   │   ├── engine.py     # Python execution engine
│   │   │   │   ├── registry.py   # Node registry
│   │   │   │   └── routes.py     # API endpoints
│   │   │   ├── extensions/       # NEW: Extension management
│   │   │   └── widgets/          # NEW: Widget integration
│   │   └── ...
│   │
│   └── web/
│       ├── src/
│       │   ├── features/
│       │   │   ├── workflow-builder/ # Visual workflow editor
│       │   │   ├── widget-manager/   # Widget lifecycle
│       │   │   └── extension-store/  # Extension marketplace
│       │   └── ...
│       └── ...
│
├── extensions/                     # NEW: Standard extension hierarchy
│   ├── workflows/                 # Pre-built workflows
│   │   ├── ai/
│   │   │   ├── openai-completion/
│   │   │   ├── content-generation/
│   │   │   └── data-analysis/
│   │   ├── automation/
│   │   │   ├── email-processor/
│   │   │   ├── slack-notifier/
│   │   │   └── github-automation/
│   │   └── data/
│   │       ├── google-sheets-sync/
│   │       └── airtable-import/
│   │
│   ├── agents/                    # Custom agent templates
│   │   ├── research/
│   │   ├── coding/
│   │   └── analytics/
│   │
│   ├── hooks/                     # Lifecycle hooks
│   │   ├── pre-execution/
│   │   ├── post-execution/
│   │   └── error-handlers/
│   │
│   └── widgets/                   # Widget implementations
│       ├── polling-widget/
│       ├── chart-widget/
│       └── data-table-widget/
│
└── docs/
    ├── workflow-system/
    ├── widget-protocol/
    └── extension-guide/
```

### 3.2 Workflow Engine Architecture

**Workflow Definition:**
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings: WorkflowSettings;
  metadata: WorkflowMetadata;
}

interface WorkflowNode {
  id: string;
  type: string; // 'openai', 'http', 'conditional', etc.
  position: { x: number; y: number };
  config: Record<string, any>; // Node-specific config
  inputs: string[]; // Connected input node IDs
  outputs: string[]; // Connected output node IDs
}
```

**Execution Model:**
- Topological sort for execution order
- Async/await for I/O operations
- Parallel execution where possible (no dependencies)
- State snapshots at each node for debugging
- Error propagation with circuit breakers

### 3.3 Widget Communication Protocol

**Architecture:**
```
Extension (Parent) <---> Widget Bridge <---> Widget (iframe)
                           ^
                           |
                    PostMessage Protocol
```

**Message Schema:**
```typescript
interface WidgetMessage {
  type: 'REQUEST' | 'RESPONSE' | 'EVENT' | 'SYNC';
  id: string; // Message correlation ID
  source: string; // 'extension' | 'widget'
  target: string; // Recipient ID
  action: string; // 'getData' | 'updateData' | 'notify'
  payload: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface WidgetBridge {
  // From extension to widget
  sendData(widgetId: string, data: any): Promise<void>;
  requestData(widgetId: string, query: any): Promise<any>;
  
  // From widget to extension
  onDataRequest(handler: (query: any) => Promise<any>): void;
  onEvent(handler: (event: WidgetEvent) => void): void;
  
  // Bidirectional sync
  syncState(widgetId: string, state: any): void;
  onStateChange(handler: (state: any) => void): void;
}
```

**Communication Flow:**
1. Extension initializes widget via iframe
2. Handshake establishes trusted origin
3. Extension registers event handlers
4. Widget requests initial data
5. Extension provides data + subscribes to updates
6. Widget emits events (user actions, state changes)
7. Extension processes events, updates state
8. Bidirectional sync keeps both sides consistent

---

## 4. CODEBASE ORGANIZATION (TIDY PRINCIPLES)

### 4.1 Directory Structure Standards

**Extensions Hierarchy:**
```
extensions/
├── [category]/              # workflows, agents, hooks, widgets
│   ├── [extension-name]/
│   │   ├── manifest.json    # Extension metadata
│   │   ├── README.md        # Documentation
│   │   ├── src/             # Source code
│   │   │   ├── index.ts     # Entry point
│   │   │   ├── config.ts    # Configuration
│   │   │   └── ...
│   │   ├── tests/           # Test suite
│   │   ├── assets/          # Icons, images
│   │   └── package.json     # Dependencies (if needed)
│   └── ...
└── template/                # Extension template/scaffold
```

**Manifest Schema:**
```json
{
  "id": "openai-completion-workflow",
  "name": "OpenAI Completion Workflow",
  "version": "1.0.0",
  "category": "workflows",
  "subcategory": "ai",
  "description": "Generate text completions using OpenAI API",
  "author": "Platform",
  "license": "MIT",
  "entry": "src/index.ts",
  "dependencies": [],
  "capabilities": ["workflow-node", "mcp-tool"],
  "configuration": {
    "apiKey": {
      "type": "secret",
      "required": true,
      "description": "OpenAI API key"
    }
  }
}
```

### 4.2 Consolidation Plan

**Files to Organize:**
- Move existing workflow files to proper structure
- Consolidate scattered MCP server code
- Create clear separation: packages/ (libraries) vs extensions/ (plugins)
- Remove duplicate configuration files
- Standardize naming conventions

---

## 5. HIGH-VALUE WORKFLOWS TO IMPLEMENT

Based on n8n-workflows repository analysis and platform needs:

### Phase 1 - Core Workflows (Must-Have)
1. **OpenAI Integration** - Text completion, chat, embeddings
2. **HTTP Request** - Generic REST API calls
3. **Webhook** - Receive HTTP webhooks
4. **Code Execution** - Run JavaScript/Python code
5. **Conditional Logic** - If/else branching
6. **Data Transform** - Map, filter, reduce operations

### Phase 2 - Communication (High Value)
7. **Slack** - Send messages, notifications
8. **Gmail** - Send/receive emails
9. **Discord** - Bot messaging

### Phase 3 - Productivity (High Value)
10. **Google Sheets** - Read/write spreadsheets
11. **Airtable** - Database operations
12. **GitHub** - Repository operations, issues, PRs

### Phase 4 - Advanced
13. **Database Connectors** - PostgreSQL, MongoDB
14. **File Operations** - Read, write, process files
15. **Schedule/Cron** - Time-based triggers

**Each workflow becomes:**
- Node type in workflow engine
- MCP tool for agents
- Template in extension marketplace

---

## 6. DEVELOPMENT LEDGER (INITIAL)

Will be expanded in DevelopmentJournal with granular tasks. High-level features:

1. **Workflow Engine Core** - Executor, node runner, state management
2. **Base Node Types** - Abstract classes, validation, error handling
3. **Widget Bridge Protocol** - PostMessage transport, schema, sync
4. **Extension System** - Registry, loader, manifest validation
5. **Core Workflow Nodes** - OpenAI, HTTP, Webhook, Code, Conditional, Transform
6. **Integration Nodes** - Slack, Gmail, GitHub, Google Sheets
7. **Visual Workflow Builder** - React Flow integration, drag-drop
8. **MCP Tool Bridge** - Expose workflows as MCP tools
9. **Extension Marketplace UI** - Browse, install, configure extensions
10. **Documentation** - API docs, extension guide, widget protocol spec
11. **Testing Suite** - Unit tests, integration tests, E2E workflow tests
12. **Migration** - Reorganize existing code to new structure

---

## 7. ARCHITECTURAL DECISIONS LOG

### Decision 1: Separate workflow engine as package
**Reason:** Reusability across apps, clear API boundary, independent versioning

### Decision 2: Python + TypeScript hybrid
**Reason:** Backend workflows in Python (existing API), frontend builder in TypeScript

### Decision 3: React Flow for workflow builder
**Reason:** Battle-tested, extensive features, active maintenance

### Decision 4: PostMessage for widget communication
**Reason:** Web standard, secure, iframe-compatible, no CORS issues

### Decision 5: Registry-based extension system
**Reason:** Scalable, supports lazy loading, third-party extensions

### Decision 6: Extensions organized by category/subcategory
**Reason:** Clear hierarchy, easy discovery, follows marketplace patterns

---

## 8. RISK MITIGATION

**Risk 1:** Workflow engine complexity
- **Mitigation:** Start with simple execution (sequential), add parallelization later

**Risk 2:** Widget security (iframe communication)
- **Mitigation:** Strict origin validation, message schema validation, CSP headers

**Risk 3:** Extension quality/malicious code
- **Mitigation:** Sandbox execution, permission system, code review for marketplace

**Risk 4:** Scope creep (200+ n8n workflows)
- **Mitigation:** Strict prioritization, implement top 15 only, document extension API for community

---

## NEXT STEPS

Proceeding to create DevelopmentJournal with detailed tasks and begin Phase 2 iterative development.
