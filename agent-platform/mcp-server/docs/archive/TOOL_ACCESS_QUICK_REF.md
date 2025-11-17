# MCP Tool Access Quick Reference

## Enable Tool Access for Agents

### Method 1: Execute Agent with Specific Tools

```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "your-agent-id",
    "prompt": "Your task description",
    "tools": ["tool1", "tool2", "tool3"]
  }
}
```

### Method 2: Chat Agent (Always Enabled)

```json
{
  "tool": "chat_with_agent",
  "arguments": {
    "agentId": "your-agent-id",
    "message": "Your message"
  }
}
```

## Common Tool Combinations

### Research & Notify
```json
{
  "tools": ["api_call", "slack_action"]
}
```

### Task Automation
```json
{
  "tools": ["api_call", "create_task", "trigger_webhook"]
}
```

### Multi-Agent Orchestration
```json
{
  "tools": ["execute_agent_async", "wait_for_multiple", "agent_teams"]
}
```

### Workflow Creation
```json
{
  "tools": ["create_workflow", "execute_workflow", "create_task"]
}
```

## All Available Tools (34+)

### Agent Development (6)
- `execute_agent`
- `execute_agent_async`
- `chat_with_agent`
- `agent_teams`
- `agent_teams_async`
- `configure_agent`

### API Integration (4)
- `api_call`
- `trigger_webhook`
- `slack_action`
- `stripe_action`

### Task Management (11)
- `create_task`
- `update_task_status`
- `get_task`
- `list_tasks`
- `get_task_timer`
- `pause_resume_task_timer`
- And more...

### Workflow (3)
- `create_workflow`
- `execute_workflow`
- `execute_workflow_async`

### Wait Handles (5)
- `create_wait_handle`
- `wait_for`
- `wait_for_multiple`
- `list_wait_handles`
- `complete_wait_handle`

### Server Management (5)
- `list_toolkits`
- `get_toolkit_info`
- `enable_toolkit`
- `disable_toolkit`
- `get_toolkit_stats`

## Examples

### Example 1: Research Assistant
```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "researcher-001",
    "prompt": "Research quantum computing trends and create a summary report",
    "tools": ["api_call", "create_task"],
    "maxTokens": 8000
  }
}
```

### Example 2: Automation Builder
```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "automation-001",
    "prompt": "Build a workflow that fetches GitHub issues and creates tasks for P0 bugs",
    "tools": ["api_call", "create_workflow", "create_task"],
    "maxTokens": 12000
  }
}
```

### Example 3: Multi-Agent Coordinator
```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "coordinator-001",
    "prompt": "Coordinate 3 agents to research, analyze, and report on market trends",
    "tools": ["execute_agent_async", "wait_for_multiple", "slack_action"],
    "maxTokens": 16000
  }
}
```

### Example 4: Interactive Chat
```json
{
  "tool": "chat_with_agent",
  "arguments": {
    "agentId": "assistant-001",
    "message": "Help me refactor the authentication module",
    "conversationId": "conv_abc123"
  }
}
```
(Tools are automatically available)

## Best Practices

✅ **Specify only needed tools** - Don't enable all tools unnecessarily  
✅ **Use capable models** - Claude 4.5 Sonnet, GPT-5 are best for tool use  
✅ **Provide clear instructions** - Tell agent what tools are available  
✅ **Monitor token usage** - Tool calls increase token consumption  
✅ **Handle async operations** - Use async tools for long-running tasks  

## Troubleshooting

### Agent doesn't use tools
- Use a more capable model (Claude 4.5 Sonnet, GPT-5)
- Provide explicit instructions about tool availability
- Verify `includeContext: "thisServer"` is being set

### Tools not available
- Check `tools` parameter is provided
- Verify toolkits are loaded
- Ensure MCP client supports `includeContext`

## More Info

📖 **[Complete Guide](./MCP_SAMPLING_WITH_TOOLS.md)**  
📖 **[README](./README.md)**  
📖 **[Advanced Features](./docs/ADVANCED_FEATURES.md)**
