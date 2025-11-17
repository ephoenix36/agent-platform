# Agents - Optimizable AI Agent Instruction Library

A curated library of AI agent instructions that can be automatically optimized using evolutionary algorithms via Evosuite SDK integration, now with **MCP server support** for collaborative multi-agent workflows.

## 🎯 Overview

**Agents** is a library system for creating, organizing, and optimizing AI agent instructions for any task domain:
- Creative tools (Photoshop, Figma, Blender)
- Web development (frontend, backend, full-stack teams)
- Research (literature review, data analysis, multi-agent teams)
- Automation (file processing, workflow orchestration)

Each agent instruction can be:
- Organized into Collections and subsections
- Equipped with MCP tools
- Automatically optimized via Evosuite SDK
- Validated with custom evaluators
- Evolved with intelligent mutators

### 🤝 Collaborative Features (MCP Server)

The included **MCP server** enables AI assistants to:
- **Search and discover** expert agents across all collections
- **Create multi-agent conversations** for collaborative problem-solving
- **Assign and track tasks** across agent teams
- **Request token sampling** for complex reasoning
- **Monitor optimization progress** of agent instructions

See [MCP_SERVER.md](./MCP_SERVER.md) for complete MCP server documentation.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# List all collections
agents list

# Run an agent
agents run creative-tools/photoshop/color-correction

# Optimize an agent
agents optimize creative-tools/photoshop/color-correction --threshold 0.85

# Start the MCP server
npm run mcp-server
```

### Using with Claude Desktop

1. Build the project: `npm run build`
2. Add to your Claude Desktop configuration:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "agents": {
      "command": "node",
      "args": ["C:/Users/YOUR_USERNAME/Documents/Coding_Projects/Agents/dist/mcp/server.js"]
    }
  }
}
```

3. Restart Claude Desktop
4. Use the MCP tools to search agents, create conversations, and collaborate!

## 📁 Project Structure

```
Agents/
├── collections/          # Agent instruction library
│   ├── creative-tools/
│   ├── web-development/
│   ├── research/
│   └── automation/
├── evaluators/          # Evaluator templates and implementations
├── mutators/            # Mutator strategies
├── optimization/        # Python optimization engine
├── src/
│   ├── core/           # Core agent management
│   ├── bridge/         # Python bridge
│   ├── mcp/            # MCP server implementation
│   └── cli.ts          # Command-line interface
└── dist/               # Compiled output
```

## 🛠️ Architecture

- **TypeScript Layer**: Agent management, CLI, MCP server
- **Python Layer**: Evosuite SDK integration, optimization engine
- **Bridge**: stdio-based communication between TS and Python
- **MCP Server**: Collaborative agent tools for AI assistants

## 📖 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and architecture
- [MCP_SERVER.md](./MCP_SERVER.md) - MCP server tools and usage
- [TRANSFORMATION.md](./TRANSFORMATION.md) - Project evolution notes

## 🎯 Key Features

### Agent Management
- Organize agents in collections and subsections
- Rich metadata (tags, difficulty, scores)
- Version control and optimization history

### MCP Integration
- **16 collaborative tools** for AI assistants
- Agent search and discovery
- Multi-agent conversations
- Task assignment and tracking
- Token sampling requests
- Optimization monitoring

### Optimization Engine
- Evolutionary algorithm-based optimization
- Custom evaluators and mutators
- Convergence detection
- Performance tracking

## 📝 License

MIT
