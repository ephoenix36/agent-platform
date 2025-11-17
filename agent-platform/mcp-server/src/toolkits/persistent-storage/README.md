# Persistent Storage Toolkit

Comprehensive asset management system for the Agent Platform, providing durable storage for all platform resources in `~/.agents`.

## Overview

The Persistent Storage Toolkit provides a unified interface for managing all agent platform assets with full CRUD operations, category-based organization, and automatic versioning.

## Features

### ✅ Asset Types Supported
- **Agents** - AI agent configurations (JSON/Markdown formats)
- **Teams** - Multi-agent collaboration configurations
- **Skills** - Reusable skill modules with linking capabilities
- **Tools** - Tool definitions (local, remote MCP, scripts, builtin)
- **Workflows** - Workflow definitions with lifecycle hooks
- **Projects** - Project configurations with lifecycle hooks

### ✅ Key Capabilities
- Full CRUD operations for all asset types
- Category-based organization
- Automatic versioning and timestamps
- Backup and restore functionality
- Comprehensive statistics
- Multiple format support (JSON, Markdown)
- Enhanced linking (skills ↔ teams, collections, projects)
- Lifecycle hooks for workflows and projects

### ✅ Storage Structure
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

## Tools (26 total)

### Agent Operations (4 tools)
- `storage_save_agent` - Save agent configuration
- `storage_load_agent` - Load agent configuration
- `storage_list_agents` - List all agents
- `storage_delete_agent` - Delete agent

### Team Operations (4 tools)
- `storage_save_team` - Save team configuration
- `storage_load_team` - Load team configuration
- `storage_list_teams` - List all teams
- `storage_delete_team` - Delete team

### Skill Operations (4 tools)
- `storage_save_skill` - Save skill definition
- `storage_load_skill` - Load skill definition
- `storage_list_skills` - List all skills
- `storage_delete_skill` - Delete skill

### Tool Operations (4 tools)
- `storage_save_tool` - Save tool definition
- `storage_load_tool` - Load tool definition
- `storage_list_tools` - List all tools
- `storage_delete_tool` - Delete tool

### Workflow Operations (4 tools)
- `storage_save_workflow` - Save workflow definition
- `storage_load_workflow` - Load workflow definition
- `storage_list_workflows` - List all workflows
- `storage_delete_workflow` - Delete workflow

### Project Operations (4 tools)
- `storage_save_project` - Save project configuration
- `storage_load_project` - Load project configuration
- `storage_list_projects` - List all projects
- `storage_delete_project` - Delete project

### Utility Operations (2 tools)
- `storage_stats` - Get storage statistics
- `storage_backup` - Create backup of storage

## Usage Examples

### Save an Agent
```typescript
await storage_save_agent({
  agent: {
    id: "code-reviewer",
    name: "Code Reviewer",
    model: "gpt-4",
    systemPrompt: "You are an expert code reviewer...",
    toolkits: ["file-operations"],
    temperature: 0.3
  },
  format: "json",
  category: "custom"
});
```

### Create a Team
```typescript
await storage_save_team({
  team: {
    id: "research-team",
    name: "Research Team",
    description: "Multi-agent research collaboration",
    mode: "parallel",
    agents: [
      { id: "researcher-1", role: "data-analyst" },
      { id: "researcher-2", role: "synthesizer" }
    ]
  },
  category: "active"
});
```

### Save a Skill with Links
```typescript
await storage_save_skill({
  skill: {
    id: "code-review",
    name: "Code Review Skill",
    description: "Expert code review and analysis",
    toolkits: ["file-operations"],
    systemInstructions: "Review code for quality, security, and best practices",
    rules: [
      "Check for security vulnerabilities",
      "Verify coding standards",
      "Suggest improvements"
    ],
    teams: ["dev-team"],
    projects: ["main-project"]
  },
  category: "user"
});
```

### Get Storage Statistics
```typescript
const stats = await storage_stats();
// Returns file counts, sizes, and breakdown by area
```

### Create Backup
```typescript
const backupPath = await storage_backup({
  areas: ["agents", "teams", "skills"]
});
```

## Setup Requirements

The persistent storage system must be initialized before use. Run:

```powershell
pwsh ./scripts/setup-persistent-storage.ps1
```

This creates the `~/.agents` directory structure and configuration file.

## Integration with Other Toolkits

The Persistent Storage Toolkit integrates seamlessly with:

- **Agent Development** - Load agents for execution
- **Workflow** - Load workflows and their dependencies
- **Skills** - Load and attach skills to agents
- **Project Management** - Store and retrieve project configurations
- **Hooks** - Execute lifecycle hooks for workflows and projects

## Error Handling

All tools return standardized responses:

**Success:**
```json
{
  "success": true,
  "message": "Agent saved: code-reviewer",
  "location": "~/.agents/agents/custom/code-reviewer.json"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Agent not found: nonexistent-agent in category custom"
}
```

## Best Practices

1. **Use Categories** - Organize assets by category for easier management
2. **Version Assets** - Include version numbers in all configurations
3. **Regular Backups** - Create backups before major changes
4. **Link Related Assets** - Use linking capabilities to create relationships
5. **Use Hooks** - Implement lifecycle hooks for automation
6. **Monitor Statistics** - Regularly check storage stats for usage patterns

## Migration

Existing assets can be migrated using:

```powershell
npm run migrate:comprehensive
```

## Documentation

For complete documentation, see:
- [Persistent Storage Summary](../../../docs/PERSISTENT_STORAGE_SUMMARY.md)
- [Quick Reference](../../../docs/PERSISTENT_STORAGE_QUICK_REF.md)
- [Commands Guide](../../../docs/PERSISTENT_STORAGE_COMMANDS.md)

## Version

**Current Version:** 2.0.0

**Features in v2.0.0:**
- Agent teams with multiple execution modes
- Enhanced skills with linking capabilities
- Tool storage (local, remote MCP, scripts)
- Workflow lifecycle hooks
- Project lifecycle hooks
- Comprehensive MCP tool integration
- Full backup and restore functionality
