# Agent Consolidation Quick Reference

**Generated:** November 13, 2025  
**Full Report:** See `AGENT_INVENTORY_REPORT.md`

---

## At a Glance

**Total Agents Found:** 45+ definitions  
**Unique Agents:** ~35 (after deduplication)  
**Storage Locations:** 7 types  
**Schema Variants:** 5 major formats  
**Production-Ready:** 23 agents (with optimization)

---

## Critical Findings

### ❌ Problems Identified

1. **Schema Chaos:** 5 different schemas for same concept
2. **Location Sprawl:** Agents in 7+ different places
3. **Duplication:** Same agents in 4+ JSON files
4. **Mixed Concerns:** Performance metrics + definitions together
5. **Optimization Gap:** Only 23/35 agents have evaluator+mutator

### ✅ What's Working

1. **Collection Format:** Best schema (detailed, with optimization)
2. **Organization:** collections/{domain}/{subsection}/ structure is clean
3. **Meta-Agents:** Extremely detailed, production-quality
4. **Examples:** Collection agents have usage examples

---

## Storage Breakdown

| Location | Count | Schema | Status |
|----------|-------|--------|--------|
| Root JSON registries | 22 instances | Marketplace | ⚠️ Needs migration |
| collections/*.json | 20 agents | Enhanced | ✅ Keep as-is |
| mcp-server/meta-agents | 3 agents | Enhanced+ | ⚠️ Move to collections |
| voice-control | 1 agent | Custom | ⚠️ Migrate |
| skills | 1 skill | Rules-based | ⚠️ Integrate |

---

## Schema Comparison

| Feature | Marketplace | Collection | MCP Meta |
|---------|------------|------------|----------|
| System Prompt | Basic | Detailed | Extreme |
| Tools | Array | Req+Opt | MCP List |
| Metrics | Full | Score | Hooks |
| Evaluator | ❌ | ✅ | ✅ |
| Mutator | ❌ | ✅ | ✅ |
| Examples | ❌ | ✅ | ❌ |

**Winner:** Collection schema with additions from MCP meta

---

## Recommended Target Schema

```json
{
  // IDENTITY
  "id": "agent-id",
  "name": "Agent Name",
  "collection": "business-agents",
  "subsection": "sales",
  "version": "1.0.0",
  
  // DEFINITION
  "systemPrompt": "Detailed instructions...",
  "userPromptTemplate": "Request template...",
  "examples": [{...}],
  
  // MODEL
  "model": "claude-4.5-sonnet",
  "temperature": 0.7,
  "maxTokens": 4000,
  
  // TOOLS
  "requiredTools": ["tool1"],
  "optionalTools": ["tool2"],
  "toolkits": ["toolkit1"],
  
  // OPTIMIZATION
  "evaluator": {...},
  "mutator": {...},
  "optimizationThreshold": 0.85,
  
  // OPTIONAL: MCP hooks, rules, metadata
}
```

---

## Migration Priority

### 🔴 HIGH (Do First)

1. **Unify Collection Schema**
   - Migrate 22 marketplace agents → collection format
   - Add evaluator + mutator to each
   - Add examples

2. **Centralize Storage**
   - Move everything to collections/ directory
   - One file per agent
   - Standard naming

3. **Separate Runtime Data**
   - Performance metrics → separate database
   - Agent definitions → static collections
   - Link by ID

### 🟡 MEDIUM (Do Soon)

4. **Consolidate Type Definitions**
   - Generate Python/TS from JSON Schema
   - Auto-sync at build time

5. **Integrate Skills**
   - Add rules/activation to main schema
   - Move to collections/

### 🟢 LOW (Nice to Have)

6. **Database Migration**
   - Keep files as source of truth
   - Load to DB at runtime

---

## Quick Migration Steps

### Week 1: Schema Unification
```bash
# 1. Create unified schema definition
# 2. Migrate marketplace agents
# 3. Move MCP meta-agents
# 4. Validate all agents
```

### Week 2: Runtime Separation
```bash
# 1. Create metrics database
# 2. Extract performance data
# 3. Update execution engine
# 4. Generate marketplace cache
```

### Week 3: Type Safety
```bash
# 1. JSON Schema definition
# 2. Generate Python dataclass
# 3. Generate TS interface
# 4. Add validation
```

### Week 4: Production
```bash
# 1. Collection manager service
# 2. Clean up old files
# 3. Update docs
# 4. Deploy
```

---

## File Locations

### Root Level (Legacy)
- `agents_registry.json` (2 agents)
- `marketplace_agents.json` (5 agents)
- `marketplace.json` (10 agents)
- `marketplace_demo.json` (5 agents)

### Collections (Keep)
```
collections/
├── business-agents/     (10 agents)
│   ├── sales/           (3 agents)
│   ├── automation/      (1 agent)
│   ├── education/       (1 agent)
│   ├── governance/      (1 agent)
│   ├── healthcare/      (1 agent)
│   └── product/         (1 agent)
├── meta-agents/         (5 agents)
├── research/            (2 agents)
├── creative-tools/      (2 agents)
├── web-development/     (2 agents)
└── skills/              (1 skill)
```

### MCP Meta-Agents (Migrate)
- `agent-platform/mcp-server/meta-agents/` (3 agents)

### Other (Migrate)
- `voice-control-mcp/agent.config.json` (1 agent)

---

## Key Metrics

### Agent Distribution
- Business agents: 10
- Meta-agents: 8 (5 collections + 3 MCP)
- Research: 2
- Creative tools: 2
- Web development: 2
- Skills: 1
- Marketplace runtime: 10

### Schema Distribution
- Enhanced (with optimization): 23 agents (66%)
- Basic (marketplace): 10 agents (29%)
- Custom: 2 agents (6%)

### Optimization Coverage
- Has evaluator: 23 agents (66%)
- Has mutator: 23 agents (66%)
- Has examples: 20 agents (57%)
- Has all three: 20 agents (57%)

---

## Success Criteria

After consolidation, we should have:

✅ **Single Schema:** All agents use unified collection format  
✅ **Single Location:** All agents in collections/ directory  
✅ **100% Optimization:** All agents have evaluator + mutator  
✅ **Type Safety:** Auto-generated Python/TS schemas  
✅ **Clean Separation:** Definitions vs. runtime metrics  
✅ **Zero Duplication:** Each agent defined once  
✅ **Easy Discovery:** Collection-based organization  

---

## Next Actions

1. **Review this report** with team
2. **Prioritize schemas** to keep vs. merge
3. **Design unified schema** (start with collection format)
4. **Create migration script** for marketplace agents
5. **Test on 1-2 agents** before full migration
6. **Update documentation** and tooling
7. **Execute 4-week migration plan**

---

**For detailed analysis, see:** `AGENT_INVENTORY_REPORT.md`
