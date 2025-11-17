# Agent Teams in Workflows - Quick Reference

## TL;DR

Agent teams can now be used as workflow nodes for multi-agent collaboration within automated processes.

---

## Quick Start

### **1. Basic Agent Team in Workflow**

```typescript
const workflow = await execute_workflow({
  workflowId: "quick_001",
  name: "Design Review",
  steps: [
    {
      id: "design_team",
      type: "agent_team",
      config: {
        prompt: "Design a REST API for user management",
        maxRounds: 2,
        agents: [
          { id: "architect", role: "System Architect" },
          { id: "security", role: "Security Engineer" }
        ]
      }
    }
  ],
  input: "User management API requirements"
});
```

### **2. Async Workflow with Teams**

```typescript
// Launch
const result = await execute_workflow_async({
  workflowId: "async_001",
  name: "Strategic Planning",
  steps: [
    { id: "research", type: "agent", config: {...} },
    { 
      id: "analysis_team", 
      type: "agent_team", 
      config: {
        prompt: "Analyze research",
        agents: [
          { id: "data", role: "Data Analyst" },
          { id: "market", role: "Market Analyst" }
        ]
      } 
    }
  ],
  timeoutMs: 600000
});

// Wait
const final = await wait_for({ handleId: result.handleId });
```

### **3. Standalone Async Team**

```typescript
// Launch
const team = await agent_teams_async({
  task: "Comprehensive code review",
  agents: [
    { id: "senior", role: "Senior Developer", model: "gpt-5" },
    { id: "security", role: "Security Expert", model: "claude-4.5-sonnet" },
    { id: "qa", role: "QA Engineer", model: "claude-sonnet-4.5-haiku" }
  ],
  maxRounds: 3,
  timeoutMs: 300000
});

// Wait
const review = await wait_for({ handleId: team.handleId });
```

---

## Step Types

| Type | Description | Use In Workflows |
|------|-------------|------------------|
| `agent` | Single AI agent | ✅ Yes |
| **`agent_team`** | Multi-agent collaboration | ✅ **NEW** |
| `api` | HTTP API call | ✅ Yes |
| `condition` | Conditional branch | ✅ Yes |
| `transform` | Data transform | ✅ Yes |
| `delay` | Timed delay | ✅ Yes |

---

## Config Schema

### **Agent Team Step**

```typescript
{
  type: "agent_team",
  config: {
    prompt?: string,              // Optional - uses previous step output if omitted
    maxRounds?: number,           // Default: 3
    model?: string,               // Default model for agents
    temperature?: number,         // Default temperature
    maxTokens?: number,           // Default max tokens
    agents: [
      {
        id: string,               // Required
        role: string,             // Required
        model?: string,           // Optional - overrides default
        temperature?: number,     // Optional - overrides default
        maxTokens?: number        // Optional - overrides default
      }
    ]
  }
}
```

---

## Tools

### **agent_teams** (Sync)
Execute team immediately, block until complete.

### **agent_teams_async** (Async)
Launch team, return handle, poll for results.

### **execute_workflow** (Sync)
Run workflow with team steps, block until complete.

### **execute_workflow_async** (Async)
Launch workflow with team steps, return handle.

---

## Models

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| `gpt-5` | ⚡⚡ | ⭐⭐⭐⭐⭐ | Reasoning, complex analysis |
| `claude-4.5-sonnet` | ⚡⚡ | ⭐⭐⭐⭐⭐ | Quality writing, design |
| `claude-sonnet-4.5-haiku` | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Fast tasks, efficiency |
| `gemini-2.5-pro` | ⚡⚡⚡ | ⭐⭐⭐⭐ | Research, large context |
| `grok-code-fast` | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | Code generation |

---

## Common Patterns

### **Design → Review**
```typescript
steps: [
  { type: "agent_team", config: { /* design team */ } },
  { type: "agent_team", config: { /* review team */ } }
]
```

### **Conditional Expert Panel**
```typescript
steps: [
  { type: "agent", config: { /* assess complexity */ } },
  { type: "condition", config: { condition: "complex === true" } },
  { type: "agent_team", config: { /* expert panel */ } }
]
```

### **Parallel Teams**
```typescript
const teams = await Promise.all([
  agent_teams_async({ /* team 1 */ }),
  agent_teams_async({ /* team 2 */ }),
  agent_teams_async({ /* team 3 */ })
]);

const results = await wait_for_multiple({
  handleIds: teams.map(t => t.handleId),
  mode: "all"
});
```

---

## Best Practices

### **Team Size**
- ✅ 2-5 agents (optimal)
- ❌ > 7 agents (diminishing returns)

### **Rounds**
- ✅ 2-3 rounds (most tasks)
- ✅ 1 round (quick reviews)
- ❌ > 5 rounds (context too large)

### **Temperature**
- Creative roles: 0.8-1.0
- Analysts: 0.6-0.7
- Reviewers: 0.4-0.6
- Compliance: 0.3-0.5

### **Sync vs Async**
- **Sync**: < 30 seconds total
- **Async**: > 30 seconds or parallel execution

---

## Example Output

### **Team Result**
```json
{
  "teamResults": [
    {
      "round": 1,
      "agentId": "architect",
      "role": "System Architect",
      "contribution": "I recommend microservices with..."
    },
    {
      "round": 1,
      "agentId": "security",
      "role": "Security Engineer",
      "contribution": "From security perspective, ensure..."
    }
  ],
  "finalSynthesis": "Accumulated context with all contributions"
}
```

---

## Templates

Access pre-built templates:
```typescript
const templates = await get_workflow_templates();
```

Available:
1. Content Generation Pipeline
2. Customer Support Automation
3. Data Analysis Workflow
4. **Software Development** (with teams)
5. **Strategic Planning** (with teams)
6. **Creative Brainstorming** (with teams)

---

## Performance

**Token Usage**:
```
Tokens ≈ Agents × Rounds × 1000 × 1.5 (context growth)
```

**Execution Time**:
```
Time ≈ Agents × Rounds × 5 seconds
```

**Cost** (GPT-4 example):
- 3 agents, 3 rounds ≈ 13,500 tokens ≈ $0.20

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Workflow stuck | Check timeout, verify agent config |
| Context too large | Reduce rounds/agents, use larger model |
| Too slow | Use faster models, reduce rounds, async execution |
| Errors | Check model names, validate agent configs |

---

## Full Documentation

See [AGENT_TEAMS_IN_WORKFLOWS.md](./AGENT_TEAMS_IN_WORKFLOWS.md) for complete guide.

---

**Version**: 1.1.0  
**Updated**: November 5, 2025
