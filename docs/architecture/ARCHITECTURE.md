# Agents System Architecture

## Overview

The **Agents** system is a hybrid TypeScript/Python platform for creating, managing, and automatically optimizing AI agent instructions using evolutionary algorithms.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │     CLI      │  │   Web UI     │  │     API      │ │
│  │  (Commander) │  │  (Future)    │  │  (Future)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│               TypeScript Core Layer                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Agent Manager (agent-manager.ts)        │  │
│  │  • Load/Save agents from JSON files              │  │
│  │  • List/Search/Filter agents                     │  │
│  │  • Collection and subsection management          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Python Bridge (python-bridge.ts)          │  │
│  │  • Spawn Python subprocess                       │  │
│  │  • stdio-based IPC                               │  │
│  │  • Request/Response protocol                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         MCP Integration (Future)                 │  │
│  │  • Run agents with MCP tools                     │  │
│  │  • Tool permission management                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │ stdio
┌─────────────────────────────────────────────────────────┐
│                Python Optimization Layer                │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Bridge (bridge.py)                    │  │
│  │  • Listen on stdin for commands                  │  │
│  │  • Route to appropriate handlers                 │  │
│  │  • Send responses on stdout                      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Optimizer (optimizer.py)                │  │
│  │  • Evolutionary algorithm implementation         │  │
│  │  • Population initialization                     │  │
│  │  • Fitness evaluation orchestration              │  │
│  │  • Mutation and selection                        │  │
│  │  • Convergence detection                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Evosuite SDK Integration (Future)         │  │
│  │  • Advanced optimization strategies              │  │
│  │  • Distributed evolution                         │  │
│  │  • Performance optimization                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Data Layer                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │       Collections (Filesystem)                   │  │
│  │  collections/                                    │  │
│  │  ├── creative-tools/                             │  │
│  │  │   ├── photoshop/                              │  │
│  │  │   │   └── *.json                              │  │
│  │  ├── web-development/                            │  │
│  │  ├── research/                                   │  │
│  │  └── meta-agents/                                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Evaluators & Mutators (Python Code)           │  │
│  │  evaluators/templates/                           │  │
│  │  mutators/templates/                             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │      Optimization Runs (Results)                 │  │
│  │  optimizations/runs/                             │  │
│  │  └── [run-id].json                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Agent Creation
```
User → CLI → AgentManager → Filesystem
                └→ Create JSON file in collections/
```

### Agent Listing/Search
```
User → CLI → AgentManager → Read collections/ → Return results
```

### Agent Optimization
```
User → CLI → AgentManager
         └→ Load agent JSON
         └→ PythonBridge → spawn optimizer.py
              └→ Send: agent instruction, threshold, max_gen
              ← Receive: optimized variant, score, history
         └→ Save optimized agent
         └→ Save optimization run metadata
```

## Key Design Decisions

### 1. Hybrid Architecture (TypeScript + Python)

**Rationale:**
- TypeScript: Excellent for CLI, MCP integration, developer tools
- Python: ML/AI ecosystem, Evosuite SDK, evaluation/mutation code
- stdio IPC: Simple, reliable, cross-platform

**Trade-offs:**
- ✅ Leverages strengths of both languages
- ✅ Easy to extend each layer independently
- ❌ Added complexity vs single-language solution
- ❌ IPC overhead (minimal for this use case)

### 2. Filesystem-based Storage

**Rationale:**
- Human-readable JSON files
- Version control friendly (git)
- No database setup required
- Easy import/export

**Trade-offs:**
- ✅ Simple, transparent, portable
- ✅ Works well for thousands of agents
- ❌ Not suitable for millions of agents
- ❌ No transactional guarantees

**Future:** Add optional database backend for scale.

### 3. Meta-Agent Pattern

**Rationale:**
- Evaluators and mutators are themselves agents
- Can be optimized using the same system
- Enables self-improvement

**Trade-offs:**
- ✅ Elegant self-referential design
- ✅ Consistent interface for all agents
- ❌ Recursive complexity
- ❌ Requires careful bootstrapping

### 4. Collection Hierarchy

**Structure:**
```
collections/
  {collection}/
    {subsection}/
      {agent-id}.json
```

**Rationale:**
- Logical organization by domain and sub-domain
- Easy to browse and discover
- Supports growth (add collections without restructuring)

**Examples:**
- `creative-tools/photoshop/color-correction-agent`
- `web-development/frontend/react-component-generator`
- `research/literature-review/literature-synthesizer`

## Agent Instruction Schema

See `src/types/schema.ts` for complete schema. Key fields:

```typescript
{
  // Identity
  id: string
  name: string
  collection: string
  subsection: string
  
  // Instruction
  systemPrompt: string
  userPromptTemplate: string
  examples: Example[]
  
  // MCP Integration
  requiredTools: string[]
  toolPermissions: ToolPermission[]
  
  // Optimization
  evaluator: EvaluatorConfig
  mutator: MutatorConfig
  currentScore: number
  optimizationThreshold: number
  optimizationHistory: OptimizationRun[]
}
```

## Optimization Process

### 1. Initialize Population
- Start with base agent instruction
- Generate N variants via mutation
- Population size: 10-20 typically

### 2. Evaluate Fitness
- For each variant, run evaluator
- Evaluator returns score (0.0 - 1.0)
- May use rule-based, LLM-judge, or automated tests

### 3. Selection
- Keep top performers (elitism)
- Select parents for next generation

### 4. Mutation
- Mutate parent instructions
- Strategies: prompt expansion, example synthesis, constraint tuning
- Adaptive mutation rate based on generation

### 5. Convergence Check
- Stop if score ≥ threshold
- Stop if marginal improvement < 1% for 5 generations
- Stop if max generations reached

### 6. Save Results
- Store best variant as new version
- Record optimization run metadata
- Preserve history for analysis

## Evaluator Design

Evaluators are Python functions:

```python
def evaluate(task_input: str, agent_output: str, context: dict) -> dict:
    return {
        'score': float,        # 0.0 - 1.0
        'breakdown': dict,     # Component scores
        'feedback': str        # Actionable feedback
    }
```

**Types:**
- **Rule-based**: Regex, format validation, objective criteria
- **LLM-judge**: Use LLM to assess subjective quality
- **Automated-test**: Run code, check outputs
- **Hybrid**: Combine multiple strategies

## Mutator Design

Mutators are Python functions:

```python
def mutate(instruction: dict, evaluation_feedback: dict, generation: int) -> dict:
    # Returns mutated instruction
    pass
```

**Strategies:**
- **Prompt expansion**: Add clarifications, constraints, examples
- **Prompt compression**: Remove redundancy
- **Example synthesis**: Generate new examples
- **Constraint tuning**: Adjust parameters
- **Instruction reframing**: Rephrase for clarity

**Adaptive Behavior:**
- Early: High mutation rate, broad exploration
- Mid: Targeted improvements based on feedback
- Late: Fine-tuning, conservative mutations

## Future Enhancements

1. **MCP Integration**
   - Run agents with actual MCP tools
   - Tool permission enforcement
   - Real-time agent execution

2. **Evosuite SDK Integration**
   - Advanced optimization algorithms
   - Distributed evolution
   - Better convergence strategies

3. **Web UI**
   - Visual agent builder
   - Optimization monitoring dashboard
   - Collection browsing

4. **Marketplace**
   - Share agents with community
   - Rate and review
   - Automated quality validation

5. **Multi-Agent Orchestration**
   - Agent teams and workflows
   - Inter-agent communication
   - Collaborative optimization

## Performance Considerations

- **Agent Loading**: O(1) for single agent, O(n) for collection listing
- **Search**: O(n) linear scan (acceptable for thousands of agents)
- **Optimization**: Varies by evaluator complexity (seconds to minutes)
- **Scalability**: Filesystem handles ~100k files comfortably per directory

## Security Considerations

- **Python Code Execution**: Evaluators/mutators run arbitrary Python
  - Future: Sandbox execution environment
  - Future: Code signing and verification
  
- **Tool Permissions**: MCP tool access controlled per-agent
  - Read/write/execute permissions
  - Max call limits

- **Input Validation**: All JSON schemas validated via Zod

## Testing Strategy

- **Unit Tests**: Core TypeScript functions (AgentManager, PythonBridge)
- **Integration Tests**: CLI commands, Python bridge communication
- **E2E Tests**: Full optimization runs
- **Meta-Agent Tests**: Evaluator/mutator creation and validation

## Development Workflow

1. Create agent JSON in appropriate collection
2. Write evaluator Python code (or use template)
3. Write mutator Python code (or use template)
4. Test agent manually via CLI
5. Run optimization
6. Review results and iterate
7. Share optimized agent (future: marketplace)
