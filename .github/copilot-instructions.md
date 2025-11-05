---
applyTo: "**"
description: Canonical engineering, coding, testing, and operational standards for the AI Agent Marketplace ecosystem. Shared across all agents and human contributors.
---
# GitHub Copilot Instructions - SOTA Agent Tools Platform

## Project Overview

**SOTA Agent Tools** is a comprehensive AI agent development platform providing:
- Auto-dataset generation
- Memory evaluation (RAPTOR-style)
- Prompt optimization (EvoPrompt)
- Out-of-distribution testing
- Island evolution algorithms  
- Artifact debugging

**Current Sprint:** Revenue-first MVP - implementing Stripe billing and self-service signup

## Active Development Context

### Current Phase: Revenue Sprint (Day 2 of 7)
**Status:** Backend 100% complete (2,680 lines), Frontend 20% complete (320 lines)  
**Objective:** Complete frontend dashboard + landing page + deploy = production ready  
**Timeline:** 8-10 hours remaining to first dollar

### Recent Major Changes
- ✅ Complete Stripe integration (subscription management, webhooks, rate limiting)
- ✅ Database schema with 6 models (User, Subscription, APIKey, APIUsage, WebhookEvent, UsageAggregate)
- ✅ 15+ FastAPI endpoints for billing operations
- ⏳ Building React frontend dashboard components

## Code Standards

### TypeScript/React
- **Strict typing:** No `any` types, explicit interfaces for all props
- **Components:** Functional with hooks, use Shadcn/ui component library
- **State:** React Query for server state, Zustand for client state  
- **Naming:** PascalCase components, camelCase functions/variables
- **Error handling:** Error boundaries + toast notifications
- **Loading states:** Always show loading UI for async operations

### Python/FastAPI
- **Type hints:** Required on all function signatures
- **Docstrings:** Google-style for public functions/classes
- **Async:** Use async/await for I/O operations (DB, Stripe API)
- **Validation:** Pydantic models for request/response
- **Logging:** Use logger module (never print statements)
- **Error handling:** Specific exceptions, proper HTTP status codes

### Database (PostgreSQL + SQLAlchemy)
- **Naming:** snake_case for tables/columns
- **Primary keys:** UUID4 (not auto-increment integers)
- **Timestamps:** created_at, updated_at on all models
- **Indexes:** Add for foreign keys + common query patterns
- **Migrations:** Alembic for all schema changes

### Security
- **Secrets:** Environment variables only, never hardcode
- **API keys:** SHA-256 hashing, never store plaintext
- **Rate limiting:** Enforce on all public endpoints
- **Input validation:** Validate all user inputs
- **HTTPS:** Required in production

## Architecture Patterns

### Backend Structure
\`\`\`
app/
├── billing/          # Stripe integration, subscription management
│   ├── models.py     # SQLAlchemy models
│   ├── stripe_client.py
│   ├── subscription.py
│   └── webhooks.py
├── auth/             # Authentication & rate limiting  
│   ├── api_key_auth.py
│   └── rate_limiting.py
└── routers/          # FastAPI route handlers
    └── billing.py
\`\`\`

### Frontend Structure
\`\`\`
src/
├── components/
│   └── billing/      # Billing dashboard components
│       ├── BillingDashboard.tsx
│       ├── SubscriptionManager.tsx
│       ├── UsageChart.tsx
│       ├── APIKeyDisplay.tsx
│       └── InvoiceList.tsx
├── lib/
│   └── api.ts        # Axios client with auth
└── app/              # Next.js pages
\`\`\`

### API Design
- **Versioning:** `/api/v1/` prefix
- **REST conventions:** GET/POST/PUT/DELETE with proper status codes
- **Response format:** `{success: boolean, data?: any, error?: string}`
- **Auth:** Bearer token (API key) in Authorization header
- **Rate limiting:** Per-minute + monthly quota by tier

## Current Sprint Tasks

### Priority 1: Frontend Dashboard (Today)
1. **SubscriptionManager.tsx** - Upgrade/downgrade UI with proration preview
2. **UsageChart.tsx** - Recharts visualization with feature breakdown
3. **APIKeyDisplay.tsx** - Secure key display with copy/regenerate
4. **InvoiceList.tsx** - Table of invoices with PDF download

### Priority 2: Landing Page (Today)
1. **Hero section** - Value prop + CTA to Stripe Checkout
2. **Features showcase** - 6 cards for each system
3. **Pricing section** - Free/Pro/Team/Enterprise comparison
4. **Sign-up flow** - Email → Stripe Checkout → API key delivery

### Priority 3: Deployment (Today)
1. Deploy FastAPI backend (Railway/Render)
2. Deploy Next.js frontend (Vercel)
3. Configure Stripe webhooks
4. End-to-end test payment flow

## Stripe Integration Details

### Pricing Tiers
- **Free:** 100 calls/mo, all features, community support
- **Pro:** $99/mo (price_1SOSNh2cbZUZPiYvrubKfCn7), 10K calls, email support
- **Team:** $499/mo (price_1SOSNi2cbZUZPiYv9IODQqID), 100K calls, priority support
- **Enterprise:** $5K/mo (price_1SOSNi2cbZUZPiYvCBoXjoqx), unlimited, on-premise

### Rate Limits
- Free: 10 req/min, Pro: 100 req/min, Team: 500 req/min, Enterprise: unlimited

### Key Files
- `.env.stripe` - API keys and price IDs
- `billing/stripe_client.py` - Complete Stripe API wrapper
- `billing/webhooks.py` - Handles subscription lifecycle events

## Context for Suggestions

### When suggesting billing code:
- Use existing SubscriptionManager and stripe_client utilities
- Follow error handling patterns established in billing.py
- Integrate with usage tracking (UsageTracker class)

### When suggesting frontend code:
- Use Shadcn/ui components (Card, Button, Badge, Alert)
- Follow BillingDashboard.tsx component patterns
- Use React Query for API calls
- Add loading skeletons and error states

### When suggesting API endpoints:
- Follow routing patterns in routers/billing.py
- Use FastAPI Depends() for auth and DB session
- Return consistent response format
- Add proper OpenAPI documentation

## Common Patterns

### API Call Pattern (Frontend)
\`\`\`typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['subscription'],
  queryFn: () => api.get('/billing/subscriptions/current')
});
\`\`\`

### Database Query Pattern (Backend)  
\`\`\`python
async def get_subscription(user_id: str, db: Session):
    return db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status.in_(['active', 'trialing'])
    ).first()
\`\`\`

### Stripe Operation Pattern
\`\`\`python
stripe_sub = await stripe_client.create_subscription(
    customer_id=user.stripe_customer_id,
    price_id=price_id,
    trial_days=14
)
\`\`\`

## Testing Approach

### Manual Testing Priority
1. Sign-up flow with test card (4242 4242 4242 4242)
2. Webhook delivery (use Stripe CLI: `stripe listen`)
3. Rate limiting (make >10 requests in 1 minute)
4. Usage tracking (verify DB records created)

### Test Data
- Test email: any email works in test mode
- Test card: 4242 4242 4242 4242 (success)
- Test card: 4000 0000 0000 0002 (decline)

## Key Documentation
- `BACKEND_COMPLETE_REPORT.md` - Full backend implementation details
- `SPRINT_EXECUTIVE_SUMMARY.md` - Current status and next steps
- `STRIPE_SETUP_GUIDE.md` - Stripe configuration guide
- `7_DAY_SPRINT_PLAN.md` - Original sprint roadmap

## Success Criteria

**Definition of Done for Sprint:**
- [ ] All dashboard components functional
- [ ] Landing page deployed
- [ ] Stripe Checkout working end-to-end  
- [ ] First test payment processed successfully
- [ ] API key auto-generated and delivered
- [ ] Mobile-responsive UI
- [ ] <2s page load, <500ms API response

---

**When in doubt:** Follow patterns in existing code, prioritize simplicity, and maintain production-grade quality standards established in backend implementation.
---
## Global Workspace Engineering Instructions (AI Agent Marketplace)

This document is a static reference for any automation, AI assistant, or developer operating in the AI Agent Marketplace ecosystem. It complements dynamic execution prompts and serves as the canonical source for standards, quality gates, and operational primitives.

---
### 1. Repository & Directory Topography

| Area | Purpose | Key Notes |
|------|---------|-----------|
| `src/` | Core Python backend (marketplace, evolution, execution) | Source code for agent registry, task execution, marketplace logic |
| `marketplace-ui/` | Next.js 16 frontend with shadcn/ui + Framer Motion | Production-ready UI with TypeScript, multi-agent chat, visualization |
| `landing-page/` | Marketing landing page | Separate Next.js app for public-facing site |
| `collections/` | Agent collection definitions (YAML) | Organized by domain: coding, research, analysis, specialized |
| `evaluators/` | Evaluation strategy implementations | Quality scoring, performance measurement |
| `mutators/` | Agent mutation strategies | Prompt evolution, instruction refinement |
| `optimization/` | Evolution & optimization engines | Genetic algorithms, hill climbing, hybrid strategies |
| `scripts/` | Automation & utility scripts | Build helpers, data seeding, deployment automation |
| `tests/` | Test suite (unit + integration) | Python pytest-based testing infrastructure |
| `docs/` | Documentation & architecture decisions | ADRs, guides, API references |
| `.specify/` | SpecKit workflow templates & memory | Planning, specification, task management |
| `.github/` | CI/CD workflows & shared instructions | This file lives here |

Conventions:
- Production Python lives under `src/` semantic root (e.g., `src/marketplace.py`, `src/evolution/`).
- Frontend code follows Next.js App Router conventions (`marketplace-ui/app/`, `marketplace-ui/components/`).
- Agent collections are YAML files in `collections/<domain>/<subsection>/<agent-name>.yaml`.
- All tests import from `src/` using proper Python module resolution.
- No hard-coded paths—use environment variables or config files.

---
### 2. Architecture Overview

**System Components:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Multi-Agent  │  │ Conversation │  │ Optimization │      │
│  │    Chat      │  │     Tree     │  │    Panel     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (FastAPI/Python)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Marketplace│  │    Task      │  │   Evolution  │      │
│  │   Registry   │  │   Executor   │  │    Engine    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Agent Collection (YAML + Code)                  │
│  Collections → Subsections → Individual Agents              │
└─────────────────────────────────────────────────────────────┘
```

**Core Flows:**
1. **Task Submission**: User submits → System selects agents → Agents compete → Winner selected → Payment processed
2. **Agent Evolution**: Background process → Mutate agents → Evaluate performance → Select survivors → Update registry
3. **Multi-Agent Chat**: User message → Broadcast to active agents → Collect responses → Visualize tree → Track branches

---
### 3. Branching & Change Management

| Workflow Element | Guideline |
|------------------|-----------|
| Base branch | `main` (fast-forward preferred) |
| Feature branches | `feat/<component>-<short-description>` (e.g., `feat/ui-chat-interface`) |
| Fix branches | `fix/<issue>-<descriptor>` (e.g., `fix/hydration-mismatch`) |
| Refactor | `refactor/<scope>` (e.g., `refactor/optimization-engine`) |
| UI/UX updates | `ui/<feature>` (e.g., `ui/conversation-tree`) |
| Release tagging | Semantic versioning (e.g., `v0.3.0`, `v1.0.0-beta`) |
| Merge strategy | Squash for features; rebase for clarity; avoid noisy merges |

Pre-merge Checklist (Definition of Done):
1. ✅ All tests pass (unit + integration relevant to scope)
2. ✅ No linter violations (Python: `ruff`, TypeScript: `eslint`)
3. ✅ Updated documentation if behavior/API changed
4. ✅ Added/adjusted tests (≥ 1 positive, ≥ 1 edge case)
5. ✅ No hard-coded secrets/credentials/API keys
6. ✅ UI changes validated in dev server (visual + functional)
7. ✅ No hydration mismatches or console errors (Next.js)
8. ✅ Accessibility considerations addressed (ARIA, keyboard nav)

---
### 4. Build & Execution Quick Reference

**Backend (Python):**
```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run marketplace demo
python src/complete_marketplace.py

# Run tests
pytest tests -v

# Lint
ruff check src/
```

**Frontend (Next.js):**
```bash
cd marketplace-ui

# Install dependencies
npm install

# Development server
npm run dev
# Opens http://localhost:3000

# Build for production
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

**Full Stack Development:**
```bash
# Terminal 1: Backend
python src/api_server.py  # (when implemented)

# Terminal 2: Frontend
cd marketplace-ui && npm run dev

# Terminal 3: Evolution engine (background)
python src/continuous_evolution.py  # (when implemented)
```

**VS Code Tasks:**
Use the compound task "🚀 Full Stack: Build & Start" from `.vscode/tasks.json` (to be created).

---
### 5. Testing Strategy

| Layer | Location | Command | Notes |
|-------|----------|---------|-------|
| Backend Unit | `tests/` | `pytest tests/test_*.py -v` | Fast feedback on logic |
| Integration | `tests/` | `pytest tests/test_integration_*.py -v` | End-to-end flows |
| Frontend Unit | `marketplace-ui/` | `npm test` | React component testing (when configured) |
| E2E | `marketplace-ui/` | `npm run test:e2e` | Playwright/Cypress (planned) |
| Type Safety | `marketplace-ui/` | `npx tsc --noEmit` | Catch TypeScript errors |
| Linting | Both | `ruff check .` + `npm run lint` | Style enforcement |

**Quality Gates (PR Blocking):**
- Test pass rate ≥ 95% for touched domains
- No new TypeScript errors
- No hydration mismatches or React errors
- No accessibility regressions (basic ARIA compliance)
- Coverage non-regression (Python ≥ 70%, TypeScript ≥ 60% aspirational)

**Test Categories:**
- **Unit**: Individual functions, classes, components
- **Integration**: Multiple modules working together
- **Regression**: Prevent previously fixed bugs
- **Performance**: Ensure optimization targets met (track in benchmarks)

---
### 6. Memory & Knowledge Taxonomy (For Agents / Tooling)

| Memory Type | Scope | Contents | Retention Guidance |
|-------------|-------|----------|--------------------|
| Project Standards | Global | This file, naming conventions, quality gates | Persistent, version on change |
| Task Context | Per Session/PR | User goal, constraints, acceptance criteria | Session-scoped, discard after completion |
| Architectural Decisions | Global | ADRs in `docs/adr/`, design rationales | Append-only ledger |
| Agent Evolution History | Backend | Performance metrics, mutation outcomes | Aggregate summaries, detailed logs expire |
| UI/UX Patterns | Frontend | Component library, animation standards | Reference for consistency |
| API Contracts | Backend/Frontend | REST endpoints, WebSocket messages | Must stay synchronized |

**Memory Storage Locations:**
- `.specify/memory/constitution.md` - Core principles & constraints
- `docs/adr/` - Architecture Decision Records
- `CHANGELOG.md` - User-facing change log
- Session memory (ephemeral) - Current task context

**Rules:**
- Never overwrite canonical memory without versioning (e.g., append `_v2`)
- Summarize large logs before storing (max 10KB per memory entry)
- Reference memory keys explicitly (`MEM:UI_PATTERNS/ANIMATION_STANDARDS`)
- Delete obsolete memory entries older than 6 months (unless ADR)

---
### 7. Coding & Style Standards

**Python:**
- Type hints everywhere: `from __future__ import annotations` preferred
- Linter: `ruff` (configured in `pyproject.toml`)
- Docstrings: Google style for public APIs
- Fail fast: Raise specific exceptions (e.g., `AgentNotFoundError`)
- Async where beneficial: Use `asyncio` for I/O-bound operations
- Error handling: Never silent `except: pass` without justification

```python
# Good
async def execute_task(task_id: str) -> TaskResult:
    """Execute a task and return the result.
    
    Args:
        task_id: Unique task identifier
        
    Returns:
        TaskResult with execution details
        
    Raises:
        TaskNotFoundError: If task_id doesn't exist
        ExecutionError: If execution fails
    """
    ...

# Bad
def execute_task(task_id):  # Missing types
    try:
        ...
    except:  # Too broad
        pass  # Silent failure
```

**TypeScript/React:**
- Strict mode enabled in `tsconfig.json`
- Functional components with hooks (no class components)
- Props interfaces for all components
- Exhaustive dependency arrays in hooks
- Error boundaries for component errors

```typescript
// Good
interface AgentCardProps {
  agent: Agent;
  onSelect: (id: string) => void;
}

export function AgentCard({ agent, onSelect }: AgentCardProps) {
  const handleClick = useCallback(() => {
    onSelect(agent.id);
  }, [agent.id, onSelect]);
  
  return <div onClick={handleClick}>{agent.name}</div>;
}

// Bad
export function AgentCard(props: any) {  // No type safety
  return <div onClick={() => props.onSelect(props.agent.id)}>
    {props.agent.name}
  </div>;
}
```

**General:**
- DRY: Extract at 3+ call sites (not before)
- YAGNI: Don't build features for hypothetical future needs
- Logging: Use structured logging (`logging` module, not `print()`)
- Comments: Explain WHY, not WHAT (code should be self-documenting)

---
### 8. Frontend Architecture (marketplace-ui/)

**Technology Stack:**
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4 + CSS variables
- **Components**: shadcn/ui (copy-paste, fully customizable)
- **Animations**: Framer Motion 11 (layout, gestures, spring physics)
- **Data Fetching**: SWR (stale-while-revalidate)
- **State**: Zustand (lightweight, no boilerplate)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts (data visualization)

**Directory Structure:**
```
marketplace-ui/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page (/)
│   ├── layout.tsx         # Root layout with Navigation
│   ├── globals.css        # Global styles + CSS variables
│   ├── agents/            # Browse agents page
│   ├── chat/              # Multi-agent chat interface ⭐
│   │   ├── page.tsx       # Main chat page
│   │   └── demo/          # Component showcase
│   ├── tasks/             # Task submission & results
│   ├── leaderboard/       # Agent rankings
│   └── creator/           # Creator dashboard
├── components/
│   ├── chat/              # Chat-specific components
│   │   ├── ConversationTree.tsx    # Branching visualization
│   │   └── OptimizationPanel.tsx   # Live performance tracking
│   ├── layout/            # Global layout components
│   │   ├── Navigation.tsx # Header navigation
│   │   └── Footer.tsx     # Site footer
│   └── ui/                # shadcn/ui components
│       └── scroll-area.tsx
├── lib/
│   ├── api.ts             # API client (fetch wrappers)
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions (cn, formatters)
├── public/                # Static assets
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json
```

**Key Pages:**
- `/` - Landing page with hero, features, CTAs
- `/agents` - Browse & filter agent marketplace
- `/chat` - **Multi-agent chat with tree visualization** ⭐
- `/chat/demo` - **Component showcase** ⭐
- `/tasks/new` - Submit new task
- `/tasks/[id]` - View task results
- `/leaderboard` - Top performers
- `/creator` - Creator dashboard & analytics

**Animation Patterns:**
- **Layout**: FLIP animations for smooth resizing/repositioning
- **Stagger**: Sequential message appearances (delay: `index * 0.1s`)
- **Spring**: Natural bounce for interactions (`type: "spring", bounce: 0.2`)
- **Gestures**: Hover scale (`whileHover={{ scale: 1.02 }}`), tap feedback
- **Shared Layouts**: `layoutId` for seamless transitions between states

**Design System:**
```css
/* CSS Variables (globals.css) */
--primary: 221.2 83.2% 53.3%      /* Blue */
--success: 142.1 76.2% 36.3%      /* Green */
--warning: 38 92% 50%             /* Amber */
--destructive: 0 84.2% 60.2%      /* Red */
--radius: 0.5rem                  /* Border radius */
```

---
### 9. Backend Architecture (src/)

**Core Modules:**

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `marketplace.py` | Agent registry, task matching, payments | Core marketplace logic |
| `task_execution_engine.py` | Task execution, agent competition | Runs tasks, selects winners |
| `evolution/` | Agent evolution & optimization | Genetic algorithms, mutations |
| `evaluators/` | Performance measurement | Scoring, quality assessment |
| `mutators/` | Agent improvement strategies | Prompt mutations, refinements |
| `models/` | Data models (Agent, Task, Result) | Pydantic/dataclass definitions |
| `api/` (planned) | FastAPI REST + WebSocket server | API endpoints for frontend |

**Agent Collection Structure:**
```
collections/
├── coding/
│   ├── general/
│   │   └── code-expert.yaml
│   └── specialized/
│       └── rust-specialist.yaml
├── research/
│   └── academic/
│       └── academic-scholar.yaml
└── analysis/
    └── data/
        └── data-analyst.yaml
```

**Agent YAML Format:**
```yaml
name: "Code Expert"
category: "coding"
description: "Expert in software development and algorithms"
instructions: |
  You are an expert software developer...
tags:
  - coding
  - algorithms
  - debugging
difficulty: "intermediate"
base_score: 0.75
price_per_execution: 0.10
```

**Evolution Pipeline:**
```
1. Select Agent Pool → 2. Generate Mutations → 3. Evaluate Performance
     ↓                        ↓                         ↓
4. Score Results ← 5. Select Survivors ← 6. Update Registry
```

---
### 10. Task Completion & Scope Standards

**Mandatory Completion Policy:**
- ✅ **NEVER deliver partial implementations** unless user explicitly requests staged delivery
- ✅ Do NOT self-impose artificial constraints based on perceived complexity/length
- ✅ Do NOT use placeholder comments (`// TODO`, `# Rest here`) as substitutes for logic
- ✅ If truly blocked, **explicitly state blocker** and request clarification

**Allowed Exceptions:**
- User explicitly: "Implement only the schema" or "Show first iteration"
- User constraints: "Stop after this component" or "Just the API layer"
- External blocker: "Need API key from user before auth logic"

**Violation Examples (PROHIBITED):**
- ❌ Implementing 3 of 5 methods with placeholders without instruction
- ❌ Stopping mid-refactor because "this might be getting long"
- ❌ Omitting error handling/tests because "you can add those later"

**Quality Standards:**
- All public functions have docstrings
- All components have prop type definitions
- Error cases handled explicitly
- Tests cover happy path + edge cases
- No console.log() in production code (use proper logging)

---
### 11. UI/UX Hydration & SSR Standards

**Hydration Mismatch Prevention:**
- ❌ **NEVER** use `Date.now()`, `Math.random()`, or browser-only APIs in initial render
- ✅ Use fixed timestamps for demo data: `new Date("2025-10-28T17:00:00")`
- ✅ Use `useEffect` for client-only logic (localStorage, window APIs)
- ✅ Use `"use client"` directive when needed for interactivity

**Common Violations:**
```typescript
// BAD - Hydration mismatch
const timestamp = new Date(Date.now() - 300000);  // Different each render

// GOOD - Fixed timestamp
const timestamp = new Date("2025-10-28T17:00:00");

// BAD - Browser API in SSR
const theme = localStorage.getItem("theme");

// GOOD - Client-only effect
const [theme, setTheme] = useState<string | null>(null);
useEffect(() => {
  setTheme(localStorage.getItem("theme"));
}, []);
```

**SSR Checklist:**
- All data fetching uses Next.js patterns (Server Components, `fetch` caching)
- No direct DOM manipulation outside `useEffect`
- Animations don't break SSR (Framer Motion is SSR-safe)
- Loading states prevent hydration mismatches

---
### 12. Security & Compliance

| Concern | Practice |
|---------|----------|
| Secrets | Never commit; use `.env.local` + Vercel env vars |
| API Keys | Store in environment variables, rotate regularly |
| Input Validation | Validate all user inputs (Zod schemas) |
| SQL Injection | Use parameterized queries (when DB added) |
| XSS Prevention | React auto-escapes, but sanitize HTML if used |
| CORS | Configure properly for API (allowed origins only) |
| Rate Limiting | Implement on API endpoints (planned) |
| Authentication | JWT tokens, secure cookies (planned) |
| Data Privacy | GDPR compliance for EU users (planned) |

**Secrets Management:**
```bash
# .env.local (NEVER commit)
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...

# Access in code
import os
api_key = os.getenv("OPENAI_API_KEY")
```

---
### 13. Performance & Optimization Guidelines

**Frontend Performance:**
- Code splitting: Dynamic imports for large components
- Image optimization: Use Next.js `<Image>` component
- Bundle size: Monitor with `npm run build` output
- Lazy loading: Use React.lazy() for below-fold content
- Memoization: `useMemo`, `useCallback` for expensive operations

**Backend Performance:**
- Async I/O: Use `asyncio` for concurrent operations
- Caching: Redis for frequently accessed data (planned)
- Database: Indexes on frequently queried fields
- Batch processing: Group similar operations
- Profiling: Use `cProfile` for Python hotspots

**Optimization Heuristics:**
1. **Measure first**: Profile before optimizing
2. **Data locality**: Reduce network round-trips
3. **Eliminate bottlenecks**: Find synchronous choke points
4. **Cache strategically**: Only with proven repetition
5. **Hardware acceleration**: Use CSS transforms, GPU-friendly animations

**Performance Targets:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: ≥ 90
- Animation Frame Rate: 60fps
- API Response Time: < 200ms (p95)

---
### 14. Documentation Standards

**Code Documentation:**
- Python: Google-style docstrings for public APIs
- TypeScript: JSDoc comments for complex logic
- Components: Prop descriptions in interface comments

**Project Documentation:**
```
docs/
├── adr/                    # Architecture Decision Records
│   └── 001-use-framer-motion.md
├── api/                    # API reference (when implemented)
├── guides/                 # How-to guides
│   ├── creating-agents.md
│   └── submitting-tasks.md
└── architecture.md         # System architecture overview
```

**README Standards:**
- Clear purpose statement (first paragraph)
- Quick start (< 5 commands to run)
- Key features (bulleted list)
- Tech stack (table format)
- Contributing guidelines link

**ADR Template:**
```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
[What is the issue we're seeing that is motivating this decision?]

## Decision
[What is the change that we're proposing/doing?]

## Consequences
[What becomes easier or more difficult?]
```

---
### 15. Git Commit & PR Standards

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body (optional)>

<footer (optional)>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation only
- `style`: Formatting, no logic change
- `test`: Adding/updating tests
- `chore`: Build/tooling changes
- `ui`: UI/UX improvements

**Examples:**
```
feat(chat): add conversation tree visualization

Implemented interactive tree component with:
- Expandable/collapsible branches
- Animated connection lines
- User/Agent visual distinction

Closes #42

---

fix(ui): resolve hydration mismatch in demo page

Changed from Date.now() to fixed timestamps to prevent
server/client render differences.

Fixes #58
```

**PR Template:**
```markdown
## Description
[What does this PR do?]

## Motivation
[Why is this change needed?]

## Testing
[How was this tested?]

## Screenshots (if UI change)
[Before/after images]

## Checklist
- [ ] Tests pass
- [ ] Lint clean
- [ ] Docs updated
- [ ] No console errors
```

---
### 16. Deployment & Operations (Planned)

**Deployment Targets:**
- **Frontend**: Vercel (automatic deployments from `main`)
- **Backend**: Railway / Render (containerized Python)
- **Database**: PostgreSQL (Supabase / Neon)
- **File Storage**: S3-compatible (Cloudflare R2)
- **CDN**: Vercel Edge Network

**Environment Strategy:**
```
development  → Local dev servers
staging      → Preview deployments (Vercel preview)
production   → Main branch auto-deploy
```

**CI/CD Pipeline:**
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    - Install dependencies
    - Run linter
    - Run tests
    - Build frontend
    - Report coverage
  deploy:
    if: branch == 'main'
    - Deploy to Vercel
    - Deploy backend to Railway
```

---
### 17. SpecKit Integration (.specify/)

**Workflow Templates:**
- `plan-template.md` - Feature planning breakdown
- `spec-template.md` - Detailed specifications
- `tasks-template.md` - Task decomposition
- `checklist-template.md` - Quality checklists
- `agent-file-template.md` - Agent collection format

**Memory Storage:**
- `.specify/memory/constitution.md` - Core principles
- Session memory for active tasks (ephemeral)

**Scripts:**
- `create-new-feature.ps1` - Scaffold new feature from template
- `setup-plan.ps1` - Initialize planning session
- `update-agent-context.ps1` - Refresh agent knowledge

**Usage:**
```powershell
# Start new feature
.\.specify\scripts\powershell\create-new-feature.ps1 -FeatureName "payment-integration"

# This creates:
# - Plan document from template
# - Task breakdown
# - Checklist for completion
```

---
### 18. Current Tasks & Roadmap

**Active Development (In Progress):**
- [x] Multi-agent chat interface with tree visualization
- [x] Live optimization panel with real-time tracking
- [x] Framer Motion animations throughout UI
- [x] shadcn/ui component integration
- [x] Fix hydration mismatches

**Next Priorities (Backlog):**
1. **Payment Integration** (Stripe)
   - Subscription model for creators
   - One-time task payments
   - Usage-based billing
   - Payment UI components

2. **Backend API Implementation**
   - FastAPI server with WebSocket support
   - REST endpoints for CRUD operations
   - Real-time updates for chat/optimization
   - Authentication & authorization

3. **Agent Evolution Automation**
   - Background evolution process
   - Scheduled optimization runs
   - Performance tracking dashboard
   - Mutation strategy A/B testing

4. **Database Integration**
   - PostgreSQL setup
   - Agent registry persistence
   - Task history & results
   - User accounts & sessions

5. **Production Deployment**
   - Vercel deployment for frontend
   - Railway/Render for backend
   - CI/CD pipeline setup
   - Monitoring & alerting

**Future Enhancements:**
- Voice input for chat
- Export conversations (PDF/Markdown)
- Advanced agent filtering
- Conversation templates
- Mobile app (React Native)
- Agent collaboration features
- Cost prediction dashboard
- Quality scoring system

---
### 19. Quick Reference Commands

```bash
# Backend Development
python src/complete_marketplace.py      # Run marketplace demo
python src/seed_agents.py              # Seed agent collections
pytest tests -v                        # Run all tests
ruff check src/                        # Lint Python

# Frontend Development
cd marketplace-ui && npm run dev       # Start dev server
npm run build                          # Production build
npm run lint                           # Lint TypeScript
npx tsc --noEmit                      # Type check

# Visit Pages
http://localhost:3000                  # Landing
http://localhost:3000/chat            # Multi-agent chat ⭐
http://localhost:3000/chat/demo       # Component showcase ⭐
http://localhost:3000/agents          # Browse agents
http://localhost:3000/leaderboard     # Rankings

# SpecKit Workflow
.\.specify\scripts\powershell\create-new-feature.ps1 -FeatureName "feature-name"
```

---
### 20. Breaking Changes & Version Policy

**What Constitutes Breaking:**
- Public Python API signature changes
- Frontend component prop interface changes
- YAML schema changes for agent collections
- Database migration requiring manual intervention
- API endpoint URL/method changes

**Version Bumping:**
- **Patch** (0.0.x): Bug fixes, no API change
- **Minor** (0.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes, migration required

**Deprecation Process:**
1. Add deprecation warning (log or console)
2. Update docs with migration guide
3. Keep deprecated code for 1 minor version
4. Remove in next major version

---
### 21. Contact & Support

**Project Lead**: [Your Name]
**Repository**: https://github.com/[org]/ai-agent-marketplace
**Documentation**: docs/
**Issues**: GitHub Issues
**Discussions**: GitHub Discussions

---

**Last Updated**: October 28, 2025
**Version**: 1.0.0
**Next Review**: Quarterly or on major architecture change
