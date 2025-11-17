# Tool Access Quick Reference

## 🚀 For Agents Using Tools

### Enable Tools in Agent Execution

```typescript
// Execute agent with tool access
const result = await performSampling({
  messages: [
    { role: "user", content: "Create 3 tasks for the sprint" }
  ],
  model: "gpt-4",
  enabledTools: [
    "create_task",
    "update_task_status",
    "list_tasks"
  ],
  toolChoice: "auto"
});
```

### All Available Tools (50+)

**Agent Tools (6):** execute_agent, execute_agent_async, chat_with_agent, configure_agent, agent_teams, agent_teams_async

**Workflow Tools (4):** execute_workflow, execute_workflow_async, create_workflow, get_workflow_templates

**Task Tools (6):** create_task, get_task, update_task_status, list_tasks, get_task_timer, pause_resume_task_timer

**Wait Tools (6):** sleep, create_wait_handle, wait_for, wait_for_multiple, complete_wait_handle, list_wait_handles

**API Tools (5):** api_call, stripe_action, github_action, slack_action, trigger_webhook

**Model Tools (3):** list_models, select_model, optimize_parameters

**Collection Tools (13):** create_collection, add_item, get_item, query_collection, update_item, delete_item, and more

**Widget Tools (7):** create_widget, update_widget, delete_widget, list_widgets, and more

## 🔧 For Developers

### Register a New Tool

```typescript
import { getToolRegistry } from "./services/tool-registry.js";

const registry = getToolRegistry();

registry.registerTool(
  "my_tool",
  "Tool description",
  z.object({
    param: z.string().describe("Parameter description")
  }),
  async (input) => {
    // Tool logic
    return { success: true };
  }
);
```

### Get Tools for Sampling

```typescript
// OpenAI format
const openAITools = registry.getToolsForOpenAI(["create_task"]);

// Anthropic format
const anthropicTools = registry.getToolsForAnthropic(["create_task"]);

// Google format
const googleTools = registry.getToolsForGoogle(["create_task"]);
```

## 🎯 Tool Choice Options

- **"auto"** - Let model decide when to use tools (recommended)
- **"required"** - Force model to use at least one tool
- **"none"** - Disable tool calling

## 📊 Supported Providers

✅ OpenAI (GPT-4, GPT-5, o1)  
✅ Anthropic (Claude 4.5 Sonnet/Haiku)  
✅ Google AI (Gemini 2.5 Pro)  
✅ xAI (Grok Code Fast)

## 🔍 Tool Discovery

```typescript
const registry = getToolRegistry();

// Get all tools
const allTools = registry.getAllTools();

// Get specific tools
const tools = registry.getTools(["create_task", "update_task_status"]);

// Get stats
const stats = registry.getStats();
console.log(`${stats.totalTools} tools registered`);
```

## ⚡ Quick Examples

### Task Management
```typescript
enabledTools: ["create_task", "update_task_status", "list_tasks"]
```

### Workflow Automation
```typescript
enabledTools: ["create_workflow", "execute_workflow", "api_call"]
```

### Model Optimization
```typescript
enabledTools: ["list_models", "select_model", "optimize_parameters"]
```

### Full Stack
```typescript
enabledTools: [
  "execute_agent", "create_workflow", "create_task",
  "api_call", "github_action", "stripe_action"
]
```

---

**✅ Agents have full MCP tool access with complete spec compliance!**

For details, see: `TOOL_ACCESS_COMPLETE.md` and `TOOL_ACCESS_INTEGRATION.md`
