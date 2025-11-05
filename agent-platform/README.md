# 🤖 AI Agent Platform

> **The Ultimate Collaborative AI Agent Marketplace**

Build, share, and monetize AI agents with a canvas-based UI, voice control, and real-time streaming. Support for multiple agent formats and protocols in one unified platform.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-teal)

---

## ✨ Features

### 🎨 Canvas-Based UI
- **Drag-and-drop** agent composition
- **Visual workflows** with React Flow
- **Custom node types** for different agent roles
- **Real-time collaboration** (coming soon)
- **Auto-layout** algorithms

### 🎤 Voice Control
- **Natural language** commands
- **Web Speech API** integration
- **Hands-free** agent configuration
- **Voice feedback** for all actions

### 🔄 Multi-Protocol Support
- **MCP** (Model Context Protocol)
- **Agent Protocol** (standardized API)
- **CrewAI** (multi-agent orchestration)
- **LangChain** + **LangGraph**
- **Custom** agent formats

### 📝 Multi-Format Parsing
- **Markdown** agents with section headers
- **JSON** standardized format
- **YAML** (CrewAI-compatible)
- **XML** structured definitions
- **Auto-detection** of format

### 💰 Flexible Monetization
- **Subscription** tiers (Basic, Pro, Enterprise)
- **Usage-based** pricing (per execution, per token)
- **Time-based** billing (per minute)
- **Hybrid** models
- **Revenue sharing** for collaborators

### 🔒 Security & Privacy
- **Docker sandbox** execution
- **Permission system** with granular control
- **Data encryption** at rest and in transit
- **Rate limiting** and quotas
- **Visibility controls** (public, private, unlisted)

### 🌊 Streaming UI
- **Real-time** component generation
- **Progressive rendering** as agents work
- **Custom widgets** from agents
- **Server-Sent Events** (SSE)

### 👥 Community Features
- **Shared workspaces**
- **Team collaboration**
- **Synergy metrics** to measure collaborative output
- **Community discovery**
- **Leaderboards** and achievements

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm 10+
- **Python** 3.12+
- **Docker** and Docker Compose
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-platform.git
cd agent-platform

# Install dependencies
npm install

# Install Python dependencies
cd apps/api
pip install -r requirements.txt
cd ../..

# Start databases
npm run docker:up

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Access the Platform

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **RabbitMQ UI**: http://localhost:15672 (admin/admin123)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

---

## 📖 Usage

### Creating an Agent

#### Via UI
1. Open http://localhost:3000
2. Click "Add Agent" button
3. Configure agent properties
4. Save and deploy

#### Via Markdown
```markdown
# Research Agent

## Description
Performs deep research on any topic using web search and summarization

## Instructions
1. Analyze the research topic
2. Search for relevant information
3. Synthesize findings
4. Generate comprehensive report

## Tools
- web_search
- summarizer
- report_generator

## Model
gpt-4

## Parameters
- temperature: 0.7
- max_tokens: 2000
```

#### Via JSON
```json
{
  "name": "Data Analyst Agent",
  "description": "Analyzes datasets and generates insights",
  "instructions": "Load data, perform statistical analysis, create visualizations",
  "tools": [
    {"name": "pandas", "type": "python"},
    {"name": "matplotlib", "type": "python"}
  ],
  "model": "gpt-4",
  "parameters": {
    "temperature": 0.3,
    "max_tokens": 1500
  }
}
```

#### Via YAML (CrewAI Style)
```yaml
researcher:
  role: Senior Data Researcher
  goal: Uncover cutting-edge developments in AI
  backstory: You're a seasoned researcher with expertise in AI
  tools:
    - web_search
    - document_analyzer
```

### Running an Agent

```typescript
// Frontend (TypeScript)
import { useAgent } from '@/hooks/useAgent';

const { execute } = useAgent('agent-id');

const results = await execute({
  input: "Research the latest developments in AI agents",
  stream: true
});
```

```python
# Backend (Python)
from app.services.agent_execution import ExecutionEngine

engine = ExecutionEngine()
async for event in engine.execute_agent(
    agent_id="agent-123",
    protocol="mcp",
    input_data={"query": "Latest AI trends"}
):
    print(event)
```

### Voice Commands

- **"Create a new agent"** - Opens agent creation dialog
- **"Run the workflow"** - Executes current workflow
- **"Add a data source"** - Adds data node to canvas
- **"Configure agent X"** - Opens configuration for agent X
- **"Show me the marketplace"** - Navigates to marketplace

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│       Client Layer (Next.js)        │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ Canvas  │ │  Voice  │ │ Widgets││
│  └─────────┘ └─────────┘ └────────┘│
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│      API Gateway (FastAPI)          │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │   REST  │ │    WS   │ │ GraphQL││
│  └─────────┘ └─────────┘ └────────┘│
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│        Core Services                │
│  ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │Execution │ │Marketplace│ │Voice ││
│  └──────────┘ └──────────┘ └──────┘│
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│      Protocol Adapters              │
│  ┌─────┐ ┌─────┐ ┌────────┐ ┌─────┐│
│  │ MCP │ │ A.P.│ │ CrewAI │ │ L.C.││
│  └─────┘ └─────┘ └────────┘ └─────┘│
└─────────────────┬───────────────────┘
                  │
┌─────────────────┴───────────────────┐
│          Data Layer                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌─────┐│
│  │Postgres│ │Mongo│ │Redis │ │ S3  ││
│  └──────┘ └──────┘ └──────┘ └─────┘│
└─────────────────────────────────────┘
```

---

## 📁 Project Structure

```
agent-platform/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # App router pages
│   │   │   ├── components/  # React components
│   │   │   │   ├── canvas/  # Canvas UI
│   │   │   │   ├── voice/   # Voice assistant
│   │   │   │   ├── streaming/ # Streaming UI
│   │   │   │   └── marketplace/
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── lib/         # Utilities
│   │   │   └── store/       # Zustand stores
│   │   └── package.json
│   │
│   └── api/                 # FastAPI backend
│       ├── app/
│       │   ├── api/         # API routes
│       │   ├── core/        # Core config
│       │   ├── models/      # Data models
│       │   ├── services/    # Business logic
│       │   │   ├── agent_execution/
│       │   │   ├── parsers/
│       │   │   ├── marketplace/
│       │   │   └── voice/
│       │   └── main.py
│       └── requirements.txt
│
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared TypeScript types
│   └── config/              # Shared configuration
│
├── infrastructure/
│   ├── docker/              # Docker images
│   ├── k8s/                 # Kubernetes manifests
│   └── terraform/           # IaC
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 🛠️ Development

### Commands

```bash
# Development
npm run dev              # Start all services
npm run dev:web          # Frontend only
npm run dev:api          # Backend only

# Build
npm run build            # Build all apps
npm run build:web        # Build frontend
npm run build:api        # Build backend

# Test
npm run test             # Run all tests
npm run test:web         # Frontend tests
npm run test:api         # Backend tests

# Lint & Format
npm run lint             # Lint all code
npm run lint:fix         # Fix lint issues
npm run format           # Format with Prettier

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database

# Docker
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
```

### Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude
- `STRIPE_SECRET_KEY` - Stripe for payments
- `DATABASE_URL` - PostgreSQL connection string
- `MONGO_URL` - MongoDB connection string
- `REDIS_URL` - Redis connection string

---

## 📊 Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] Project setup and architecture
- [x] Next.js frontend with canvas UI
- [x] FastAPI backend
- [x] Multi-format agent parser
- [x] Voice assistant integration
- [x] Docker Compose infrastructure

### 🚧 Phase 2: Core Features (In Progress)
- [ ] Agent execution engine
- [ ] Protocol adapters (MCP, Agent Protocol, CrewAI)
- [ ] Streaming UI renderer
- [ ] Marketplace listing
- [ ] Payment integration
- [ ] Sandboxed execution

### 📅 Phase 3: Advanced Features (Planned)
- [ ] Community features
- [ ] Collaborative workspaces
- [ ] Synergy metrics
- [ ] Advanced voice commands
- [ ] Mobile app
- [ ] Enterprise features

### 🔮 Phase 4: Scale & Polish (Future)
- [ ] Kubernetes deployment
- [ ] Global CDN
- [ ] Advanced analytics
- [ ] White-label solutions
- [ ] Plugin marketplace

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode, full type coverage
- **Python**: Type hints, docstrings, PEP 8
- **Testing**: 80%+ coverage required
- **Documentation**: Update docs with changes

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- **CrewAI** for multi-agent inspiration
- **LangChain** for agent framework patterns
- **React Flow** for canvas UI
- **FastAPI** for amazing backend framework
- **Next.js** team for excellent DX

---

## 📞 Support

- 📧 Email: support@agentplatform.dev
- 💬 Discord: [Join our community](https://discord.gg/agentplatform)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/agent-platform/issues)
- 📖 Docs: [Documentation](https://docs.agentplatform.dev)

---

**Built with ❤️ for the AI community**
