# Persistent Storage System for MCP Agent Platform

## Overview

This directory contains the persistent storage system for the MCP Agent Platform, providing durable, structured storage for all agent-related assets in the `~/.agents` directory (Windows: `C:\Users\[username]\.agents`).

## Quick Start

### 1. Setup Storage

Run the PowerShell setup script to create the directory structure:

```powershell
pwsh ./scripts/setup-persistent-storage.ps1
```

This creates:
- `~/.agents/` root directory
- All subdirectories for agents, skills, workflows, etc.
- Configuration files
- Example templates

### 2. Migrate Existing Agents (Optional)

If you have agents in the `collections/` directory, migrate them:

```bash
npm run migrate:storage
# or
node --loader ts-node/esm scripts/migrate-to-persistent-storage.ts
```

### 3. Use in Your Code

```typescript
import { PersistentStorageManager } from './core/persistent-storage.js';

const storage = new PersistentStorageManager();
await storage.initialize();

// Save an agent
await storage.saveAgent({
  id: 'my-agent',
  name: 'My Agent',
  model: 'gpt-4o',
  systemPrompt: '...',
  // ... other fields
}, 'json', 'custom');

// Load an agent
const agent = await storage.loadAgent('my-agent', 'custom');

// List all agents
const agents = await storage.listAgents();
```

## Storage Structure

```
~/.agents/
├── config.json                 # Storage configuration
├── README.md                   # This file (copied on setup)
├── .gitignore                  # Git ignore rules
│
├── agents/                     # Agent definitions
│   ├── configured/             # Runtime configured agents
│   ├── marketplace/            # Downloaded from marketplace
│   ├── custom/                 # User-created agents
│   └── templates/              # Agent templates
│
├── skills/                     # Skills with instructions & rules
│   ├── system/                 # System-provided skills
│   ├── user/                   # User-created skills
│   ├── marketplace/            # Downloaded skills
│   └── templates/              # Skill templates
│
├── teams/                      # Agent team configurations
│   ├── active/                 # Currently active teams
│   ├── archived/               # Archived teams
│   └── templates/              # Team templates
│
├── toolsets/                   # Tool collections with instructions
│   ├── core/                   # Core platform toolsets
│   ├── custom/                 # User-created toolsets
│   ├── marketplace/            # Downloaded toolsets
│   └── external-mcp/           # External MCP server integrations
│
├── workflows/                  # Workflow definitions & history
│   ├── active/                 # Active workflows
│   ├── templates/              # Workflow templates
│   └── history/                # Execution history
│
├── hooks/                      # Lifecycle hooks
│   ├── tool/                   # Tool execution hooks
│   ├── agent/                  # Agent execution hooks
│   ├── workflow/               # Workflow execution hooks
│   └── system/                 # System-level hooks
│
├── collections/                # Data collections & knowledge bases
│   ├── documents/              # Document collections
│   ├── datasets/               # Structured datasets
│   ├── knowledge-graphs/       # Knowledge graph data
│   └── vector-stores/          # Vector embeddings
│
├── evaluation/                 # Evaluation configs & results
│   ├── configs/                # Evaluator configurations
│   ├── results/                # Evaluation results
│   ├── metrics/                # Performance metrics
│   └── benchmarks/             # Benchmark definitions
│
├── mutation/                   # Mutation rules & evolution
│   ├── strategies/             # Mutation strategies
│   ├── constraints/            # Mutation constraints
│   └── history/                # Evolution history
│
├── metrics/                    # Performance tracking & analytics
│   ├── usage/                  # Usage statistics
│   ├── costs/                  # Cost tracking
│   ├── performance/            # Performance metrics
│   └── anomalies/              # Anomaly detection data
│
├── projects/                   # Project management data
│   ├── active/                 # Active projects
│   ├── archived/               # Archived projects
│   └── templates/              # Project templates
│
├── cache/                      # Cache & temporary storage
│   ├── embeddings/             # Cached embeddings
│   ├── api-responses/          # API response cache
│   └── temp/                   # Temporary files
│
├── logs/                       # System & execution logs
│   ├── agent-execution/        # Agent execution logs
│   ├── workflow/               # Workflow execution logs
│   ├── errors/                 # Error logs
│   └── audit/                  # Audit logs
│
└── backups/                    # Automated backups
    ├── daily/                  # Daily backups
    ├── weekly/                 # Weekly backups
    └── manual/                 # Manual backups
```

## File Formats

### Agent Formats

#### JSON Format (Primary)

```json
{
  "id": "example-agent",
  "name": "Example Agent",
  "version": "1.0.0",
  "model": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 2000,
  "topP": 1.0,
  "systemPrompt": "You are an example agent...",
  "toolkits": ["agent-development", "file-operations"],
  "skills": ["skill-1"],
  "metadata": {
    "category": "example",
    "author": "user",
    "created": "2025-11-16T00:00:00Z"
  },
  "createdAt": "2025-11-16T00:00:00Z",
  "updatedAt": "2025-11-16T00:00:00Z"
}
```

#### Markdown Format (Alternative)

```markdown
---
id: example-agent
name: Example Agent
version: 1.0.0
model: gpt-4o
temperature: 0.7
maxTokens: 2000
topP: 1.0
toolkits:
  - agent-development
  - file-operations
skills:
  - skill-1
metadata:
  category: example
  author: user
---

# System Prompt

You are an example agent designed to...

## Core Capabilities

- Capability 1
- Capability 2

## Examples

...
```

### Skill Format

```json
{
  "id": "example-skill",
  "name": "Example Skill",
  "version": "1.0.0",
  "description": "A skill that does X",
  "toolkits": ["file-operations", "data-management"],
  "systemInstructions": "Detailed instructions for this skill...",
  "rules": [
    "Rule 1: Always validate inputs",
    "Rule 2: Use error handling",
    "Rule 3: Log all operations"
  ],
  "documents": ["doc-1", "doc-2"],
  "collections": ["collection-1"],
  "agents": ["agent-1", "agent-2"],
  "evaluationRules": {
    "accuracy": 0.95,
    "speed": "fast"
  },
  "mutationRules": {
    "allowPromptMutation": true,
    "allowRuleMutation": false
  },
  "metadata": {
    "category": "data-processing",
    "complexity": "medium"
  },
  "createdAt": "2025-11-16T00:00:00Z",
  "updatedAt": "2025-11-16T00:00:00Z"
}
```

### Toolset Format

```json
{
  "id": "example-toolset",
  "name": "Example Toolset",
  "version": "1.0.0",
  "description": "A collection of tools for X",
  "tools": ["tool-1", "tool-2", "tool-3"],
  "instructions": "Instructions for using this toolset...",
  "rules": [
    "Rule 1: Check permissions before tool use",
    "Rule 2: Rate limit applies"
  ],
  "dependencies": ["other-toolset"],
  "metadata": {
    "category": "integration",
    "requires": ["api-key"]
  },
  "createdAt": "2025-11-16T00:00:00Z",
  "updatedAt": "2025-11-16T00:00:00Z"
}
```

### Hook Format

```json
{
  "id": "validation-hook",
  "name": "Input Validation Hook",
  "type": "tool:before",
  "handler": "function validate(input) { ... }",
  "enabled": true,
  "priority": 100,
  "metadata": {
    "category": "validation"
  },
  "createdAt": "2025-11-16T00:00:00Z",
  "updatedAt": "2025-11-16T00:00:00Z"
}
```

### Workflow Format

```json
{
  "id": "example-workflow",
  "name": "Example Workflow",
  "version": "1.0.0",
  "description": "A workflow that does X",
  "steps": [
    {
      "id": "step-1",
      "type": "agent",
      "agentId": "agent-1",
      "input": "..."
    },
    {
      "id": "step-2",
      "type": "condition",
      "condition": "..."
    }
  ],
  "agents": ["agent-1", "agent-2"],
  "skills": ["skill-1"],
  "metadata": {
    "category": "automation"
  },
  "createdAt": "2025-11-16T00:00:00Z",
  "updatedAt": "2025-11-16T00:00:00Z"
}
```

## API Reference

### PersistentStorageManager

```typescript
class PersistentStorageManager {
  constructor(customPath?: string)
  
  // Initialization
  async initialize(): Promise<void>
  
  // Path utilities
  getPath(area: string, ...subPaths: string[]): string
  
  // Agent operations
  async saveAgent(agent: any, format: 'json' | 'markdown', category: string): Promise<void>
  async loadAgent(id: string, category: string): Promise<any>
  async listAgents(category?: string): Promise<any[]>
  async deleteAgent(id: string, category: string): Promise<void>
  
  // Skill operations
  async saveSkill(skill: Skill, category: string): Promise<void>
  async loadSkill(id: string, category: string): Promise<Skill>
  async listSkills(category?: string): Promise<Skill[]>
  
  // Toolset operations
  async saveToolset(toolset: Toolset, category: string): Promise<void>
  async loadToolset(id: string, category: string): Promise<Toolset>
  async listToolsets(category?: string): Promise<Toolset[]>
  
  // Hook operations
  async saveHook(hook: Hook, category: string): Promise<void>
  async loadHook(id: string, category: string): Promise<Hook>
  async listHooks(category?: string, type?: string): Promise<Hook[]>
  
  // Workflow operations
  async saveWorkflow(workflow: Workflow, category: string): Promise<void>
  async loadWorkflow(id: string, category: string): Promise<Workflow>
  async listWorkflows(category?: string): Promise<Workflow[]>
  
  // Backup & utilities
  async createBackup(areas?: string[]): Promise<string>
  async getStats(): Promise<any>
}
```

## Configuration

Edit `~/.agents/config.json` to customize:

```json
{
  "version": "1.0.0",
  "features": {
    "auto_backup": true,
    "backup_interval_days": 7,
    "cache_enabled": true,
    "cache_ttl_hours": 24,
    "logging_enabled": true,
    "log_retention_days": 30,
    "metrics_enabled": true
  }
}
```

## Integration with EvoSuite SDK

Skills can link to EvoSuite evaluation and mutation rules:

```json
{
  "id": "evolving-skill",
  "evaluationRules": {
    "evosuiteConfig": "path/to/evaluator.json",
    "metrics": ["accuracy", "latency", "cost"]
  },
  "mutationRules": {
    "evosuiteStrategy": "path/to/mutator.json",
    "constraints": ["max_tokens", "min_quality"]
  }
}
```

## Backup & Recovery

### Create Manual Backup

```typescript
const storage = new PersistentStorageManager();
await storage.initialize();

const backupPath = await storage.createBackup(['agents', 'skills', 'workflows']);
console.log(`Backup created: ${backupPath}`);
```

### Restore from Backup

```powershell
# Copy backup to main storage
Copy-Item -Recurse "$env:USERPROFILE\.agents\backups\manual\2025-11-16\*" "$env:USERPROFILE\.agents\"
```

## Maintenance

### Clear Cache

```powershell
Remove-Item "$env:USERPROFILE\.agents\cache\*" -Recurse -Force
```

### Rotate Logs

Logs are automatically rotated based on retention policy in `config.json`.

### View Statistics

```typescript
const storage = new PersistentStorageManager();
await storage.initialize();

const stats = await storage.getStats();
console.log(JSON.stringify(stats, null, 2));
```

## Troubleshooting

### Storage Not Initialized

**Error:** `Persistent storage not initialized`

**Solution:** Run setup script:
```powershell
pwsh ./scripts/setup-persistent-storage.ps1
```

### Permission Denied

**Error:** `EACCES: permission denied`

**Solution:** Check directory permissions:
```powershell
icacls "$env:USERPROFILE\.agents" /grant "$env:USERNAME:(OI)(CI)F"
```

### Disk Space Issues

Monitor storage size:
```powershell
Get-ChildItem "$env:USERPROFILE\.agents" -Recurse | Measure-Object -Property Length -Sum
```

## Best Practices

1. **Use JSON format for agents** - Better tooling support, easier to parse
2. **Organize by category** - Use subdirectories (custom, marketplace, templates)
3. **Version your agents** - Increment version numbers on changes
4. **Regular backups** - Enable auto_backup in config.json
5. **Clean cache** - Periodically clear cache directory
6. **Monitor metrics** - Review metrics/ directory for insights
7. **Document skills** - Add detailed systemInstructions and rules
8. **Link related assets** - Use references between agents, skills, workflows

## Migration from Collections

To migrate existing agents from `collections/` directory:

```bash
npm run migrate:storage
```

This will:
1. Read all agents from collections/
2. Convert to persistent storage format
3. Save to appropriate categories
4. Generate migration report

## Next Steps

1. ✅ Run setup script
2. ✅ Migrate existing agents (optional)
3. ✅ Update MCP server configuration
4. ✅ Create your first custom agent
5. ✅ Explore skills and workflows
6. ✅ Configure evaluation and mutation rules
7. ✅ Set up automated backups

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-16  
**Documentation:** See individual format sections above
