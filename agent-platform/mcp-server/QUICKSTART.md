# Quick Start Guide - MCP Server Setup

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd C:\Users\ephoe\Documents\Coding_Projects\Agents\agent-platform\mcp-server
pnpm install
```

Or with npm:
```bash
npm install
```

### Step 2: Configure Environment (2 min)

1. Copy example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add **at least one** API key:

**Option A: OpenAI (Recommended)**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```
Get key: https://platform.openai.com/api-keys

**Option B: Anthropic (Claude)**
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
```
Get key: https://console.anthropic.com/

**Option C: Google AI**
```env
GOOGLE_AI_API_KEY=xxxxxxxxxxxx
```
Get key: https://makersuite.google.com/app/apikey

### Step 3: Build Server (1 min)

```bash
pnpm run build
```

### Step 4: Test It! (1 min)

```bash
pnpm run inspect
```

This opens the MCP Inspector. Try:
1. Click on `execute_agent` tool
2. Fill in:
   ```json
   {
     "agentId": "test-agent",
     "prompt": "Say hello and tell me a joke"
   }
   ```
3. Click "Run Tool"
4. See real AI response! 🎉

---

## 🔗 Integrate with Your App

### Option 1: Via API Route (Recommended)

Create `app/api/mcp/route.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const { tool, params } = await req.json();
  
  // Call MCP server
  const { stdout } = await execAsync(
    `node mcp-server/build/index.js`,
    {
      env: {
        ...process.env,
        MCP_TOOL: tool,
        MCP_PARAMS: JSON.stringify(params)
      }
    }
  );
  
  return Response.json(JSON.parse(stdout));
}
```

### Option 2: Direct Integration

```typescript
// lib/mcp-client.ts
import { spawn } from 'child_process';

export async function callMCP(tool: string, params: any) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', [
      './mcp-server/build/index.js'
    ]);
    
    let output = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', () => {
      resolve(JSON.parse(output));
    });
    
    process.stdin.write(JSON.stringify({
      tool,
      params
    }));
    process.stdin.end();
  });
}
```

---

## 🎯 Try These Examples

### Example 1: Execute Agent

```javascript
const result = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'execute_agent',
    params: {
      agentId: 'website-builder',
      prompt: 'Create a landing page for a SaaS product',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7
    }
  })
});
```

### Example 2: Intelligent Model Selection

```javascript
const model = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'select_model',
    params: {
      taskType: 'code_generation',
      complexity: 'high',
      speed: 'balanced'
    }
  })
});
```

### Example 3: API Integration (Stripe)

```javascript
const payment = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'stripe_action',
    params: {
      action: 'create_payment_intent',
      params: {
        amount: 2000,
        currency: 'usd'
      }
    }
  })
});
```

### Example 4: Workflow Execution

```javascript
const workflow = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'execute_workflow',
    params: {
      workflowId: 'content-gen',
      name: 'Blog Post Pipeline',
      steps: [
        { id: '1', type: 'agent', config: { prompt: 'Research topic' } },
        { id: '2', type: 'agent', config: { prompt: 'Write article' } }
      ],
      input: 'AI trends in 2025'
    }
  })
});
```

---

## 🔧 Update EnhancedCanvas

Replace simulated responses with real AI:

```typescript
// In EnhancedCanvas.tsx

const handleTextSubmit = useCallback(async () => {
  if (!textInput.trim()) return;
  
  // Add user message
  setTextHistory(prev => [...prev, { 
    role: 'user', 
    content: textInput 
  }]);
  
  // Call MCP server for real AI response
  const response = await fetch('/api/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'execute_agent',
      params: {
        agentId: selectedPreset.id,
        prompt: textInput,
        model: selectedPreset.model,
        temperature: selectedPreset.temperature,
        systemPrompt: selectedPreset.systemPrompt,
        documents: documents.filter(d => selectedDocs.includes(d.id))
      }
    })
  });
  
  const result = await response.json();
  const aiMessage = JSON.parse(result.content[0].text);
  
  // Add AI response
  setTextHistory(prev => [...prev, {
    role: 'assistant',
    content: aiMessage.response
  }]);
  
  setTextInput('');
}, [textInput, selectedPreset, documents, selectedDocs]);
```

---

## 🎨 Add Model Selection UI

```typescript
// New component: ModelSelector.tsx

export function ModelSelector() {
  const [models, setModels] = useState([]);
  const [selected, setSelected] = useState('gpt-4-turbo-preview');
  
  useEffect(() => {
    // Fetch available models
    fetch('/api/mcp', {
      method: 'POST',
      body: JSON.stringify({ tool: 'list_models', params: {} })
    })
    .then(res => res.json())
    .then(data => setModels(JSON.parse(data.content[0].text).models));
  }, []);
  
  return (
    <select 
      value={selected} 
      onChange={(e) => setSelected(e.target.value)}
      className="bg-gray-800 text-white rounded px-3 py-2"
    >
      {models.map(model => (
        <option key={model.id} value={model.id}>
          {model.name} ({model.provider})
        </option>
      ))}
    </select>
  );
}
```

---

## ✅ Testing Checklist

- [ ] MCP server builds without errors
- [ ] MCP Inspector can connect to server
- [ ] At least one API key is configured
- [ ] Can execute `execute_agent` tool
- [ ] Web app can call MCP via API route
- [ ] Real AI responses appear in text panel
- [ ] Document upload works with AI context
- [ ] Model selection returns recommendations

---

## 🎓 Next Level Features

Once basics work, add these:

### 1. Streaming Responses
```typescript
// Enable streaming for real-time responses
const stream = await fetch('/api/mcp/stream', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'execute_agent',
    params: { ...config, stream: true }
  })
});

const reader = stream.body.getReader();
// Read chunks as they arrive
```

### 2. Multi-Agent Orchestration
```typescript
const collaboration = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'agent_teams',
    params: {
      agents: [
        { id: 'researcher', role: 'Research' },
        { id: 'writer', role: 'Write' },
        { id: 'editor', role: 'Edit' }
      ],
      task: 'Create comprehensive article'
    }
  })
});
```

### 3. Smart Workflows
```typescript
// Get pre-built templates
const templates = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'get_workflow_templates',
    params: {}
  })
});

// Execute template
const result = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'execute_workflow',
    params: {
      ...templates[0], // Use template
      input: 'Your input here'
    }
  })
});
```

---

## 🚨 Common Issues

### Issue: "Cannot find module"
**Fix:** Run `pnpm install` and `pnpm run build`

### Issue: "API key not configured"
**Fix:** Check `.env` file has correct keys

### Issue: "Port already in use"
**Fix:** Kill existing process or change port

### Issue: "Rate limit exceeded"
**Fix:** Add delays between requests or upgrade API plan

---

## 💡 Pro Tips

1. **Start with one AI provider** (OpenAI is easiest)
2. **Test in MCP Inspector** before integrating
3. **Monitor API usage** to control costs
4. **Use GPT-3.5 Turbo** for development (cheaper)
5. **Enable debug logs** when troubleshooting
6. **Save successful prompts** as templates
7. **Implement caching** for repeated requests

---

## 🎉 You're Ready!

Your AI Agent Platform now has:
- ✅ Real AI execution via MCP
- ✅ Multiple AI providers (GPT-4, Claude, Gemini)
- ✅ Intelligent model selection
- ✅ API integrations (Stripe, GitHub, Slack, etc.)
- ✅ Workflow orchestration
- ✅ Production-ready architecture

**Next:** Build amazing AI-powered workflows! 🚀
