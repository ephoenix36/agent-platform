# Copilot Instructions for AI Agent Platform

## 🎯 Project Context

### What This Project Does
The AI Agent Platform is a **collaborative marketplace** for building, sharing, and monetizing AI agents with a visual canvas-based UI, voice control, and real-time streaming capabilities. It supports multiple agent formats (MCP, Agent Protocol, CrewAI, LangChain) and provides Docker-sandboxed execution with flexible monetization options.

### Core Technologies
- **Frontend:** Next.js 15, React 18, TypeScript 5.6, TailwindCSS 3.4, React Flow (canvas), Framer Motion
- **Backend:** FastAPI (Python 3.12), Alembic (migrations), Pydantic (validation)
- **Database:** PostgreSQL (main), MongoDB (logs/analytics), Redis (caching/sessions)
- **Message Queue:** RabbitMQ (async workflows)
- **Storage:** MinIO (S3-compatible object storage)
- **Infrastructure:** Docker, Docker Compose, Turbo (monorepo)
- **Testing:** Playwright (E2E), Jest/Vitest (unit), pytest (Python)
- **MCP Server:** Model Context Protocol SDK, custom tools integration

### Architecture Overview
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│   FastAPI    │────▶│ PostgreSQL  │
│   (Web UI)  │◀────│   (API)      │◀────│  (Main DB)  │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                     
       │                   ├──────────▶ MongoDB (Logs)
       │                   ├──────────▶ Redis (Cache)
       │                   ├──────────▶ RabbitMQ (Queue)
       │                   └──────────▶ MinIO (Storage)
       │
       └─────────▶ MCP Server (Task Tools, Workflow Orchestration, ...)
```

---

## 🏗️ Code Standards

### TypeScript/JavaScript

**Naming Conventions:**
- **Files:** `kebab-case.ts` (e.g., `agent-executor.ts`)
- **Components:** `PascalCase.tsx` (e.g., `AgentCanvas.tsx`)
- **Functions:** `camelCase` (e.g., `executeAgent`)
- **Constants:** `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Types/Interfaces:** `PascalCase` (e.g., `AgentConfig`, `ExecutionResult`)

**Patterns We Use:**

```typescript
// ✅ Functional components with TypeScript
export function AgentCard({ agent }: AgentCardProps): JSX.Element {
  const { execute, isLoading } = useAgent(agent.id);
  
  return (
    <Card>
      <h3>{agent.name}</h3>
      <Button onClick={() => execute()} disabled={isLoading}>
        Execute
      </Button>
    </Card>
  );
}

// ✅ Custom hooks for reusable logic
export function useAgent(id: string) {
  const [isLoading, setIsLoading] = useState(false);
  
  const execute = useCallback(async (input?: string) => {
    setIsLoading(true);
    try {
      const result = await api.executeAgent(id, input);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  
  return { execute, isLoading };
}

// ✅ Explicit return types for all exported functions
export function parseAgentMarkdown(content: string): AgentConfig {
  const sections = content.split(/^##\s+/gm);
  // Implementation
  return config;
}

// ✅ Zod schemas for runtime validation
export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  model: z.enum(['gpt-4', 'gpt-4-turbo-preview', 'claude-3-opus']),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(32000).optional(),
});

export type Agent = z.infer<typeof AgentSchema>;
```

**Anti-Patterns to Avoid:**

```typescript
// ❌ Default exports (use named exports)
export default function Component() {}

// ❌ Any types
function process(data: any) {}

// ❌ Deeply nested ternaries
const value = a ? (b ? (c ? d : e) : f) : g;

// ❌ Mutating props or state directly
props.user.name = 'New Name';  // Wrong!
setUsers(users.push(newUser)); // Wrong!

// ✅ Use immutable patterns
const updatedUser = { ...user, name: 'New Name' };
setUsers([...users, newUser]);
```

### Python (FastAPI Backend)

**Style:** PEP 8 + Black formatter

```python
# ✅ Type hints for all functions
from typing import List, Optional
from pydantic import BaseModel

class AgentCreate(BaseModel):
    name: str
    description: str
    model: str = "gpt-4"
    temperature: float = 0.7

async def create_agent(
    agent: AgentCreate,
    db: AsyncSession,
    user_id: str
) -> Agent:
    """
    Create a new agent in the database.
    
    Args:
        agent: Agent configuration
        db: Database session
        user_id: ID of the user creating the agent
        
    Returns:
        Created agent instance
        
    Raises:
        ValueError: If agent name already exists
    """
    # Implementation
    return created_agent

# ✅ Dependency injection for services
from fastapi import Depends

@router.post("/agents")
async def create_agent_endpoint(
    agent: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await create_agent(agent, db, current_user.id)

# ✅ Structured logging
import logging
logger = logging.getLogger(__name__)

logger.info(f"Creating agent: {agent.name}", extra={
    "user_id": user_id,
    "model": agent.model
})
```

---

## 🧩 Common Patterns

### Agent Execution Flow

```typescript
// Frontend initiates execution
const { execute } = useAgent(agentId);

const result = await execute({
  input: "Research AI developments",
  stream: true,  // Enable streaming responses
  context: { 
    userPreferences: preferences 
  }
});

// Backend handles execution
# apps/api/app/services/agent_executor.py
async def execute_agent(
    agent_id: str,
    input_data: str,
    user_id: str,
    stream: bool = False
) -> ExecutionResult:
    """Execute agent with sandbox isolation and monitoring."""
    
    # 1. Load agent configuration
    agent = await get_agent(agent_id)
    
    # 2. Check permissions
    if not can_execute(user_id, agent):
        raise PermissionError()
    
    # 3. Prepare Docker sandbox
    sandbox = await create_sandbox(agent)
    
    try:
        # 4. Execute with monitoring
        if stream:
            return execute_streaming(sandbox, agent, input_data)
        else:
            return await execute_batch(sandbox, agent, input_data)
    finally:
        # 5. Cleanup
        await sandbox.destroy()
```

### Streaming UI Components

```typescript
// Real-time component generation from agent
export function StreamingOutput({ executionId }: Props) {
  const [components, setComponents] = useState<UIComponent[]>([]);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/stream/${executionId}`);
    
    eventSource.onmessage = (event) => {
      const component = JSON.parse(event.data);
      setComponents(prev => [...prev, component]);
    };
    
    return () => eventSource.close();
  }, [executionId]);
  
  return (
    <div className="space-y-4">
      {components.map((comp, idx) => (
        <DynamicComponent key={idx} {...comp} />
      ))}
    </div>
  );
}
```

### Voice Control Integration

```typescript
// Voice command processing
export function useVoiceCommands() {
  const recognition = useSpeechRecognition();
  
  const processCommand = useCallback((transcript: string) => {
    // Natural language → structured command
    const intent = parseIntent(transcript);
    
    switch (intent.action) {
      case 'create_agent':
        return createAgentFromVoice(intent.parameters);
      case 'execute_agent':
        return executeAgentFromVoice(intent.parameters);
      case 'connect_nodes':
        return connectNodesFromVoice(intent.parameters);
    }
  }, []);
  
  recognition.onResult = processCommand;
  
  return { startListening: recognition.start };
}
```

### Multi-Format Agent Parsing

```typescript
// Detect and parse any agent format
export function parseAgent(content: string): AgentConfig {
  const format = detectFormat(content);
  
  switch (format) {
    case 'markdown':
      return parseMarkdownAgent(content);
    case 'json':
      return JSON.parse(content);
    case 'yaml':
      return parseYAMLAgent(content);
    case 'xml':
      return parseXMLAgent(content);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function detectFormat(content: string): AgentFormat {
  if (content.trimStart().startsWith('#')) return 'markdown';
  if (content.trimStart().startsWith('{')) return 'json';
  if (content.trimStart().startsWith('<')) return 'xml';
  if (/^\w+:\s*$/m.test(content)) return 'yaml';
  throw new Error('Could not detect format');
}
```

---

## 🧪 Testing Requirements

### Coverage Expectations
- **Unit tests:** >80% coverage for business logic
- **Integration tests:** All API endpoints
- **E2E tests:** Critical user flows (create agent, execute, share)

### Testing Patterns

```typescript
// Unit test structure (Vitest)
describe('parseAgentMarkdown', () => {
  it('should parse valid markdown agent', () => {
    const markdown = `
# Test Agent

## Description
A test agent

## Model
gpt-4
    `;
    
    const result = parseAgentMarkdown(markdown);
    
    expect(result.name).toBe('Test Agent');
    expect(result.description).toBe('A test agent');
    expect(result.model).toBe('gpt-4');
  });
  
  it('should throw on invalid markdown', () => {
    const invalid = 'Not valid';
    expect(() => parseAgentMarkdown(invalid)).toThrow();
  });
});

// E2E test (Playwright)
test('should create and execute agent', async ({ page }) => {
  await page.goto('/');
  
  // Create agent
  await page.click('[data-testid="add-agent"]');
  await page.fill('[data-testid="agent-name"]', 'Test Agent');
  await page.fill('[data-testid="agent-description"]', 'Test description');
  await page.click('[data-testid="save-agent"]');
  
  // Execute agent
  await page.click('[data-testid="execute-agent"]');
  await page.fill('[data-testid="input"]', 'Test input');
  await page.click('[data-testid="run"]');
  
  // Verify result
  await expect(page.locator('[data-testid="output"]')).toBeVisible();
});
```

```python
# Python test (pytest)
@pytest.mark.asyncio
async def test_create_agent(client: AsyncClient, db: AsyncSession):
    """Test agent creation endpoint."""
    
    # Arrange
    agent_data = {
        "name": "Test Agent",
        "description": "Test description",
        "model": "gpt-4"
    }
    
    # Act
    response = await client.post("/api/agents", json=agent_data)
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == agent_data["name"]
    assert "id" in data
    
    # Verify in database
    agent = await db.get(Agent, data["id"])
    assert agent is not None
    assert agent.name == agent_data["name"]
```

---

## 🔒 Security Practices

### Input Validation

```typescript
// Always validate with Zod schemas
import { z } from 'zod';

const ExecuteAgentSchema = z.object({
  agentId: z.string().uuid(),
  input: z.string().min(1).max(10000),
  context: z.record(z.any()).optional()
});

export async function executeAgent(req: Request) {
  // Validate and parse
  const validated = ExecuteAgentSchema.parse(await req.json());
  
  // Use validated data
  return await execute(validated);
}
```

```python
# Pydantic validation in FastAPI
from pydantic import BaseModel, validator

class AgentExecute(BaseModel):
    agent_id: str
    input: str
    context: Optional[Dict[str, Any]] = None
    
    @validator('input')
    def input_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Input cannot be empty')
        return v
```

### Secret Management

```typescript
// ❌ Never hardcode secrets
const apiKey = 'sk-1234567890abcdef';

// ✅ Use environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required');
}
```

### Authentication & Authorization

```typescript
// Middleware for protected routes
export async function requireAuth(req: NextRequest) {
  const session = await getSession(req);
  
  if (!session) {
    return NextResponse.redirect('/login');
  }
  
  return NextResponse.next();
}

// Permission checking
export async function canExecuteAgent(userId: string, agentId: string) {
  const agent = await getAgent(agentId);
  
  // Public agents: anyone can execute
  if (agent.visibility === 'public') return true;
  
  // Private agents: only owner
  if (agent.visibility === 'private') {
    return agent.userId === userId;
  }
  
  // Shared agents: check permissions
  return await hasPermission(userId, agentId, 'execute');
}
```

### Docker Sandbox Security

```python
# Secure Docker execution
async def create_sandbox(agent: Agent) -> DockerSandbox:
    """Create isolated Docker container for agent execution."""
    
    container = await docker.containers.create(
        image='agent-runtime:latest',
        network_disabled=agent.internet_access is False,
        mem_limit='512m',           # Memory limit
        cpu_period=100000,          # CPU throttling
        cpu_quota=50000,            # 50% CPU
        read_only=True,             # Read-only filesystem
        security_opt=['no-new-privileges'],  # Security
        user='nonroot',             # Non-root user
        environment={
            'AGENT_ID': agent.id,
            # No secrets in environment
        }
    )
    
    return DockerSandbox(container)
```

---

## 📦 Dependencies

### When to Add a Dependency

Only add dependencies when:
1. **Complexity justified:** Feature is complex enough to warrant external library
2. **Well-maintained:** Updated within last 6 months, active community
3. **Performance critical:** Significant performance improvement over custom implementation
4. **Security vetted:** No known vulnerabilities, reputable source

### Preferred Libraries

**Frontend:**
- **HTTP:** Native `fetch` API (no axios for simple cases)
- **Forms:** React Hook Form + Zod
- **State:** Zustand (simple) or Jotai (complex)
- **Styling:** TailwindCSS + Headless UI
- **Testing:** Vitest + Testing Library + Playwright
- **Canvas:** React Flow
- **Animation:** Framer Motion

**Backend:**
- **Web:** FastAPI
- **ORM:** SQLAlchemy 2.0 (async)
- **Migration:** Alembic
- **Validation:** Pydantic v2
- **Testing:** pytest + pytest-asyncio
- **HTTP:** httpx (async client)

### Avoid
- jQuery (unnecessary)
- Lodash (use native methods or es-toolkit)
- Moment.js (deprecated, use date-fns or Temporal API)
- Request library (deprecated, use httpx)

---

## 🏛️ Architecture Decisions

### Why Monorepo?
- **Decision:** Use Turbo monorepo with shared packages
- **Rationale:** Code sharing (types, utils), unified tooling, easier refactoring
- **Trade-offs:** More complex build setup, larger git repo

### Why Next.js 15?
- **Decision:** Use Next.js 15 App Router
- **Rationale:** React Server Components, streaming, better performance, route groups
- **Trade-offs:** Learning curve, some libraries not yet compatible

### Why FastAPI + PostgreSQL?
- **Decision:** FastAPI backend with PostgreSQL main database
- **Rationale:** 
  - FastAPI: Type safety, auto OpenAPI docs, async support, Python ecosystem
  - PostgreSQL: ACID compliance, complex queries, JSON support, mature
- **Trade-offs:** More complex than serverless, requires infrastructure

### Why Docker Sandbox?
- **Decision:** Execute user agents in isolated Docker containers
- **Rationale:** Security isolation, resource limits, reproducible environment
- **Trade-offs:** Overhead, cold start time

---

## 🐛 Known Issues & Gotchas

### React Flow Canvas

**Issue:** Canvas positions not persisting correctly
```typescript
// ❌ Don't mutate nodes directly
nodes[0].position = { x: 100, y: 200 };

// ✅ Create new array
setNodes(nodes.map(n => 
  n.id === id ? { ...n, position: newPos } : n
));
```

### FastAPI + SQLAlchemy Async

**Issue:** Session management in async context
```python
# ❌ Don't forget to commit
async def create_agent(agent: AgentCreate, db: AsyncSession):
    new_agent = Agent(**agent.dict())
    db.add(new_agent)
    # Missing: await db.commit()  # Will not persist!
    return new_agent

# ✅ Always commit
async def create_agent(agent: AgentCreate, db: AsyncSession):
    new_agent = Agent(**agent.dict())
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)  # Get ID and defaults
    return new_agent
```

### Streaming with SSE

**Issue:** Buffering causes delays
```typescript
// ✅ Disable buffering in Next.js API routes
export const runtime = 'edge';  // Use Edge runtime

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of generateChunks()) {
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

---

## 🔧 Development Workflow

### Before Starting Work
1. `git pull origin main`
2. `npm install` (check for new dependencies)
3. `npm run db:migrate` (apply database migrations)
4. `docker-compose up -d` (start services)

### Before Committing
1. `npm run lint:fix` (auto-fix linting issues)
2. `npm run format` (format code)
3. `npm test` (run tests)
4. Review changed files for debug code, console.logs

### PR Checklist
- [ ] Tests added/updated for new features
- [ ] Documentation updated (README, API docs, inline comments)
- [ ] No console.log or debug statements
- [ ] TypeScript types are explicit (no `any`)
- [ ] Error handling implemented
- [ ] Performance considered (no N+1 queries, proper caching)
- [ ] Security reviewed (input validation, auth checks)
- [ ] Accessibility considered (ARIA labels, keyboard navigation)

---

## 📐 Monorepo Structure

```
agent-platform/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # Utilities, API client
│   │   │   └── types/       # TypeScript types
│   │   └── package.json
│   │
│   └── api/                 # FastAPI backend
│       ├── app/
│       │   ├── api/         # API routes
│       │   ├── core/        # Config, security
│       │   ├── models/      # Database models
│       │   ├── schemas/     # Pydantic schemas
│       │   ├── services/    # Business logic
│       │   └── main.py
│       └── requirements.txt
│
├── packages/
│   ├── workflow-engine/     # Workflow execution engine
│   ├── extension-system/    # Plugin system
│   └── widget-bridge/       # UI widget framework
│
├── mcp-server/              # MCP server with tools
│   └── src/
│       ├── tools/           # MCP tools
│       │   ├── agent-tools.ts
│       │   ├── task-tools.ts      # ← Timer-integrated tasks
│       │   ├── workflow-tools.ts
│       │   └── model-tools.ts
│       └── index.ts
│
├── docs/                    # Documentation
│   ├── architecture/        # Architecture docs
│   ├── api/                 # API reference
│   ├── guides/              # User guides
│   ├── research/            # Research & analysis
│   ├── sprints/             # Sprint planning/retros
│   ├── style-guides/        # Code style guides
│   └── templates/           # Document templates
│
├── tests/                   # E2E tests
├── docker-compose.yml       # Local dev infrastructure
├── turbo.json              # Turbo configuration
└── package.json            # Root package
```

---

## 🎨 UI/UX Guidelines

### Component Patterns

```typescript
// Use composition over configuration
<Card>
  <Card.Header>
    <Card.Title>Agent Name</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Content */}
  </Card.Content>
  <Card.Footer>
    <Button>Execute</Button>
  </Card.Footer>
</Card>

// Provide sensible defaults
<Button variant="primary" size="md">  {/* Defaults */}
  Click me
</Button>

// Use render props for flexibility
<DataTable
  data={agents}
  renderRow={(agent) => (
    <AgentRow key={agent.id} agent={agent} />
  )}
/>
```

### Accessibility

```typescript
// Always include ARIA labels
<button
  aria-label="Execute agent"
  aria-busy={isLoading}
  disabled={isLoading}
>
  {isLoading ? <Spinner /> : 'Execute'}
</button>

// Semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><Link href="/agents">Agents</Link></li>
  </ul>
</nav>

// Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Interactive element
</div>
```

---

## 🚀 Performance Optimization

### Frontend

```typescript
// Code splitting with dynamic imports
const AgentCanvas = dynamic(() => import('@/components/AgentCanvas'), {
  loading: () => <Skeleton />,
  ssr: false  // Disable SSR for client-only components
});

// Memoize expensive computations
const sortedAgents = useMemo(
  () => agents.sort((a, b) => a.name.localeCompare(b.name)),
  [agents]
);

// Debounce search inputs
const debouncedSearch = useDeferredValue(searchTerm);

// Virtualize long lists
import { VirtualList } from '@/components/VirtualList';

<VirtualList
  items={agents}
  height={600}
  itemHeight={80}
  renderItem={(agent) => <AgentCard agent={agent} />}
/>
```

### Backend

```python
# Use async operations
async def get_agents(db: AsyncSession, user_id: str) -> List[Agent]:
    result = await db.execute(
        select(Agent)
        .where(Agent.user_id == user_id)
        .options(selectinload(Agent.executions))  # Eager load
    )
    return result.scalars().all()

# Cache expensive queries
from functools import lru_cache

@lru_cache(maxsize=128)
async def get_popular_agents(limit: int = 10) -> List[Agent]:
    # Expensive query
    pass

# Use database indexes
class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, index=True)  # Indexed for fast lookups
    visibility = Column(String, index=True)  # Indexed
```

---

## 📚 Additional Resources

- **Project Wiki:** [Internal documentation]
- **API Docs:** http://localhost:8000/docs (when running)
- **Turbo Docs:** https://turbo.build/repo/docs
- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Flow:** https://reactflow.dev
- **MCP Protocol:** https://modelcontextprotocol.io

---

## 🤝 Getting Help

- **Questions:** Ask in team Slack #agent-platform
- **Bugs:** Create GitHub issue with reproduction steps
- **Features:** Discuss in #feature-requests before implementing
- **Code Review:** Tag @platform-team for review

---

**Remember:** Write code that your future self (and teammates) will thank you for! 🙌
