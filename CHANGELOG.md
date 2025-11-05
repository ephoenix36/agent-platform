# Changelog

All notable changes to the Agents project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-10-27

### Added - MCP Server for Collaborative AI Workflows

#### New Components
- **MCP Server** (`src/mcp/server.ts`) - Complete Model Context Protocol server implementation
- **Conversation Manager** (`src/mcp/conversation-manager.ts`) - Multi-agent conversation orchestration
- **Task Manager** (`src/mcp/task-manager.ts`) - Task assignment and progress tracking
- **Sampling Manager** (`src/mcp/sampling-manager.ts`) - Token sampling request management

#### New Tools (16 Total)

**Agent Discovery:**
- `search_agents` - Search agents by name, tags, collection, score, difficulty
- `get_agent` - Get complete agent details including instructions and history
- `list_collections` - List all available agent collections
- `list_subsections` - List subsections within a collection

**Conversation Management:**
- `create_conversation` - Create multi-agent conversations for collaboration
- `add_conversation_message` - Add messages to ongoing conversations
- `get_conversation` - Retrieve conversation history and details
- `list_conversations` - List conversations with status filtering

**Task Management:**
- `create_task` - Create and assign tasks to agents
- `update_task_status` - Update task status and progress
- `get_task` - Get detailed task information
- `list_tasks` - List tasks with comprehensive filtering

**Sampling:**
- `request_sampling` - Request token sampling from client LLM

**Optimization:**
- `optimize_agent` - Start evolutionary optimization for an agent
- `get_optimization_history` - View agent optimization history

#### Documentation
- `MCP_SERVER.md` - Complete MCP server documentation and API reference
- `QUICKSTART.md` - Step-by-step guide for using the MCP server
- `MCP_IMPLEMENTATION.md` - Technical implementation details and architecture
- `claude_desktop_config.example.json` - Configuration template for Claude Desktop

#### Scripts
- Added `npm run mcp-server` script to package.json
- Added `agents-mcp` binary entry point

### Changed
- Updated `README.md` with MCP server features and quick start
- Enhanced project structure to include `src/mcp/` directory
- Added collaborative features section to overview

### Technical Details
- Uses `@modelcontextprotocol/sdk` v1.17.2
- Stdio transport for local communication
- Full TypeScript implementation with type safety
- Comprehensive error handling in MCP format
- Zod schemas for input validation

### Use Cases Enabled
1. **Research Teams** - Multi-agent collaboration for literature review and analysis
2. **Development Teams** - Coordinated task assignment across specialized agents
3. **Expert Consultation** - Access to domain experts with specialized knowledge
4. **Agent Optimization** - Evolutionary improvement of agent instructions
5. **Knowledge Synthesis** - Combined expertise from multiple perspectives

### Future Enhancements Planned
- Persistent storage (database backend)
- Real MCP sampling integration
- WebSocket notifications
- Advanced search with embeddings
- Conversation export/import
- Task templates and automation

## [0.1.0] - 2025-10-25

### Added - Initial Release

#### Core Features
- Agent instruction library system
- Collection-based organization (creative-tools, web-development, research, automation)
- Subsection categorization within collections
- JSON-based agent instruction format

#### Agent Schema
- System prompts and user prompt templates
- Examples for few-shot learning
- MCP tool requirements and permissions
- Evaluator configuration (rule-based, LLM-judge, automated-test)
- Mutator strategies for optimization
- Optimization history tracking
- Metadata (tags, difficulty, scores, tokens)

#### Infrastructure
- TypeScript core with Python optimization layer
- AgentManager for CRUD operations
- Python bridge for optimization communication
- CLI for agent management
- Build system with TypeScript compilation

#### Documentation
- `README.md` - Project overview
- `ARCHITECTURE.md` - System design documentation
- Initial agent templates

#### Initial Collections
- `creative-tools/` - Agents for creative software
- `web-development/` - Development and engineering agents
- `research/` - Research and analysis agents
  - `literature-review/literature-synthesizer` - Academic literature synthesis
- `automation/` - Workflow automation agents
- `meta-agents/` - Self-improvement and system agents

### Technical Details
- TypeScript 5.5.4
- Node.js ES2022 modules
- Zod 3.22.4 for schema validation
- Commander for CLI
- Path-based agent organization

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes to agent schema or API
- **Minor (0.X.0)**: New features, new tools, new collections
- **Patch (0.0.X)**: Bug fixes, documentation updates, minor improvements

## Upgrade Guide

### From 0.1.0 to 0.2.0

**No breaking changes** - This is a backwards-compatible feature addition.

#### New Features Available
1. MCP server for collaborative workflows
2. 16 new tools for agent discovery and collaboration
3. Multi-agent conversations
4. Task management system

#### To Start Using MCP Features
1. Rebuild the project: `npm run build`
2. Configure Claude Desktop (see `QUICKSTART.md`)
3. Restart Claude Desktop
4. Access tools through natural language

#### Existing Functionality
All existing CLI commands and agent management functions continue to work:
- `agents list`
- `agents run`
- `agents optimize`
- Direct use of AgentManager API

---

## Roadmap

### v0.3.0 (Planned)
- Persistent storage backend
- Real MCP sampling integration
- Enhanced search with semantic embeddings
- Conversation export/import

### v0.4.0 (Planned)
- Agent marketplace
- Collaborative editing
- Real-time notifications
- Web UI dashboard

### v1.0.0 (Future)
- Production-ready optimization engine
- Distributed agent execution
- Full Evosuite SDK integration
- Enterprise features (auth, multi-tenancy)

---

For questions or suggestions, please open an issue on the project repository.
