# Advisors MCP Server

AI advisor agents that provide quality assurance, strategic guidance, and meta-cognitive support.

## Overview

The Advisors MCP Server provides 7 specialized AI advisors:

1. **The Skeptic** - Challenge assumptions and find flaws
2. **The Pattern Hunter** - Find hidden patterns and insights
3. **The Mirror** - Reflect back reality vs. perception
4. **The Oracle** - Provide strategic guidance
5. **The Interrogator** - Ask unasked questions
6. **The Validator** - Validate quality and readiness
7. **The Outsider** - Provide fresh perspective

## Installation

```bash
cd advisors-mcp
pnpm install
pnpm build
```

## Configuration

Add to your MCP settings file (`.vscode/mcp.json` or similar):

```json
{
  "mcpServers": {
    "advisors": {
      "command": "node",
      "args": ["C:/Users/ephoe/Documents/Coding_Projects/Agents/advisors-mcp/dist/index.js"],
      "description": "AI advisor agents for quality and strategy"
    }
  }
}
```

## Available Tools

### `consult_advisor`

Consult a specific advisor for guidance.

**Parameters:**
- `advisor` (required): Which advisor to consult
- `task` (required): The task or problem
- `intention` (optional): What you intend to accomplish
- `implementation` (optional): What you've implemented
- `assumptions` (optional): Key assumptions
- `constraints` (optional): Constraints
- `stage` (optional): planning | executing | reviewing | delivering

**Example:**
```json
{
  "advisor": "skeptic",
  "task": "Building a landing page for SaaS product",
  "assumptions": [
    "Users will have JavaScript enabled",
    "Email service will always be available"
  ]
}
```

### `run_quality_gate`

Run comprehensive quality validation with all advisors.

**Parameters:**
- `task` (required): What needs validation
- `intention` (optional): Original goals
- `implementation` (optional): What was built
- `assumptions` (optional): Assumptions made
- `constraints` (optional): Constraints worked within

**Example:**
```json
{
  "task": "Landing page ready for customer launch",
  "intention": "Professional SaaS landing page with contact form",
  "implementation": "Next.js app with Tailwind, analytics, email integration"
}
```

### `list_advisors`

Get information about all advisors and when to use them.

### `get_advisor_guide`

Get recommendations on which advisor to use for your situation.

**Parameters:**
- `situation` (required): Description of your situation

## Usage Examples

### Before Major Decision
```typescript
// Consult the Skeptic to challenge assumptions
const result = await consultAdvisor({
  advisor: "skeptic",
  task: "Deciding whether to build 6 domains or start with 2",
  assumptions: [
    "Can build all 6 domains well in Year 1",
    "Customers want full suite immediately"
  ]
});
```

### Before Customer Delivery
```typescript
// Run quality gate
const gate = await runQualityGate({
  task: "Landing page ready for launch",
  intention: "Professional landing page for optimization platform",
  implementation: "Next.js 14, TypeScript, Tailwind CSS, full analytics"
});

if (!gate.passed) {
  console.log("Critical issues:", gate.criticalIssues);
  console.log("Must address before launch");
}
```

### When Stuck
```typescript
// Consult the Mirror
const reflection = await consultAdvisor({
  advisor: "mirror",
  task: "Building agent system",
  intention: "Create simple agent framework",
  implementation: "Complex multi-layer architecture with 15 components"
});
// Might reveal scope creep or overengineering
```

### Strategic Planning
```typescript
// Consult the Oracle
const strategy = await consultAdvisor({
  advisor: "oracle",
  task: "Resource allocation for next quarter",
  constraints: [
    "Limited development time",
    "Need to show revenue soon"
  ]
});
```

## When to Use Which Advisor

- **Planning phase** → Oracle, Interrogator
- **During execution** → Pattern Hunter, Mirror
- **Before delivery** → Validator, Skeptic, Outsider
- **When stuck** → Mirror, Interrogator, Outsider
- **Major decisions** → Skeptic, Oracle, Interrogator
- **Quality checks** → Validator, Skeptic
- **Simplification** → Outsider, Pattern Hunter

## Quality Gate Workflow

For any customer-facing delivery:

1. Run `run_quality_gate` with full context
2. Review feedback from all 7 advisors
3. Address critical issues (must fix)
4. Consider warnings (should fix)
5. Integrate insights into final delivery
6. Re-run quality gate if major changes
7. Deploy when `passed: true`

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Test locally
node dist/index.js
```

## Integration with Other Agents

All agents should invoke advisors at key checkpoints:

```typescript
class OptimizationAgent {
  async execute(task: Task) {
    // Strategic planning
    const strategy = await this.mcp.consultAdvisor({
      advisor: "oracle",
      task: task.description
    });
    
    // Execute with strategy
    const result = await this.implement(strategy);
    
    // Quality validation
    const validation = await this.mcp.runQualityGate({
      task: task.description,
      implementation: result.summary
    });
    
    if (!validation.passed) {
      return this.fix(validation.criticalIssues);
    }
    
    return result;
  }
}
```

## License

MIT
