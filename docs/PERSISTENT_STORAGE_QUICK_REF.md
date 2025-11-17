# Persistent Storage - Quick Reference

## Setup (One-Time)

```powershell
# Run setup script
npm run setup:storage

# Or with force (recreate if exists)
npm run setup:storage-force

# Manual PowerShell
pwsh ./scripts/setup-persistent-storage.ps1
```

**Result:** Creates `~/.agents/` directory structure (Windows: `C:\Users\ephoe\.agents\`)

## Migration (Optional)

```bash
# Migrate existing agents from collections/
npm run migrate:storage
```

## Quick Commands

```bash
# View storage statistics
npm run storage:stats

# Create manual backup
npm run storage:backup

# Build TypeScript
npm run build
```

## Storage Locations

| Asset Type | Path | Categories |
|------------|------|------------|
| **Agents** | `~/.agents/agents/` | configured, marketplace, custom, templates |
| **Skills** | `~/.agents/skills/` | system, user, marketplace, templates |
| **Teams** | `~/.agents/teams/` | active, archived, templates |
| **Toolsets** | `~/.agents/toolsets/` | core, custom, marketplace, external-mcp |
| **Workflows** | `~/.agents/workflows/` | active, templates, history |
| **Hooks** | `~/.agents/hooks/` | tool, agent, workflow, system |
| **Collections** | `~/.agents/collections/` | documents, datasets, knowledge-graphs, vector-stores |
| **Evaluation** | `~/.agents/evaluation/` | configs, results, metrics, benchmarks |
| **Mutation** | `~/.agents/mutation/` | strategies, constraints, history |
| **Metrics** | `~/.agents/metrics/` | usage, costs, performance, anomalies |
| **Projects** | `~/.agents/projects/` | active, archived, templates |
| **Cache** | `~/.agents/cache/` | embeddings, api-responses, temp |
| **Logs** | `~/.agents/logs/` | agent-execution, workflow, errors, audit |
| **Backups** | `~/.agents/backups/` | daily, weekly, manual |

## Code Examples

### Initialize Storage

```typescript
import { PersistentStorageManager } from './core/persistent-storage.js';

const storage = new PersistentStorageManager();
await storage.initialize();
```

### Save Agent (JSON)

```typescript
await storage.saveAgent({
  id: 'my-agent',
  name: 'My Agent',
  version: '1.0.0',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0,
  systemPrompt: 'You are...',
  toolkits: ['agent-development'],
  skills: [],
  metadata: {}
}, 'json', 'custom');
```

### Save Agent (Markdown)

```typescript
await storage.saveAgent({
  id: 'my-agent',
  name: 'My Agent',
  version: '1.0.0',
  model: 'gpt-4o',
  systemPrompt: 'You are...',
  toolkits: ['agent-development']
}, 'markdown', 'custom');
```

### Load Agent

```typescript
const agent = await storage.loadAgent('my-agent', 'custom');
```

### List Agents

```typescript
// All agents
const allAgents = await storage.listAgents();

// Specific category
const customAgents = await storage.listAgents('custom');
```

### Delete Agent

```typescript
await storage.deleteAgent('my-agent', 'custom');
```

### Save Skill

```typescript
await storage.saveSkill({
  id: 'my-skill',
  name: 'My Skill',
  version: '1.0.0',
  description: 'Does X',
  toolkits: ['file-operations'],
  systemInstructions: 'Instructions...',
  rules: [
    'Rule 1: Always validate',
    'Rule 2: Error handling'
  ],
  documents: [],
  collections: [],
  agents: [],
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}, 'user');
```

### Save Toolset

```typescript
await storage.saveToolset({
  id: 'my-toolset',
  name: 'My Toolset',
  version: '1.0.0',
  description: 'Collection of tools',
  tools: ['tool-1', 'tool-2'],
  instructions: 'How to use...',
  rules: ['Rule 1', 'Rule 2'],
  dependencies: [],
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}, 'custom');
```

### Save Hook

```typescript
await storage.saveHook({
  id: 'my-hook',
  name: 'Validation Hook',
  type: 'tool:before',
  handler: 'function validate(input) { ... }',
  enabled: true,
  priority: 100,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}, 'system');
```

### Save Workflow

```typescript
await storage.saveWorkflow({
  id: 'my-workflow',
  name: 'My Workflow',
  version: '1.0.0',
  description: 'Multi-step process',
  steps: [
    { id: 'step-1', type: 'agent', agentId: 'agent-1' },
    { id: 'step-2', type: 'condition', condition: '...' }
  ],
  agents: ['agent-1'],
  skills: [],
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}, 'active');
```

### Create Backup

```typescript
// Backup specific areas
const backupPath = await storage.createBackup(['agents', 'skills', 'workflows']);
console.log(`Backup created: ${backupPath}`);

// Backup everything (except cache, logs, backups)
const fullBackup = await storage.createBackup();
```

### Get Statistics

```typescript
const stats = await storage.getStats();
console.log(JSON.stringify(stats, null, 2));

// Output:
// {
//   "root": "C:\\Users\\ephoe\\.agents",
//   "areas": {
//     "agents": { "files": 5, "size": 12345 },
//     "skills": { "files": 3, "size": 6789 },
//     ...
//   }
// }
```

## File Format Quick Reference

### Agent JSON

```json
{
  "id": "agent-id",
  "name": "Agent Name",
  "version": "1.0.0",
  "model": "gpt-4o",
  "temperature": 0.7,
  "maxTokens": 2000,
  "topP": 1.0,
  "systemPrompt": "...",
  "toolkits": ["toolkit-1"],
  "skills": ["skill-1"],
  "metadata": {},
  "createdAt": "2025-11-16T00:00:00Z",
  "updatedAt": "2025-11-16T00:00:00Z"
}
```

### Agent Markdown

```markdown
---
id: agent-id
name: Agent Name
version: 1.0.0
model: gpt-4o
toolkits: ["toolkit-1"]
---

# System Prompt

Your instructions here...
```

### Skill

```json
{
  "id": "skill-id",
  "name": "Skill Name",
  "version": "1.0.0",
  "description": "...",
  "toolkits": ["toolkit-1"],
  "systemInstructions": "...",
  "rules": ["rule-1", "rule-2"],
  "documents": [],
  "collections": [],
  "agents": [],
  "evaluationRules": {},
  "mutationRules": {},
  "metadata": {},
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Configuration

Edit `~/.agents/config.json`:

```json
{
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

## Maintenance

```powershell
# Clear cache
Remove-Item "$env:USERPROFILE\.agents\cache\*" -Recurse -Force

# Clear logs (older than 30 days)
Get-ChildItem "$env:USERPROFILE\.agents\logs" -Recurse | 
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
  Remove-Item -Force

# View disk usage
Get-ChildItem "$env:USERPROFILE\.agents" -Recurse | 
  Measure-Object -Property Length -Sum
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Storage not initialized | Run `npm run setup:storage` |
| Permission denied | Check directory permissions with `icacls` |
| Disk space full | Clear cache and old logs |
| Migration failed | Check source paths in migration script |

## Next Steps

1. ✅ Run `npm run setup:storage`
2. ✅ Optionally run `npm run migrate:storage`
3. ✅ Update MCP server to use persistent storage
4. ✅ Create your first agent in `~/.agents/agents/custom/`
5. ✅ Explore skills, workflows, hooks

---

**Full Documentation:** See `docs/PERSISTENT_STORAGE.md`
