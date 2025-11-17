# Meta-Agent System - Quick Reference Guide

## ✅ System Status: OPERATIONAL

**Server:** ✅ Running (validation errors resolved)  
**Tools:** ✅ 75+ MCP tools available  
**Meta-Agents:** ✅ 3 deployed and ready

---

## 🎯 Quick Commands

### Use Agent Architect
```typescript
// Create a new specialized agent
mcp_agents_execute_agent({
  agentId: "agent-architect-001",
  prompt: "Create a [ROLE] agent that [DOES_WHAT]"
})
```

### Use Workflow Designer
```typescript
// Design a sophisticated workflow
mcp_agents_execute_agent({
  agentId: "workflow-designer-001",
  prompt: "Design a workflow for [TASK] with [N] steps"
})
```

### Use Telemetry Specialist
```typescript
// Set up performance monitoring
mcp_agents_execute_agent({
  agentId: "telemetry-specialist-001",
  prompt: "Optimize agent [AGENT_ID] for [METRICS]"
})
```

---

## 📋 Common Use Cases

### 1. Create a Research Agent
```
Agent Architect → "Create a Research Synthesis Agent that conducts multi-source research, evaluates source credibility, synthesizes findings with proper citations, and produces academic-quality reports. Include protocols for handling contradictory information and optimizing for accuracy over speed."
```

### 2. Design a Content Pipeline
```
Workflow Designer → "Design a content creation workflow: 1) Research topic (parallel sources), 2) Agent team creates outline, 3) Parallel writing of sections, 4) Editing & polish, 5) SEO optimization. Include error handling and quality gates at each step."
```

### 3. Optimize Existing Agent
```
Telemetry Specialist → "Analyze agent 'content-writer-v1' and create: 1) Comprehensive telemetry hooks, 2) Quality evaluation framework, 3) 5 mutation strategies for temperature/model/prompts, 4) A/B testing setup, 5) Weekly optimization report."
```

---

## 🔧 Meta-Agent Details

| Agent | Model | Temp | Tokens | Best For |
|-------|-------|------|--------|----------|
| Agent Architect | Claude 4.5 | 0.5 | 16K | Creating agents |
| Workflow Designer | Claude 4.5 | 0.4 | 16K | Orchestrating workflows |
| Telemetry Specialist | Claude 4.5 | 0.3 | 12K | Monitoring & optimization |

---

## 📊 Performance Targets

### Agent Quality Standards
- Clarity: >90/100
- Completeness: >95/100
- Robustness: >85/100

### Workflow Quality Standards
- Success Rate: >95%
- Parallelization: >85%
- Error Coverage: 100%

### Optimization Impact
- Speed Improvement: +15-40%
- Quality Improvement: +10-25%
- Cost Reduction: +20-40%

---

## 🚀 Workflow Patterns

### Sequential
```
A → B → C → D
```
Simple, predictable, no parallelism

### Parallel Fan-Out
```
      → B1 →
A → → B2 → → D
      → B3 →
```
Maximum speed, needs merge logic

### Conditional
```
A → [if X] → B
    [else] → C
```
Dynamic paths based on data

### Agent Team
```
A → [Team: Creative ↔ Analyst ↔ Critic] → B
```
Multi-perspective collaboration

---

## 💡 Pro Tips

1. **Start Simple**: Create basic agents before complex workflows
2. **Measure Everything**: Always add telemetry
3. **Test Variants**: Compare before deploying
4. **Parallelize Aggressively**: Free performance gains
5. **Document Changes**: Track what works

---

## 🐛 Troubleshooting

### Agent Not Working?
1. Check agent configuration
2. Review telemetry data
3. Use Telemetry Specialist to diagnose
4. Generate improved variant

### Workflow Slow?
1. Analyze critical path
2. Identify bottlenecks
3. Increase parallelization
4. Optimize slow steps

### High Costs?
1. Review token usage
2. Optimize prompt length
3. Implement caching
4. Use cheaper models where appropriate

---

## 📖 File Locations

**Agents:**
- `meta-agents/agent-architect.json`
- `meta-agents/workflow-designer.json`
- `meta-agents/telemetry-specialist.json`

**Documentation:**
- `META_AGENT_SYSTEM_DOCUMENTATION.md` (Complete guide)
- `IMPLEMENTATION_PLAN_META_AGENTS.md` (Implementation roadmap)

**Server:**
- `mcp-server/build/index.js` (Compiled server)
- `mcp-server/src/tools/` (Tool implementations)

---

## 🎓 Learning Sequence

1. ✅ Read documentation
2. ✅ Create first agent with Agent Architect
3. ✅ Design first workflow with Workflow Designer
4. ✅ Add telemetry with Telemetry Specialist
5. ✅ Run optimization loop
6. ✅ Create recursive improvement system

---

## 🔗 Next Steps

### Immediate
- [x] Fix server validation ✅
- [x] Create Agent Architect ✅
- [x] Create Workflow Designer ✅
- [x] Create Telemetry Specialist ✅
- [x] Write documentation ✅

### Short-Term
- [ ] Create Research Orchestrator agent
- [ ] Create Code Architecture agent
- [ ] Create Documentation Master agent
- [ ] Build visual workflow designer
- [ ] Add real-time dashboards

### Long-Term
- [ ] Automated A/B testing
- [ ] Multi-agent marketplace
- [ ] Cross-platform deployment
- [ ] Federated learning
- [ ] Autonomous evolution

---

**System Ready. Build Exceptional AI. 🚀**

*Quick Reference v1.0.0*
