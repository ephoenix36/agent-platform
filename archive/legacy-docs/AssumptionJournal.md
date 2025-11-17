# Assumption Journal
**Project:** Evolving Skills System for AI Agent Platform
**Commenced:** 2025-11-05
**Workflow:** Autonomous Development (dev.prompt.md)

---

## Core Assumptions

### 1. Skills System Architecture
**Assumption:** Skills are lightweight, versioned instruction fragments that can be attached to agents, tools, and agent groups.

**Rationale:**
- User requested "one or two sentence, high value notes"
- Skills should be composable and reusable
- Skills should evolve independently via genetic algorithms
- Skills provide domain-specific expertise without bloating agent prompts

**Structure:**
```python
Skill {
  id: str
  name: str
  domain: str  # coding, research, analysis, etc.
  instruction: str  # 1-2 sentence, high-density guidance
  applicable_to: [tools, agents, agent_groups]
  version: str
  generation: int
  performance_score: float
  parent_skills: [str]
  created_at: datetime
  optimized_at: datetime
}
```

### 2. Skill Domains
**Assumption:** Skills are organized by domain to match existing agent categories.

**Domains:**
- Coding (syntax, patterns, best practices)
- Research (sourcing, synthesis, citation)
- Analysis (metrics, visualization, interpretation)
- Communication (tone, clarity, persuasion)
- Problem-Solving (decomposition, strategy, debugging)
- Meta (prompting, self-correction, quality control)

### 3. Evolution Strategy
**Assumption:** Skills evolve via island evolution + EvoPrompt-style mutation.

**Evolution Pipeline:**
1. **Mutation:** SkillMutatorAgent generates variants
2. **Evaluation:** SkillEvaluatorAgent scores performance
3. **Selection:** Top performers survive, weak skills pruned
4. **Crossover:** High-performing skills can be combined

### 4. Integration Points
**Assumption:** Skills integrate seamlessly with existing agent system.

**Integration:**
- `Agent.skills: List[str]` - References to skill IDs
- `Tool.recommended_skills: List[str]` - Skills that enhance tool usage
- `AgentGroup.shared_skills: List[str]` - Skills available to group
- Skills injected into agent systemPrompt at runtime

### 5. Meta-Agent Prompting
**Assumption:** Skill Creator, Mutator, and Evaluator agents must follow UpgradePrompt.prompt.md standards.

**Prompting Principles (from UpgradePrompt):**
- **Masterfully Informative:** Dense, accurate, comprehensive
- **Absolutely Complete:** Thorough, addressing all components
- **Rich & Specific:** Powerful vocabulary, zero vagueness
- **Purposeful:** Every word serves the goal

**Implementation:**
- Use identity casting (Role, Mission, CorePurpose)
- Directive scaffolding (Meta-Directives → Workflows → Formats)
- Defensive design (anticipate hallucination, ambiguity)
- Performance tuning (unambiguous, strong verbs, clear delimiters)

### 6. Tech Stack
**Assumption:** Python backend, JSON storage, SQLAlchemy models (future DB migration).

**Stack:**
- Python 3.11+
- Pydantic for validation
- JSON for initial persistence
- Integration with existing agent_registry.py

### 7. File Organization
**Assumption:** Follow existing project structure conventions.

**Structure:**
```
src/
  skills/
    __init__.py
    skill_registry.py      # Core skill management
    skill_evolution.py     # Evolution engine
collections/
  meta-agents/
    skills/
      skill-creator.json
      skill-mutator.json
      skill-evaluator.json
  skills/
    coding/
      python-best-practices.json
      error-handling.json
    research/
      source-evaluation.json
tests/
  test_skills.py
  test_skill_evolution.py
```

---

## Ambiguity Resolutions

### Ambiguity 1: Skill Granularity
**Question:** How specific should each skill be?

**Resolution:** Each skill targets ONE specific capability or pattern.
- ✅ Good: "Use type hints on all function signatures for clarity and IDE support."
- ❌ Too Broad: "Write good Python code."
- ❌ Too Narrow: "Import typing module."

**Rationale:** Single-responsibility enables precise evolution and composition.

### Ambiguity 2: Skill Application Timing
**Question:** When/how are skills applied to agents?

**Resolution:** Skills are injected into agent systemPrompt at task execution time.

**Implementation:**
```python
def prepare_agent_prompt(agent: Agent, skills: List[Skill]) -> str:
    base_prompt = agent.system_prompt
    skill_section = "\n\n## Domain Skills:\n"
    for skill in skills:
        skill_section += f"- {skill.instruction}\n"
    return base_prompt + skill_section
```

**Rationale:** Runtime injection allows dynamic skill composition without agent redeployment.

### Ambiguity 3: Skill Evaluation Methodology
**Question:** How to measure skill effectiveness?

**Resolution:** A/B testing - compare agent performance with/without skill on standardized tasks.

**Evaluation:**
```python
score = (performance_with_skill - baseline_performance) / baseline_performance
```

**Rationale:** Direct performance delta isolates skill contribution.

---

## Technology Decisions

### Decision 1: Pydantic Models
**Chosen:** Use Pydantic for Skill data models

**Alternatives Considered:**
- Dataclasses (chosen for Agent)
- Plain dictionaries

**Rationale:** Pydantic provides validation, serialization, and forward compatibility with FastAPI.

### Decision 2: JSON Storage (Initial)
**Chosen:** Store skills as JSON files in collections/skills/

**Future Migration:** PostgreSQL when database layer added

**Rationale:** Consistency with existing agent collections, zero dependencies, human-readable.

### Decision 3: Expert Prompting Standard
**Chosen:** Apply UpgradePrompt "Apex Standard" to all meta-agents

**Implementation:** Each meta-agent includes:
- Identity Casting (Role, Mission, CorePurpose)
- Meta-Directives (Apex Standard adherence)
- Step-by-Step Workflows
- Defensive Constraints (anti-hallucination, format validation)
- Rationale Inclusion (commented explanations)

**Rationale:** User explicitly requested expert prompting per UpgradePrompt guidelines.

---

## Out-of-Scope (Explicitly Deferred)

1. **UI Integration:** No frontend changes in this iteration
2. **Database Migration:** JSON storage sufficient for MVP
3. **Skill Marketplace:** Skills are system-level, not user-tradable (yet)
4. **Skill Dependencies:** Skills are independent (no prerequisite chains)
5. **Real-time Evolution:** Background evolution runs on schedule, not live

---

**Last Updated:** 2025-11-05 (Initial)
