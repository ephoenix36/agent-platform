# Contributing to AI Agent Platform

Thank you for your interest in contributing to the AI Agent Platform! This document provides guidelines and instructions for contributing to the project.

## 🎯 Development Setup

### Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** 10.0.0 or higher
- **Python** 3.12 or higher
- **Docker** and Docker Compose
- **Git**

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/agent-platform.git
cd agent-platform

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/agent-platform.git
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies (root + all packages)
npm install

# Install Python dependencies
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies
cd ../..
```

### 3. Set Up Local Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your local configuration
# Add your API keys (OpenAI, Anthropic, etc.)

# Start Docker services
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed database with sample data (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
# Start all services with Turbo
npm run dev

# Or start individual services:
npm run dev:web    # Frontend only (Next.js)
npm run dev:api    # Backend only (FastAPI)
```

### 5. Verify Setup

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432
- **MongoDB:** localhost:27017
- **Redis:** localhost:6379

---

## 📋 Code Standards

### TypeScript/JavaScript

#### Style Guide
- Use **ESLint** and **Prettier** (configs provided)
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use **functional components** with hooks (no class components)
- Prefer **named exports** over default exports
- Use **TypeScript strict mode** (no `any` types)

#### File Naming
- Components: `PascalCase.tsx` (e.g., `AgentCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `parse-agent.ts`)
- Hooks: `use-camel-case.ts` (e.g., `use-agent.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

#### Example

```typescript
// ✅ Good
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import type { Agent } from '@/types/agent';

interface AgentCardProps {
  agent: Agent;
  onExecute?: (id: string) => void;
}

export function AgentCard({ agent, onExecute }: AgentCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  
  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    try {
      await onExecute?.(agent.id);
    } finally {
      setIsExecuting(false);
    }
  }, [agent.id, onExecute]);
  
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{agent.name}</h3>
      <p className="text-sm text-gray-600">{agent.description}</p>
      <Button onClick={handleExecute} disabled={isExecuting}>
        {isExecuting ? 'Executing...' : 'Execute'}
      </Button>
    </div>
  );
}

// ❌ Bad
export default function AgentCard(props: any) {  // No default export, no `any`
  const [isExecuting, setIsExecuting] = useState(false);
  // ... implementation
}
```

### Python (FastAPI)

#### Style Guide
- Follow **PEP 8**
- Use **Black** formatter (line length: 100)
- Use **type hints** for all function parameters and return values
- Use **async/await** for database operations
- Use **Pydantic** for data validation

#### Example

```python
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.deps import get_db, get_current_user
from app.models.agent import Agent as AgentModel
from app.schemas.agent import Agent, AgentCreate

router = APIRouter()

class AgentCreate(BaseModel):
    """Schema for creating a new agent."""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., max_length=500)
    model: str = Field(default="gpt-4")
    temperature: float = Field(default=0.7, ge=0, le=2)

@router.post("/agents", response_model=Agent, status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Agent:
    """
    Create a new agent.
    
    Args:
        agent_data: Agent configuration
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Created agent
        
    Raises:
        HTTPException: If agent name already exists
    """
    # Check for duplicate name
    existing = await db.execute(
        select(AgentModel).where(
            AgentModel.name == agent_data.name,
            AgentModel.user_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Agent name already exists")
    
    # Create agent
    agent = AgentModel(
        **agent_data.dict(),
        user_id=current_user.id
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    
    return agent
```

---

## 🧪 Testing Requirements

### Coverage Goals
- **Unit tests:** >80% code coverage
- **Integration tests:** All API endpoints
- **E2E tests:** Critical user flows

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage

# Python tests
cd apps/api
pytest
pytest --cov=app --cov-report=html
```

### Writing Tests

#### Frontend (Vitest + Testing Library)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentCard } from './AgentCard';

describe('AgentCard', () => {
  const mockAgent = {
    id: '123',
    name: 'Test Agent',
    description: 'Test description',
    model: 'gpt-4'
  };
  
  it('renders agent information', () => {
    render(<AgentCard agent={mockAgent} />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
  
  it('calls onExecute when button clicked', async () => {
    const onExecute = vi.fn();
    render(<AgentCard agent={mockAgent} onExecute={onExecute} />);
    
    const button = screen.getByRole('button', { name: /execute/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onExecute).toHaveBeenCalledWith('123');
    });
  });
  
  it('disables button while executing', async () => {
    const onExecute = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AgentCard agent={mockAgent} onExecute={onExecute} />);
    
    const button = screen.getByRole('button', { name: /execute/i });
    fireEvent.click(button);
    
    expect(button).toBeDisabled();
    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });
});
```

#### Backend (pytest)

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent

@pytest.mark.asyncio
async def test_create_agent(
    client: AsyncClient,
    db: AsyncSession,
    auth_headers: dict
):
    """Test creating a new agent."""
    
    # Arrange
    agent_data = {
        "name": "Test Agent",
        "description": "Test description",
        "model": "gpt-4",
        "temperature": 0.7
    }
    
    # Act
    response = await client.post(
        "/api/agents",
        json=agent_data,
        headers=auth_headers
    )
    
    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == agent_data["name"]
    assert data["description"] == agent_data["description"]
    assert "id" in data
    
    # Verify in database
    agent = await db.get(Agent, data["id"])
    assert agent is not None
    assert agent.name == agent_data["name"]

@pytest.mark.asyncio
async def test_create_agent_duplicate_name(
    client: AsyncClient,
    db: AsyncSession,
    auth_headers: dict
):
    """Test that creating agent with duplicate name fails."""
    
    agent_data = {"name": "Duplicate", "description": "Test"}
    
    # Create first agent
    await client.post("/api/agents", json=agent_data, headers=auth_headers)
    
    # Try to create duplicate
    response = await client.post("/api/agents", json=agent_data, headers=auth_headers)
    
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
```

#### E2E (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Agent Creation', () => {
  test('should create and execute agent', async ({ page }) => {
    // Navigate to platform
    await page.goto('/');
    
    // Login (if needed)
    await page.click('[data-testid="login"]');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="submit"]');
    
    // Create agent
    await page.click('[data-testid="add-agent"]');
    await page.fill('[data-testid="agent-name"]', 'E2E Test Agent');
    await page.fill('[data-testid="agent-description"]', 'Created by E2E test');
    await page.selectOption('[data-testid="model"]', 'gpt-4');
    await page.click('[data-testid="save"]');
    
    // Verify creation
    await expect(page.locator('text=E2E Test Agent')).toBeVisible();
    
    // Execute agent
    await page.click('[data-testid="execute-agent"]');
    await page.fill('[data-testid="input"]', 'Hello, agent!');
    await page.click('[data-testid="run"]');
    
    // Verify execution started
    await expect(page.locator('[data-testid="execution-status"]')).toContainText('Running');
  });
});
```

---

## 🌲 Git Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Build/config changes

Examples:
```bash
feature/add-voice-control
fix/agent-execution-timeout
docs/update-api-reference
refactor/simplify-parser
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Build process, dependencies

**Examples:**

```bash
feat(canvas): add drag-and-drop for agent nodes

Implement drag-and-drop functionality using React Flow.
Nodes can be dragged from sidebar onto canvas.

Closes #123

fix(auth): prevent token expiration on active sessions

- Refresh token 5 minutes before expiration
- Add background refresh task
- Handle refresh failures gracefully

Fixes #456

docs(api): update authentication endpoints documentation

- Add examples for JWT refresh
- Document rate limiting
- Fix response schema typos
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Before Committing**
   ```bash
   # Format code
   npm run format
   
   # Fix linting issues
   npm run lint:fix
   
   # Run tests
   npm test
   
   # Check types
   npm run type-check
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push to Fork**
   ```bash
   git push origin feature/my-feature
   ```

6. **Create Pull Request**
   - Go to GitHub and create PR
   - Fill in PR template
   - Link related issues
   - Request review from maintainers

7. **Address Review Comments**
   - Make requested changes
   - Push updates to same branch
   - Re-request review

8. **Merge**
   - Maintainer will merge once approved
   - Delete branch after merge

---

## 📝 Pull Request Checklist

Before submitting a PR, ensure:

### Code Quality
- [ ] Code follows project style guides
- [ ] No linting errors (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] TypeScript types are explicit (no `any`)
- [ ] No console.log or debug statements

### Testing
- [ ] Unit tests added for new features
- [ ] Integration tests updated if API changed
- [ ] E2E tests added for new user flows
- [ ] All tests pass (`npm test`)
- [ ] Test coverage maintained or improved

### Documentation
- [ ] README updated if user-facing changes
- [ ] API docs updated if endpoints changed
- [ ] Inline code comments for complex logic
- [ ] CHANGELOG.md updated

### Functionality
- [ ] Feature works as expected
- [ ] No regressions introduced
- [ ] Error handling implemented
- [ ] Loading/pending states handled
- [ ] Accessibility considered (ARIA labels, keyboard nav)

### Performance
- [ ] No performance regressions
- [ ] Large lists virtualized if needed
- [ ] Images optimized
- [ ] Database queries optimized (no N+1)

### Security
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] No secrets in code
- [ ] XSS/CSRF protection considered

---

## 🐛 Reporting Bugs

### Before Reporting

1. **Search existing issues** - Maybe it's already reported
2. **Update to latest** - Bug might be fixed
3. **Reproduce in clean environment** - Isolate the issue

### Bug Report Template

```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 11, macOS 14]
- Browser: [e.g. Chrome 120, Safari 17]
- Node.js: [e.g. 20.10.0]
- Version: [e.g. 0.1.0]

**Additional Context**
Any other relevant information.

**Logs**
```
Paste relevant logs here
```
```

---

## 💡 Feature Requests

### Before Requesting

1. **Search existing requests** - Maybe someone else wants it too
2. **Consider alternatives** - Can it be achieved differently?
3. **Think about scope** - Is it aligned with project goals?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem. Ex. I'm frustrated when [...]

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Use Cases**
How would this feature be used? Who would benefit?

**Example Implementation**
If you have ideas on how to implement this.

**Additional Context**
Any other context, screenshots, or mockups.
```

---

## 🏗️ Project Structure

```
agent-platform/
├── .github/
│   ├── copilot-instructions.md    # AI coding guidelines
│   └── workflows/                  # CI/CD workflows
│
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router pages
│   │   │   ├── components/         # React components
│   │   │   ├── hooks/              # Custom hooks
│   │   │   ├── lib/                # Utilities
│   │   │   └── types/              # TypeScript types
│   │   └── package.json
│   │
│   └── api/                        # FastAPI backend
│       ├── app/
│       │   ├── api/                # API routes
│       │   ├── core/               # Config, auth
│       │   ├── models/             # Database models
│       │   ├── schemas/            # Pydantic schemas
│       │   └── services/           # Business logic
│       └── requirements.txt
│
├── packages/
│   ├── workflow-engine/            # Shared workflow engine
│   ├── extension-system/           # Plugin system
│   └── widget-bridge/              # UI widget framework
│
├── mcp-server/                     # MCP server
│   └── src/
│       ├── tools/                  # MCP tools
│       └── services/               # MCP services
│
├── docs/                           # Documentation
│   ├── architecture/               # Architecture docs
│   ├── api/                        # API reference
│   ├── guides/                     # User guides
│   └── sprints/                    # Sprint planning
│
├── tests/                          # E2E tests
├── docker-compose.yml              # Local dev setup
├── turbo.json                      # Turbo config
└── package.json                    # Root package
```

---

## 📚 Resources

- **Architecture Docs:** `docs/architecture/`
- **API Reference:** `docs/api/`
- **Style Guides:** `docs/style-guides/`
- **Turbo Docs:** https://turbo.build/repo/docs
- **Next.js Docs:** https://nextjs.org/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **React Flow:** https://reactflow.dev

---

## 📞 Getting Help

- **Questions:** Open a GitHub Discussion
- **Bugs:** Create a GitHub Issue
- **Security:** Email security@example.com
- **Chat:** Join our Discord server

---

## 📜 Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@example.com.

---

## 📄 License

By contributing to AI Agent Platform, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing! 🙌**
