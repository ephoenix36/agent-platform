# Contributing to AI Agent Marketplace

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the AI Agent Marketplace platform.

---

## 🎯 Ways to Contribute

- **Bug Reports** - Report issues you encounter
- **Feature Requests** - Suggest new features
- **Code Contributions** - Submit pull requests
- **Documentation** - Improve docs and examples
- **Agent Creation** - Build and share professional agents
- **Testing** - Write and improve test coverage

---

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork on GitHub, then clone
git clone https://github.com/YOUR_USERNAME/ai-agent-marketplace.git
cd ai-agent-marketplace

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/ai-agent-marketplace.git
```

### 2. Set Up Development Environment

#### Python Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Or use poetry
poetry install
```

#### TypeScript Setup (for MCP server)

```bash
npm install
npm run build
```

### 3. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b fix/your-bugfix-name
```

---

## 💻 Development Workflow

### Code Style

We use:
- **Python:** Black (formatting), MyPy (typing), Flake8 (linting)
- **TypeScript:** Prettier, ESLint

```bash
# Python formatting
black src/ tests/
isort src/ tests/

# Python type checking
mypy src/

# Python linting
flake8 src/ tests/

# TypeScript
npm run lint
npm run format
```

### Type Hints

All Python code must include comprehensive type hints:

```python
from typing import List, Dict, Optional, Any
from dataclasses import dataclass

@dataclass
class Agent:
    name: str
    description: str
    parameters: Dict[str, Any]
    
async def execute_task(
    task_id: str,
    agents: List[Agent],
    timeout: Optional[float] = None
) -> Dict[str, Any]:
    """Execute task with type hints."""
    ...
```

### Documentation

All public functions, classes, and methods must include docstrings:

```python
def calculate_fitness(
    quality: float,
    speed: float,
    relevance: float
) -> float:
    """
    Calculate multi-objective fitness score.
    
    Args:
        quality: Quality score (0-1)
        speed: Speed score (0-1)
        relevance: Relevance score (0-1)
        
    Returns:
        Combined fitness score (0-1)
        
    Example:
        >>> calculate_fitness(0.9, 0.8, 0.95)
        0.883
    """
    return 0.4 * quality + 0.3 * speed + 0.3 * relevance
```

---

## 🧪 Testing

### Writing Tests

- Place tests in `tests/` directory
- Name test files `test_*.py`
- Use descriptive test names
- Include docstrings

```python
import pytest
from src.agent_registry import Agent, AgentRegistry, AgentCategory

class TestAgentRegistry:
    """Test suite for AgentRegistry."""
    
    @pytest.fixture
    def registry(self):
        """Create clean registry for testing."""
        return AgentRegistry(storage_path=None)  # In-memory
    
    @pytest.fixture
    def sample_agent(self):
        """Create sample agent."""
        return Agent(
            name="Test Agent",
            description="For testing",
            category=AgentCategory.RESEARCH,
            system_prompt="Test prompt",
            model="gpt-4o",
            parameters={"temperature": 0.5}
        )
    
    def test_register_agent(self, registry, sample_agent):
        """Test agent registration."""
        agent_id = registry.register(sample_agent)
        
        assert agent_id is not None
        assert len(agent_id) > 0
        
        retrieved = registry.get(agent_id)
        assert retrieved is not None
        assert retrieved.name == "Test Agent"
    
    async def test_agent_execution(self, registry, sample_agent):
        """Test async agent execution."""
        # Use pytest-asyncio for async tests
        ...
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html tests/

# Run specific file
pytest tests/test_agent_registry.py -v

# Run specific test
pytest tests/test_agent_registry.py::TestAgentRegistry::test_register_agent -v
```

### Test Coverage

Aim for >80% coverage on new code:

```bash
pytest --cov=src tests/
coverage html
# Open htmlcov/index.html
```

---

## 📝 Pull Request Process

### 1. Before Submitting

- ✅ All tests pass
- ✅ Code is formatted (Black, Prettier)
- ✅ Type checking passes (MyPy)
- ✅ Linting passes (Flake8, ESLint)
- ✅ Documentation updated
- ✅ CHANGELOG.md updated
- ✅ Commit messages are clear

### 2. Commit Messages

Use conventional commits:

```
feat: add cascade evaluation for cost optimization
fix: resolve race condition in agent execution
docs: update API documentation with examples
test: add integration tests for marketplace
refactor: simplify island migration logic
perf: optimize agent selection algorithm
```

### 3. Create Pull Request

```bash
# Push branch
git push origin feature/your-feature-name

# Create PR on GitHub with:
# - Clear title
# - Description of changes
# - Link to related issues
# - Screenshots (if UI changes)
```

### 4. PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or documented)
```

---

## 🏗️ Architecture Guidelines

### Project Structure

```
src/
├── core/              # Core abstractions
│   ├── agent.py
│   └── task.py
├── registry/          # Agent management
│   └── agent_registry.py
├── execution/         # Task execution
│   └── task_engine.py
├── evolution/         # Evolution systems
│   ├── island.py
│   └── cascade.py
└── integration/       # External integrations
    └── mcp_sampling.py
```

### Design Principles

1. **Separation of Concerns**
   - Each module has a single responsibility
   - Clear interfaces between components

2. **Dependency Injection**
   - Pass dependencies explicitly
   - Makes testing easier

3. **Async First**
   - Use `async/await` for I/O operations
   - Enables parallelization

4. **Type Safety**
   - Comprehensive type hints
   - Use dataclasses for data structures

5. **Testability**
   - Write testable code
   - Use dependency injection
   - Avoid global state

---

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Try latest version
3. Search documentation

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Initialize marketplace with...
2. Execute task with...
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment**
- OS: [e.g., Windows 11]
- Python: [e.g., 3.10.5]
- Version: [e.g., 1.0.0]

**Error messages**
```python
# Paste full error traceback
```

**Additional context**
Any other relevant information.
```

---

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Describe the problem or use case.

**Describe the solution you'd like**
Clear description of what you want.

**Describe alternatives you've considered**
Other approaches you've thought about.

**Additional context**
Mockups, examples, references.
```

---

## 🏅 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to community Discord
- Eligible for bounties (coming soon)

---

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing private information
- Unethical or illegal behavior

---

## 📞 Getting Help

- **Documentation:** Check `/docs`
- **Discussions:** GitHub Discussions
- **Discord:** [Join Community]
- **Email:** dev@aimarketplace.dev

---

## 🎓 Learning Resources

### For New Contributors

1. Read [ARCHITECTURE.md](docs/ARCHITECTURE.md)
2. Review [API.md](docs/API.md)
3. Study example code in `tests/`
4. Join community Discord

### Recommended Reading

- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [Async Programming](https://docs.python.org/3/library/asyncio.html)
- [Black Code Style](https://black.readthedocs.io/)
- [pytest Documentation](https://docs.pytest.org/)

---

## 📅 Release Process

### Versioning

We use Semantic Versioning (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Git tag created
- [ ] PyPI package published
- [ ] GitHub release created

---

## 🌟 Special Thanks

Thank you for contributing to making AI agent marketplaces a reality!

Your contributions help build:
- Better AI agents
- More efficient evolution
- Sustainable creator economics
- The future of AI collaboration

---

**Questions?** Open a GitHub Discussion or join our Discord!

**Ready to contribute?** Fork the repo and start coding! 🚀
