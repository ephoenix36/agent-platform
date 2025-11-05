# Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will get you up and running with the AI Agent Platform in just a few minutes.

## Step 1: Get API Keys (2 minutes)

### Required: xAI (Grok) - **Recommended!**
1. Go to https://x.ai/api
2. Sign up for an account
3. Generate API key
4. Copy key (starts with `xai-`)

**Why xAI?**
- 💰 **$0.10/$0.40** per 1M tokens (vs GPT-4o: $2.50/$10.00)
- 🧠 Highest intelligence: **60.25 IQ**
- ⚡ Very fast responses
- 🎯 Perfect for agents

### Optional but Recommended: OpenRouter
1. Go to https://openrouter.ai/keys
2. Sign up
3. Generate API key
4. Copy key (starts with `sk-or-v1-`)

**Why OpenRouter?**
- 🌐 Access to 100+ models through one API
- 💡 Intelligent routing
- 📊 Model comparisons
- 💰 Competitive pricing

### Optional: Other Providers
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/account/keys
- Google: https://makersuite.google.com/app/apikey

## Step 2: Configure Environment (1 minute)

1. Navigate to your project:
```bash
cd C:\Users\ephoe\Documents\Coding_Projects\Agents\agent-platform
```

2. Your `.env` file is already configured! Just verify the keys:
```env
XAI_API_KEY=<your_xai_api_key>
OPENROUTER_API_KEY=<your_openrouter_api_key>
GOOGLE_API_KEY=<your_google_api_key>
ELEVENLABS_API_KEY=<your_elevenlabs_api_key>
```

✅ You're all set!

## Step 3: Start the Platform (2 minutes)

### Option A: Quick Start (Development)

Frontend (Already running at http://localhost:3000):
```powershell
cd apps\web
npm run dev
```

Backend API:
```powershell
cd apps\api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Option B: Production Build

```powershell
# Build frontend
cd apps\web
npm run build
npm start

# Start backend
cd apps\api
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Step 4: Access the Platform

🌐 **Open in browser:** http://localhost:3000

You'll see:
- 🏠 **Dashboard** - Activity monitoring
- 🛒 **Marketplace** - Agent marketplace
- 🎨 **Canvas** - Visual workflow builder
- 📊 **Activity** - Real-time analytics
- 🔧 **MCP Tools** - Tool library
- ⚙️ **Settings** - Configuration

## 🎯 Try Your First Agent

### Example 1: Simple Chat

1. Go to any page
2. Click the floating chat bar at the bottom
3. Select model: **Grok 4 Fast** (cheapest, fastest)
4. Type: "Write a Python function to calculate fibonacci"
5. Press Enter

**Cost:** ~$0.0001 (vs $0.0025 with GPT-4o)

### Example 2: Create a Workflow

1. Navigate to **Canvas** tab
2. Click "Create Workflow"
3. Add nodes:
   - Node 1: LLM - "Generate React component"
   - Node 2: LLM - "Review the code"
4. Connect nodes
5. Click "Execute"

Watch real-time execution in the Activity Dashboard!

### Example 3: Process Documents

1. Drag and drop a document into the chat bar
2. Watch the fan-out hover effect
3. Click on the document
4. Choose:
   - **OCR** - Extract text
   - **Analyze** - AI analysis
   - **Enhance** - Improve quality
   - **Caption** - Generate description

### Example 4: Install MCP Tools

1. Go to **MCP Tools** tab
2. Browse verified tools
3. Click "Install" on Voice Control MCP
4. Configure in Settings
5. Use in your agents!

## 💡 Pro Tips

### Cost Optimization

**Use xAI Grok for everything:**
```typescript
const config = {
  provider: 'xai',
  model: 'grok-4-fast',  // Cheapest + fastest
  temperature: 0.7,
};
```

**Savings calculation:**
- 1M tokens with GPT-4o: $12.50
- 1M tokens with Grok 4 Fast: $0.50
- **You save: $12.00 (96% savings!)**

### Performance Optimization

1. **Enable telemetry** to track costs
2. **Set up alerts** for budget thresholds
3. **Use parallel nodes** in workflows
4. **Cache frequent requests** (coming soon)

### Quality Optimization

1. **Use appropriate temperature:**
   - Creative: 0.8-1.0
   - Balanced: 0.5-0.7
   - Precise: 0.1-0.3

2. **Choose right model:**
   - Fast tasks: Grok 4 Fast
   - Complex reasoning: Grok 4
   - Structured output: OpenAI GPT-4o

3. **Enable auto-optimization** in Settings

## 🔍 Monitoring & Analytics

### View Telemetry

1. Go to **Activity** tab
2. See real-time:
   - Agent executions
   - Workflow progress
   - Costs
   - Success rates

### Cost Analysis

```bash
# Today's costs
GET /api/telemetry/analytics/cost-analysis?days=1

# By provider
GET /api/telemetry/analytics/cost-analysis?group_by=provider

# By agent
GET /api/telemetry/analytics/cost-analysis?group_by=agent
```

### Performance Metrics

```bash
# Get agent metrics
GET /api/telemetry/metrics/agent/my-agent?hours=24

# Get workflow metrics
GET /api/telemetry/metrics/workflow/my-workflow?hours=24
```

## 🐛 Troubleshooting

### API Key Issues

**Error:** "API key not found"
```bash
# Check .env file
cat .env | grep XAI_API_KEY

# Restart servers
# Frontend: Ctrl+C then npm run dev
# Backend: Ctrl+C then uvicorn main:app --reload
```

### Connection Issues

**Error:** "Failed to fetch"
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check if frontend is running
curl http://localhost:3000
```

### Port Already in Use

```powershell
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

## 📚 Next Steps

### Learn More
- 📖 Read full README: `README_WORLD_CLASS.md`
- 🎓 Check API docs: http://localhost:8000/docs
- 💬 Join Discord: https://discord.gg/agent-platform

### Build Your First Agent
1. Study existing agents in Marketplace
2. Clone and modify
3. Add to your workflows
4. Monitor performance
5. Optimize based on telemetry

### Explore Advanced Features
- Custom MCP tools
- Multi-agent collaboration
- Voice control integration
- Document AI pipelines
- Workflow templates

## 🎉 You're Ready!

Your platform is running with:
- ✅ xAI Grok (96% cheaper than GPT-4o)
- ✅ OpenRouter (100+ models)
- ✅ Real-time telemetry
- ✅ Activity dashboard
- ✅ Document AI
- ✅ MCP tools
- ✅ Workflow engine

**Start building amazing AI agents and save thousands on costs!**

Need help? Check:
- 📖 Full docs: `README_WORLD_CLASS.md`
- 🐛 GitHub issues: Report bugs
- 💬 Discord: Ask questions
- 📧 Email: support@agent-platform.ai

Happy building! 🚀
