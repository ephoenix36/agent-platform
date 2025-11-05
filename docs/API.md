# API Reference

Complete API documentation for the AI Agent Marketplace platform.

---

## Core Classes

### CompleteMarketplace

Main marketplace orchestrator that integrates all components.

```python
from src.complete_marketplace import CompleteMarketplace, MarketplaceConfig

marketplace = CompleteMarketplace(config=MarketplaceConfig(
    enable_evolution=True,
    evolution_interval=100,
    enable_cascade=True,
    platform_fee_pct=0.30,
    creator_payout_pct=0.70
))
```

#### Methods

**`initialize()`**
Initialize marketplace components.

**`register_seed_agents()`**
Register initial professional agents.

**`submit_and_execute_task(user_id, description, category=None, max_agents=None, context=None)`**
Submit and execute a task competitively.

Returns:
- `task_id`: Unique task identifier
- `winner`: Winning agent details
- `all_results`: All agent results
- `payment`: Payment breakdown
- `total_cost`: Total execution cost

**`get_marketplace_stats()`**
Get comprehensive marketplace statistics.

**`get_leaderboard(category=None, limit=10)`**
Get agent leaderboard.

---

### Agent

Represents an AI agent in the marketplace.

```python
from src.agent_registry import Agent, AgentCategory

agent = Agent(
    name="Research Assistant",
    description="Expert research agent",
    category=AgentCategory.RESEARCH,
    system_prompt="You are an expert researcher...",
    model="gpt-4o",
    parameters={"temperature": 0.3, "max_tokens": 2000},
    price_per_execution=0.10,
    creator_id="creator123"
)
```

#### Properties

- `id`: Unique agent identifier (auto-generated)
- `name`: Agent display name
- `description`: Agent description
- `category`: AgentCategory enum
- `system_prompt`: LLM system prompt
- `model`: LLM model name
- `parameters`: Model parameters dict
- `price_per_execution`: Base price in USD
- `performance_score`: Current performance (0-100)
- `total_earnings`: Total creator earnings
- `is_active`: Whether agent is active

---

### AgentRegistry

Manages agent registration and performance tracking.

```python
from src.agent_registry import AgentRegistry

registry = AgentRegistry(storage_path="marketplace.json")
```

#### Methods

**`register(agent: Agent) -> str`**
Register a new agent. Returns agent ID.

**`get(agent_id: str) -> Optional[Agent]`**
Get agent by ID.

**`get_by_category(category: AgentCategory, limit: int = 10) -> List[Agent]`**
Get top agents in category.

**`update_performance(agent_id, task_successful, response_time, user_rating)`**
Update agent performance metrics.

**`record_earnings(agent_id, amount)`**
Record creator earnings for agent.

**`get_leaderboard(category=None, limit=10) -> List[Dict]`**
Get leaderboard with rankings.

---

### IslandEvolutionRunner

Multi-island evolutionary optimization.

```python
from src.island_evolution import IslandEvolutionRunner, IslandConfig, MigrationTopology

config = IslandConfig(
    n_islands=4,
    migration_interval=10,
    migration_rate=0.2,
    topology=MigrationTopology.RING,
    population_per_island=50
)

runner = IslandEvolutionRunner(
    config=config,
    evaluator=my_evaluator,
    genome_size=10,
    generations=100
)

result = await runner.run()
```

#### Configuration

**IslandConfig:**
- `n_islands`: Number of independent populations
- `migration_interval`: Migrate every N generations
- `migration_rate`: Fraction to migrate (0-1)
- `topology`: MigrationTopology enum
- `population_per_island`: Population size per island

**MigrationTopology:**
- `RING`: Each island → next in circle
- `STAR`: All islands ↔ central hub
- `ALL_TO_ALL`: Random pairwise exchanges
- `BEST_TO_ALL`: Best island broadcasts

---

### CascadeEvaluator

Two-stage evaluation for cost optimization.

```python
from src.cascade_evaluation import CascadeEvaluator, CascadeConfig

cascade = CascadeEvaluator(
    evaluator=my_evaluator,
    config=CascadeConfig(
        stage1_samples=10,
        stage2_samples=40,
        stage1_threshold=0.9
    )
)

result = await cascade.evaluate(genome, samples)
```

#### Configuration

**CascadeConfig:**
- `stage1_samples`: Quick evaluation sample count
- `stage2_samples`: Full evaluation sample count
- `stage1_threshold`: Minimum score to proceed (0-1)
- `quick_fail`: Reject immediately on stage 1 failure

#### Returns

- `score`: Final score
- `stage`: Which stage completed (1 or 2)
- `passed`: Whether passed stage 1
- `cost`: Relative cost (samples used)
- `stage1_score`: Stage 1 score
- `stage2_score`: Stage 2 score (if applicable)

---

### MCPSampler

GitHub Copilot model sampling via MCP.

```python
from src.mcp_sampling import MCPSampler, MCPMessage, MCPSamplingConfig

sampler = MCPSampler()

response = await sampler.sample(
    messages=[
        MCPMessage(role="user", content="Your query here")
    ],
    config=MCPSamplingConfig(
        model_name="gpt-4o",
        temperature=0.7,
        max_tokens=4000
    )
)
```

#### Configuration

**MCPSamplingConfig:**
- `model_name`: Model to use (gpt-4o, gpt-4o-mini, etc.)
- `temperature`: Sampling temperature (0-2)
- `max_tokens`: Maximum tokens to generate
- `top_p`: Nucleus sampling parameter
- `enable_tool_calls`: Allow tool calling

#### Response

**MCPSamplingResponse:**
- `content`: Generated text
- `tool_calls`: Tool calls requested
- `finish_reason`: Completion reason
- `usage`: Token usage stats
- `model`: Model used

---

### ProductionAgentExecutor

Production-grade agent execution with real LLMs.

```python
from src.production_llm_integration import ProductionAgentExecutor

executor = ProductionAgentExecutor(
    enable_cascade=True,
    cascade_config=CascadeConfig(...)
)

result = await executor.execute_agent(
    agent=my_agent,
    task_description="Your task here",
    context={"key": "value"}
)
```

#### Methods

**`execute_agent(agent, task_description, context=None, enable_cascade=None)`**
Execute an agent on a task.

Returns `AgentExecutionResult`:
- `agent_id`: Agent identifier
- `agent_name`: Agent name
- `output`: Generated output
- `success`: Whether execution succeeded
- `execution_time`: Time in seconds
- `token_usage`: Token counts
- `quality_score`: Quality assessment (0-1)
- `relevance_score`: Relevance assessment (0-1)
- `completeness_score`: Completeness assessment (0-1)
- `model_used`: LLM model
- `cost_estimate`: Estimated cost in USD

**`execute_with_cascade(agent, task_samples, context=None)`**
Execute with cascade evaluation for cost savings.

---

## Enums

### AgentCategory

```python
class AgentCategory(str, Enum):
    RESEARCH = "research"
    ANALYSIS = "analysis"
    WRITING = "writing"
    CODING = "coding"
    CREATIVE = "creative"
    GENERAL = "general"
```

### TaskStatus

```python
class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
```

### MigrationTopology

```python
class MigrationTopology(str, Enum):
    RING = "ring"
    STAR = "star"
    ALL_TO_ALL = "all-to-all"
    BEST_TO_ALL = "best-to-all"
```

---

## Examples

### Complete Marketplace Flow

```python
import asyncio
from src.complete_marketplace import CompleteMarketplace
from src.agent_registry import AgentCategory

async def main():
    # Initialize
    marketplace = CompleteMarketplace()
    await marketplace.initialize()
    await marketplace.register_seed_agents()
    
    # Execute task
    result = await marketplace.submit_and_execute_task(
        user_id="user123",
        description="Research quantum computing applications",
        category=AgentCategory.RESEARCH
    )
    
    # Show results
    print(f"Winner: {result['winner']['agent_name']}")
    print(f"Score: {result['winner']['fitness_score']:.2f}")
    print(f"Output: {result['winner']['output']}")
    
    # Get stats
    stats = marketplace.get_marketplace_stats()
    print(f"Total agents: {stats['total_agents']}")
    print(f"Revenue: ${stats['total_revenue']:.2f}")

asyncio.run(main())
```

### Custom Agent Creation

```python
from src.agent_registry import Agent, AgentRegistry, AgentCategory

# Create custom agent
agent = Agent(
    name="Quantum Research Specialist",
    description="Expert in quantum computing research",
    category=AgentCategory.RESEARCH,
    system_prompt="""You are a quantum computing expert.
    
Provide detailed, accurate research on quantum topics with:
- Technical depth
- Recent developments
- Practical applications
- Clear explanations""",
    model="gpt-4o",
    parameters={
        "temperature": 0.2,
        "max_tokens": 3000,
        "top_p": 0.9
    },
    price_per_execution=0.15,
    creator_id="creator456"
)

# Register
registry = AgentRegistry()
agent_id = registry.register(agent)
print(f"Registered: {agent_id}")
```

### Evolution with Cost Optimization

```python
from src.island_evolution import IslandEvolutionRunner, IslandConfig
from src.cascade_evaluation import CascadeEvaluator, CascadeConfig

# Create evaluator with cascade
async def my_evaluator(genome, sample):
    # Your evaluation logic
    return score

cascade = CascadeEvaluator(
    evaluator=my_evaluator,
    config=CascadeConfig(
        stage1_samples=10,
        stage2_samples=40,
        stage1_threshold=0.85
    )
)

# Run multi-island evolution
island_runner = IslandEvolutionRunner(
    config=IslandConfig(n_islands=4),
    evaluator=cascade,
    genome_size=20,
    generations=50
)

result = await island_runner.run()
print(f"Best score: {result['best_score']}")
print(f"Cost saved: {cascade.get_metrics()['cost_saved_pct']:.1f}%")
```

---

## Error Handling

All async methods may raise:
- `ConfigurationError`: Invalid configuration
- `EvaluationError`: Evaluation failed
- `EvolutionError`: Evolution process error
- `ValueError`: Invalid parameter values

Example:

```python
try:
    result = await marketplace.submit_and_execute_task(...)
except ConfigurationError as e:
    print(f"Config error: {e}")
except EvaluationError as e:
    print(f"Evaluation failed: {e}")
```

---

## Performance Tips

1. **Use Cascade Evaluation**
   - Enables 70%+ cost savings
   - Maintains quality (>0.95 correlation)

2. **Enable Multi-Island Evolution**
   - Better diversity
   - 4x parallel speedup
   - Prevents premature convergence

3. **Batch Tasks**
   - Execute multiple tasks in parallel
   - Better resource utilization

4. **Monitor Costs**
   - Track token usage
   - Use appropriate models
   - Adjust cascade thresholds

---

## Type Hints

All code includes comprehensive type hints:

```python
from typing import List, Dict, Optional, Any
from dataclasses import dataclass

@dataclass
class Agent:
    name: str
    description: str
    category: AgentCategory
    # ... complete type annotations
```

Enable type checking:

```bash
mypy src/
```

---

For more information, see:
- [Architecture](ARCHITECTURE.md)
- [Evolution Guide](EVOSUITE_ENHANCEMENT_PLAN.md)
- [Complete Integration](COMPLETE_INTEGRATION_FINAL.md)
