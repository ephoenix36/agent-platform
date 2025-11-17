# Agent Platform v2.0 - Advanced Features

## Overview

This update adds powerful new capabilities to the agent platform:

1. **Configured Agent Presets** - Reusable agent configurations
2. **Advanced Orchestration Modes** - Linear, parallel, rounds, and intelligent agent selection
3. **Conditional Logic & Branching** - Dynamic flow control
4. **Configurable Output** - Control verbosity and field selection
5. **Enhanced Model Handling** - Better MCP sampling with model specification

## New Features

### 1. Agent Registry

Agents can now be configured once and reused across teams and workflows.

**Configure an Agent:**
```json
{
  "tool": "configure_agent",
  "arguments": {
    "agentId": "senior-architect",
    "name": "Senior Technical Architect",
    "model": "gpt-4o",
    "temperature": 0.3,
    "maxTokens": 1500,
    "systemPrompt": "You are a senior technical architect...",
    "skills": ["system-design", "architecture-patterns"],
    "toolkits": ["core", "integrations"]
  }
}
```

**List Configured Agents:**
```json
{
  "tool": "list_agents"
}
```

**Get Agent Details:**
```json
{
  "tool": "get_agent",
  "arguments": {
    "agentId": "senior-architect"
  }
}
```

**Delete Agent:**
```json
{
  "tool": "delete_agent",
  "arguments": {
    "agentId": "senior-architect"
  }
}
```

### 2. Advanced Orchestration Modes

#### Linear Mode (Default)
Agents execute sequentially, each building on previous contributions.

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "senior-architect"},
      {"id": "code-reviewer"},
      {"id": "security-expert"}
    ],
    "task": "Design and review a secure authentication system",
    "mode": "linear"
  }
}
```

#### Parallel Mode
All agents work simultaneously on the task.

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "frontend-dev", "role": "Frontend specialist"},
      {"id": "backend-dev", "role": "Backend specialist"},
      {"id": "devops", "role": "DevOps engineer"}
    ],
    "task": "Design a deployment pipeline",
    "mode": "parallel"
  }
}
```

#### Rounds Mode
Multiple discussion rounds with all agents.

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "architect"},
      {"id": "developer"},
      {"id": "reviewer"}
    ],
    "task": "Iterate on API design",
    "mode": "rounds",
    "maxRounds": 3
  }
}
```

#### Intelligent Mode
AI selects most relevant agents from pool for each round.

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "architect", "role": "System architect"},
      {"id": "security", "role": "Security expert"},
      {"id": "performance", "role": "Performance specialist"},
      {"id": "ux", "role": "UX designer"},
      {"id": "data", "role": "Data engineer"}
    ],
    "task": "Design a real-time analytics dashboard",
    "mode": "intelligent",
    "intelligentSelection": {
      "poolSize": 2,
      "criteria": "Select agents most relevant to current design phase"
    },
    "maxRounds": 4
  }
}
```

### 3. Conditional Logic & Branching

Control team flow based on output conditions.

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "analyzer", "role": "Code analyzer"},
      {"id": "fixer", "role": "Bug fixer"},
      {"id": "tester", "role": "Quality tester"}
    ],
    "task": "Review and fix code issues",
    "mode": "linear",
    "conditions": [
      {
        "check": "contains error",
        "action": "branch",
        "branchTo": "fixer"
      },
      {
        "check": "exceeds threshold",
        "action": "stop"
      },
      {
        "check": "success",
        "action": "continue"
      }
    ]
  }
}
```

**Condition Types:**
- `contains error` - Check if output contains errors
- `exceeds threshold` - Check if token usage > 2000
- `empty` or `no response` - Check for empty output
- `success` - Check for successful completion
- Custom text matching

**Actions:**
- `continue` - Proceed to next agent
- `stop` - Stop collaboration immediately
- `branch` - Jump to specific agent (requires `branchTo`)
- `repeat` - Repeat current agent's contribution

### 4. Configurable Output

Control what information is returned from agent execution.

**Verbose Output (Default):**
```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "my-agent",
    "prompt": "Analyze this code",
    "verbose": true
  }
}
```
Returns: `agentId`, `response`, `model`, `usage`, `finishReason`, `skillsUsed`, `toolsAvailable`, `timestamp`

**Concise Output:**
```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "my-agent",
    "prompt": "Analyze this code",
    "verbose": false
  }
}
```
Returns: `agentId`, `response`

**Custom Fields:**
```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "my-agent",
    "prompt": "Analyze this code",
    "outputFields": ["response", "usage", "model"]
  }
}
```
Returns: Only specified fields

**Team Output Control:**
```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [...],
    "task": "...",
    "verbose": false,
    "outputFields": ["agentId", "contribution"]
  }
}
```

### 5. Enhanced Model Handling

**Force MCP Sampling (Recommended):**
```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [...],
    "task": "...",
    "forceModel": true  // Let MCP client choose model
  }
}
```

**Specify Model for All Agents:**
```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [...],
    "task": "...",
    "model": "gpt-4o",  // Default for all agents
    "forceModel": false  // Allow model specification
  }
}
```

**Per-Agent Models:**
```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "agent1", "model": "gpt-4o"},
      {"id": "agent2", "model": "claude-sonnet-4.5-haiku"}
    ],
    "task": "..."
  }
}
```

## Complete Examples

### Example 1: Code Review Workflow with Branching

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {
        "id": "analyzer",
        "role": "Code analyzer - identify issues",
        "temperature": 0.2,
        "maxTokens": 800
      },
      {
        "id": "fixer",
        "role": "Bug fixer - provide solutions",
        "temperature": 0.3,
        "maxTokens": 1000
      },
      {
        "id": "reviewer",
        "role": "Final reviewer - approve or reject",
        "temperature": 0.1,
        "maxTokens": 500
      }
    ],
    "task": "Review this authentication code for security issues",
    "mode": "linear",
    "conditions": [
      {
        "check": "contains error",
        "action": "branch",
        "branchTo": "fixer"
      }
    ],
    "forceModel": true,
    "verbose": false,
    "outputFields": ["agentId", "role", "contribution"]
  }
}
```

### Example 2: Parallel Feature Development

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "frontend-specialist"},
      {"id": "backend-specialist"},
      {"id": "database-specialist"}
    ],
    "task": "Design a user profile feature",
    "mode": "parallel",
    "forceModel": true,
    "outputFields": ["agentId", "contribution", "usage"]
  }
}
```

### Example 3: Intelligent Agent Selection

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "architect", "role": "System architect"},
      {"id": "security", "role": "Security expert"},
      {"id": "performance", "role": "Performance optimizer"},
      {"id": "ux-designer", "role": "UX designer"},
      {"id": "accessibility", "role": "Accessibility specialist"}
    ],
    "task": "Design a healthcare appointment booking system",
    "mode": "intelligent",
    "intelligentSelection": {
      "poolSize": 2,
      "criteria": "Select the two most relevant specialists based on current design needs"
    },
    "maxRounds": 3,
    "forceModel": true
  }
}
```

### Example 4: Multi-Round Consensus Building

```json
{
  "tool": "agent_teams",
  "arguments": {
    "agents": [
      {"id": "senior-architect"},
      {"id": "tech-lead"},
      {"id": "principal-engineer"}
    ],
    "task": "Reach consensus on microservices architecture",
    "mode": "rounds",
    "maxRounds": 4,
    "conditions": [
      {
        "check": "success",
        "action": "stop"
      }
    ],
    "forceModel": true,
    "verbose": true
  }
}
```

## Tool Reference

### New Tools Added

1. **list_agents** - List all configured agents
2. **get_agent** - Get details for specific agent
3. **delete_agent** - Remove agent configuration

### Enhanced Tools

1. **execute_agent** - Now supports `outputFields` and `verbose`
2. **agent_teams** - Full orchestration with modes, conditions, output control
3. **agent_teams_async** - Same enhancements, async execution
4. **configure_agent** - Now registers agents in registry

### Tool Count: 9 Total
- execute_agent
- execute_agent_async
- chat_with_agent
- agent_teams (enhanced)
- agent_teams_async (enhanced)
- configure_agent (enhanced)
- list_agents (new)
- get_agent (new)
- delete_agent (new)

## Migration Guide

### Breaking Changes
**None!** All changes are backward compatible.

### Recommended Updates

1. **Use `forceModel: true`** for best MCP sampling:
```json
// Old
{"task": "...", "model": "gpt-4o"}

// New (recommended)
{"task": "...", "forceModel": true}
```

2. **Use configured agents** for consistency:
```json
// Old
{
  "agents": [
    {"id": "agent1", "role": "...", "temperature": 0.3, ...}
  ]
}

// New
// First configure
{"tool": "configure_agent", "arguments": {...}}
// Then use
{"agents": [{"id": "agent1"}]}
```

3. **Control output verbosity**:
```json
// Old (returns everything)
{"agentId": "...", "prompt": "..."}

// New (concise)
{"agentId": "...", "prompt": "...", "verbose": false}
// Or custom
{"agentId": "...", "prompt": "...", "outputFields": ["response", "usage"]}
```

## Performance Tips

1. **Use parallel mode** for independent tasks
2. **Use intelligent mode** to reduce token usage
3. **Set `verbose: false`** to reduce output size
4. **Use `forceModel: true`** to let MCP handle model selection
5. **Set appropriate `maxTokens`** per agent to control costs

## Best Practices

1. **Configure reusable agents** for your team
2. **Use conditional logic** to handle errors gracefully
3. **Start with linear mode**, optimize to parallel/intelligent
4. **Monitor token usage** via usage fields
5. **Use appropriate orchestration**:
   - Linear: Sequential dependencies
   - Parallel: Independent tasks
   - Rounds: Iterative refinement
   - Intelligent: Large agent pools

## Testing the New Features

After server restart:

1. **Configure agents**:
```bash
configure_agent for architect, reviewer, etc.
```

2. **Test modes**:
```bash
agent_teams with mode=linear, parallel, rounds, intelligent
```

3. **Test conditions**:
```bash
agent_teams with conditions for branching
```

4. **Test output control**:
```bash
execute_agent with outputFields and verbose options
```

5. **List and manage**:
```bash
list_agents, get_agent, delete_agent
```

## Next Steps

After server restart, the new features will be available. You can:

1. ✅ Configure your standard agents
2. ✅ Test all orchestration modes
3. ✅ Try conditional branching
4. ✅ Experiment with intelligent selection
5. ✅ Measure performance improvements

## Version Info

- **Version**: 2.0.0
- **Updated**: 2025-11-08
- **Toolkit**: agent-development
- **Tools**: 9 (was 6)
- **Backward Compatible**: Yes

---

**Status**: ✅ **IMPLEMENTATION COMPLETE**  
**Build Status**: ✅ **PASSING**  
**Breaking Changes**: ❌ **NONE**  
**Ready for Testing**: ✅ **YES** (after server restart)
