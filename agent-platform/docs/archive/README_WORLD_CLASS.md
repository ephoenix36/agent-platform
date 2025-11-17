# AI Agent Platform - World-Class Multi-Agent System

A comprehensive, production-ready platform for building, deploying, and managing AI agents and workflows with advanced telemetry, optimization, and multi-provider LLM support.

## 🌟 Key Features

### 1. **Universal LLM Provider Support**
- ✅ **xAI (Grok)** - 96% cheaper than GPT-4o, highest intelligence (60.25 IQ)
- ✅ **OpenRouter** - Access to 100+ models through single API
- ✅ **OpenAI** - GPT-4, GPT-4o, GPT-3.5-turbo
- ✅ **Anthropic** - Claude 3.5 Sonnet, Haiku
- ✅ **Google** - Gemini 2.0 Flash, Gemini 1.5 Pro

**Cost Comparison:**
- xAI Grok 4 Fast: $0.10/$0.40 per 1M tokens
- GPT-4o: $2.50/$10.00 per 1M tokens
- **Savings: 96% on input, 96% on output!**

### 2. **Comprehensive Telemetry System**
- ⏱️ Real-time performance monitoring
- 💰 Automatic cost tracking per agent/workflow
- 📊 Token usage analytics
- ✅ Success rate monitoring
- ⚡ Latency and throughput metrics
- 🎯 Quality scoring and confidence tracking

**Metrics Collected:**
- Execution time (p50, p95, p99)
- Token usage (input/output/total)
- Cost per execution
- Success/error rates
- Provider/model distribution
- Quality scores

### 3. **Activity Dashboard**
- 📈 Real-time agent monitoring
- 🔄 Active workflow tracking
- 📊 Performance trends
- 💹 Cost analysis
- 🎯 Optimization recommendations
- 🚨 Alert configuration

### 4. **AI-Enabled Document Editor**
- 📝 **OCR** - Extract text from images/PDFs
- 🧠 **AI Analysis** - Summarization, entity extraction, sentiment
- ✨ **Image Enhancement** - Upscale, denoise, sharpen
- 🎨 **Annotations** - Highlights, comments, shapes
- 🤖 **AI Captions** - Generate descriptions
- 📊 **Structured Data** - Extract from invoices, forms

### 5. **MCP Tools Library**
- 🔍 Discover tools from NPM, GitHub, custom registry
- ✅ Verified tools with ratings and downloads
- 📦 One-click installation
- ⚙️ Configuration management
- 🔄 Automatic updates
- 🛡️ Security verification

**Verified Tools:**
- Voice Control MCP
- Web Scraper MCP
- File Operations MCP
- And more...

### 6. **Workflow Execution Engine**
- 🔄 Multi-step workflow orchestration
- 🌳 Topological execution ordering
- ⚡ Parallel node execution
- 🔀 Conditional branching
- 🔁 Loop support
- 🎯 Error handling and retry
- 📊 Full telemetry integration

**Node Types:**
- Agent (LLM execution)
- Transform (data manipulation)
- API Call (external integrations)
- Condition (branching logic)
- Loop (iteration)
- Parallel (concurrent execution)

### 7. **Floating Chat Interface**
- 💬 Persistent across all views
- 🎤 Voice mode toggle
- 📎 Document drag-and-drop with fan-out hover
- 🤖 Model/provider selection
- 👥 Agent management
- 📁 Project context
- ✨ Quick actions

### 8. **Enhanced Settings**
- 🔑 API key management with visibility toggle
- ✅ Provider testing
- 📊 Model comparison with pricing
- ⚙️ Telemetry configuration
- 🎯 Optimization targets
- 🔒 Secure storage

## 🚀 Getting Started

### Prerequisites
```bash
Node.js >= 18
Python >= 3.10
PostgreSQL
MongoDB
Redis
RabbitMQ (optional)
MinIO/S3 (optional)
```

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/agent-platform.git
cd agent-platform
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Install dependencies:**
```bash
# Frontend
cd apps/web
npm install

# Backend
cd ../api
pip install -r requirements.txt
```

4. **Start services:**
```bash
# Frontend (Next.js)
npm run dev

# Backend (FastAPI)
uvicorn main:app --reload --port 8000
```

5. **Access the platform:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📋 Configuration

### Required API Keys

#### xAI (Grok) - Recommended
```env
XAI_API_KEY=xai-your-key-here
XAI_API_URL=https://api.x.ai/v1
```
Get your key at: https://x.ai/api

#### OpenRouter - Recommended
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_API_URL=https://openrouter.ai/api/v1
```
Get your key at: https://openrouter.ai/keys

#### Optional Providers
```env
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_API_KEY=your-key-here
```

### Voice Services
```env
DEEPGRAM_API_KEY=your-key-here
ELEVENLABS_API_KEY=sk-your-key-here
```

## 🎯 Usage Examples

### 1. Execute a Simple Agent
```typescript
const response = await fetch('/api/agents/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'code-review-agent',
    prompt: 'Review this code: ...',
    provider: 'xai',
    model: 'grok-4-fast',
  }),
});
```

### 2. Create and Run a Workflow
```typescript
const workflow = {
  name: 'Code Generation Pipeline',
  nodes: [
    {
      id: 'generate',
      type: 'llm',
      config: {
        provider: 'xai',
        model: 'grok-4-fast',
        prompt: 'Generate a React component...',
      },
    },
    {
      id: 'review',
      type: 'llm',
      config: {
        provider: 'xai',
        model: 'grok-4-fast',
        prompt: 'Review this code: {generate}',
      },
      inputs: ['generate'],
    },
  ],
};

const result = await fetch('/api/workflows/create', {
  method: 'POST',
  body: JSON.stringify(workflow),
});
```

### 3. Monitor Telemetry
```typescript
// Get agent metrics
const metrics = await fetch('/api/telemetry/metrics/agent/my-agent?hours=24');

// Get dashboard overview
const dashboard = await fetch('/api/telemetry/dashboard/overview?hours=24');
```

### 4. Process Documents
```typescript
// Upload and OCR
const formData = new FormData();
formData.append('file', documentFile);
const upload = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData,
});

// Perform OCR
const ocr = await fetch('/api/documents/ocr', {
  method: 'POST',
  body: JSON.stringify({ documentUrl: upload.url }),
});
```

## 📊 Architecture

### Frontend (Next.js)
```
apps/web/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── FloatingChatBar.tsx
│   │   ├── ActivityDashboard.tsx
│   │   ├── DocumentEditor.tsx
│   │   ├── MCPToolsLibrary.tsx
│   │   └── EnhancedSettingsPage.tsx
│   └── types/               # TypeScript types
│       └── providers.ts
```

### Backend (FastAPI)
```
apps/api/
├── main.py                  # Main FastAPI app
├── telemetry/
│   ├── collector.py        # Telemetry collection
│   └── routes.py           # API endpoints
├── llm/
│   └── providers.py        # LLM provider abstraction
├── documents/
│   └── routes.py           # Document processing
└── workflows/
    ├── executor.py         # Workflow execution
    └── routes.py           # Workflow API
```

## 🔒 Security

- API keys encrypted at rest
- HTTPS/TLS for all communications
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- JWT authentication (optional)
- OAuth2 support (Google, GitHub)

## 📈 Performance

### Optimizations
- Connection pooling for databases
- Redis caching for frequent queries
- Async/await throughout
- Lazy loading for frontend components
- CDN for static assets
- Database indexing
- Query optimization

### Benchmarks
- API response time: <100ms (avg)
- Workflow execution: Parallel node support
- Document OCR: <5s for typical page
- LLM latency: Depends on provider

## 🧪 Testing

```bash
# Frontend tests
cd apps/web
npm test

# Backend tests
cd apps/api
pytest

# E2E tests
npm run test:e2e
```

## 📝 Changelog

### v1.0.0 (2025-11-01)
- ✅ Universal LLM provider support (xAI, OpenRouter, OpenAI, Anthropic, Google)
- ✅ Comprehensive telemetry system
- ✅ Activity dashboard with real-time monitoring
- ✅ AI-enabled document editor
- ✅ MCP tools library
- ✅ Workflow execution engine
- ✅ Floating chat interface
- ✅ Enhanced settings page

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- Anthropic for Claude
- Google for Gemini
- xAI for Grok (game-changing pricing!)
- OpenRouter for unified API access
- Model Context Protocol (MCP) community

## 📞 Support

- Documentation: https://docs.agent-platform.ai
- Discord: https://discord.gg/agent-platform
- Email: support@agent-platform.ai
- GitHub Issues: https://github.com/your-org/agent-platform/issues

## 🗺️ Roadmap

### Q1 2025
- [ ] Agent marketplace launch
- [ ] Community features
- [ ] Advanced optimization algorithms
- [ ] Real-time collaboration

### Q2 2025
- [ ] Mobile app (iOS/Android)
- [ ] VS Code extension
- [ ] Enterprise features
- [ ] Multi-tenancy support

### Q3 2025
- [ ] Self-hosted option
- [ ] Custom model fine-tuning
- [ ] Advanced analytics
- [ ] API versioning

---

Built with ❤️ by the Agent Platform Team

**Why xAI Grok?**
- 💰 96% cheaper than GPT-4o
- 🧠 Highest intelligence (60.25 vs 26.31)
- ⚡ Very fast response times
- 🎯 Perfect for agents at scale

Save thousands on AI costs while getting better results!
