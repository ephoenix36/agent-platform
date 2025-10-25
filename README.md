# Agents - Optimizable AI Agent Instruction Library

A curated library of AI agent instructions that can be automatically optimized using evolutionary algorithms via Evosuite SDK integration.

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
```

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
└── src/                 # TypeScript source code
```

## 🛠️ Architecture

- **TypeScript Layer**: Agent management, CLI, MCP integration
- **Python Layer**: Evosuite SDK integration, optimization engine
- **Bridge**: stdio-based communication between TS and Python

## 📖 Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 📝 License

MIT
