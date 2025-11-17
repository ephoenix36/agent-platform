# Agent Definitions Inventory Report
**Date:** November 13, 2025  
**Project:** Agents Platform  
**Purpose:** Comprehensive discovery and cataloging of all agent definitions

---

## Executive Summary

**Total Agent Definitions Found:** 45+  
**Storage Locations:** 7 distinct types  
**Schema Variations:** 5 major formats  
**Consolidation Priority:** HIGH (critical for unified collection system)

---

## 1. Agent Storage Locations

### 1.1 JSON Registry Files (Root Level)
**Location:** `c:\Users\ephoe\Documents\Coding_Projects\Agents\*.json`

| File Name | Agent Count | Schema Type | Has Performance Metrics | Storage Format |
|-----------|-------------|-------------|------------------------|----------------|
| `agents_registry.json` | 2 | Marketplace Agent | Yes (full metrics) | Flat JSON dict |
| `marketplace_agents.json` | 5 | Marketplace Agent | Yes (full metrics) | Flat JSON dict |
| `marketplace.json` | 10 | Marketplace Agent | Yes (full metrics) | Flat JSON dict |
| `marketplace_demo.json` | 5 | Marketplace Agent | Yes (full metrics) | Flat JSON dict |

**Subtotal:** 22 agent instances (some duplicates across files)  
**Schema Details:**
- **System Prompt:** ✅ Yes (detailed, 100-500 tokens)
- **Tools List:** ✅ Yes (string array)
- **Performance Metrics:** ✅ Yes (score, tasks_completed, success_rate, avg_response_time, user_rating)
- **Economics:** ✅ Yes (price_per_execution, total_earnings, revenue_30d)
- **Evolution:** ✅ Yes (generation, parent_agents, mutations)
- **Model Config:** ✅ Yes (model, parameters)

**Example Fields:**
```json
{
  "id": "uuid",
  "name": "Agent Name",
  "description": "...",
  "creator": "system|marketplace",
  "category": "research|coding|...",
  "version": "1.0.0",
  "performance_score": 84.7,
  "tasks_completed": 2,
  "success_rate": 1.0,
  "system_prompt": "...",
  "tools": ["tool1", "tool2"],
  "model": "gpt-4-turbo",
  "parameters": {}
}
```

---

### 1.2 Collection JSON Files (Structured)
**Location:** `c:\Users\ephoe\Documents\Coding_Projects\Agents\collections\`

**Total Collection Files:** 20 JSON files

#### Collection Structure Overview:
```
collections/
├── business-agents/          (10 agents)
│   ├── automation/           web-research-automation-agent.json
│   ├── education/            education-learning-optimizer.json
│   ├── governance/           policy-optimization-agent.json
│   ├── healthcare/           healthcare-treatment-optimizer.json
│   ├── product/              product-design-optimizer.json
│   └── sales/                linkedin-prospect-researcher.json
│                             email-deliverability-validator.json
│                             cold-email-reply-classifier.json
├── creative-tools/           (2 agents)
│   └── photoshop/            color-correction-agent.json
├── meta-agents/              (5 agents)
│   ├── core/                 agent-genesis-architect.json
│   │                         evaluator-creator.json
│   │                         mutator-creator.json
│   ├── skills/               skill-creator.json
│   └── strategy/             project-architect.json
│                             ui-ux-strategist.json
├── research/                 (2 agents)
│   ├── data-analysis/        data-analyzer.json
│   └── literature-review/    literature-synthesizer.json
├── skills/                   (1 agent)
│   └── image_processing/     photoshop-expert.json
└── web-development/          (2 agents)
    ├── backend/              api-endpoint-designer.json
    └── frontend/             react-component-generator.json
```

**Subtotal:** 20 unique agent definitions

**Schema Details:**
- **System Prompt:** ✅ Yes (extremely detailed, 1000-5000+ tokens, includes frameworks, protocols, examples)
- **Tools List:** ✅ Yes (required + optional)
- **Performance Metrics:** ✅ Yes (currentScore, optimizationHistory)
- **Evaluator:** ✅ Yes (full eval framework with criteria, weights, metrics)
- **Mutator:** ✅ Yes (strategies, constraints, mutationRate)
- **Examples:** ✅ Yes (input/output pairs with explanations)
- **User Prompt Template:** ✅ Yes (parameterized template)

**Example Fields:**
```json
{
  "id": "agent-id",
  "name": "Agent Name",
  "description": "...",
  "collection": "business-agents",
  "subsection": "sales",
  "version": "1.0.0",
  "systemPrompt": "# Identity & Expertise\n...\n# Core Capabilities\n...",
  "userPromptTemplate": "**Request**\nParam: {param}\n...",
  "examples": [{
    "input": "...",
    "output": "...",
    "explanation": "..."
  }],
  "requiredTools": ["tool1"],
  "optionalTools": ["tool2"],
  "evaluator": {
    "type": "llm-judge",
    "implementation": "evaluators/path/eval.py",
    "successCriteria": [...],
    "weightedMetrics": [...]
  },
  "mutator": {
    "strategies": [...],
    "constraints": [...],
    "mutationRate": 0.25
  },
  "optimizationHistory": [],
  "currentScore": 0.75,
  "optimizationThreshold": 0.85
}
```

**Key Differentiator:** These are PRODUCTION-READY agent specifications with:
- Comprehensive instruction sets (meta-directives, workflows, protocols)
- Built-in optimization (evaluators + mutators)
- Examples for zero-shot execution
- Template-based user interaction

---

### 1.3 MCP Server Meta-Agents
**Location:** `c:\Users\ephoe\Documents\Coding_Projects\Agents\agent-platform\mcp-server\meta-agents\`

| File Name | Agent Type | Schema | Has System Prompt | Has Tools | Has Metrics |
|-----------|-----------|---------|------------------|-----------|------------|
| `agent-architect.json` | Meta-agent | Enhanced JSON | ✅ Yes (16,000 tokens) | ✅ Yes (4 tools) | ✅ Yes (hooks + eval) |
| `workflow-designer.json` | Meta-agent | Enhanced JSON | ✅ Yes (16,000 tokens) | ✅ Yes (5 tools) | ✅ Yes (hooks + eval) |
| `telemetry-specialist.json` | Meta-agent | Enhanced JSON | ✅ Yes (12,000 tokens) | ✅ Yes (3 tools) | ✅ Yes (hooks only) |

**Subtotal:** 3 meta-agents

**Schema Details:**
- **System Prompt:** ✅ Yes (EXTREMELY detailed, 12,000-16,000 tokens)
- **Tools List:** ✅ Yes (specific MCP tools)
- **Hooks:** ✅ Yes (beforeExecution, afterExecution, onError)
- **Evaluation:** ✅ Yes (metrics + criteria with thresholds)
- **Mutation:** ✅ Yes (strategies with parameters)
- **Model Config:** ✅ Yes (model, temperature, maxTokens, topP)

**Example Fields:**
```json
{
  "id": "agent-architect-001",
  "name": "Agent Prompt Architect",
  "description": "...",
  "version": "1.0.0",
  "model": "claude-4.5-sonnet",
  "temperature": 0.5,
  "maxTokens": 16000,
  "topP": 0.95,
  "systemPrompt": "# **IDENTITY & MISSION**\n...",
  "tools": ["semantic_search", "grep_search", ...],
  "hooks": {
    "beforeExecution": ["logAgentStart", ...],
    "afterExecution": ["logAgentCompletion", ...],
    "onError": ["logError", ...]
  },
  "evaluation": {
    "metrics": ["clarity_score", ...],
    "criteria": {...}
  },
  "mutation": {
    "strategies": [{
      "name": "clarity_enhancement",
      "description": "...",
      "parameters": {...}
    }]
  }
}
```

**Key Differentiator:** 
- Designed for MCP server integration
- Lifecycle hooks for telemetry
- Meta-level agents (create other agents)
- Extremely detailed instructions (10x more detailed than marketplace agents)

---

### 1.4 Voice/MCP Project Configs
**Location:** Various subdirectories

| File Path | Purpose | Schema Type | Config Details |
|-----------|---------|-------------|---------------|
| `voice-control-mcp\agent.config.json` | Voice control | MCP Agent Config | Model routing, optimization targets, evolution config |
| `voice-agent-livekit\mcp-servers.json` | MCP servers list | Server Config | Not an agent definition |
| `ui-design-mcp\design-mockups\catalog.json` | Design catalog | Design Assets | Not an agent definition |

**Subtotal:** 1 agent config

**Schema Details (agent.config.json):**
```json
{
  "agent": {
    "name": "voice-control-assistant",
    "version": "1.0.0",
    "type": "mcp-server",
    "description": "...",
    "category": "automation",
    "capabilities": [...],
    "model_config": {
      "default_model": "grok-4-fast",
      "model_routing": {...},
      "sampling_config": {...}
    },
    "optimization_targets": [{
      "name": "command_accuracy",
      "target_value": 0.95,
      "weight": 0.4
    }],
    "evolution_config": {...},
    "safety_config": {...}
  }
}
```

**Key Differentiator:**
- Domain-specific (voice control, desktop automation)
- Model routing strategies
- Safety and optimization configs
- Evolution settings embedded

---

### 1.5 Python Dataclass Definitions
**Location:** `c:\Users\ephoe\Documents\Coding_Projects\Agents\src\agent_registry.py`

**Schema:** Python `@dataclass`

```python
@dataclass
class Agent:
    # Identity
    id: str
    name: str
    description: str
    creator: str
    category: AgentCategory
    version: str = "1.0.0"
    
    # Performance metrics
    performance_score: float = 0.0
    tasks_completed: int = 0
    success_rate: float = 0.0
    avg_response_time: float = 0.0
    user_rating: float = 0.0
    
    # Economics
    price_per_execution: float = 0.01
    total_earnings: float = 0.0
    revenue_30d: float = 0.0
    
    # Evolution tracking
    generation: int = 0
    parent_agents: List[str]
    mutations: List[str]
    
    # Implementation
    system_prompt: str = ""
    tools: List[str]
    model: str = "gpt-4-turbo"
    parameters: Dict[str, Any]
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
```

**Usage:** Runtime agent management in Python backend  
**Storage:** Serializes to JSON (marketplace files)  
**Count:** 0 direct definitions (only class definition)

**Key Differentiator:**
- Runtime schema for agent execution
- Includes economics and evolution tracking
- Performance metrics integrated
- Serialization methods for JSON storage

---

### 1.6 TypeScript Interface Definitions
**Location:** `c:\Users\ephoe\Documents\Coding_Projects\Agents\agent-platform\mcp-server\src\services\agent-registry.ts`

**Schema:** TypeScript `interface`

```typescript
export interface AgentConfig {
  id: string;
  name: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  enabledTools?: string[];
  toolkits?: string[];
  skills?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```

**Usage:** MCP server agent configuration  
**Storage:** In-memory Map (production would use database)  
**Count:** 0 direct definitions (only interface)

**Key Differentiator:**
- Lightweight config format
- Supports toolkits and skills
- MCP server integration
- Metadata extensibility

---

### 1.7 Skills Collection (Special Format)
**Location:** `c:\Users\ephoe\Documents\Coding_Projects\Agents\collections\skills\`

| File | Type | Schema |
|------|------|--------|
| `image_processing\photoshop-expert.json` | Skill Definition | Enhanced with rules + activation patterns |

**Schema Details:**
```json
{
  "id": "photoshop-expert",
  "name": "Photoshop Expert Automation",
  "domain": "image_processing",
  "version": "1.0.0",
  "system_prompt": "...",
  "rules": [{
    "directive": "Use Ctrl+J to duplicate layers...",
    "priority": 95,
    "activation_patterns": ["**/*.psd"],
    "tags": ["efficiency", "shortcuts"]
  }],
  "activation_patterns": ["tasks/image-editing/*", "**/*.psd"],
  "activation_conditions": ["task.type == 'image_editing'"],
  "required_tools": ["desktop-control", "screen-capture"],
  "optional_tools": ["ocr", "image-comparison"],
  "tool_configurations": {...}
}
```

**Subtotal:** 1 skill definition

**Key Differentiator:**
- Rules-based system with priorities
- Activation patterns (glob matching)
- Activation conditions (boolean expressions)
- Tool configurations embedded
- Domain-specific knowledge encoding

---

## 2. Schema Variations Summary

### Schema Type Comparison

| Schema Type | Location | Agent Count | System Prompt | Tools | Metrics | Evaluator | Mutator | Examples |
|------------|----------|-------------|---------------|-------|---------|-----------|---------|----------|
| **Marketplace Agent** | Root JSON files | 22 | ✅ Basic | ✅ Array | ✅ Full | ❌ No | ❌ No | ❌ No |
| **Collection Agent** | collections/*.json | 20 | ✅ Detailed | ✅ Req+Opt | ✅ Score | ✅ Yes | ✅ Yes | ✅ Yes |
| **Meta-Agent** | mcp-server/meta-agents | 3 | ✅ Extreme | ✅ MCP | ✅ Hooks | ✅ Yes | ✅ Yes | ❌ No |
| **MCP Config** | voice-control-mcp | 1 | ❌ No | ❌ No | ✅ Targets | ❌ No | ✅ Evolution | ❌ No |
| **Skill** | collections/skills | 1 | ✅ Detailed | ✅ Config | ❌ No | ❌ No | ❌ No | ❌ No |
| **Python Dataclass** | src/*.py | 0 (schema) | ✅ Field | ✅ Field | ✅ Fields | ❌ No | ❌ No | ❌ No |
| **TS Interface** | mcp-server/src | 0 (schema) | ✅ Optional | ✅ Arrays | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 3. Storage Format Details by Location

### 3.1 Root Registry Files (Marketplace Schema)
- **Format:** Flat JSON dictionary (agent_id → agent_object)
- **Strengths:** 
  - Simple structure
  - Full performance metrics
  - Economic tracking
  - Evolution lineage
- **Weaknesses:**
  - No optimization framework
  - Minimal documentation
  - No examples
  - No evaluation criteria
- **Use Case:** Runtime marketplace operations, agent discovery

### 3.2 Collection Files (Enhanced Schema)
- **Format:** Standalone JSON files, one per agent
- **Strengths:**
  - Comprehensive instruction sets
  - Built-in optimization (eval + mutator)
  - Examples for testing
  - Template-based interaction
  - Hierarchical organization (collection/subsection)
- **Weaknesses:**
  - No runtime metrics (separate tracking)
  - File-based (not database)
- **Use Case:** Production agent definitions, optimization experiments

### 3.3 MCP Meta-Agents (Enhanced + Hooks)
- **Format:** Standalone JSON with lifecycle hooks
- **Strengths:**
  - Extremely detailed instructions
  - MCP tool integration
  - Telemetry hooks
  - Meta-agent capabilities
  - Evaluation framework
- **Weaknesses:**
  - Heavy weight (16K tokens)
  - Not suitable for simple agents
- **Use Case:** System-level agents, agent creation, workflow design

### 3.4 Python Dataclass (Runtime Schema)
- **Format:** Python class with serialization
- **Strengths:**
  - Type safety
  - Runtime validation
  - Method support (to_dict, from_dict)
  - IDE integration
- **Weaknesses:**
  - Python-specific
  - No optimization framework
- **Use Case:** Backend agent management, execution engine

### 3.5 TypeScript Interface (Runtime Schema)
- **Format:** TypeScript interface
- **Strengths:**
  - Type safety
  - Lightweight
  - Flexible metadata
  - MCP integration
- **Weaknesses:**
  - Minimal structure
  - No optimization
- **Use Case:** MCP server agent registry

### 3.6 Skill Format (Rule-Based)
- **Format:** JSON with rules + activation system
- **Strengths:**
  - Priority-based rule execution
  - Pattern matching activation
  - Tool configuration
  - Domain expertise encoding
- **Weaknesses:**
  - Custom format
  - Limited to specific use cases
- **Use Case:** Domain-specific automation skills

---

## 4. Agent Inventory by Collection

### Business Agents Collection (10 agents)
**Location:** `collections/business-agents/`

| Subsection | Agent ID | Has Evaluator | Has Mutator | Optimization Threshold |
|------------|----------|---------------|-------------|----------------------|
| automation | web-research-automation-agent | ✅ | ✅ | 0.80 |
| education | education-learning-optimizer | ✅ | ✅ | 0.82 |
| governance | policy-optimization-agent | ✅ | ✅ | 0.75 |
| healthcare | healthcare-treatment-optimizer | ✅ | ✅ | 0.85 |
| product | product-design-optimizer | ✅ | ✅ | 0.80 |
| sales | linkedin-prospect-researcher | ✅ | ✅ | 0.78 |
| sales | email-deliverability-validator | ✅ | ✅ | 0.80 |
| sales | cold-email-reply-classifier | ✅ | ✅ | 0.85 |

**Characteristics:**
- Revenue-focused business operations
- Detailed evaluation criteria
- Mutation strategies for continuous improvement
- 1000-5000 token system prompts
- Real-world use case examples

---

### Meta-Agents Collection (5 agents)
**Location:** `collections/meta-agents/`

| Subsection | Agent ID | Purpose | System Prompt Size |
|------------|----------|---------|-------------------|
| core | agent-genesis-architect | Creates business agents | 5000+ tokens |
| core | evaluator-creator | Creates evaluation frameworks | Unknown |
| core | mutator-creator | Creates mutation strategies | Unknown |
| skills | skill-creator | Creates skill definitions | Unknown |
| strategy | project-architect | Strategic project planning | Unknown |
| strategy | ui-ux-strategist | UI/UX strategy | Unknown |

**Characteristics:**
- System-level agents
- Create other agents/components
- Extremely detailed instructions
- Platform integration focus

---

### Research Collection (2 agents)
**Location:** `collections/research/`

| Subsection | Agent ID | Current Score | Threshold |
|------------|----------|---------------|-----------|
| data-analysis | data-analyzer | Unknown | 0.85 |
| literature-review | literature-synthesizer | 0.71 | 0.85 |

**Characteristics:**
- Academic/scientific focus
- High quality standards
- Rigorous evaluation

---

### Creative Tools Collection (2 agents)
**Location:** `collections/creative-tools/`

| Subsection | Agent ID | Type |
|------------|----------|------|
| photoshop | color-correction-agent | Agent |
| photoshop | (photoshop-expert) | Skill (in skills/) |

---

### Web Development Collection (2 agents)
**Location:** `collections/web-development/`

| Subsection | Agent ID |
|------------|----------|
| backend | api-endpoint-designer |
| frontend | react-component-generator |

---

### Skills Collection (1 skill)
**Location:** `collections/skills/`

| Domain | Skill ID | Rules Count |
|--------|----------|-------------|
| image_processing | photoshop-expert | 10 rules |

---

### Marketplace Agents (22 instances, ~10 unique)
**Location:** Root JSON files

**Unique Agents** (names from marketplace.json):
1. Academic Scholar (research)
2. Web Research Pro (research)
3. Data Analyst Pro (analysis)
4. Technical Writer Pro (writing)
5. Code Reviewer (coding)
6. ...and 5 more

**Characteristics:**
- Simple schema
- Performance tracking
- Economics integration
- Multiple instances across files (staging, demo, production)

---

### MCP Meta-Agents (3 agents)
**Location:** `agent-platform/mcp-server/meta-agents/`

1. **agent-architect-001** - Creates agent system prompts
2. **workflow-designer-001** - Designs multi-step workflows
3. **telemetry-specialist-001** - Performance optimization

**Characteristics:**
- 12,000-16,000 token instructions
- MCP tool integration
- Lifecycle hooks
- Advanced evaluation frameworks

---

## 5. Total Agent Count Analysis

### Direct Count
- Root JSON registries: **22 instances** (~10 unique agents, some duplicates)
- Collection JSON files: **20 agents**
- MCP meta-agents: **3 agents**
- Voice control config: **1 agent**
- Skills: **1 skill**

**Raw Total:** 47 agent/skill definitions

### Deduplicated Count
Removing duplicates across marketplace files:
- **Unique marketplace agents:** ~10
- **Collection agents:** 20
- **MCP meta-agents:** 3
- **Voice control:** 1
- **Skills:** 1

**Unique Total:** ~35 unique agent definitions

### By Sophistication Level
- **Production-ready with optimization:** 23 (collections + MCP meta-agents)
- **Marketplace runtime agents:** 10
- **Domain-specific configs:** 2

---

## 6. Field Presence Analysis

### System Prompt Coverage
- **Has system prompt:** 36/35 agents (100%)
- **Detailed (1000+ tokens):** 23 agents
- **Basic (100-500 tokens):** 10 agents
- **Config-only (no prompt):** 2 agents

### Tools Coverage
- **Has tools list:** 36/35 agents (100%)
- **Required + optional split:** 20 agents
- **Simple array:** 13 agents
- **Tool configurations:** 1 agent (skill)

### Performance Metrics
- **Full metrics tracking:** 22 agents (marketplace schema)
- **Score + history:** 20 agents (collection schema)
- **Optimization targets:** 1 agent (voice control)
- **No metrics:** 3 agents (MCP meta-agents use hooks instead)

### Optimization Framework
- **Has evaluator:** 23 agents
- **Has mutator:** 23 agents
- **Has examples:** 20 agents
- **Has none:** 13 agents

---

## 7. Consolidation Priority Recommendations

### HIGH PRIORITY (Do First)

#### 1. Unify Collection Schema
**Problem:** Collection agents (20) use enhanced schema, but marketplace agents (10) use basic schema.

**Recommendation:**
- Migrate all marketplace agents to collection schema format
- Add evaluator + mutator to existing agents
- Create examples for each agent
- Store in unified collection structure

**Impact:** Enables optimization for all agents

---

#### 2. Centralize Storage
**Problem:** Agents scattered across 7+ locations with different formats.

**Recommendation:**
- Single source of truth: `collections/` directory
- One JSON file per agent
- Standardized naming: `{collection}/{subsection}/{agent-id}.json`
- Runtime registries (marketplace.json) become views/caches

**Impact:** Eliminates duplication, simplifies management

---

#### 3. Standardize Runtime Tracking
**Problem:** Performance metrics in marketplace schema, but not in collection schema.

**Recommendation:**
- Separate concerns: Definition (static) vs. Metrics (dynamic)
- Agent definition files: Collections (no runtime metrics)
- Runtime metrics: Database or separate tracking files
- Link by agent ID

**Impact:** Clean separation, better scalability

---

### MEDIUM PRIORITY (Do Soon)

#### 4. Consolidate Python/TS Schemas
**Problem:** Three schemas (JSON, Python dataclass, TS interface) must stay in sync.

**Recommendation:**
- Generate Python/TS from JSON schema
- Use JSON Schema validation
- Auto-generate types at build time

**Impact:** Reduced maintenance, guaranteed consistency

---

#### 5. Unified Skill System
**Problem:** Skills use different schema (rules, activation patterns).

**Recommendation:**
- Integrate skills into main agent schema
- Add optional fields: `rules[]`, `activationPatterns[]`
- Skills become specialized agents
- Or: Keep separate but reference from agents

**Impact:** Unified management, simpler system

---

### LOW PRIORITY (Nice to Have)

#### 6. MCP Config Integration
**Problem:** Voice control uses custom config format.

**Recommendation:**
- Migrate to unified collection schema
- Map custom fields to standard schema
- Keep domain-specific in metadata

**Impact:** One less schema variant

---

#### 7. Database Migration
**Problem:** File-based storage limits scalability.

**Recommendation:**
- Keep files as source of truth
- Load into database at runtime
- Use files for version control
- Database for queries and updates

**Impact:** Better performance, easier queries

---

## 8. Suggested Target Collection Structure

### Unified Schema Proposal

```json
{
  // === IDENTITY ===
  "id": "unique-agent-id",
  "name": "Human-Readable Name",
  "description": "Brief description",
  "collection": "business-agents|meta-agents|research|creative-tools|web-dev",
  "subsection": "sales|automation|core|...",
  "version": "1.0.0",
  "category": "research|coding|analysis|...",  // For marketplace compatibility
  "tags": ["tag1", "tag2"],
  "difficulty": "beginner|intermediate|advanced",
  "author": "creator-id",
  "createdAt": "ISO_DATE",
  "updatedAt": "ISO_DATE",
  
  // === AGENT DEFINITION ===
  "systemPrompt": "# Identity...\n# Capabilities...\n# Protocols...",
  "userPromptTemplate": "**Request**\nParam: {param}\n...",
  "examples": [{
    "input": "...",
    "output": "...",
    "explanation": "..."
  }],
  
  // === MODEL CONFIG ===
  "model": "claude-4.5-sonnet",
  "temperature": 0.7,
  "maxTokens": 4000,
  "topP": 0.9,
  
  // === TOOLS & CAPABILITIES ===
  "requiredTools": ["tool1"],
  "optionalTools": ["tool2"],
  "toolkits": ["toolkit1"],
  "skills": ["skill1"],
  "toolConfigurations": {},  // For skill-like tool configs
  
  // === OPTIMIZATION FRAMEWORK ===
  "evaluator": {
    "type": "llm-judge|automated-test|rule-based",
    "implementation": "evaluators/path/eval.py",
    "successCriteria": [{
      "name": "criterion1",
      "description": "...",
      "weight": 0.3,
      "required": true
    }],
    "weightedMetrics": [{
      "name": "metric1",
      "weight": 0.5,
      "target": 0.85,
      "aggregation": "mean"
    }]
  },
  "mutator": {
    "strategies": ["strategy1", "strategy2"],
    "constraints": [{
      "name": "constraint1",
      "type": "content|performance|complexity",
      "value": true
    }],
    "implementation": "mutators/path/mutator.py",
    "mutationRate": 0.25
  },
  "optimizationThreshold": 0.85,
  "currentScore": 0.75,
  "optimizationHistory": [],
  
  // === LIFECYCLE HOOKS (optional, for MCP) ===
  "hooks": {
    "beforeExecution": ["hook1"],
    "afterExecution": ["hook2"],
    "onError": ["hook3"]
  },
  
  // === RULES (optional, for skill-like behavior) ===
  "rules": [{
    "directive": "Rule text",
    "priority": 95,
    "activationPatterns": ["pattern1"],
    "activationConditions": ["condition1"],
    "tags": ["tag1"]
  }],
  
  // === METADATA ===
  "metadata": {
    "estimatedTokens": 1200,
    "complexity": "high",
    "dependencies": ["agent-id-1"],
    "economicModel": {
      "pricePerExecution": 0.10,
      "currency": "USD"
    },
    "evolutionConfig": {
      "generation": 0,
      "parentAgents": [],
      "mutations": []
    }
  }
}
```

### Storage Structure

```
collections/
├── business-agents/
│   ├── sales/
│   │   ├── linkedin-prospect-researcher.json
│   │   ├── email-deliverability-validator.json
│   │   └── cold-email-reply-classifier.json
│   ├── marketing/
│   ├── product/
│   └── ...
├── meta-agents/
│   ├── core/
│   │   ├── agent-genesis-architect.json
│   │   ├── agent-architect.json           # Merged from MCP
│   │   └── ...
│   └── ...
├── research/
├── creative-tools/
├── web-development/
└── skills/                                 # Optional: keep separate or merge
```

### Runtime Tracking (Separate)

```
runtime/
├── metrics/
│   └── {agent-id}.json                     # Performance metrics
├── cache/
│   └── marketplace.json                    # Cached marketplace view
└── logs/
    └── executions/
        └── {agent-id}/
            └── {execution-id}.json
```

---

## 9. Migration Path

### Phase 1: Consolidate Collections (Week 1)
1. ✅ Create unified schema definition (above)
2. Migrate marketplace agents to collection format
   - Add evaluators
   - Add mutators
   - Add examples
3. Move MCP meta-agents to collections/meta-agents/core/
4. Validate all agents against schema

**Output:** All agents in unified format

---

### Phase 2: Implement Runtime Separation (Week 2)
1. Create runtime metrics database schema
2. Extract performance metrics from marketplace files
3. Implement metrics service (separate from definitions)
4. Update agent execution to track metrics separately
5. Create marketplace cache/view generator

**Output:** Clean separation of definition vs. runtime data

---

### Phase 3: Generate Type Definitions (Week 2)
1. Create JSON Schema for unified agent format
2. Generate Python dataclass from schema
3. Generate TypeScript interface from schema
4. Add validation at load time
5. Update tests

**Output:** Type-safe schemas, automatic sync

---

### Phase 4: Implement Collection System (Week 3)
1. Collection manager service
2. Agent discovery by collection/subsection
3. Search and filtering
4. Version management
5. Hot-reload support

**Output:** Production-ready collection system

---

### Phase 5: Migration & Cleanup (Week 4)
1. Migrate remaining configs (voice control)
2. Remove duplicate files
3. Update documentation
4. Update tooling (CLI, UI)
5. Archive old formats

**Output:** Fully consolidated system

---

## 10. Key Insights

### What We Learned

1. **Schema Fragmentation:** 5+ different schemas for essentially the same concept (agent definition)
2. **Optimization Split:** Best agents have evaluators + mutators, but only 23/35 have them
3. **Location Chaos:** Agents in 7+ different locations with no clear organization
4. **Runtime Confusion:** Performance metrics mixed with static definitions
5. **Duplication:** Same agents stored in 4 different JSON files
6. **Untapped Potential:** Many agents lack optimization framework that could make them better

### Critical Success Factors

1. **Single Schema:** One unified schema covers all use cases (with optional fields)
2. **Single Location:** One directory structure for all agents
3. **Separation of Concerns:** Definitions (static) separate from metrics (dynamic)
4. **Type Safety:** Generated types keep Python/TS in sync with JSON
5. **Optimization First:** All agents should have evaluator + mutator
6. **Examples Required:** Every agent needs examples for testing

### Risks

1. **Breaking Changes:** Migration will break existing code
2. **Data Loss:** Must carefully preserve all metrics during migration
3. **Complexity:** Unified schema might be too complex for simple agents
4. **Backward Compatibility:** Need migration path for existing users

---

## Appendix A: File Locations Reference

### All Agent Definition Files

```
ROOT LEVEL:
- agents_registry.json (2 agents)
- marketplace_agents.json (5 agents)
- marketplace.json (10 agents)
- marketplace_demo.json (5 agents)

COLLECTIONS:
- collections/business-agents/automation/web-research-automation-agent.json
- collections/business-agents/education/education-learning-optimizer.json
- collections/business-agents/governance/policy-optimization-agent.json
- collections/business-agents/healthcare/healthcare-treatment-optimizer.json
- collections/business-agents/product/product-design-optimizer.json
- collections/business-agents/sales/linkedin-prospect-researcher.json
- collections/business-agents/sales/email-deliverability-validator.json
- collections/business-agents/sales/cold-email-reply-classifier.json
- collections/creative-tools/photoshop/color-correction-agent.json
- collections/meta-agents/core/agent-genesis-architect.json
- collections/meta-agents/core/evaluator-creator.json
- collections/meta-agents/core/mutator-creator.json
- collections/meta-agents/skills/skill-creator.json
- collections/meta-agents/strategy/project-architect.json
- collections/meta-agents/strategy/ui-ux-strategist.json
- collections/research/data-analysis/data-analyzer.json
- collections/research/literature-review/literature-synthesizer.json
- collections/skills/image_processing/photoshop-expert.json
- collections/web-development/backend/api-endpoint-designer.json
- collections/web-development/frontend/react-component-generator.json

MCP META-AGENTS:
- agent-platform/mcp-server/meta-agents/agent-architect.json
- agent-platform/mcp-server/meta-agents/workflow-designer.json
- agent-platform/mcp-server/meta-agents/telemetry-specialist.json

OTHER CONFIGS:
- voice-control-mcp/agent.config.json

SCHEMA DEFINITIONS:
- src/agent_registry.py (Python dataclass)
- agent-platform/mcp-server/src/services/agent-registry.ts (TS interface)
```

---

## Appendix B: Schema Comparison Matrix

| Feature | Marketplace | Collection | MCP Meta | Voice Config | Skill | Python | TypeScript |
|---------|------------|------------|----------|--------------|-------|--------|------------|
| ID | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Name | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Version | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| System Prompt | ✅ Basic | ✅ Detailed | ✅ Extreme | ❌ | ✅ Detailed | ✅ Field | ✅ Optional |
| Tools List | ✅ Array | ✅ Req+Opt | ✅ MCP | ❌ | ✅ Configured | ✅ Field | ✅ Arrays |
| Model Config | ✅ | ✅ | ✅ | ✅ Routing | ❌ | ✅ | ✅ |
| Performance Metrics | ✅ Full | ✅ Score | ❌ | ✅ Targets | ❌ | ✅ Full | ❌ |
| Evaluator | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mutator | ❌ | ✅ | ✅ | ✅ Evolution | ❌ | ❌ | ❌ |
| Examples | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User Template | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Hooks | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rules | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Economics | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Evolution | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |

---

**End of Report**
