# Agent Teams in Workflows - Complete Guide

## Overview

The MCP server now supports **async agent teams as workflow nodes**, enabling sophisticated multi-agent collaboration patterns within automated workflows. This combines the power of:

- **Agent Teams**: Multiple AI agents collaborating with distinct roles
- **Workflows**: Sequential/conditional orchestration of complex tasks  
- **Async Execution**: Non-blocking operations with wait handles
- **Flexible Configuration**: Per-agent model, temperature, and token settings

---

## Architecture

### **Workflow System**

Workflows orchestrate multi-step processes with various node types:

| Node Type | Purpose | Async Support |
|-----------|---------|---------------|
| `agent` | Single AI agent execution | ✅ Yes (via `execute_workflow_async`) |
| `agent_team` | **Multi-agent collaboration** | ✅ **NEW** |
| `api` | HTTP API calls | ✅ Yes |
| `condition` | Conditional branching | ✅ Yes |
| `transform` | Data transformation | ✅ Yes |
| `delay` | Timed delays | ✅ Yes |

### **Agent Teams System**

Agent teams enable multiple AI agents to collaborate on complex tasks:

**Synchronous**: `agent_teams` - Returns results immediately  
**Asynchronous**: `agent_teams_async` - Returns wait handle, executes in background

---

## Current Functionality Explained

### **1. Synchronous Workflows (`execute_workflow`)**

**Purpose**: Execute multi-step workflows sequentially with immediate results

**Process**:
```
Input → Step 1 → Step 2 → ... → Step N → Complete Results
```

**Data Flow**:
- Each step receives output from previous step
- `currentData` variable flows through pipeline
- Results array captures all step outputs

**Example**:
```typescript
const workflow = {
  workflowId: "wf_001",
  name: "Content Pipeline",
  steps: [
    { 
      id: "research", 
      type: "agent", 
      config: { prompt: "Research AI trends" } 
    },
    { 
      id: "outline", 
      type: "agent", 
      config: { prompt: "Create outline based on research" } 
    },
    { 
      id: "publish", 
      type: "api", 
      config: { url: "/api/publish" } 
    }
  ],
  input: "AI trends in 2025"
};
```

**When to Use**:
- Short workflows (< 30 seconds)
- When you need immediate results
- Sequential dependencies between steps

---

### **2. Asynchronous Workflows (`execute_workflow_async`)**

**Purpose**: Launch long-running workflows without blocking

**Process**:
```
Launch → Return Wait Handle → Background Execution → Poll for Results
```

**Wait Handle System**:
- Creates unique ID: `workflow_{workflowId}_{timestamp}`
- Type: `'workflow'`
- Status: `pending` → `completed` | `failed` | `timeout`
- Metadata: workflowId, name, stepCount

**Example**:
```typescript
// Launch async workflow
const result = await execute_workflow_async({
  workflowId: "wf_002",
  name: "Data Processing",
  steps: [...],
  input: data,
  timeoutMs: 300000 // 5 minutes
});

// Get wait handle
const handleId = result.handleId; // e.g., "workflow_wf_002_1730832847192"

// Poll for completion
const finalResult = await wait_for({
  handleId: handleId,
  timeoutMs: 300000,
  pollIntervalMs: 500
});
```

**When to Use**:
- Long workflows (> 30 seconds)
- Resource-intensive operations
- When you want to start multiple workflows in parallel
- Background processing scenarios

---

### **3. Agent Teams (`agent_teams`)**

**Purpose**: Synchronous multi-agent collaboration

**Collaboration Pattern**:
```
Round 1: Agent A → Agent B → Agent C
Round 2: Agent A → Agent B → Agent C  (with accumulated context)
Round 3: Agent A → Agent B → Agent C
```

**Features**:
- Multiple collaboration rounds
- Each agent has distinct role
- Context accumulates between agents and rounds
- Per-agent model configuration
- Temperature control per agent

**Example**:
```typescript
const team = await agent_teams({
  task: "Design a microservices architecture",
  maxRounds: 3,
  agents: [
    { 
      id: "architect", 
      role: "System Architect",
      model: "claude-4.5-sonnet",
      temperature: 0.7
    },
    { 
      id: "security", 
      role: "Security Engineer",
      model: "gpt-5",
      temperature: 0.5
    },
    { 
      id: "devops", 
      role: "DevOps Engineer",
      model: "grok-code-fast",
      temperature: 0.6
    }
  ]
});
```

**Output**:
```json
{
  "task": "Design a microservices architecture",
  "rounds": 3,
  "participants": 3,
  "results": [
    {
      "round": 1,
      "agentId": "architect",
      "role": "System Architect",
      "contribution": "I propose a domain-driven design with..."
    },
    {
      "round": 1,
      "agentId": "security",
      "role": "Security Engineer",
      "contribution": "From a security perspective, we need..."
    },
    // ... more rounds
  ],
  "finalSynthesis": "Full accumulated context with all contributions"
}
```

**When to Use**:
- Complex problem-solving requiring multiple perspectives
- Design reviews and brainstorming
- Short collaborations (< 2 minutes)
- When you need immediate results

---

### **4. Async Agent Teams (`agent_teams_async`)** ⭐ NEW

**Purpose**: Launch multi-agent collaboration in background

**Process**:
```
Launch → Return Wait Handle → Background Collaboration → Poll for Results
```

**Wait Handle**:
- ID: `team_{timestamp}`
- Type: `'custom'` with metadata `{ type: 'agent_team' }`
- Includes: agentCount, maxRounds, task preview

**Example**:
```typescript
// Launch async team
const result = await agent_teams_async({
  task: "Comprehensive market analysis for AI tools",
  maxRounds: 5,
  agents: [
    { id: "data", role: "Data Analyst", model: "gpt-5" },
    { id: "market", role: "Market Analyst", model: "claude-4.5-sonnet" },
    { id: "competitive", role: "Competitive Intelligence", model: "gemini-2.5-pro" }
  ],
  timeoutMs: 600000 // 10 minutes
});

// Get handle
const handleId = result.handleId; // e.g., "team_1730832847192"

// Poll for completion
const analysis = await wait_for({
  handleId: handleId,
  timeoutMs: 600000
});
```

**When to Use**:
- Long collaborations (> 2 minutes)
- Many rounds or many agents
- Resource-intensive analysis
- When you want to start multiple teams in parallel

---

### **5. Agent Teams in Workflows** 🚀 NEW

**Purpose**: Embed multi-agent collaboration as workflow nodes

**Configuration**:
```typescript
{
  type: "agent_team",
  config: {
    prompt: "Task for the team",
    maxRounds: 3,
    model: "claude-sonnet-4.5-haiku", // default for all agents
    temperature: 0.7, // default
    maxTokens: 1000, // default
    agents: [
      { 
        id: "agent1", 
        role: "Role 1",
        model: "gpt-5",          // override default
        temperature: 0.8,        // override default
        maxTokens: 1500          // override default
      },
      { id: "agent2", role: "Role 2" } // uses defaults
    ]
  }
}
```

**Data Flow**:
```
Previous Step Output → Agent Team (multi-round collaboration) → Next Step Input
```

**Example Workflow**:
```typescript
{
  workflowId: "sw_dev_001",
  name: "Software Development with Review",
  steps: [
    {
      id: "requirements",
      type: "agent",
      config: {
        prompt: "Analyze requirements and identify features",
        model: "claude-4.5-sonnet"
      }
    },
    {
      id: "design_team",
      type: "agent_team",
      config: {
        prompt: "Design system architecture based on requirements",
        maxRounds: 2,
        agents: [
          { id: "arch", role: "System Architect", model: "claude-4.5-sonnet" },
          { id: "sec", role: "Security Engineer", model: "gpt-5" },
          { id: "ux", role: "UX Designer", model: "claude-sonnet-4.5-haiku" }
        ]
      }
    },
    {
      id: "implementation",
      type: "agent",
      config: {
        prompt: "Implement the design",
        model: "grok-code-fast"
      }
    },
    {
      id: "review_team",
      type: "agent_team",
      config: {
        prompt: "Review the implementation for quality",
        maxRounds: 1,
        agents: [
          { id: "senior", role: "Senior Developer", model: "gpt-5" },
          { id: "qa", role: "QA Engineer", model: "claude-sonnet-4.5-haiku" }
        ]
      }
    },
    {
      id: "deploy",
      type: "api",
      config: { endpoint: "/api/deploy" }
    }
  ]
}
```

**When to Use**:
- Complex workflows requiring collaboration at specific stages
- Design → Review → Implement patterns
- When different expertise needed at different stages
- Multi-perspective decision-making within larger process

---

## Complete Use Cases

### **Use Case 1: Strategic Planning (Async Workflow + Agent Teams)**

```typescript
// Launch comprehensive strategic planning workflow
const workflow = await execute_workflow_async({
  workflowId: "strategic_001",
  name: "Q1 2026 Strategic Planning",
  steps: [
    {
      id: "research",
      type: "agent",
      config: {
        prompt: "Conduct comprehensive market research for AI tools sector",
        model: "gemini-2.5-pro",
        maxTokens: 4000
      }
    },
    {
      id: "analysis_team",
      type: "agent_team",
      config: {
        prompt: "Analyze market research findings and identify opportunities",
        maxRounds: 2,
        agents: [
          { 
            id: "data_analyst", 
            role: "Data Analyst",
            model: "gpt-5",
            temperature: 0.5 
          },
          { 
            id: "market_analyst", 
            role: "Market Analyst",
            model: "claude-4.5-sonnet",
            temperature: 0.6
          },
          { 
            id: "competitive", 
            role: "Competitive Intelligence",
            model: "gemini-2.5-pro",
            temperature: 0.7
          }
        ]
      }
    },
    {
      id: "processing",
      type: "delay",
      config: { ms: 5000 }
    },
    {
      id: "strategy_team",
      type: "agent_team",
      config: {
        prompt: "Develop strategic recommendations based on analysis",
        maxRounds: 3,
        agents: [
          { 
            id: "ceo", 
            role: "CEO Perspective",
            model: "claude-4.5-sonnet",
            temperature: 0.8
          },
          { 
            id: "cfo", 
            role: "CFO Perspective",
            model: "gpt-5",
            temperature: 0.5
          },
          { 
            id: "cto", 
            role: "CTO Perspective",
            model: "grok-code-fast",
            temperature: 0.7
          }
        ]
      }
    },
    {
      id: "execution_plan",
      type: "agent",
      config: {
        prompt: "Create detailed execution plan with milestones",
        model: "claude-4.5-sonnet"
      }
    },
    {
      id: "save_results",
      type: "api",
      config: { endpoint: "/api/strategies/save" }
    }
  ],
  input: "Q1 2026 strategic planning initiative",
  timeoutMs: 900000 // 15 minutes
});

// Get wait handle
const handleId = workflow.handleId;

// Monitor progress
const result = await wait_for({
  handleId: handleId,
  timeoutMs: 900000,
  pollIntervalMs: 1000
});

console.log("Strategic plan complete:", result);
```

---

### **Use Case 2: Parallel Team Workflows**

```typescript
// Launch multiple team workflows in parallel
const teams = [
  {
    name: "Engineering Team",
    agents: [
      { id: "fe", role: "Frontend Lead" },
      { id: "be", role: "Backend Lead" },
      { id: "devops", role: "DevOps Lead" }
    ],
    task: "Design technical architecture"
  },
  {
    name: "Product Team", 
    agents: [
      { id: "pm", role: "Product Manager" },
      { id: "ux", role: "UX Designer" },
      { id: "research", role: "User Researcher" }
    ],
    task: "Define product requirements"
  },
  {
    name: "Business Team",
    agents: [
      { id: "sales", role: "Sales Lead" },
      { id: "marketing", role: "Marketing Lead" },
      { id: "cs", role: "Customer Success Lead" }
    ],
    task: "Create go-to-market strategy"
  }
];

// Launch all teams asynchronously
const handles = await Promise.all(
  teams.map(team => 
    agent_teams_async({
      task: team.task,
      agents: team.agents,
      maxRounds: 3,
      timeoutMs: 300000
    })
  )
);

// Wait for all teams to complete
const results = await wait_for_multiple({
  handleIds: handles.map(h => h.handleId),
  mode: "all",
  timeoutMs: 300000
});

console.log("All teams completed:", results);
```

---

### **Use Case 3: Conditional Team Activation**

```typescript
const workflow = {
  workflowId: "review_001",
  name: "Code Review with Conditional Expert Panel",
  steps: [
    {
      id: "initial_review",
      type: "agent",
      config: {
        prompt: "Initial code review and complexity assessment",
        model: "grok-code-fast"
      }
    },
    {
      id: "check_complexity",
      type: "condition",
      config: {
        condition: "complexity === 'high'"
      }
    },
    {
      id: "expert_panel",
      type: "agent_team",
      config: {
        prompt: "Deep technical review by expert panel",
        maxRounds: 2,
        agents: [
          { id: "senior", role: "Senior Architect", model: "claude-4.5-sonnet" },
          { id: "security", role: "Security Expert", model: "gpt-5" },
          { id: "performance", role: "Performance Expert", model: "gemini-2.5-pro" }
        ]
      }
    },
    {
      id: "final_report",
      type: "agent",
      config: {
        prompt: "Generate final review report",
        model: "claude-4.5-sonnet"
      }
    }
  ]
};
```

---

## API Reference

### **Workflow Step: `agent_team`**

**Type**: `"agent_team"`

**Config Schema**:
```typescript
{
  prompt?: string;              // Task for team (or use currentData from workflow)
  maxRounds?: number;           // Default: 3
  model?: string;               // Default model for all agents
  temperature?: number;         // Default temperature
  maxTokens?: number;           // Default max tokens
  agents: Array<{
    id: string;                 // Unique agent identifier
    role: string;               // Agent's role/expertise
    model?: string;             // Override default model
    temperature?: number;       // Override default temperature
    maxTokens?: number;         // Override default max tokens
  }>;
}
```

**Output**:
```typescript
{
  teamResults: Array<{
    round: number;
    agentId: string;
    role: string;
    contribution: string;
  }>;
  finalSynthesis: string;       // Accumulated context from all contributions
}
```

---

### **Tool: `agent_teams_async`**

**Parameters**:
```typescript
{
  task: string;                 // Collaborative task description
  agents: Array<{
    id: string;
    role: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }>;
  maxRounds?: number;           // Default: 5
  model?: string;               // Default model
  timeoutMs?: number;           // Timeout in milliseconds
}
```

**Returns (Immediate)**:
```typescript
{
  async: true;
  handleId: string;             // Wait handle ID
  status: "pending";
  agentCount: number;
  maxRounds: number;
  message: string;
  startTime: string;            // ISO timestamp
  timeout?: number;
}
```

**Returns (After `wait_for`)**:
```typescript
{
  task: string;
  rounds: number;
  participants: number;
  results: Array<{
    round: number;
    agentId: string;
    role: string;
    contribution: string;
  }>;
  finalSynthesis: string;
  timestamp: string;
}
```

---

## Available Models

All agents support these models with different characteristics:

| Model | Provider | Best For | Speed | Quality | Cost |
|-------|----------|----------|-------|---------|------|
| `gpt-5` | OpenAI | Reasoning, analysis | Medium | Highest | High |
| `claude-4.5-sonnet` | Anthropic | Complex tasks, quality | Medium | Highest | High |
| `claude-sonnet-4.5-haiku` | Anthropic | Speed, efficiency | Fast | High | Low |
| `gemini-2.5-pro` | Google | Research, large context | Medium | High | Medium |
| `grok-code-fast` | xAI | Code generation | Fastest | Medium | Low |

---

## Best Practices

### **1. Agent Team Composition**

✅ **DO**:
- Use 2-5 agents per team (optimal collaboration)
- Assign distinct, complementary roles
- Use higher-quality models for complex agents
- Use faster models for simple validation agents

❌ **DON'T**:
- Create teams with > 7 agents (diminishing returns)
- Duplicate roles within same team
- Use high-temperature for all agents (reduces consistency)

### **2. Round Configuration**

✅ **DO**:
- Start with 2-3 rounds for most tasks
- Use 1 round for quick reviews
- Use 4-5 rounds only for complex brainstorming

❌ **DON'T**:
- Use > 5 rounds (context becomes too large)
- Use 0 rounds (minimum is 1)

### **3. Temperature Settings**

| Agent Role | Recommended Temperature |
|------------|------------------------|
| Creative Director, Innovator | 0.8 - 1.0 |
| Analyst, Architect | 0.6 - 0.7 |
| Reviewer, QA | 0.4 - 0.6 |
| Compliance, Security | 0.3 - 0.5 |

### **4. Workflow Design**

✅ **DO**:
- Use `agent_team` for collaborative phases
- Use single `agent` for sequential tasks
- Use `condition` to skip teams when not needed
- Use `delay` between heavy team operations

❌ **DON'T**:
- Put agent teams in tight loops
- Chain multiple large teams without breaks
- Use synchronous workflows for > 3 teams

### **5. Async vs Sync Decision**

**Use Synchronous** when:
- Total workflow time < 30 seconds
- Need immediate results
- Single team with < 3 agents and < 3 rounds

**Use Asynchronous** when:
- Total workflow time > 30 seconds
- Multiple teams in workflow
- Running teams in parallel
- Background processing acceptable

---

## Performance Considerations

### **Token Usage**

Agent teams can consume significant tokens:

```
Total Tokens = Agents × Rounds × Tokens per Response × Context Growth Factor
```

**Example**:
- 3 agents
- 3 rounds  
- 1000 tokens per response
- Context grows ~1.5x per round

**Total**: ~13,500 tokens (~$0.20 with GPT-4)

### **Execution Time**

```
Time = Agents × Rounds × Avg Response Time
```

**Example**:
- 3 agents
- 3 rounds
- 5 seconds per response

**Total**: ~45 seconds

### **Optimization Tips**

1. **Reduce rounds**: Use fewer rounds for simpler tasks
2. **Smaller teams**: 2-3 agents often sufficient
3. **Faster models**: Use `claude-sonnet-4.5-haiku` or `grok-code-fast` for some agents
4. **Lower maxTokens**: Set to 500-800 for quick contributions
5. **Async execution**: Always use async for > 30 second workflows

---

## Workflow Templates

The system provides 6 pre-built templates showcasing agent teams:

1. **Content Generation Pipeline** - Traditional sequential workflow
2. **Customer Support Automation** - Conditional routing
3. **Data Analysis Workflow** - API integration
4. **Software Development** - 2 agent teams (design + review)
5. **Strategic Planning** - Nested teams with delays
6. **Creative Brainstorming** - High-temperature diverse team

Access via:
```typescript
const templates = await get_workflow_templates();
```

---

## Migration Guide

### **From Synchronous Teams to Workflows**

**Before**:
```typescript
const designTeam = await agent_teams({
  task: "Design system",
  agents: [...]
});

const reviewTeam = await agent_teams({
  task: "Review design: " + designTeam.finalSynthesis,
  agents: [...]
});
```

**After**:
```typescript
const workflow = await execute_workflow({
  workflowId: "design_001",
  name: "Design and Review",
  steps: [
    {
      id: "design",
      type: "agent_team",
      config: {
        prompt: "Design system",
        agents: [...]
      }
    },
    {
      id: "review",
      type: "agent_team",
      config: {
        // Uses output from design team automatically
        prompt: "Review the design",
        agents: [...]
      }
    }
  ]
});
```

---

## Troubleshooting

### **Workflow Not Completing**

**Problem**: Async workflow stuck in `pending` status

**Solutions**:
- Check timeout hasn't expired
- Verify all agents configured correctly
- Check for errors in workflow execution logs
- Use shorter timeouts for testing

### **Agent Team Context Too Large**

**Problem**: Context exceeds model limits after many rounds

**Solutions**:
- Reduce `maxRounds` to 2-3
- Use models with larger context windows (gemini-2.5-pro)
- Reduce `maxTokens` per agent
- Use fewer agents

### **Slow Performance**

**Problem**: Workflows taking too long

**Solutions**:
- Use faster models (`grok-code-fast`, `claude-sonnet-4.5-haiku`)
- Reduce rounds and agents
- Use async execution
- Lower `maxTokens` to 500-800

---

## Future Enhancements

Planned features:

1. **Parallel Agent Execution**: Run agents simultaneously instead of sequentially
2. **Agent Memory**: Persistent context across workflow runs
3. **Dynamic Team Formation**: Auto-select agents based on task
4. **Cost Tracking**: Per-workflow token usage and cost reporting
5. **Workflow Visualization**: See execution progress in real-time
6. **Agent Specialization**: Pre-configured expert agents
7. **Checkpoint/Resume**: Save and resume long-running workflows

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/agent-platform/mcp-server/issues
- Documentation: https://docs.agent-platform.dev
- Community: https://discord.gg/agent-platform

---

**Version**: 1.1.0  
**Last Updated**: November 5, 2025  
**Author**: Agent Platform Team
