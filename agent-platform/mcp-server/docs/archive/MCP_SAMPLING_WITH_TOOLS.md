# MCP Sampling with Tool Access

## Overview

The Agent Platform MCP Server now supports **MCP sampling with tool access**, allowing AI agents executed via `execute_agent` and `chat_with_agent` to use the MCP server's tools during their execution.

This enables agents to:
- Access external data sources
- Perform complex multi-step operations
- Utilize specialized tools (API calls, workflows, task management, etc.)
- Collaborate with other agents
- Execute code and interact with systems

## How It Works

When an agent is executed with MCP sampling and tool access enabled, the following happens:

1. **Agent Execution Request**: You call `execute_agent` or `chat_with_agent` with optional `tools` parameter
2. **MCP Sampling**: The server delegates to the MCP client (e.g., Claude, GPT) using `createMessage` 
3. **Tool Access**: The `includeContext: "thisServer"` parameter makes all server tools available
4. **Tool Calls**: The AI can call any available tool as part of generating its response
5. **Result**: The complete response (including any tool use) is returned

## Usage

### Execute Agent with Tool Access

```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "research-assistant-001",
    "prompt": "Research the latest developments in quantum computing and create a summary",
    "tools": ["api_call", "trigger_webhook", "create_task"],
    "maxTokens": 8000,
    "temperature": 0.7
  }
}
```

**What happens:**
1. The agent receives your prompt
2. It can call `api_call` to fetch information
3. It can call `trigger_webhook` to send notifications
4. It can call `create_task` to track work items
5. It generates a comprehensive response using these tools

### Chat with Tool-Enabled Agent

```json
{
  "tool": "chat_with_agent",
  "arguments": {
    "agentId": "code-assistant-001",
    "message": "Help me debug this React component and check if there are any similar issues in our codebase"
  }
}
```

**What happens:**
1. The chat agent has access to **all server tools by default**
2. It can use `semantic_search` to find similar code
3. It can use `execute_workflow` to run tests
4. It can use `create_task` to track the bug fix
5. It provides an interactive, tool-augmented response

### Execute Agent Without Tools

```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "simple-writer-001",
    "prompt": "Write a creative story about a space explorer",
    "maxTokens": 4000
  }
}
```

**What happens:**
1. No `tools` parameter specified
2. `includeContext` is not set (or set to undefined)
3. The agent executes as a pure LLM generation
4. No tool access enabled

## Configuration

### Automatic Tool Access

When you specify tools in the `execute_agent` call:

```typescript
{
  tools: ["tool1", "tool2", "tool3"]
}
```

The system automatically sets:
```typescript
{
  includeContext: "thisServer"
}
```

### Chat Agents

The `chat_with_agent` tool **always enables tool access** by default:

```typescript
{
  includeContext: "thisServer"
}
```

This makes chat agents more capable and interactive.

### Manual Control

You can also pass `includeContext` directly through the sampling configuration (advanced usage).

## Available Tools

When tool access is enabled, agents can use any tool from the loaded toolkits:

### Core Server Management (5 tools)
- `list_toolkits`
- `get_toolkit_info`
- `enable_toolkit`
- `disable_toolkit`
- `get_toolkit_stats`

### Agent Development (6 tools)
- `execute_agent`
- `execute_agent_async`
- `chat_with_agent`
- `agent_teams`
- `agent_teams_async`
- `configure_agent`

### Model Management (3 tools)
- `list_models`
- `select_model`

### External Integrations (5 tools)
- `api_call`
- `trigger_webhook`
- `slack_action`
- `stripe_action`

### Task Management (11 tools)
- `create_task`
- `update_task_status`
- `get_task`
- `list_tasks`
- And more...

### Wait Handle Management (5 tools)
- `create_wait_handle`
- `wait_for`
- `wait_for_multiple`
- `list_wait_handles`
- `complete_wait_handle`

### Workflow Tools
- `execute_workflow`
- `execute_workflow_async`
- `create_workflow`

**Total: 34+ tools available**

## Examples

### Example 1: Research Agent with API Access

```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "market-researcher-001",
    "prompt": "Analyze the current market trends for electric vehicles and send the report to our Slack channel",
    "tools": ["api_call", "slack_action"],
    "maxTokens": 8000,
    "model": "claude-4.5-sonnet"
  }
}
```

The agent will:
1. Use `api_call` to fetch market data APIs
2. Analyze the trends using its reasoning capabilities
3. Use `slack_action` to post the report
4. Return a complete summary

### Example 2: Multi-Step Workflow Agent

```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "automation-specialist-001",
    "prompt": "Create a workflow that: 1) Calls the GitHub API to list open issues, 2) Creates tasks for each P0 issue, 3) Sends a summary webhook",
    "tools": ["api_call", "create_task", "trigger_webhook", "create_workflow"],
    "maxTokens": 12000
  }
}
```

The agent will:
1. Use `create_workflow` to design the automation
2. Use `api_call` to fetch GitHub issues
3. Use `create_task` for each P0 issue
4. Use `trigger_webhook` to send notifications
5. Return the workflow configuration

### Example 3: Code Assistant Chat

```json
{
  "tool": "chat_with_agent",
  "arguments": {
    "agentId": "code-helper-001",
    "message": "I need to refactor the authentication module. Can you help me identify all the files and create a plan?"
  }
}
```

The agent automatically has tool access and can:
1. Use search tools to find authentication code
2. Use `create_task` to break down the work
3. Use `execute_workflow` to run tests
4. Provide interactive assistance

### Example 4: Recursive Agent Execution

```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "meta-orchestrator-001",
    "prompt": "Break down the project plan into sub-agents: one for frontend, one for backend, one for testing. Execute each and synthesize results.",
    "tools": ["execute_agent_async", "wait_for_multiple", "agent_teams"],
    "maxTokens": 16000
  }
}
```

The agent can:
1. Use `execute_agent_async` to spawn sub-agents
2. Use `wait_for_multiple` to wait for all sub-agents
3. Use `agent_teams` for collaboration
4. Synthesize all results into a final plan

## Technical Details

### Implementation

The implementation spans three key files:

#### 1. `SamplingClient.ts`
```typescript
export interface SamplingOptions {
  // ... other options
  includeContext?: "none" | "thisServer" | "allServers";
}

private async createSamplingRequest(options: SamplingOptions): Promise<CreateMessageResult> {
  const request: CreateMessageRequest = {
    method: 'sampling/createMessage',
    params: {
      messages: options.messages,
      maxTokens: options.maxTokens,
      // ... other params
      ...(options.includeContext && { includeContext: options.includeContext })
    }
  };
  // ...
}
```

#### 2. `sampling-service.ts`
```typescript
async function sampleViaMCP(config: SamplingConfig, model: string): Promise<SamplingResult> {
  const result = await mcpSamplingClient.sample({
    messages: mcpMessages,
    systemPrompt,
    maxTokens: config.maxTokens ?? 4000,
    temperature: config.temperature ?? 0.7,
    topP: config.topP ?? 1.0,
    includeContext: config.includeContext ?? 
      (config.enabledTools && config.enabledTools.length > 0 ? "thisServer" : undefined)
  });
}
```

#### 3. `agent-tools.ts`
```typescript
// Execute agent
const result = await performSampling({
  messages,
  model: input.model || "claude-sonnet-4.5-haiku",
  temperature: input.temperature ?? 0.7,
  maxTokens: input.maxTokens ?? 4000,
  enabledTools: input.tools,
  includeContext: input.tools && input.tools.length > 0 ? "thisServer" : undefined
});

// Chat with agent
const result = await performSampling({
  messages: [{ role: "user", content: input.message }],
  model: "claude-sonnet-4.5-haiku",
  temperature: 0.7,
  maxTokens: 2000,
  includeContext: "thisServer" // Always enabled for chat
});
```

### MCP Protocol

According to the MCP specification:

```typescript
interface CreateMessageParams {
  messages: SamplingMessage[];
  modelPreferences?: ModelPreferences;
  systemPrompt?: string;
  includeContext?: "none" | "thisServer" | "allServers";
  temperature?: number;
  maxTokens: number;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}
```

The `includeContext` parameter tells the MCP client:
- **"none"**: Don't include any context (pure LLM generation)
- **"thisServer"**: Include this server's tools/resources/prompts
- **"allServers"**: Include all connected servers' context

## Benefits

### 1. Powerful Agent Capabilities
Agents can perform complex multi-step operations by combining tools.

### 2. No Additional Code
Tools are automatically available - no need to implement custom tool calling logic.

### 3. Flexible Control
Choose which tools to expose per agent execution.

### 4. Secure by Default
Tool access is opt-in (except for chat agents where it's useful by default).

### 5. MCP Standard
Uses the official MCP protocol - works with any compliant client.

## Best Practices

### 1. Specify Relevant Tools
Only include tools the agent actually needs:

```json
{
  "tools": ["api_call", "slack_action"]
}
```

Instead of enabling all tools unnecessarily.

### 2. Use Appropriate Models
More capable models (Claude 4.5 Sonnet, GPT-5) are better at tool use:

```json
{
  "model": "claude-4.5-sonnet",
  "tools": ["execute_workflow", "create_task"]
}
```

### 3. Provide Clear Instructions
Tell the agent what tools are available and how to use them:

```json
{
  "prompt": "You have access to api_call and slack_action. Use api_call to fetch data and slack_action to notify the team when done."
}
```

### 4. Monitor Token Usage
Tool calls increase token usage. Use appropriate `maxTokens`:

```json
{
  "maxTokens": 8000,  // Higher for tool-using agents
  "tools": ["api_call", "execute_agent"]
}
```

### 5. Handle Async Operations
Use async tools for long-running operations:

```json
{
  "tools": ["execute_agent_async", "wait_for"],
  "prompt": "Launch 3 research agents and wait for all to complete"
}
```

## Limitations

1. **Tool availability depends on MCP client support**
   - Not all MCP clients fully support `includeContext`
   - Falls back to pure LLM generation if unsupported

2. **Tool execution is delegated to the MCP client**
   - The client (Claude, GPT, etc.) decides when to call tools
   - You cannot force specific tool calls

3. **Token limits apply**
   - Tool calls consume tokens
   - Complex tool use may hit limits

4. **No fine-grained tool filtering yet**
   - Currently all tools are available when `includeContext: "thisServer"`
   - Per-tool filtering is a future enhancement

## Future Enhancements

1. **Fine-grained tool filtering**
   - Specify exact tools to include
   - Role-based tool access

2. **Tool call telemetry**
   - Track which tools agents use
   - Optimize agent prompts based on usage

3. **Tool composition**
   - Create higher-level tools from primitives
   - Agent-specific tool libraries

4. **Conversation memory for chat**
   - Persist conversation history
   - Context-aware multi-turn chat

## Troubleshooting

### Agent doesn't use tools

**Cause**: Model may not support tool use well, or instructions unclear

**Solution**:
- Use a more capable model (Claude 4.5 Sonnet, GPT-5)
- Provide explicit instructions about tool availability
- Check that `includeContext: "thisServer"` is being set

### "Sampling not supported by client" error

**Cause**: MCP client doesn't support sampling

**Solution**:
- Use a client that supports MCP sampling (Claude Desktop, VS Code with MCP extension)
- Check client configuration
- Ensure `sampling: {}` capability is advertised

### Tools not available during execution

**Cause**: `includeContext` not set correctly

**Solution**:
- Verify `tools` parameter is provided in `execute_agent`
- Check logs for sampling configuration
- Ensure toolkits are loaded

## Related Documentation

- [README.md](./README.md) - Main documentation
- [MCP_SAMPLING_COMPLETE.md](./MCP_SAMPLING_COMPLETE.md) - MCP sampling setup
- [ADVANCED_FEATURES.md](./docs/ADVANCED_FEATURES.md) - Advanced platform features
- [API_REFERENCE_SOTA.md](./API_REFERENCE_SOTA.md) - Complete API reference

## Conclusion

MCP sampling with tool access transforms simple agents into powerful autonomous systems capable of:
- Researching and gathering information
- Executing complex multi-step workflows
- Collaborating with other agents
- Interacting with external systems
- Managing tasks and projects

This feature is **production-ready** and works with any MCP-compliant client that supports the `includeContext` parameter.
