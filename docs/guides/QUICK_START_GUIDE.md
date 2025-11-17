# Quick Start: Using Your Agent Platform NOW

**No migration required - start using immediately!**

---

## 🚀 Available Agents

You have access to **20+ production-ready agents** in your `collections/` directory:

### Business Agents
- **Sales**: LinkedIn prospecting, email validation, cold email classification
- **Product**: Product design optimizer
- **Education**: Learning path optimizer
- **Healthcare**: Treatment protocol optimizer
- **Governance**: Policy optimization

### Creative Tools
- **Photoshop**: Color correction expert

### Meta-Agents (Most Powerful)
- **agent-genesis-architect**: Creates new agents
- **evaluator-creator**: Creates evaluators
- **mutator-creator**: Creates mutators
- **skill-creator**: Creates skills
- **project-architect**: Designs projects
- **ui-ux-strategist**: UX/UI strategy

### Research
- **data-analyzer**: Data analysis
- **literature-synthesizer**: Research synthesis

### Web Development
- **api-endpoint-designer**: Backend API design
- **react-component-generator**: React components

---

## 📖 Examples You Can Run Right Now

### 1. Create a New Agent

```typescript
// Use the meta-agent to create any agent you need
const result = await execute_agent({
  agentId: "agent-genesis-architect",
  prompt: `
    Business Domain: Sales
    Specific Use Case: Outbound prospecting on LinkedIn
    Target Users: SDRs and AEs
    Primary Goal: Generate personalized connection requests
    Success Metrics: 
      - Connection acceptance rate
      - Response rate to first message
      - Meetings booked
    Key Constraints:
      - Must comply with LinkedIn ToS
      - Personalization required
      - Professional tone
    
    Business Context: B2B SaaS company selling to mid-market
    Integration Preferences: LinkedIn Sales Navigator, HubSpot CRM
    
    Generate a complete, production-ready agent configuration.
  `,
  model: "claude-sonnet-4"
});

console.log(result);
// You'll get a complete agent definition with:
// - Detailed system prompt
// - User prompt template
// - Examples
// - Evaluator configuration
// - Mutator configuration
// Ready to save and use!
```

### 2. Build a Multi-Agent Team

```typescript
// Design review team
const designReview = await mcp_agents_agent_teams({
  task: "Review the checkout flow design for our e-commerce app",
  agents: [
    {
      id: "ui-ux-strategist",
      role: "UX Strategist - Focus on user psychology, conversion optimization, and usability patterns"
    },
    {
      id: "product-design-optimizer", 
      role: "Product Designer - Evaluate visual design, consistency, and accessibility"
    },
    {
      id: "data-analyzer",
      role: "Data Analyst - Provide insights on funnel metrics and drop-off points"
    }
  ],
  maxRounds: 3,
  mode: "rounds", // Each agent reviews, then next round considers previous feedback
  model: "claude-sonnet-4",
  verbose: true
});

console.log(designReview.finalResult);
```

### 3. Create a Workflow

```typescript
// Content creation pipeline
const contentWorkflow = await execute_workflow({
  workflowId: "blog-post-pipeline",
  name: "Blog Post Creation",
  steps: [
    {
      id: "research",
      type: "agent",
      config: {
        agentId: "literature-synthesizer",
        prompt: "Research trends in AI agent orchestration for 2025"
      }
    },
    {
      id: "outline",
      type: "agent",
      config: {
        agentId: "project-architect",
        prompt: "Create detailed outline for blog post based on research: {research.output}"
      }
    },
    {
      id: "review-team",
      type: "agent_team",
      config: {
        prompt: "Review outline for clarity, flow, and SEO: {outline.output}",
        agents: [
          { id: "copywriter", role: "Content Writer" },
          { id: "seo-expert", role: "SEO Specialist" }
        ],
        maxRounds: 2
      }
    },
    {
      id: "draft",
      type: "agent",
      config: {
        agentId: "react-component-generator", // Repurpose for writing
        prompt: "Write blog post based on: {outline.output} incorporating feedback: {review-team.output}"
      }
    }
  ]
});
```

### 4. Create a Reusable Skill

```typescript
// Create a citation skill
const citationSkill = await mcp_agents_create_skill({
  id: "academic-citation-apa",
  name: "APA Citation Expert",
  description: "Ensures all sources are cited in APA 7th edition format with verification",
  domain: "research",
  instruction: "Always cite sources using APA 7th edition format (Author, Year). Include in-text citations and full references. Verify all facts with at least two independent, peer-reviewed sources before stating as fact.",
  applicableTo: ["agents", "agent_groups"],
  tags: ["research", "citation", "apa", "academic"],
  rules: [
    {
      id: "apa-format",
      description: "Use APA 7th edition for all citations",
      priority: 10
    },
    {
      id: "dual-verification",
      description: "Cross-reference claims with 2+ independent sources",
      priority: 9
    },
    {
      id: "peer-reviewed-priority",
      description: "Prioritize peer-reviewed sources over general web content",
      priority: 8
    }
  ],
  toolkits: ["core"],
  systemPrompt: "You are an expert in academic citation standards with deep knowledge of APA 7th edition formatting rules.",
  bestPractices: [
    "Check publication dates for currency",
    "Verify author credentials",
    "Use DOI links when available",
    "Distinguish between primary and secondary sources"
  ],
  warnings: [
    "Never cite Wikipedia as a primary source",
    "Don't use citations older than 5 years for rapidly evolving fields",
    "Avoid predatory journals"
  ]
});

// Now use it with any agent
const research = await execute_agent({
  agentId: "literature-synthesizer",
  prompt: "Summarize recent advances in quantum computing",
  skills: ["academic-citation-apa"], // Skill applied automatically
  model: "claude-sonnet-4"
});
```

### 5. Async Long-Running Task

```typescript
// Launch a complex analysis in the background
const asyncTask = await execute_agent_async({
  agentId: "data-analyzer",
  prompt: "Analyze 10,000 customer support tickets and identify top 20 issues with severity rankings",
  model: "claude-sonnet-4",
  maxTokens: 16000,
  timeoutMs: 600000 // 10 minutes
});

console.log("Task launched:", asyncTask.handleId);

// Do other work...

// Check status
const status = await get_wait_handle_status({
  handleId: asyncTask.handleId
});

console.log("Status:", status);

// Wait for completion
const result = await wait_for({
  handleId: asyncTask.handleId
});

console.log("Analysis complete:", result.result);
```

### 6. Parallel Agent Execution

```typescript
// Run multiple research tasks in parallel
const tasks = await Promise.all([
  execute_agent_async({
    agentId: "literature-synthesizer",
    prompt: "Research AI safety developments in 2025"
  }),
  execute_agent_async({
    agentId: "literature-synthesizer",
    prompt: "Research large language model architectures"
  }),
  execute_agent_async({
    agentId: "literature-synthesizer",
    prompt: "Research AI regulation policies globally"
  })
]);

// Wait for all to complete
const results = await wait_for_multiple({
  handleIds: tasks.map(t => t.handleId),
  mode: "all" // Wait for all (or use "any" for first completion)
});

console.log("All research complete:", results);
```

### 7. Intelligent Agent Selection

```typescript
// Let the system choose the best agents
const intelligentTeam = await mcp_agents_agent_teams({
  task: "Comprehensive code review for security, performance, and maintainability",
  agents: [
    { id: "senior-dev", role: "Senior Developer" },
    { id: "security-expert", role: "Security Engineer" },
    { id: "qa-engineer", role: "QA Specialist" },
    { id: "performance-expert", role: "Performance Engineer" },
    { id: "architect", role: "System Architect" }
  ],
  mode: "intelligent", // AI selects which agents to use each round
  maxRounds: 5,
  intelligentSelection: {
    poolSize: 3, // Select 3 agents per round
    criteria: "Select agents most relevant to issues discovered in previous round"
  }
});
```

### 8. Conditional Workflow

```typescript
const adaptiveWorkflow = await execute_workflow({
  workflowId: "adaptive-support",
  name: "Adaptive Customer Support",
  steps: [
    {
      id: "classify",
      type: "agent",
      config: {
        agentId: "email-classifier",
        prompt: "Classify customer inquiry: {input}"
      }
    },
    {
      id: "check-complexity",
      type: "condition",
      config: {
        condition: "classify.output.complexity === 'high'"
      }
    },
    {
      id: "expert-team",
      type: "agent_team",
      config: {
        prompt: "Handle complex inquiry: {input}",
        agents: [
          { id: "support-specialist", role: "Support Specialist" },
          { id: "product-expert", role: "Product Expert" },
          { id: "technical-lead", role: "Technical Lead" }
        ]
      },
      dependencies: ["check-complexity"] // Only runs if condition true
    },
    {
      id: "simple-response",
      type: "agent",
      config: {
        agentId: "support-agent",
        prompt: "Handle simple inquiry: {input}"
      },
      dependencies: ["check-complexity"] // Runs if condition false
    }
  ]
});
```

---

## 🛠️ Pro Tips

### 1. Start with Meta-Agents
- Use `agent-genesis-architect` to create any agent you need
- Use `skill-creator` to extract reusable capabilities
- These are your "agent factories"

### 2. Compose for Power
```typescript
// Combine multiple skills
await execute_agent({
  agentId: "research-agent",
  prompt: "Research AI trends",
  skills: [
    "academic-citation-apa",
    "fact-verification",
    "synthesis-expert",
    "seo-optimization"
  ] // All skills applied together
});
```

### 3. Use Teams for Complex Tasks
- 2-5 agents optimal
- 2-3 rounds typical
- Different models for different roles
- Linear for sequential, parallel for independent, rounds for collaborative

### 4. Cache Frequently Used Agents
```typescript
// Configure once, reuse many times
const salesAgentId = await configure_agent({
  id: "my-sales-agent",
  name: "LinkedIn Prospector",
  systemPrompt: "You are an expert...",
  model: "claude-sonnet-4",
  temperature: 0.7,
  skills: ["persuasion", "research"]
});

// Now just reference by ID
await execute_agent({
  agentId: salesAgentId,
  prompt: "Find prospects in fintech"
});
```

### 5. Monitor Performance
```typescript
// Track execution
const result = await execute_agent({
  agentId: "agent-id",
  prompt: "Task",
  verbose: true // Get detailed execution info
});

console.log(result.usage); // Token usage
console.log(result.model); // Model used
console.log(result.executionTime); // Time taken
```

---

## 📚 Reference Docs

- `AGENT_CONSOLIDATION_SUMMARY.md` - Overview and recommendations
- `CONSOLIDATION_QUICK_REFERENCE.md` - Quick lookup
- `agent-platform/mcp-server/docs/AGENT_TEAMS_QUICK_REFERENCE.md` - Teams guide
- `agent-platform/mcp-server/docs/SKILLS_QUICKSTART.md` - Skills guide

---

## 🎯 Common Patterns

### Content Creation
Research → Outline → Draft → Review (team) → Polish → Publish

### Code Review
Lint → Security Scan → Team Review (3-5 agents) → Approve → Deploy

### Customer Support
Classify → Route → Handle (agent or team) → Follow-up → Close

### Product Development
Research → Design (team) → Prototype → Test → Iterate → Launch

### Data Analysis
Collect → Clean → Analyze (agent) → Visualize → Insights (team) → Report

---

## 🚨 Troubleshooting

### Agent Not Found
```typescript
// List all available agents first
const agents = await mcp_agents_list_agents();
console.log(agents);
```

### API Key Issues
```
Error: ANTHROPIC_API_KEY not configured
```
**Solution:** The agent teams tool requires API keys. Use MCP sampling mode or configure keys.

### Skill Not Loading
```typescript
// Load skill toolkits
await mcp_agents_load_skill({ id: "skill-id" });
```

### Timeout
```typescript
// Increase timeout for long tasks
await execute_agent_async({
  agentId: "agent-id",
  prompt: "Long task",
  timeoutMs: 600000 // 10 minutes
});
```

---

**You're ready to start using your agent platform!**

Pick an example above and try it out. All the agents, tools, and infrastructure are ready to use immediately.
