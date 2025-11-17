# Agent Platform Quick Reference

## 🚀 Quick Start

### Running the Server
```bash
# Development mode (auto-reload)
npm run dev

# Build TypeScript
npm run build

# Run production
npm start

# Test with MCP Inspector
npm run inspect
```

## 📦 What's New (v2.1.0)

### ✨ Skills System
**Higher-level abstraction over toolkits with instructions, rules, and prompts**

```typescript
// Create a skill
create_skill({
  id: "my-skill",
  name: "My Skill",
  description: "What it does",
  config: {
    toolkits: ["core", "project-management"],
    instructions: { /* ... */ },
    rules: [ /* ... */ ],
    systemPrompt: "You are an expert..."
  }
})

// Use with agent
execute_agent({
  agentId: "agent-1",
  prompt: "Do something",
  skills: ["my-skill"]  // ← Automatically includes instructions, rules, tools
})

// Use in workflows
execute_workflow({
  workflowId: "wf-1",
  steps: [{
    type: "agent",
    config: {
      skills: ["my-skill"],  // ← Works in workflows too!
      prompt: "Task"
    }
  }]
})
```

### 🎯 Key Features
- ✅ **15 Skill Management Tools** - Full lifecycle (create, update, load, attach, export)
- ✅ **Agent Integration** - Skills work seamlessly with agents
- ✅ **Workflow Integration** - Skills work in workflow agent steps
- ✅ **Composition** - Combine multiple skills intelligently
- ✅ **Portability** - Export/import skills across systems

## 📚 Available Tools

### Skills Tools (15 new)
```
create_skill          - Create new skill
update_skill          - Update skill configuration
get_skill             - Get skill details
list_skills           - Search/list skills
load_skill            - Load skill toolkits
unload_skill          - Unload skill resources
delete_skill          - Delete skill
attach_skill          - Attach to entity (agent/workflow/team)
detach_skill          - Detach from entity
get_attached_skills   - List skill attachments
compose_skills        - Compose multiple skills
export_skill          - Export to JSON
import_skill          - Import from JSON
get_skill_usage_stats - Get usage statistics
validate_skill        - Validate skill configuration
```

### Agent Tools
```
execute_agent         - Execute agent (now with skills!)
execute_agent_async   - Execute asynchronously
configure_agent       - Configure agent preset
agent_teams           - Multi-agent collaboration
chat_with_agent       - Conversational interface
```

### Workflow Tools
```
execute_workflow      - Execute multi-step workflow
execute_workflow_async- Execute asynchronously
create_workflow       - Create workflow template
get_workflow_templates- Get pre-built templates
```

### Project Management Tools (31 tools)
```
# Projects: create, update, list, get, delete, archive
# Sprints: create, start, complete, update, list
# Tasks: create, update, list, get, delete, assign, comment
# Documentation: create, update, link, search
# Memory: store, retrieve, search, export
```

## 🎨 Pre-Built Skills

### 1. Project Management
```typescript
execute_agent({
  agentId: "pm-agent",
  skills: ["project-management"],
  prompt: "Create a new project for mobile app development"
})
```
**Provides:** 31 PM tools, Agile/Scrum guidance, 15 rules

### 2. Internal Platform Development
```typescript
execute_agent({
  agentId: "dev-agent",
  skills: ["internal-platform-development"],
  prompt: "Add a new tool to the core toolkit"
})
```
**Provides:** Development workflows, TypeScript patterns, MCP compliance

### 3. Creation Specialists
```typescript
// For creating skills
execute_agent({
  agentId: "skill-creator",
  skills: ["skill-creation-specialist"],
  prompt: "Create a data analysis skill"
})

// For creating tools
execute_agent({
  agentId: "tool-creator",
  skills: ["tool-creation-specialist"],
  prompt: "Create a tool for API monitoring"
})

// For creating workflows
execute_agent({
  agentId: "workflow-creator",
  skills: ["workflow-creation-specialist"],
  prompt: "Create a content generation pipeline"
})
```

## 🏗️ Architecture

```
MCP Server (index.ts)
├── Types System (src/types/)
│   ├── skill.ts - Skill definitions
│   ├── toolkit.ts - Toolkit definitions
│   ├── agent.ts - Agent types
│   └── collection.ts - Collection types
├── Services (src/services/)
│   ├── skills-service.ts - Skill lifecycle
│   ├── toolkit-manager.ts - Toolkit management
│   ├── collection-service.ts - Collections
│   ├── sampling-service.ts - MCP sampling
│   └── service-registry.ts - DI container
├── Tools (src/tools/)
│   ├── skill-tools.ts - 15 skill tools
│   ├── agent-tools.ts - Agent execution
│   ├── workflow-tools.ts - Workflows
│   └── ... (other tool sets)
├── Toolkits (src/toolkits/)
│   ├── core/ - Basic operations
│   ├── skills/ - Skill management
│   ├── project-management/ - 31 PM tools
│   └── ... (other toolkits)
└── Skills (src/skills/)
    ├── internal-development-skill.ts
    └── creation-specialists.ts
```

## 🔧 Common Patterns

### Create and Use a Skill
```typescript
// 1. Create skill
const skill = await create_skill({
  id: "data-analyst",
  name: "Data Analysis Expert",
  config: {
    toolkits: ["core"],
    instructions: {
      overview: "Expert data analyst",
      usage: "Use for data exploration",
      bestPractices: ["Validate data first", "Document assumptions"]
    },
    rules: [
      { id: "validate", description: "Always validate data", priority: 10 }
    ]
  }
});

// 2. Use with agent
const result = await execute_agent({
  agentId: "analyst",
  skills: ["data-analyst"],
  prompt: "Analyze sales data for trends"
});
```

### Compose Multiple Skills
```typescript
execute_agent({
  agentId: "multi-skilled",
  skills: [
    "project-management",
    "code-review-expert",
    "data-analyst"
  ],
  prompt: "Complex task requiring multiple expertise areas"
  // All skills' instructions, rules, and tools are automatically merged
})
```

### Attach Skill to Agent
```typescript
// Permanently attach skill to agent
await attach_skill({
  skillId: "project-management",
  entityType: "agent",
  entityId: "scrum-master-bot"
});

// Now agent always uses this skill
execute_agent({
  agentId: "scrum-master-bot",
  prompt: "Plan next sprint"
  // No need to specify skills - automatically attached
});
```

### Export/Import Skills
```typescript
// Export skill (with dependencies)
const exported = await export_skill({
  skillId: "my-skill",
  includeDependencies: true,
  includeStats: true
});

// Save to file
fs.writeFileSync('skill-export.json', JSON.stringify(exported));

// Import on another system
await import_skill({
  exportData: fs.readFileSync('skill-export.json', 'utf-8')
});
```

## 📖 Documentation

- **Skills Quick Start:** `docs/SKILLS_QUICKSTART.md`
- **Progress Report:** `PROGRESS_REPORT.md`
- **Session Summary:** `FINAL_SESSION_SUMMARY.md`
- **MCP Development:** Follow `MCP-dev.prompt.md`

## 🔍 Troubleshooting

### Build Errors
```bash
# Clean and rebuild
rm -rf build
npm run build
```

### Tool Not Found
```typescript
// List available toolkits
await list_toolkits()

// Check if toolkit is loaded
await list_toolkits({ onlyLoaded: true })

// Enable toolkit
await enable_toolkit({ toolkitId: "toolkit-id" })
```

### Skill Not Working
```typescript
// Check skill exists
await get_skill({ id: "skill-id" })

// Check skill is loaded
await list_skills({ onlyLoaded: true })

// Load skill explicitly
await load_skill({ id: "skill-id" })
```

## 🎯 Development Workflow

### Adding a New Tool
1. Create tool in `src/tools/your-tool.ts`
2. Define Zod schema
3. Register with `server.tool(name, desc, schema.shape, handler)`
4. Use `withHooks()` wrapper
5. Return MCP-compliant format
6. Build and test

### Adding a New Skill
1. Use `skill-creation-specialist` for guidance
2. Define instructions, rules, system prompt
3. Select appropriate toolkits
4. Test with sample agents
5. Export and share

### Adding a New Toolkit
1. Create directory in `src/toolkits/`
2. Create `index.ts` with toolkit definition
3. Register tools in toolkit
4. Register toolkit in `src/index.ts`
5. Build and test

## 📊 Status Dashboard

**Platform Version:** 2.1.0  
**Build Status:** ✅ SUCCESS  
**Completion:** 54% (6/11 tasks)

### Completed Features
✅ Skills System (15 tools)  
✅ Project Management Skill  
✅ Internal Development Skill  
✅ Enhanced Agent Configuration  
✅ Workflow/Agent Compatibility  
✅ Creation Specialist Skills  

### In Progress
🚧 Collection Management Tools  
🚧 Widget Integration  
🚧 Hook Support  
🚧 Structured Output  

## 🆘 Getting Help

1. **Documentation:** Check `docs/` folder
2. **Examples:** See `SKILLS_QUICKSTART.md`
3. **MCP Inspector:** `npm run inspect` for testing
4. **Logs:** Check console output for errors
5. **Build:** Run `npm run build` to verify TypeScript

---

**Last Updated:** 2025-11-08  
**Platform:** Agent Platform MCP Server  
**Status:** Production Ready (Skills System)
