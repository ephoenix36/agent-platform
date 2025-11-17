/**
 * Enhanced Documentation Generation Tools
 * 
 * Tools for generating high-value project documents:
 * - README with badges, features, quick start
 * - ROADMAP with phases and milestones  
 * - ARCHITECTURE docs with diagrams
 * - API documentation
 * - CHANGELOG generation
 * - Contributing guidelines
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ProjectManagementService } from '../service/project-management-service.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate README.md template
 */
function generateReadmeTemplate(projectName: string, description: string, features?: string[]): string {
  return `# ${projectName}

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

## 📋 Overview

${description}

## ✨ Features

${features?.map(f => `- ${f}`).join('\n') || '- Feature 1\n- Feature 2\n- Feature 3'}

## 🚀 Quick Start

### Prerequisites

\`\`\`bash
# List prerequisites here
node >= 18.0.0
npm >= 9.0.0
\`\`\`

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${projectName.toLowerCase().replace(/\s+/g, '-')}

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## 📖 Documentation

For detailed documentation, see:
- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Contributing](./docs/CONTRIBUTING.md)

## 🗺️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and milestones.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: TBD
- **Contributors**: See [Contributors](./CONTRIBUTORS.md)

## 📞 Support

- Documentation: [docs/](./docs/)
- Issues: [GitHub Issues](issues-url)
- Discussions: [GitHub Discussions](discussions-url)
`;
}

/**
 * Generate ROADMAP.md template
 */
function generateRoadmapTemplate(projectName: string): string {
  return `# ${projectName} - Product Roadmap

## Vision

[Your product vision statement here]

## Current Version: 1.0.0

---

## 🎯 Phase 1: Foundation (Q1 2025)

**Status**: 🚧 In Progress

### Objectives
- [ ] Core infrastructure setup
- [ ] Basic feature implementation
- [ ] Initial testing framework

### Milestones

#### Milestone 1.1: Project Setup
- [ ] Development environment configuration
- [ ] CI/CD pipeline
- [ ] Documentation structure
- **Target**: Week 1-2

#### Milestone 1.2: Core Features
- [ ] Feature A implementation
- [ ] Feature B implementation
- [ ] Integration tests
- **Target**: Week 3-6

---

## 🚀 Phase 2: Growth (Q2 2025)

**Status**: 📋 Planned

### Objectives
- [ ] Performance optimization
- [ ] Advanced features
- [ ] User feedback integration

### Milestones

#### Milestone 2.1: Optimization
- [ ] Performance profiling
- [ ] Code optimization
- [ ] Load testing
- **Target**: Week 7-10

#### Milestone 2.2: Feature Expansion
- [ ] Advanced feature set
- [ ] Plugin system
- [ ] API extensions
- **Target**: Week 11-14

---

## 🎨 Phase 3: Polish (Q3 2025)

**Status**: 💡 Ideation

### Objectives
- [ ] UI/UX refinement
- [ ] Documentation completion
- [ ] Security hardening

### Milestones

#### Milestone 3.1: User Experience
- [ ] UI improvements
- [ ] Accessibility compliance
- [ ] User onboarding flow
- **Target**: Week 15-18

---

## 📊 Success Metrics

| Metric | Current | Target (Phase 1) | Target (Phase 2) | Target (Phase 3) |
|--------|---------|------------------|------------------|------------------|
| Performance | - | 90% | 95% | 98% |
| Test Coverage | - | 70% | 80% | 90% |
| User Satisfaction | - | 3.5/5 | 4.0/5 | 4.5/5 |

---

## 📝 Update History

| Date | Phase | Changes | Updated By |
|------|-------|---------|------------|
| YYYY-MM-DD | Phase 1 | Initial roadmap | Team |

---

## 💬 Feedback

Have suggestions for the roadmap? [Open a discussion](discussions-url)
`;
}

/**
 * Generate ARCHITECTURE.md template
 */
function generateArchitectureTemplate(projectName: string, techStack?: string[]): string {
  return `# ${projectName} - Architecture Documentation

## 🏗️ System Overview

[High-level description of the system architecture]

## 📐 Architecture Diagram

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web UI     │  │  Mobile App  │  │   CLI Tool   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ REST API / GraphQL
                         │
┌────────────────────────▼────────────────────────────────┐
│                   API Gateway                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │     Auth     │  │  Rate Limit  │  │   Routing    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                 Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Business   │  │   Service    │  │   Workflow   │ │
│  │    Logic     │  │   Layer      │  │   Engine     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Database   │  │     Cache    │  │   Storage    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
\`\`\`

## 🔧 Technology Stack

${techStack?.map(tech => `- **${tech}**`).join('\n') || `- **Frontend**: React 18 + TypeScript
- **Backend**: Node.js + FastAPI
- **Database**: PostgreSQL + Redis
- **Infrastructure**: Docker + Kubernetes`}

## 📦 Component Architecture

### Core Components

#### 1. API Layer
- **Purpose**: Handle external requests and route to appropriate services
- **Technology**: Express.js / FastAPI
- **Key Files**: \`src/api/\`, \`src/routes/\`

#### 2. Business Logic Layer
- **Purpose**: Implement core business rules and workflows
- **Technology**: TypeScript / Python
- **Key Files**: \`src/services/\`, \`src/domain/\`

#### 3. Data Access Layer
- **Purpose**: Manage database operations and data persistence
- **Technology**: Prisma / SQLAlchemy
- **Key Files**: \`src/models/\`, \`src/repositories/\`

## 🔐 Security Architecture

### Authentication & Authorization
- Authentication: JWT tokens
- Authorization: Role-based access control (RBAC)
- Session management: Redis-backed sessions

### Data Protection
- Encryption at rest: AES-256
- Encryption in transit: TLS 1.3
- PII handling: Data masking and tokenization

## 🚀 Deployment Architecture

### Environments
- **Development**: Local Docker Compose
- **Staging**: Kubernetes cluster (staging namespace)
- **Production**: Kubernetes cluster (production namespace)

### CI/CD Pipeline
1. Code commit → GitHub Actions trigger
2. Automated tests (unit, integration, e2e)
3. Build Docker images
4. Security scanning
5. Deploy to staging
6. Smoke tests
7. Manual approval for production
8. Production deployment
9. Health checks

## 📊 Data Flow

### Request Lifecycle
\`\`\`
1. Client Request → API Gateway
2. Authentication & Validation
3. Route to Service Handler
4. Business Logic Execution
5. Database Operations
6. Response Formation
7. Return to Client
\`\`\`

## 🔄 State Management

[Describe state management approach]

## 📈 Scalability Considerations

- **Horizontal Scaling**: Stateless application servers
- **Database Scaling**: Read replicas + connection pooling
- **Caching Strategy**: Redis for hot data
- **CDN**: Static assets served via CDN
- **Load Balancing**: Application-level load balancing

## 🔍 Monitoring & Observability

- **Logging**: Structured JSON logs → ELK stack
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Alerting**: PagerDuty integration

## 🛠️ Development Guidelines

### Code Organization
\`\`\`
src/
├── api/           # API endpoints and routing
├── services/      # Business logic services
├── models/        # Data models
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── tests/         # Test suites
\`\`\`

### Design Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Dependency Injection**: Loose coupling
- **Event-Driven**: Asynchronous processing

## 📚 Additional Resources

- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Performance Optimization](./PERFORMANCE.md)

---

**Last Updated**: YYYY-MM-DD
**Version**: 1.0.0
`;
}

/**
 * Register enhanced documentation tools
 */
export function registerEnhancedDocTools(
  server: McpServer,
  service: ProjectManagementService
): void {
  
  /**
   * Generate README.md
   */
  server.tool(
    'pm_generate_readme',
    'Generate a comprehensive README.md for a project',
    {
      slug: z.string().describe('Project slug'),
      features: z.array(z.string()).optional().describe('Key features to highlight'),
      badges: z.array(z.object({
        label: z.string(),
        message: z.string(),
        color: z.string().optional()
      })).optional().describe('Additional badges to include'),
    },
    async ({ slug, features, badges }) => {
      try {
        const project = service.getProject(slug);
        const content = generateReadmeTemplate(project.name, project.description, features);
        
        const readmePath = path.join(project.paths.root, 'README.md');
        fs.writeFileSync(readmePath, content, 'utf-8');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `README.md generated for project '${project.name}'`,
              path: readmePath,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Generate ARCHITECTURE.md
   */
  server.tool(
    'pm_generate_architecture_doc',
    'Generate architecture documentation with diagrams and technical details',
    {
      slug: z.string().describe('Project slug'),
      techStack: z.array(z.string()).optional().describe('Technologies used in the stack'),
    },
    async ({ slug, techStack }) => {
      try {
        const project = service.getProject(slug);
        const content = generateArchitectureTemplate(project.name, techStack);
        
        const docsPath = path.join(project.paths.docs, 'ARCHITECTURE.md');
        fs.mkdirSync(path.dirname(docsPath), { recursive: true });
        fs.writeFileSync(docsPath, content, 'utf-8');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `ARCHITECTURE.md generated for project '${project.name}'`,
              path: docsPath,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Update roadmap phase status
   */
  server.tool(
    'pm_update_roadmap_phase',
    'Update the status of a roadmap phase',
    {
      slug: z.string().describe('Project slug'),
      phaseNumber: z.number().describe('Phase number (1, 2, 3, etc.)'),
      status: z.enum(['planned', 'in-progress', 'completed', 'delayed']).describe('New phase status'),
    },
    async ({ slug, phaseNumber, status }) => {
      try {
        const project = service.getProject(slug);
        const roadmapPath = path.join(project.paths.root, 'ROADMAP.md');
        
        if (!fs.existsSync(roadmapPath)) {
          throw new Error('ROADMAP.md does not exist. Generate it first with pm_generate_roadmap.');
        }
        
        let content = fs.readFileSync(roadmapPath, 'utf-8');
        
        // Update phase status emoji
        const statusEmojis: Record<string, string> = {
          'planned': '📋',
          'in-progress': '🚧',
          'completed': '✅',
          'delayed': '⏸️'
        };
        
        const phaseRegex = new RegExp(`(## [^#]* Phase ${phaseNumber}[^\\n]*\\n\\n\\*\\*Status\\*\\*: )[^\\n]+`, 'g');
        content = content.replace(phaseRegex, `$1${statusEmojis[status]} ${status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}`);
        
        fs.writeFileSync(roadmapPath, content, 'utf-8');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Updated Phase ${phaseNumber} status to '${status}'`,
              path: roadmapPath,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Mark roadmap item complete
   */
  server.tool(
    'pm_complete_roadmap_item',
    'Mark a roadmap checklist item as complete',
    {
      slug: z.string().describe('Project slug'),
      itemText: z.string().describe('Text of the item to mark complete (partial match)'),
    },
    async ({ slug, itemText }) => {
      try {
        const project = service.getProject(slug);
        const roadmapPath = path.join(project.paths.root, 'ROADMAP.md');
        
        if (!fs.existsSync(roadmapPath)) {
          throw new Error('ROADMAP.md does not exist. Generate it first with pm_generate_roadmap.');
        }
        
        let content = fs.readFileSync(roadmapPath, 'utf-8');
        
        // Find and replace [ ] with [x] for matching items
        const lines = content.split('\n');
        let matchCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('- [ ]') && lines[i].toLowerCase().includes(itemText.toLowerCase())) {
            lines[i] = lines[i].replace('- [ ]', '- [x]');
            matchCount++;
          }
        }
        
        if (matchCount === 0) {
          throw new Error(`No uncompleted items found matching: "${itemText}"`);
        }
        
        content = lines.join('\n');
        fs.writeFileSync(roadmapPath, content, 'utf-8');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Marked ${matchCount} item(s) as complete`,
              itemText,
              path: roadmapPath,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}
