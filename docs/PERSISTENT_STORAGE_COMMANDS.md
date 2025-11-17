# Persistent Storage - Quick Command Reference

## 🚀 Instant Commands

### Setup & Migration
```bash
# Setup storage (first time)
npm run setup:storage

# Migrate all existing assets
npm run migrate:comprehensive

# View statistics
npm run storage:stats

# Create backup
npm run storage:backup
```

### Direct Usage
```typescript
import { PersistentStorageManager } from './src/core/persistent-storage.js';

const s = new PersistentStorageManager();
await s.initialize();
```

## 📦 Storage Operations

### Agents
```typescript
// Save
await s.saveAgent(agent, 'json'|'markdown', 'configured'|'marketplace'|'custom'|'templates');

// Load
const agent = await s.loadAgent('agent-id', 'custom');

// List
const agents = await s.listAgents('custom');
```

### Teams ✨ NEW
```typescript
// Save
await s.saveTeam(team, 'active'|'archived'|'templates');

// Load
const team = await s.loadTeam('team-id', 'active');

// List
const teams = await s.listTeams('active');
```

### Skills (Enhanced) ✨
```typescript
// Save with links
await s.saveSkill({
  id: 'skill-id',
  name: 'Skill Name',
  // ... other fields ...
  agents: ['agent-1'],
  teams: ['team-1'],          // ✨ NEW
  projects: ['project-1'],    // ✨ NEW
  databases: ['db-1'],        // ✨ NEW
  collections: ['coll-1']
}, 'user'|'system'|'marketplace'|'templates');

// List
const skills = await s.listSkills('user');
```

### Tools ✨ NEW
```typescript
// Save MCP server
await s.saveTool({
  type: 'remote-mcp',
  mcpServer: { name, command, args, env }
}, 'builtin'|'local'|'remote-mcp'|'script'|'custom');

// Save script
await s.saveTool({
  type: 'script',
  script: { language, path, args, env }
}, 'script');

// List
const tools = await s.listTools('remote-mcp', 'remote-mcp');
```

### Projects ✨ NEW
```typescript
// Save with hooks
await s.saveProject({
  id: 'project-id',
  hooks: {
    onCreate: ['hook-1'],
    onUpdate: ['hook-2'],
    onComplete: ['hook-3'],
    onArchive: ['hook-4']
  }
}, 'active'|'archived'|'templates');
```

### Workflows (Enhanced) ✨
```typescript
// Save with hooks
await s.saveWorkflow({
  id: 'workflow-id',
  hooks: {
    before: ['hook-1'],
    after: ['hook-2'],
    error: ['hook-3'],
    stepBefore: ['hook-4'],
    stepAfter: ['hook-5']
  }
}, 'active'|'templates'|'history');
```

## 🔧 MCP Tools

### Via MCP Client
```typescript
// Agents
await mcp.callTool('storage_save_agent', { agent, format, category });
await mcp.callTool('storage_load_agent', { id, category });
await mcp.callTool('storage_list_agents', { category? });

// Teams
await mcp.callTool('storage_save_team', { team, category });
await mcp.callTool('storage_list_teams', { category? });

// Skills
await mcp.callTool('storage_save_skill', { skill, category });
await mcp.callTool('storage_list_skills', { category? });

// Tools
await mcp.callTool('storage_save_tool', { tool, category });
await mcp.callTool('storage_list_tools', { category?, type? });

// Utilities
await mcp.callTool('storage_stats', {});
await mcp.callTool('storage_backup', { areas? });
```

## 📂 Directory Structure

```
C:\Users\ephoe\.agents\
├── agents/          Agents (4 categories)
├── skills/          Skills (4 categories)
├── teams/           Teams (3 categories) ✨
├── toolsets/        Toolsets (4 categories)
├── tools/           Tools (5 categories) ✨
├── workflows/       Workflows (3 categories)
├── hooks/           Hooks (4 categories)
├── projects/        Projects (3 categories)
├── collections/     Collections (4 categories)
├── evaluation/      Evaluation (4 categories)
├── mutation/        Mutation (3 categories)
├── metrics/         Metrics (4 categories)
├── cache/           Cache (3 categories)
├── logs/            Logs (4 categories)
└── backups/         Backups (3 categories)
```

## 🎯 Common Patterns

### Create Agent Team
```typescript
await s.saveTeam({
  id: 'team-id',
  name: 'Team Name',
  version: '1.0.0',
  description: 'Description',
  mode: 'linear'|'parallel'|'rounds'|'intelligent',
  agents: [
    { id: 'agent-1', role: 'Role 1' },
    { id: 'agent-2', role: 'Role 2' }
  ],
  skills: ['skill-1'],
  maxRounds: 3,
  conditions: [
    { check: 'condition', action: 'continue' }
  ]
}, 'active');
```

### Link Skill to Everything
```typescript
await s.saveSkill({
  id: 'comprehensive-skill',
  name: 'Comprehensive Skill',
  version: '1.0.0',
  description: 'Skill with all links',
  toolkits: ['toolkit-1'],
  systemInstructions: 'Instructions...',
  rules: ['Rule 1', 'Rule 2'],
  agents: ['agent-1'],
  teams: ['team-1'],
  projects: ['project-1'],
  databases: ['db-1'],
  collections: ['collection-1']
}, 'user');
```

### Register MCP Server
```typescript
await s.saveTool({
  id: 'mcp-server-name',
  name: 'Server Name',
  version: '1.0.0',
  description: 'Description',
  type: 'remote-mcp',
  mcpServer: {
    name: 'server-name',
    command: 'npx',
    args: ['-y', 'package-name'],
    env: {}
  }
}, 'remote-mcp');
```

### Project with Hooks
```typescript
await s.saveProject({
  id: 'project-id',
  name: 'Project',
  version: '1.0.0',
  slug: 'project-slug',
  status: 'active',
  agents: ['agent-1'],
  teams: ['team-1'],
  workflows: ['workflow-1'],
  hooks: {
    onCreate: ['init-hook'],
    onComplete: ['complete-hook']
  }
}, 'active');
```

## 📊 Quick Stats

```bash
# View current state
npm run storage:stats

# Output shows:
# - Total files per area
# - Size per area
# - Storage root location
```

## 🔍 File Locations

### Agents
- Configured: `~/.agents/agents/configured/`
- Marketplace: `~/.agents/agents/marketplace/`
- Custom: `~/.agents/agents/custom/`
- Templates: `~/.agents/agents/templates/`

### Teams ✨
- Active: `~/.agents/teams/active/`
- Archived: `~/.agents/teams/archived/`
- Templates: `~/.agents/teams/templates/`

### Tools ✨
- Builtin: `~/.agents/tools/builtin/`
- Local: `~/.agents/tools/local/`
- Remote MCP: `~/.agents/tools/remote-mcp/`
- Scripts: `~/.agents/tools/script/`
- Custom: `~/.agents/tools/custom/`

## ✅ Current Migration Status

```
✓ 21 agents migrated
✓ 1 skill migrated
✓ 17 toolsets migrated
✓ 4 MCP servers migrated
✓ 11 workflows migrated
✓ 1 test team created
✓ 1 test skill with links created

Total: 56 assets in storage
```

## 🎯 Next Actions

1. **Create your first team:** Use saveTeam()
2. **Link skills:** Add teams/projects/databases to skills
3. **Register MCP servers:** Use saveTool() with type 'remote-mcp'
4. **Add project hooks:** Use saveProject() with lifecycle hooks
5. **Enhance workflows:** Add hooks to existing workflows

## 📚 Full Documentation

- Complete Guide: `docs/PERSISTENT_STORAGE.md`
- Quick Ref: `docs/PERSISTENT_STORAGE_QUICK_REF.md`
- Implementation: `docs/PERSISTENT_STORAGE_IMPLEMENTATION.md`
- Integration: `docs/PERSISTENT_STORAGE_INTEGRATION.md`
- Final Summary: `docs/PERSISTENT_STORAGE_FINAL.md`

---

**Status:** ✅ Production Ready  
**Version:** 2.0.0  
**Date:** November 16, 2025
