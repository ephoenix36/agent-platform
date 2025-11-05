# Agent Platform MCP Server

> **Model Context Protocol (MCP) Server** for AI Agent Platform with real AI sampling, intelligent model selection, and API integrations.

## 🚀 Features

### Core Capabilities
- ✅ **Real AI Agent Execution** - Execute agents with actual AI models (GPT-4, Claude, Gemini)
- ✅ **MCP Sampling** - Use client's LLM for agent interactions
- ✅ **Intelligent Model Selection** - Automatic model selection based on task type
- ✅ **Model Parameter Optimization** - Get optimal temperature, top_p for any use case
- ✅ **Multi-Agent Collaboration** - Orchestrate multiple agents on complex tasks
- ✅ **Workflow Orchestration** - Build and execute multi-step workflows
- ✅ **API Integrations** - Connect to any API (Zapier-like functionality)

### Supported Integrations
- **AI Providers:** OpenAI, Anthropic (Claude), Google AI (Gemini)
- **APIs:** Stripe, GitHub, Slack, Discord
- **Generic:** Any REST API with authentication
- **Webhooks:** Trigger external services (Zapier, Make, n8n)

---

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Setup Steps

1. **Install dependencies:**
```bash
cd mcp-server
pnpm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
# Required for AI sampling
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Optional: API integrations
STRIPE_SECRET_KEY=sk_live_...
GITHUB_TOKEN=ghp_...
SLACK_BOT_TOKEN=xoxb-...
```

3. **Build the server:**
```bash
pnpm run build
```

4. **Test with MCP Inspector:**
```bash
pnpm run inspect
```

---

## 🔧 Available Tools

### Agent Tools

#### `execute_agent`
Execute an AI agent with full configuration control.

**Parameters:**
- `agentId` - Agent identifier
- `prompt` - User instruction
- `model` - AI model (optional, auto-selects if not provided)
- `temperature` - Sampling temperature (0-2)
- `maxTokens` - Max response length
- `topP` - Top-p sampling
- `systemPrompt` - Custom system prompt
- `context` - Conversation history
- `documents` - Documents to include in context

**Example:**
```json
{
  "agentId": "website-builder",
  "prompt": "Create a landing page for a SaaS product",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.7,
  "systemPrompt": "You are an expert web developer",
  "documents": [
    {
      "id": "brand-guide",
      "name": "Brand Guidelines.pdf",
      "content": "Brand colors: #667eea, #764ba2..."
    }
  ]
}
```

#### `chat_with_agent`
Have a conversation with an agent (maintains context).

**Example:**
```json
{
  "agentId": "research-assistant",
  "message": "What are the latest trends in AI?",
  "conversationId": "conv_123"
}
```

#### `configure_agent`
Create or update an agent preset.

**Example:**
```json
{
  "agentId": "code-reviewer",
  "name": "Senior Code Reviewer",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.3,
  "maxTokens": 4000,
  "topP": 0.95,
  "systemPrompt": "You are a senior software engineer reviewing code for quality, security, and best practices.",
  "enabledTools": ["code_analysis", "security_scan"]
}
```

#### `collaborate_agents`
Orchestrate multiple agents on a complex task.

**Example:**
```json
{
  "agents": [
    { "id": "researcher", "role": "Research and gather information" },
    { "id": "writer", "role": "Write compelling content" },
    { "id": "editor", "role": "Edit and polish" }
  ],
  "task": "Create a comprehensive blog post about quantum computing",
  "maxRounds": 3
}
```

---

### Model Tools

#### `list_models`
Get all available AI models with specifications.

**Returns:**
```json
{
  "count": 10,
  "models": [
    {
      "id": "gpt-4-turbo-preview",
      "provider": "openai",
      "name": "GPT-4 Turbo",
      "contextWindow": 128000,
      "recommended": "Large context tasks"
    }
  ]
}
```

#### `select_model`
Intelligently select best model for a task.

**Parameters:**
- `taskType` - Type of task (creative_writing, code_generation, research, etc.)
- `complexity` - Task complexity (low, medium, high)
- `budget` - Budget constraints (optional)
- `speed` - Speed vs quality tradeoff (optional)

**Example:**
```json
{
  "taskType": "code_generation",
  "complexity": "high",
  "budget": "medium",
  "speed": "balanced"
}
```

**Returns:**
```json
{
  "recommended": "gpt-4-turbo-preview",
  "reasoning": "GPT-4 Turbo provides superior code generation with better accuracy",
  "parameters": {
    "temperature": 0.3,
    "topP": 0.9,
    "maxTokens": 2000
  }
}
```

#### `optimize_parameters`
Get optimal parameters for a model and use case.

**Example:**
```json
{
  "model": "gpt-4-turbo-preview",
  "useCase": "chatbot"
}
```

**Returns:**
```json
{
  "temperature": 0.8,
  "topP": 0.9,
  "maxTokens": 1500,
  "presencePenalty": 0.6,
  "frequencyPenalty": 0.3,
  "reasoning": "Conversational with variety, avoiding repetition"
}
```

---

### API Integration Tools

#### `api_call`
Make a generic HTTP API call to any endpoint.

**Example:**
```json
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "key": "value"
  },
  "auth": {
    "type": "bearer",
    "token": "your-token-here"
  }
}
```

#### `stripe_action`
Execute Stripe payment operations.

**Actions:**
- `create_customer`
- `create_payment_intent`
- `create_subscription`
- `list_charges`
- `refund_payment`

**Example:**
```json
{
  "action": "create_payment_intent",
  "params": {
    "amount": 2000,
    "currency": "usd",
    "payment_method_types": ["card"]
  }
}
```

#### `github_action`
Interact with GitHub repositories.

**Actions:**
- `create_issue`
- `create_pr`
- `list_repos`
- `get_file`
- `create_commit`

**Example:**
```json
{
  "action": "create_issue",
  "repo": "owner/repo",
  "params": {
    "title": "Bug: Login not working",
    "body": "Detailed description...",
    "labels": ["bug", "priority-high"]
  }
}
```

#### `slack_action`
Send messages and manage Slack workspace.

**Example:**
```json
{
  "action": "send_message",
  "params": {
    "channel": "#general",
    "text": "Deployment completed successfully! ✅"
  }
}
```

#### `trigger_webhook`
Trigger external webhooks (Zapier, Make, n8n).

**Example:**
```json
{
  "url": "https://hooks.zapier.com/hooks/catch/...",
  "payload": {
    "event": "agent_completed",
    "data": {
      "agentId": "website-builder",
      "status": "success"
    }
  }
}
```

---

### Workflow Tools

#### `execute_workflow`
Execute a multi-step workflow.

**Example:**
```json
{
  "workflowId": "content-pipeline",
  "name": "Blog Post Generation",
  "steps": [
    {
      "id": "research",
      "type": "agent",
      "config": {
        "prompt": "Research latest AI trends",
        "model": "gpt-4-turbo-preview"
      }
    },
    {
      "id": "write",
      "type": "agent",
      "config": {
        "prompt": "Write blog post based on research",
        "temperature": 0.8
      }
    },
    {
      "id": "publish",
      "type": "api",
      "config": {
        "url": "https://cms.example.com/publish"
      }
    }
  ],
  "input": "Topic: Future of AI Agents"
}
```

#### `create_workflow`
Create a reusable workflow template.

#### `get_workflow_templates`
Get pre-built workflow templates.

**Returns templates for:**
- Content generation pipeline
- Customer support automation
- Data analysis workflow

---

## 🔌 Integration with Your App

### 1. Configure MCP Client in Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-platform": {
      "command": "node",
      "args": [
        "C:/Users/ephoe/Documents/Coding_Projects/Agents/agent-platform/mcp-server/build/index.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

### 2. Use in Your Web App

Create an API endpoint that calls the MCP server:

```typescript
// app/api/agent/execute/route.ts
import { spawn } from 'child_process';

export async function POST(req: Request) {
  const { agentId, prompt, config } = await req.json();
  
  // Call MCP server via stdio
  const mcpProcess = spawn('node', [
    './mcp-server/build/index.js'
  ]);
  
  // Send tool call request
  mcpProcess.stdin.write(JSON.stringify({
    tool: 'execute_agent',
    params: { agentId, prompt, ...config }
  }));
  
  // Get response
  return new Response(/* ... */);
}
```

### 3. Connect to EnhancedCanvas

Update the text input handler:

```typescript
// In EnhancedCanvas.tsx
const handleTextSubmit = async () => {
  const response = await fetch('/api/agent/execute', {
    method: 'POST',
    body: JSON.stringify({
      agentId: selectedAgent.id,
      prompt: textInput,
      model: selectedAgent.model,
      temperature: selectedAgent.temperature,
      documents: selectedDocs
    })
  });
  
  const result = await response.json();
  setTextHistory(prev => [...prev, {
    role: 'assistant',
    content: result.response
  }]);
};
```

---

## 🧪 Testing

### Run Tests
```bash
pnpm run test
```

### Test with MCP Inspector
```bash
pnpm run inspect
```

Then try executing tools:
1. Select `execute_agent`
2. Fill in parameters
3. Click "Run Tool"
4. See real AI responses!

---

## 📊 Model Selection Guide

### Task Type Recommendations

| Task Type | Recommended Model | Temperature | Top-P |
|-----------|------------------|-------------|-------|
| **Creative Writing** | Claude 3 Opus / GPT-4 Turbo | 0.9 | 0.95 |
| **Code Generation** | GPT-4 Turbo / o1-preview | 0.3 | 0.95 |
| **Data Analysis** | GPT-4 Turbo / Claude 3 Opus | 0.3 | 0.9 |
| **Research** | Claude 3 Opus (200K context) | 0.4 | 0.92 |
| **Conversation** | GPT-4 Turbo / Claude 3 Sonnet | 0.8 | 0.9 |
| **Reasoning** | o1-preview / o1-mini | 0.1 | 0.9 |
| **Vision** | GPT-4 Vision | 0.7 | 1.0 |

### Budget Optimization

**High Budget:**
- Use GPT-4 Turbo or Claude 3 Opus
- Higher max_tokens
- Enable all tools

**Medium Budget:**
- Mix GPT-4 and GPT-3.5 Turbo
- Use Claude 3 Sonnet
- Optimize max_tokens

**Low Budget:**
- Use GPT-3.5 Turbo
- Claude 3 Haiku
- Limit max_tokens

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Always use `.env.example`
2. **Rotate API keys** regularly
3. **Use environment variables** for all secrets
4. **Validate all inputs** before API calls
5. **Rate limit** API requests
6. **Monitor usage** to detect anomalies
7. **Use HTTPS** for all API communications
8. **Implement proper error handling** to avoid leaking sensitive data

---

## 🐛 Troubleshooting

### "OPENAI_API_KEY not configured"
- Make sure `.env` file exists in `mcp-server/` directory
- Check that `.env` has `OPENAI_API_KEY=sk-...`
- Restart the server after changing `.env`

### "Network error in speech recognition"
- Voice recognition requires HTTPS in production
- Works on `localhost` for development
- Deploy to Vercel/Netlify for production testing

### "Module not found" errors
- Run `pnpm install` to install dependencies
- Run `pnpm run build` to compile TypeScript
- Check that `build/` directory exists

### Tool returns error
- Check MCP Inspector for detailed error messages
- Enable debug logging: `LOG_LEVEL=debug`
- Verify API keys are correct

---

## 📝 Development

### Project Structure
```
mcp-server/
├── src/
│   ├── index.ts              # Main server entry
│   ├── services/
│   │   └── sampling-service.ts   # AI sampling logic
│   ├── tools/
│   │   ├── agent-tools.ts        # Agent execution
│   │   ├── model-tools.ts        # Model selection
│   │   ├── api-tools.ts          # API integrations
│   │   └── workflow-tools.ts     # Workflows
│   └── utils/
│       └── logging.ts            # Logging utilities
├── build/                     # Compiled output
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

### Adding New Tools

1. Create tool file in `src/tools/`
2. Define input schema with Zod
3. Register tool in main `index.ts`
4. Build and test

**Example:**
```typescript
// src/tools/custom-tools.ts
export async function registerCustomTools(server: McpServer, logger: Logger) {
  server.tool(
    "my_custom_tool",
    "Description of what it does",
    z.object({
      param1: z.string()
    }).shape,
    async (input) => {
      // Implementation
      return {
        content: [{ type: "text", text: "Result" }]
      };
    }
  );
}
```

---

## 🚀 Next Steps

1. **Set up API keys** in `.env`
2. **Build and test** with MCP Inspector
3. **Integrate** with your web app
4. **Create custom workflows** for your use cases
5. **Monitor usage** and optimize costs

---

## 📚 Resources

- [MCP Specification](https://modelcontextprotocol.io)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Stripe API Docs](https://stripe.com/docs/api)

---

## 📄 License

MIT

---

**Ready to build AI-powered workflows! 🚀**
