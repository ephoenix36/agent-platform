# Persistent Storage Tools - Quick Reference

## 26 Storage Tools Available via MCP

### 🤖 Agent Tools (4)

| Tool | Description | Usage |
|------|-------------|-------|
| `storage_save_agent` | Save agent configuration | Save to configured/marketplace/custom/templates |
| `storage_load_agent` | Load agent configuration | Retrieve by ID and category |
| `storage_list_agents` | List all agents | Filter by category, see all agents |
| `storage_delete_agent` | Delete agent | Remove by ID and category |

**Example:**
```typescript
storage_save_agent({
  agent: {
    id: "my-agent",
    name: "My Agent",
    model: "gpt-4",
    systemPrompt: "You are..."
  },
  format: "json",
  category: "custom"
})
```

---

### 👥 Team Tools (4)

| Tool | Description | Usage |
|------|-------------|-------|
| `storage_save_team` | Save team configuration | Create multi-agent teams |
| `storage_load_team` | Load team configuration | Retrieve team by ID |
| `storage_list_teams` | List all teams | Filter by active/archived/templates |
| `storage_delete_team` | Delete team | Remove by ID |

**Example:**
```typescript
storage_save_team({
  team: {
    id: "research-team",
    name: "Research Team",
    mode: "parallel",
    agents: [
      { id: "agent-1", role: "researcher" },
      { id: "agent-2", role: "analyzer" }
    ]
  },
  category: "active"
})
```

---

### 🎯 Skill Tools (4)

| Tool | Description | Usage |
|------|-------------|-------|
| `storage_save_skill` | Save skill definition | Create reusable skills with links |
| `storage_load_skill` | Load skill definition | Retrieve skill by ID |
| `storage_list_skills` | List all skills | Filter by system/user/marketplace/templates |
| `storage_delete_skill` | Delete skill | Remove by ID |

**Example:**
```typescript
storage_save_skill({
  skill: {
    id: "code-review",
    name: "Code Review",
    toolkits: ["file-operations"],
    systemInstructions: "Review code...",
    rules: ["Check security", "Verify standards"],
    teams: ["dev-team"],
    projects: ["main-project"]
  },
  category: "user"
})
```

---

### 🔧 Tool Storage Tools (4)

| Tool | Description | Usage |
|------|-------------|-------|
| `storage_save_tool` | Save tool definition | Store local/remote-mcp/script/builtin tools |
| `storage_load_tool` | Load tool definition | Retrieve tool by ID |
| `storage_list_tools` | List all tools | Filter by category and type |
| `storage_delete_tool` | Delete tool | Remove by ID |

**Example:**
```typescript
storage_save_tool({
  tool: {
    id: "my-tool",
    name: "My Tool",
    type: "remote-mcp",
    mcpServer: {
      name: "my-server",
      command: "node",
      args: ["server.js"]
    }
  },
  category: "remote-mcp"
})
```

---

### 🔄 Workflow Tools (4)

| Tool | Description | Usage |
|------|-------------|-------|
| `storage_save_workflow` | Save workflow definition | Create workflows with hooks |
| `storage_load_workflow` | Load workflow definition | Retrieve workflow by ID |
| `storage_list_workflows` | List all workflows | Filter by active/archived/templates |
| `storage_delete_workflow` | Delete workflow | Remove by ID |

**Example:**
```typescript
storage_save_workflow({
  workflow: {
    id: "build-workflow",
    name: "Build Workflow",
    steps: [...],
    hooks: {
      before: ["validate-hook"],
      after: ["notify-hook"]
    }
  },
  category: "active"
})
```

---

### 📁 Project Tools (4)

| Tool | Description | Usage |
|------|-------------|-------|
| `storage_save_project` | Save project configuration | Store projects with hooks |
| `storage_load_project` | Load project configuration | Retrieve project by slug |
| `storage_list_projects` | List all projects | Filter by active/archived/completed |
| `storage_delete_project` | Delete project | Remove by slug |

**Example:**
```typescript
storage_save_project({
  project: {
    id: "main-project",
    slug: "main-project",
    name: "Main Project",
    status: "active",
    hooks: {
      onCreate: ["init-hook"],
      onComplete: ["archive-hook"]
    }
  },
  category: "active"
})
```

---

### 🛠️ Utility Tools (2)

| Tool | Description | Usage |
|------|-------------|-------|
| `storage_stats` | Get storage statistics | See file counts, sizes, breakdown |
| `storage_backup` | Create storage backup | Backup specific areas or all |

**Example:**
```typescript
// Get statistics
const stats = await storage_stats();

// Create backup
const backupPath = await storage_backup({
  areas: ["agents", "teams", "skills"]
});
```

---

## 📊 Storage Structure

```
~/.agents/
├── agents/
│   ├── configured/
│   ├── marketplace/
│   ├── custom/
│   └── templates/
├── teams/
│   ├── active/
│   ├── archived/
│   └── templates/
├── skills/
│   ├── system/
│   ├── user/
│   ├── marketplace/
│   └── templates/
├── tools/
│   ├── builtin/
│   ├── local/
│   ├── remote-mcp/
│   ├── script/
│   └── custom/
├── workflows/
│   ├── active/
│   ├── archived/
│   └── templates/
└── projects/
    ├── active/
    ├── archived/
    └── completed/
```

---

## 🚀 Common Workflows

### Create and Use an Agent
```typescript
// 1. Save agent
await storage_save_agent({
  agent: { id: "helper", name: "Helper", model: "gpt-4", systemPrompt: "..." },
  format: "json",
  category: "custom"
});

// 2. Load agent
const agent = await storage_load_agent({ id: "helper", category: "custom" });

// 3. Use agent (with other tools)
const result = await execute_agent({ agentId: "helper", prompt: "Help me..." });
```

### Create a Team
```typescript
// 1. Save individual agents
await storage_save_agent({ agent: { id: "agent-1", ... } });
await storage_save_agent({ agent: { id: "agent-2", ... } });

// 2. Create team
await storage_save_team({
  team: {
    id: "my-team",
    mode: "linear",
    agents: [{ id: "agent-1" }, { id: "agent-2" }]
  }
});

// 3. Execute team (with other tools)
const result = await execute_agent_team({ teamId: "my-team", prompt: "..." });
```

### Backup Before Changes
```typescript
// Create backup
const backup = await storage_backup({ areas: ["agents", "teams"] });

// Make changes
await storage_save_agent({ ... });

// If needed, restore from backup folder
```

---

## 💡 Tips

1. **Use Categories** - Organize assets by category for easy management
2. **Link Assets** - Use skill linking to connect skills to teams and projects
3. **Add Hooks** - Implement lifecycle hooks for automation
4. **Regular Backups** - Create backups before major changes
5. **Check Stats** - Monitor storage usage with `storage_stats`

---

## 🔗 See Also

- Full integration guide: `PERSISTENT_STORAGE_INTEGRATION.md`
- Toolkit docs: `src/toolkits/persistent-storage/README.md`
- Original docs: `docs/PERSISTENT_STORAGE_*.md`

---

**Total: 26 tools for comprehensive asset management** ✅
