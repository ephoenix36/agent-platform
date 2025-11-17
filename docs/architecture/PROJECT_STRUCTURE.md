# AI Agent Platform - Monorepo Structure

```
agent-platform/
├── README.md
├── package.json                    # Root package.json for workspace
├── turbo.json                      # Turborepo configuration
├── .gitignore
├── .env.example
├── docker-compose.yml              # Local development stack
│
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/               # App router pages
│   │   │   ├── components/
│   │   │   │   ├── canvas/       # Canvas components
│   │   │   │   ├── streaming/    # Streaming UI
│   │   │   │   ├── voice/        # Voice components
│   │   │   │   ├── marketplace/  # Marketplace UI
│   │   │   │   └── community/    # Community features
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/            # Zustand stores
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── tests/
│   │
│   └── api/                        # FastAPI backend
│       ├── pyproject.toml
│       ├── requirements.txt
│       ├── Dockerfile
│       ├── app/
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── api/
│       │   │   ├── v1/
│       │   │   │   ├── agents.py
│       │   │   │   ├── marketplace.py
│       │   │   │   ├── payments.py
│       │   │   │   ├── community.py
│       │   │   │   └── executions.py
│       │   │   └── dependencies.py
│       │   ├── core/
│       │   │   ├── auth/
│       │   │   ├── permissions/
│       │   │   └── security/
│       │   ├── services/
│       │   │   ├── agent_execution/
│       │   │   │   ├── engine.py
│       │   │   │   ├── adapters/
│       │   │   │   │   ├── mcp_adapter.py
│       │   │   │   │   ├── agent_protocol_adapter.py
│       │   │   │   │   ├── crewai_adapter.py
│       │   │   │   │   ├── langchain_adapter.py
│       │   │   │   │   └── custom_adapter.py
│       │   │   │   ├── sandbox.py
│       │   │   │   └── streaming.py
│       │   │   ├── parsers/
│       │   │   │   ├── multi_format_parser.py
│       │   │   │   ├── markdown_parser.py
│       │   │   │   ├── json_parser.py
│       │   │   │   ├── yaml_parser.py
│       │   │   │   └── xml_parser.py
│       │   │   ├── marketplace/
│       │   │   ├── payments/
│       │   │   ├── community/
│       │   │   ├── voice/
│       │   │   └── ui_generator/
│       │   ├── models/
│       │   │   ├── agent.py
│       │   │   ├── user.py
│       │   │   ├── marketplace.py
│       │   │   ├── payment.py
│       │   │   └── community.py
│       │   ├── db/
│       │   │   ├── postgres.py
│       │   │   ├── mongodb.py
│       │   │   ├── redis.py
│       │   │   └── migrations/
│       │   └── utils/
│       └── tests/
│
├── packages/
│   ├── ui/                        # Shared UI components
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── tsconfig.json
│   │
│   ├── types/                     # Shared TypeScript types
│   │   ├── package.json
│   │   └── src/
│   │       ├── agent.ts
│   │       ├── marketplace.ts
│   │       ├── user.ts
│   │       └── api.ts
│   │
│   └── config/                    # Shared configuration
│       ├── package.json
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── services/                      # Microservices
│   ├── websocket/                 # Real-time communication
│   │   ├── package.json
│   │   └── src/
│   │
│   ├── worker/                    # Background jobs
│   │   ├── pyproject.toml
│   │   └── src/
│   │
│   └── analytics/                 # Analytics service
│       ├── package.json
│       └── src/
│
├── infrastructure/
│   ├── k8s/                      # Kubernetes manifests
│   ├── terraform/                # Infrastructure as code
│   └── docker/                   # Docker images
│
└── docs/
    ├── API.md
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    └── CONTRIBUTING.md
```

## Technology Choices

### Frontend (apps/web)
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query
- **Canvas**: React Flow (Xyflow)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

### Backend (apps/api)
- **Framework**: FastAPI
- **Language**: Python 3.12
- **ORM**: SQLAlchemy + Alembic
- **Async**: asyncio + uvicorn
- **Validation**: Pydantic v2

### Infrastructure
- **Databases**: PostgreSQL + MongoDB + Redis
- **Message Queue**: RabbitMQ
- **Storage**: AWS S3 / MinIO
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

### Agent Frameworks
- **MCP**: @modelcontextprotocol/sdk
- **Agent Protocol**: agent-protocol-sdk
- **CrewAI**: crewai
- **LangChain**: langchain + langgraph
- **AutoGen**: pyautogen

## Development Commands

```bash
# Install dependencies
npm install
cd apps/api && pip install -r requirements.txt

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

# Lint
npm run lint             # Lint all code
npm run lint:fix         # Fix lint issues

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
```

## Environment Variables

See `.env.example` for required environment variables.

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Install dependencies: `npm install`
4. Start databases: `docker-compose up -d`
5. Run migrations: `npm run db:migrate`
6. Start development server: `npm run dev`
7. Visit http://localhost:3000

## Documentation

- [Architecture](./PLATFORM_ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Contributing](./docs/CONTRIBUTING.md)
