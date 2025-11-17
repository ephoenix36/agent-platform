# Skills System Quick Start Guide

## What are Skills?

Skills are **higher-level abstractions** that combine toolkits with:
- **Instructions:** Comprehensive guidance on how to use the tools
- **Rules:** Actionable constraints and best practices
- **System Prompts:** Additional context for AI agents

Think of skills as "pre-configured expertise packages" that agents can equip to excel at specific tasks.

## Why Use Skills?

### Benefits
✅ **Guided Execution:** Agents automatically follow best practices  
✅ **Composition:** Combine multiple skills for complex tasks  
✅ **Reusability:** Define once, use across agents and workflows  
✅ **Portability:** Export/import skills between systems  
✅ **Validation:** Built-in validators ensure quality  
✅ **Tracking:** Monitor skill usage and effectiveness  

## Quick Examples

### Example 1: Using an Existing Skill

```typescript
// Execute an agent with the project-management skill
execute_agent({
  agentId: "pm-agent",
  prompt: "Create a new project for building a mobile app",
  skills: ["project-management"],
  model: "claude-sonnet-4"
})
```

The agent will automatically receive:
- Project management instructions
- 15 best-practice rules
- All project management tools
- Agile/Scrum guidance

### Example 2: Creating a Custom Skill

```typescript
create_skill({
  id: "code-review-expert",
  name: "Code Review Expert",
  description: "Expert code reviewer following industry best practices",
  
  config: {
    toolkits: ["core", "agent-development"],
    
    instructions: {
      overview: "Expert code reviewer specializing in TypeScript, Python, and Go",
      usage: "Use this skill to perform thorough code reviews with focus on...",
      examples: [
        "Review PR for security vulnerabilities",
        "Check code against style guide",
        "Identify performance issues"
      ],
      bestPractices: [
        "Always check for security vulnerabilities first",
        "Look for code smells and anti-patterns",
        "Provide constructive feedback with examples"
      ],
      warnings: [
        "Don't approve code with security issues",
        "Avoid nitpicking on style if automated tools handle it"
      ]
    },
    
    rules: [
      {
        id: "security-first",
        description: "Check for security vulnerabilities before anything else",
        priority: 10
      },
      {
        id: "test-coverage",
        description: "Ensure new code has adequate test coverage (>80%)",
        priority: 9
      },
      {
        id: "documentation",
        description: "All public APIs must be documented",
        priority: 8
      }
    ],
    
    systemPrompt: "You are a senior code reviewer with 10+ years of experience..."
  },
  
  metadata: {
    author: "Your Name",
    version: "1.0.0",
    tags: ["code-review", "quality", "typescript", "python"]
  }
})
```

### Example 3: Composing Multiple Skills

```typescript
// Use both project-management and code-review skills
execute_agent({
  agentId: "tech-lead",
  prompt: "Review the sprint tasks and approve ready code",
  skills: [
    "project-management",
    "code-review-expert"
  ],
  model: "claude-sonnet-4"
})
```

The agent gets:
- Project management capabilities
- Code review expertise
- All rules from both skills (prioritized)
- Combined instructions
- All tools from both skill toolkits

### Example 4: Attaching Skills to Agents

```typescript
// Permanently attach a skill to an agent
attach_skill({
  skillId: "project-management",
  entityType: "agent",
  entityId: "scrum-master-bot",
  overrides: {
    rules: {
      "retrospective-required": true,
      "sprint-duration": true
    },
    systemPrompt: "You are a certified Scrum Master with..."
  }
})

// Now the agent always uses this skill
execute_agent({
  agentId: "scrum-master-bot",
  prompt: "Plan the next sprint",
  // Skills attached to agent are automatically used
})
```

## Skills vs Toolkits vs Tools

| Feature | Tools | Toolkits | Skills |
|---------|-------|----------|--------|
| **What** | Individual MCP tools | Collections of related tools | Toolkits + Instructions + Rules |
| **Example** | `create_task` | `project-management` toolkit | `project-management` skill |
| **Instructions** | ❌ No | ❌ No | ✅ Yes |
| **Rules** | ❌ No | ❌ No | ✅ Yes |
| **Composition** | ✅ List tools | ⚠️ Manual | ✅ Automatic |
| **Guidance** | ❌ No | ❌ No | ✅ Yes |
| **Portability** | ⚠️ Limited | ⚠️ Limited | ✅ Full |
| **Use Case** | Low-level operations | Feature sets | Expert capabilities |

## Skill Lifecycle

```
┌─────────────┐
│   CREATE    │ ← Define skill with instructions, rules, toolkits
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    LOAD     │ ← Load toolkit dependencies
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ATTACH    │ ← Attach to agents/workflows/teams
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     USE     │ ← Execute with agent
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   TRACK     │ ← Monitor usage statistics
└─────────────┘
```

## Available Tools

### Skill Management
- `create_skill` - Create new skill
- `update_skill` - Update skill configuration
- `delete_skill` - Delete skill
- `get_skill` - Get skill details
- `list_skills` - Search/list skills

### Skill Lifecycle
- `load_skill` - Load skill toolkits
- `unload_skill` - Unload skill
- `attach_skill` - Attach to entity
- `detach_skill` - Detach from entity
- `get_attached_skills` - List attachments

### Skill Composition
- `compose_skills` - Compose multiple skills
- `export_skill` - Export to JSON
- `import_skill` - Import from JSON

### Monitoring
- `get_skill_usage_stats` - Get usage statistics

## Pre-Built Skills

### 1. Project Management
**ID:** `project-management`  
**Toolkits:** `project-management`  
**Features:** Agile/Scrum, sprints, tasks, documentation  
**Rules:** 15 rules (priorities 6-10)  
**Use Case:** Project planning, sprint management, task tracking

### 2. Internal Platform Development
**ID:** `internal-platform-development`  
**Toolkits:** `core`, `skills`, `agent-development`, `project-management`  
**Features:** TypeScript development, MCP tools, testing  
**Rules:** 15 rules (priorities 7-10)  
**Use Case:** Developing the agent platform itself

## Best Practices

### When to Create a Skill
✅ **Create a skill when:**
- You need to combine multiple toolkits with guidance
- You want agents to follow specific best practices
- You need reusable expertise across multiple agents
- You want to enforce rules and constraints
- You need portable, shareable configurations

❌ **Don't create a skill for:**
- Single, simple tools (use tools directly)
- One-off operations
- Very dynamic, changing requirements

### Skill Design Guidelines

1. **Clear Instructions**
   - Write for both humans and AI agents
   - Include examples and use cases
   - Provide context and prerequisites

2. **Actionable Rules**
   - Keep rules short and specific
   - Set appropriate priorities
   - Make rules enforceable

3. **Focused Scope**
   - Each skill should have a clear purpose
   - Don't try to do everything in one skill
   - Compose multiple skills for complex tasks

4. **Versioning**
   - Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
   - Document breaking changes
   - Maintain backward compatibility when possible

5. **Testing**
   - Test skills with real agents
   - Verify rule enforcement
   - Check tool availability

## Advanced Features

### Skill Composition
```typescript
// Compose multiple skills into one configuration
const composition = await compose_skills({
  skillIds: ["skill-1", "skill-2", "skill-3"]
})

// Use the composed configuration
execute_agent({
  agentId: "multi-skilled-agent",
  prompt: "Complex task requiring multiple skills",
  skills: ["skill-1", "skill-2", "skill-3"]
})
```

### Skill Overrides
```typescript
// Override specific rules when attaching
attach_skill({
  skillId: "project-management",
  entityType: "agent",
  entityId: "flexible-pm-bot",
  overrides: {
    rules: {
      "sprint-duration": false,  // Disable this rule
      "retrospective-required": true  // Ensure this one is enabled
    },
    tools: ["create_project", "create_sprint"],  // Limit tools
    systemPrompt: "Custom prompt addition..."
  }
})
```

### Export/Import
```typescript
// Export a skill (with dependencies and stats)
const exported = await export_skill({
  skillId: "my-skill",
  includeDependencies: true,
  includeStats: true
})

// Save to file
fs.writeFileSync('my-skill.json', JSON.stringify(exported, null, 2))

// Import on another system
const result = await import_skill({
  exportData: fs.readFileSync('my-skill.json', 'utf-8')
})
```

## Troubleshooting

### Skill Not Loading
```typescript
// Check if skill exists
const skill = await get_skill({ id: "my-skill" })

// Check toolkit dependencies
const skillData = skill.config.toolkits
// Ensure all toolkits are registered

// Try loading explicitly
await load_skill({ id: "my-skill" })
```

### Tools Not Available
```typescript
// Check loaded tools
const skill = await get_skill({ id: "my-skill" })
console.log(skill.loadedTools)

// Verify toolkit is loaded
const stats = await list_toolkits({ onlyLoaded: true })
```

### Rules Not Applied
```typescript
// Check rule configuration
const skill = await get_skill({ id: "my-skill" })
const activeRules = skill.config.rules.filter(r => r.enabled !== false)
console.log(activeRules)

// Verify skill is attached
const attachments = await get_attached_skills({
  entityType: "agent",
  entityId: "my-agent"
})
```

## Migration Guide

### From Direct Toolkit Usage
```typescript
// Before: Using toolkits directly
execute_agent({
  agentId: "agent-1",
  prompt: "Create a project",
  tools: ["create_project", "create_sprint", "create_task"]
})

// After: Using a skill
execute_agent({
  agentId: "agent-1",
  prompt: "Create a project",
  skills: ["project-management"]
  // Automatically includes tools, instructions, and rules
})
```

### From enabledTools Configuration
```typescript
// Before: Manual tool configuration
configure_agent({
  agentId: "pm-agent",
  name: "Project Manager",
  model: "claude-sonnet-4",
  enabledTools: ["create_project", "create_sprint", "create_task"],
  systemPrompt: "You are a project manager..."
})

// After: Using skills
configure_agent({
  agentId: "pm-agent",
  name: "Project Manager",
  model: "claude-sonnet-4",
  skills: ["project-management"],
  // No need for manual tool list or detailed prompt
})
```

## Resources

- **Type Definitions:** `src/types/skill.ts`
- **Service Implementation:** `src/services/skills-service.ts`
- **MCP Tools:** `src/tools/skill-tools.ts`
- **Example Skills:** `src/skills/`
- **Project Management Skill:** `src/toolkits/project-management/skill-definition.ts`

## Next Steps

1. ✅ Explore pre-built skills (`list_skills`)
2. ✅ Create your first custom skill
3. ✅ Attach skills to agents
4. ✅ Test skill composition
5. ✅ Export and share your skills
6. ✅ Monitor skill usage statistics

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-08  
**Platform Version:** 2.1.0
