# Agent Consolidation & Migration Plan

**Date:** November 13, 2025  
**Status:** Ready to Execute  
**Priority:** HIGH

---

## Overview

This plan consolidates 45+ agent definitions scattered across 7 storage locations into a unified collection system with proper skills, workflows, teams, and optimization capabilities.

## Goals

1. **Unify Storage**: All agents in `collections/` directory with consistent schema
2. **Separate Concerns**: Static definitions vs. runtime performance metrics
3. **Enable Optimization**: All agents have evaluator + mutator
4. **Add Skills**: Create reusable skill modules
5. **Build Teams**: Pre-configured multi-agent collaboration teams
6. **Create Workflows**: Orchestration patterns for common tasks
7. **Async Support**: Long-running agent tasks and workflows

---

## Target Architecture

```
collections/
├── agents/                  # All unified agent definitions
│   ├── business/           # Business-focused agents
│   │   ├── sales/
│   │   ├── marketing/
│   │   ├── customer-success/
│   │   └── ...
│   ├── creative/           # Creative tools
│   ├── development/        # Coding & development
│   ├── research/           # Research agents
│   └── meta/               # Meta-agents
│
├── skills/                 # Reusable skill definitions
│   ├── coding/
│   ├── research/
│   ├── analysis/
│   └── ...
│
├── workflows/              # Multi-step orchestrations
│   ├── content-creation/
│   ├── code-review/
│   └── ...
│
└── teams/                  # Pre-configured agent teams
    ├── design-review-team/
    ├── code-review-team/
    └── ...
```

---

## Unified Agent Schema

```json
{
  // IDENTITY
  "id": "unique-agent-id",
  "name": "Human Readable Name",
  "description": "Brief description of capabilities",
  "collection": "agents",
  "subsection": "business/sales",
  "version": "1.0.0",
  "tags": ["tag1", "tag2"],
  
  // DEFINITION
  "systemPrompt": "Detailed instructions with frameworks, protocols, examples...",
  "userPromptTemplate": "Template with {parameters} for user input",
  "examples": [
    {
      "input": "Example user request",
      "output": "Expected agent output",
      "explanation": "Why this is a good example"
    }
  ],
  
  // MODEL CONFIGURATION
  "model": "claude-4.5-sonnet",
  "temperature": 0.7,
  "maxTokens": 4000,
  "topP": 0.95,
  
  // TOOLS & CAPABILITIES
  "requiredTools": ["tool1", "tool2"],
  "optionalTools": ["tool3", "tool4"],
  "toolkits": ["toolkit1"],
  "skills": ["skill1", "skill2"],
  
  // OPTIMIZATION
  "evaluator": {
    "type": "llm-judge",
    "implementation": "evaluators/path/eval.py",
    "successCriteria": [
      {
        "name": "criterion_name",
        "description": "What to measure",
        "weight": 0.3,
        "required": true
      }
    ],
    "weightedMetrics": [
      {
        "name": "metric_name",
        "weight": 0.5,
        "aggregation": "mean"
      }
    ]
  },
  "mutator": {
    "strategies": ["strategy1", "strategy2"],
    "constraints": [
      {
        "name": "constraint_name",
        "type": "content",
        "value": true
      }
    ],
    "mutationRate": 0.25
  },
  "optimizationThreshold": 0.85,
  "currentScore": 0.75,
  "optimizationHistory": [],
  
  // METADATA
  "difficulty": "intermediate",
  "estimatedTokens": 2000,
  "createdAt": "2025-11-13T00:00:00Z",
  "updatedAt": "2025-11-13T00:00:00Z",
  "createdBy": "creator-id"
}
```

---

## Migration Phases

### Phase 1: Collection Schema Setup ✅ READY

Create database collections:
- [x] `unified-agents` - All agent definitions
- [x] `agent-performance-metrics` - Runtime performance data (separate!)
- [x] `unified-skills` - Reusable skill modules
- [x] `agent-workflows` - Multi-step orchestrations
- [x] `agent-teams` - Pre-configured teams

**Status:** Schema designed, ready to implement

### Phase 2: Core Agent Migration (Week 1)

**Target:** 20 collection JSON agents (already best format)

1. **Validate Existing** 
   - Read all `collections/**/*.json` agents
   - Verify schema compliance
   - Check for missing fields

2. **Enhance**
   - Add missing evaluators (7 agents need)
   - Add missing mutators (7 agents need)
   - Add examples where missing (5 agents need)
   - Add userPromptTemplate (10 agents need)

3. **Reorganize**
   - Move to standardized paths
   - Update collection/subsection fields
   - Ensure consistent naming

**Scripts Needed:**
- `scripts/validate-collection-agents.ts`
- `scripts/enhance-agents.ts`
- `scripts/reorganize-collections.ts`

### Phase 3: Marketplace Agent Migration (Week 1-2)

**Target:** 22 marketplace JSON agents

1. **Extract**
   - Read `marketplace_agents.json`, `agents_registry.json`, etc.
   - Parse marketplace schema

2. **Transform**
   - Convert to unified schema
   - Preserve performance data separately
   - Generate evaluator + mutator for each
   - Add examples based on description
   - Create userPromptTemplate

3. **Import**
   - Save to `collections/agents/` with proper categorization
   - Store performance metrics in separate collection

**Scripts Needed:**
- `scripts/migrate-marketplace-agents.ts`
- `scripts/generate-optimization-config.ts`
- `scripts/separate-performance-data.ts`

### Phase 4: Meta-Agent Migration (Week 2)

**Target:** 3 MCP meta-agents

1. **Preserve**
   - These are highest quality, most detailed
   - Extract all advanced features (hooks, evaluation metrics)

2. **Adapt**
   - Convert MCP-specific format to unified schema
   - Preserve all detailed instructions
   - Map MCP tools to unified tools

3. **Enhance**
   - Add to `collections/agents/meta/`
   - Keep as reference implementations

**Scripts Needed:**
- `scripts/migrate-meta-agents.ts`

### Phase 5: Skills Creation (Week 2)

**Target:** Create 20-30 reusable skills

1. **Extract from Agents**
   - Analyze agent system prompts
   - Identify common patterns
   - Extract reusable capabilities

2. **Create Skill Modules**
   - Coding skills (type-safety, error-handling, testing)
   - Research skills (citation, fact-checking, synthesis)
   - Analysis skills (data-interpretation, visualization)
   - Communication skills (clarity, persuasion, structure)
   - Problem-solving skills (decomposition, debugging)
   - Meta skills (prompting, self-correction)

3. **Attach to Agents**
   - Update agents to reference skills
   - Remove redundant instructions from system prompts

**Scripts Needed:**
- `scripts/extract-skills.ts`
- `scripts/create-skill-definitions.ts`
- `scripts/attach-skills-to-agents.ts`

### Phase 6: Team Creation (Week 3)

**Target:** Create 10-15 pre-configured teams

1. **Design Review Team**
   - Architect + UX Designer + Security Expert

2. **Code Review Team**
   - Senior Developer + Security Expert + QA Engineer

3. **Content Creation Team**
   - Copywriter + Editor + SEO Expert

4. **Research Team**
   - Academic Researcher + Web Researcher + Synthesis Expert

5. **Business Strategy Team**
   - Market Analyst + Financial Analyst + Product Strategist

6. **Customer Success Team**
   - Support Agent + Success Manager + Product Specialist

**Scripts Needed:**
- `scripts/create-agent-teams.ts`
- `scripts/test-team-execution.ts`

### Phase 7: Workflow Creation (Week 3)

**Target:** Create 10-15 common workflows

1. **Content Pipeline**
   - Research → Outline → Draft → Edit → Optimize

2. **Code Review Pipeline**
   - Lint → Security Scan → Team Review → Approve

3. **Feature Development**
   - Requirement Analysis → Design → Implementation → Testing

4. **Customer Onboarding**
   - Welcome → Setup → Training → Check-in

5. **Sales Outreach**
   - Research → Personalization → Outreach → Follow-up

**Scripts Needed:**
- `scripts/create-workflows.ts`
- `scripts/test-workflow-execution.ts`

### Phase 8: Performance Separation (Week 3-4)

**Target:** Separate runtime data from definitions

1. **Create Performance DB**
   - Design schema for metrics
   - Time-series data structure
   - Aggregation queries

2. **Migrate Historical Data**
   - Extract from marketplace JSONs
   - Store in performance collection
   - Link by agent ID

3. **Update Agent Execution**
   - Log metrics to separate collection
   - Keep definitions immutable
   - Update collection service

**Scripts Needed:**
- `scripts/setup-performance-db.ts`
- `scripts/migrate-performance-data.ts`
- `scripts/update-execution-logging.ts`

### Phase 9: Async & Optimization (Week 4)

**Target:** Enable async execution and optimization

1. **Async Workflows**
   - Long-running workflow support
   - Background execution
   - Status polling
   - Result retrieval

2. **Async Teams**
   - Multi-agent async collaboration
   - Wait handles
   - Timeout management

3. **Optimization Pipeline**
   - Batch optimization runs
   - Evaluator execution
   - Mutator application
   - Score tracking

**Scripts Needed:**
- `scripts/test-async-workflows.ts`
- `scripts/test-async-teams.ts`
- `scripts/run-optimization-pipeline.ts`

### Phase 10: Testing & Validation (Week 4)

**Target:** Comprehensive testing

1. **Unit Tests**
   - Schema validation
   - Collection CRUD operations
   - Skill attachment/composition

2. **Integration Tests**
   - Agent execution with skills
   - Team execution
   - Workflow execution

3. **Performance Tests**
   - Metrics logging
   - Aggregation queries
   - Optimization runs

4. **Migration Verification**
   - All agents migrated
   - No data loss
   - Schema compliance

**Scripts Needed:**
- `scripts/test-unified-system.ts`
- `scripts/verify-migration.ts`
- `scripts/benchmark-performance.ts`

---

## Success Criteria

### Quantitative Metrics
- ✅ 100% of agents migrated to unified schema
- ✅ 0 schema validation errors
- ✅ All agents have evaluator + mutator
- ✅ 20+ reusable skills created
- ✅ 10+ agent teams configured
- ✅ 10+ workflows created
- ✅ Performance data separated
- ✅ All tests passing

### Qualitative Metrics
- ✅ Clean, consistent directory structure
- ✅ Single source of truth for agent definitions
- ✅ Easy to add new agents
- ✅ Skills composable and reusable
- ✅ Teams and workflows functional
- ✅ Documentation complete

---

## Rollback Plan

If migration fails:
1. Original JSONs preserved in `collections-backup/`
2. Git history maintains all versions
3. Can revert to old system within minutes
4. No data loss at any step

---

## Next Steps

1. ✅ Create migration scripts in `scripts/migration/`
2. ✅ Run Phase 1-2 (collection agents)
3. ✅ Run Phase 3 (marketplace agents)
4. ✅ Run Phase 4-10 sequentially
5. ✅ Test and validate
6. ✅ Deploy unified system

---

## Workflow Backlog Integration (New)

The new `WORKFLOW_CATALOG.md` and `workflow_backlog.json` establish a structured pipeline for bringing high-value external workflows (n8n templates, LangGraph social media agent patterns, awesome-ai-apps agents) into the platform.

### Ingestion Meta-Agents
- `external-workflow-harvester` – parses external sources and produces normalized workflow JSON items
- `workflow-catalog-curator` – reprioritizes, updates statuses, proposes evaluator/mutator additions

### Ingestion Flow (Hybrid Migration Augmentation)
1. Select top priorities from backlog (initial top 10 listed in catalog)
2. Harvester meta-agent generates draft workflow JSON → stored in `collections/agent-workflows/`
3. Curator meta-agent evaluates coverage, assigns evaluator draft, and schedules optimization
4. Implement required agents/skills if absent
5. Mark workflow status transitions (planned → in-progress → completed) in both markdown and JSON

### Tracking
- Source-of-truth statuses mirrored: `WORKFLOW_CATALOG.md` (checkboxes) + `workflow_backlog.json` (status field)
- Completed workflows trigger evaluator baseline runs and performance logging to `agent-performance-metrics`

### Success Criteria Extension
- ≥25 workflows ingested in first pass (from initial planned 70)
- Zero duplicate workflow IDs
- 100% ingested workflows have agentsNeeded available or stubbed
- Evaluator template attached to ≥60% of completed workflows

### Upcoming Enhancements
- Script: `generate-workflows-from-external.ts` to be extended with meta-agent invocation
- Add automated diff & collision check before file write
- Attach hooks: beforeExecution (schema validate), afterExecution (metrics log), onError (retry classification)

### Optimization Pipeline Integration
- Baseline evaluation: `workflow:evaluate` produces dynamic `overallScore` per success criterion weights.
- Aggregation & suggestions: `workflow:optimize` writes `workflow_scoreboard.json` with low performers (<0.65 threshold) and hints.
- Improvement tracking: low performer JSON files enriched via `optimizationHints` array for guided iteration.
- Strategy document: `PERFORMANCE_OPTIMIZATION.md` outlines loop, thresholds, and next enhancements.
- Planned next: rolling averages, alerting, mutation previews.
 - Rolling averages implemented: `workflow:rollup` creates `workflow_scoreboard_rolling.json`.
 - Alerts implemented: `workflow:alert` generates `alerts.json` (Slack stub ready via env `SLACK_ALERT_WEBHOOK`).
 - Mutation preview implemented: `workflow:mutate-preview <workflowId>` outputs simulation JSON.
 - Cost & token metrics integrated into evaluation for resource efficiency tracking.

---

---

## Notes

- **Backup Everything:** Full backup before starting
- **Test Incrementally:** Validate after each phase
- **Document Changes:** Update docs as we go
- **Monitor Performance:** Ensure no degradation
- **Communication:** Keep stakeholders informed

---

**Status:** 📋 PLANNED - Ready to execute
**Next Action:** Create migration scripts
