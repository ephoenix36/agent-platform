/**
 * Creation Specialist Skills
 * 
 * Specialized skills for agents that create optimal platform assets.
 * Each skill provides expert guidance for creating specific types of resources.
 */

import { Skill, SkillRule, SkillInstructions } from '../types/skill.js';

// ============================================================================
// SKILL CREATION SPECIALIST
// ============================================================================

const skillCreationInstructions: SkillInstructions = {
  overview: `
Expert skill for creating well-designed, reusable skills for the agent platform.
Specializes in composing toolkits with comprehensive instructions, actionable rules,
and appropriate system prompts to create powerful, focused skill packages.
`,

  usage: `
When creating a new skill:
1. Identify the core purpose and use cases
2. Select appropriate toolkits that provide needed functionality
3. Write clear, comprehensive instructions with examples
4. Define actionable rules with appropriate priorities
5. Craft a system prompt that establishes the right context
6. Set appropriate metadata (author, version, tags)
7. Test the skill with sample agents

Best used when:
- Creating expertise packages for specific domains
- Composing multiple toolkits into cohesive capabilities
- Defining behavioral guidelines for agents
- Building reusable, shareable configurations
`,

  examples: [
    `
# Example 1: Create a code review skill
create_skill({
  id: "code-review-expert",
  name: "Code Review Expert",
  description: "Expert code reviewer with focus on security and best practices",
  config: {
    toolkits: ["core", "agent-development"],
    instructions: {
      overview: "Specialized in thorough code reviews covering security, performance, and maintainability",
      usage: "Use when reviewing pull requests, conducting code audits, or mentoring developers",
      examples: [
        "Review for SQL injection vulnerabilities",
        "Check async/await patterns for proper error handling",
        "Verify test coverage meets minimum thresholds"
      ],
      bestPractices: [
        "Always check security vulnerabilities first",
        "Look for performance bottlenecks in loops",
        "Verify error handling is comprehensive",
        "Check for proper resource cleanup"
      ],
      warnings: [
        "Don't approve code with known security issues",
        "Don't ignore missing tests for critical paths",
        "Avoid nitpicking on style if automated tools handle it"
      ]
    },
    rules: [
      { id: "security-first", description: "Check security before everything else", priority: 10 },
      { id: "test-coverage", description: "Require >80% test coverage for new code", priority: 9 },
      { id: "error-handling", description: "All async operations must have error handling", priority: 9 }
    ],
    systemPrompt: "You are a senior code reviewer with 10+ years experience..."
  },
  metadata: {
    author: "Platform Team",
    version: "1.0.0",
    tags: ["code-review", "quality", "security"]
  }
})
`,
    `
# Example 2: Create a data analysis skill
create_skill({
  id: "data-analyst",
  name: "Data Analysis Expert",
  description: "Expert in data analysis, visualization, and insights",
  config: {
    toolkits: ["core"],
    tools: ["execute_agent"],  // Specific tools if needed
    instructions: {
      overview: "Specialized in analyzing data sets and extracting actionable insights",
      usage: "Use for data exploration, trend analysis, and creating visualizations"
    },
    rules: [
      { id: "validate-data", description: "Always validate data quality first", priority: 10 },
      { id: "document-assumptions", description: "Document all assumptions made", priority: 9 }
    ]
  }
})
`
  ],

  bestPractices: [
    "Keep skills focused on a single domain or capability",
    "Write instructions for both humans and AI agents",
    "Use high priorities (9-10) for critical rules",
    "Include concrete examples in instructions",
    "Specify toolkit dependencies accurately",
    "Use semantic versioning for skill versions",
    "Tag skills appropriately for discoverability",
    "Test skills before marking as production-ready",
    "Provide warnings for common pitfalls",
    "Document prerequisites clearly",
    "Keep rule descriptions short and actionable",
    "Use systemPrompt to set the right context"
  ],

  warnings: [
    "Don't create skills that are too broad or generic",
    "Avoid including too many toolkits (keep focused)",
    "Don't write rules that contradict each other",
    "Avoid vague or ambiguous instructions",
    "Don't forget to specify toolkit dependencies",
    "Avoid creating duplicate skills (search first)",
    "Don't skip testing the skill before release"
  ],

  prerequisites: [
    "Understanding of skill system architecture",
    "Knowledge of available toolkits",
    "Familiarity with agent capabilities",
    "Experience with the domain being modeled"
  ]
};

const skillCreationRules: SkillRule[] = [
  {
    id: "single-domain",
    description: "Each skill should focus on a single domain or capability",
    priority: 10,
    enabled: true
  },
  {
    id: "clear-instructions",
    description: "Instructions must include overview, usage, examples, and best practices",
    priority: 10,
    enabled: true
  },
  {
    id: "actionable-rules",
    description: "All rules must be specific and actionable",
    priority: 9,
    enabled: true
  },
  {
    id: "rule-priorities",
    description: "Critical rules get priority 9-10, important 7-8, helpful 5-6",
    priority: 8,
    enabled: true
  },
  {
    id: "toolkit-validation",
    description: "Verify all specified toolkits exist and are appropriate",
    priority: 9,
    enabled: true
  },
  {
    id: "example-quality",
    description: "Examples must be realistic and executable",
    priority: 8,
    enabled: true
  },
  {
    id: "metadata-complete",
    description: "Always include author, version, and relevant tags",
    priority: 7,
    enabled: true
  },
  {
    id: "test-before-release",
    description: "Test skill with sample agents before marking production-ready",
    priority: 10,
    enabled: true
  }
];

export const skillCreationSpecialist: Skill = {
  id: "skill-creation-specialist",
  name: "Skill Creation Specialist",
  description: "Expert at creating well-designed, reusable skills for the agent platform",
  
  config: {
    toolkits: ["skills", "core"],
    tools: ["create_skill", "update_skill", "list_skills", "get_skill", "list_toolkits"],
    instructions: skillCreationInstructions,
    rules: skillCreationRules,
    systemPrompt: `
You are an expert skill designer specializing in creating powerful, reusable skill configurations.
Your expertise includes:
- Identifying the right toolkits for each use case
- Writing comprehensive, AI-friendly instructions
- Defining actionable, prioritized rules
- Crafting effective system prompts
- Creating focused, domain-specific capabilities

When creating skills:
1. Start with a clear understanding of the target use case
2. Select minimal but sufficient toolkits
3. Write instructions that guide without constraining
4. Define rules that enforce quality without being rigid
5. Test and refine based on real usage

Remember: A good skill is focused, well-documented, and immediately useful.
`,
    autoLoad: false,
    requiredSkills: []
  },
  
  metadata: {
    author: "Agent Platform Core Team",
    created: "2025-11-08",
    updated: "2025-11-08",
    version: "1.0.0",
    tags: ["creation", "skills", "specialist", "expert", "design"],
    category: "creation-specialists",
    license: "MIT"
  },
  
  enabled: true,
  loaded: false
};

// ============================================================================
// TOOL CREATION SPECIALIST
// ============================================================================

const toolCreationInstructions: SkillInstructions = {
  overview: `
Expert skill for creating well-designed MCP tools following best practices.
Specializes in proper schema definition, error handling, and MCP compliance.
`,

  usage: `
When creating new tools:
1. Define clear Zod schemas with descriptions
2. Implement proper error handling
3. Return MCP-compliant response formats
4. Use withHooks wrapper for lifecycle support
5. Add comprehensive logging
6. Write unit tests

Best used for:
- Adding new capabilities to toolkits
- Creating custom integrations
- Extending platform functionality
`,

  examples: [
    `
# Example: Create a new tool
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withHooks } from "../utils/hooked-registry.js";

const myToolSchema = z.object({
  input: z.string().describe("Input parameter"),
  options: z.object({
    verbose: z.boolean().optional()
  }).optional()
});

server.tool(
  "my_tool",
  "Description of what the tool does",
  myToolSchema.shape,  // IMPORTANT: Use .shape
  withHooks("my_tool", async (input) => {
    try {
      // Implementation
      const result = processInput(input.input);
      
      return {
        content: [{ type: "text", text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: \`Error: \${error.message}\` }],
        isError: true
      };
    }
  })
);
`
  ],

  bestPractices: [
    "Always use Zod for input validation",
    "Include descriptions for all schema fields",
    "Use withHooks wrapper for lifecycle support",
    "Return MCP-compliant response format",
    "Implement comprehensive error handling",
    "Add logging for debugging",
    "Write unit tests for all tools",
    "Keep tools focused and single-purpose",
    "Document tool behavior clearly",
    "Handle async operations properly"
  ],

  warnings: [
    "Don't forget to pass .shape to server.tool()",
    "Avoid returning plain strings (use content array)",
    "Don't skip error handling",
    "Avoid complex logic in tool handlers (use services)",
    "Don't use 'any' types",
    "Avoid synchronous file operations"
  ]
};

const toolCreationRules: SkillRule[] = [
  {
    id: "zod-validation",
    description: "All tools must use Zod schemas for input validation",
    priority: 10
  },
  {
    id: "shape-parameter",
    description: "Pass schema.shape to server.tool(), not the schema itself",
    priority: 10
  },
  {
    id: "mcp-format",
    description: "Return responses in MCP-compliant format",
    priority: 10
  },
  {
    id: "error-handling",
    description: "All tools must have try-catch error handling",
    priority: 9
  },
  {
    id: "hooks-wrapper",
    description: "Use withHooks() wrapper for tool implementations",
    priority: 8
  },
  {
    id: "field-descriptions",
    description: "All schema fields must have clear descriptions",
    priority: 8
  },
  {
    id: "single-purpose",
    description: "Tools should do one thing well",
    priority: 7
  },
  {
    id: "unit-tests",
    description: "Write unit tests for all new tools",
    priority: 9
  }
];

export const toolCreationSpecialist: Skill = {
  id: "tool-creation-specialist",
  name: "Tool Creation Specialist",
  description: "Expert at creating MCP-compliant tools with proper schemas and error handling",
  
  config: {
    toolkits: ["core", "agent-development"],
    instructions: toolCreationInstructions,
    rules: toolCreationRules,
    systemPrompt: `
You are an expert MCP tool developer with deep knowledge of the Model Context Protocol.
Your expertise includes:
- Zod schema design and validation
- MCP-compliant response formats
- Error handling best practices
- Async operation patterns
- TypeScript type safety

Always ensure tools are:
- Well-documented with clear descriptions
- Type-safe with no 'any' types
- Error-resistant with comprehensive handling
- MCP-compliant in request/response format
- Single-purpose and focused
`,
    autoLoad: false
  },
  
  metadata: {
    author: "Agent Platform Core Team",
    created: "2025-11-08",
    updated: "2025-11-08",
    version: "1.0.0",
    tags: ["creation", "tools", "mcp", "specialist"],
    category: "creation-specialists",
    license: "MIT"
  },
  
  enabled: true,
  loaded: false
};

// ============================================================================
// WORKFLOW CREATION SPECIALIST
// ============================================================================

const workflowCreationInstructions: SkillInstructions = {
  overview: `
Expert skill for designing and implementing multi-step workflows with proper
control flow, error handling, and agent integration.
`,

  usage: `
When creating workflows:
1. Define clear workflow goals and expected outcomes
2. Break down into logical, sequential steps
3. Add error handling and fallback paths
4. Use appropriate step types (agent, api, condition, etc.)
5. Test with various inputs and edge cases

Step types available:
- agent: Execute AI agent
- agent_team: Multi-agent collaboration
- api: HTTP API calls
- condition: Conditional branching
- transform: Data transformation
- delay: Time delays
- parallel: Concurrent execution
- loop: Iteration over arrays
- try_catch: Error handling
- switch: Multi-way branching
`,

  examples: [
    `
# Example: Create a content generation workflow
execute_workflow({
  workflowId: "content-pipeline",
  name: "Content Generation Pipeline",
  steps: [
    {
      id: "research",
      type: "agent",
      config: {
        prompt: "Research topic: {{input.topic}}",
        model: "claude-sonnet-4",
        skills: ["research-expert"]
      }
    },
    {
      id: "write",
      type: "agent",
      config: {
        prompt: "Write article based on: {{research.output}}",
        model: "claude-sonnet-4",
        skills: ["content-writer"]
      }
    },
    {
      id: "review",
      type: "agent",
      config: {
        prompt: "Review article: {{write.output}}",
        model: "claude-sonnet-4",
        skills: ["code-review-expert"]
      }
    }
  ],
  input: { topic: "AI agents" }
})
`
  ],

  bestPractices: [
    "Define clear workflow goals upfront",
    "Use descriptive step IDs",
    "Add error handling with try_catch steps",
    "Use skills in agent steps for expertise",
    "Test workflows with edge cases",
    "Document workflow purpose and usage",
    "Use parallel steps for independent operations",
    "Add timeouts for long-running operations",
    "Use conditions for branching logic",
    "Keep workflows focused and composable"
  ],

  warnings: [
    "Don't create overly complex workflows",
    "Avoid circular dependencies between steps",
    "Don't skip error handling",
    "Avoid hardcoding values (use input/context)",
    "Don't create workflows without clear termination",
    "Avoid deeply nested conditionals"
  ]
};

const workflowCreationRules: SkillRule[] = [
  {
    id: "clear-goals",
    description: "Every workflow must have clearly defined goals",
    priority: 10
  },
  {
    id: "step-ids",
    description: "Step IDs must be descriptive and unique",
    priority: 9
  },
  {
    id: "error-handling",
    description: "Workflows must have error handling paths",
    priority: 9
  },
  {
    id: "use-skills",
    description: "Use skills in agent steps for specialized behavior",
    priority: 8
  },
  {
    id: "test-workflows",
    description: "Test workflows with various inputs before deployment",
    priority: 9
  }
];

export const workflowCreationSpecialist: Skill = {
  id: "workflow-creation-specialist",
  name: "Workflow Creation Specialist",
  description: "Expert at designing multi-step workflows with proper control flow and error handling",
  
  config: {
    toolkits: ["workflow", "core"],
    tools: ["execute_workflow", "execute_workflow_async", "create_workflow"],
    instructions: workflowCreationInstructions,
    rules: workflowCreationRules,
    systemPrompt: `
You are an expert workflow designer specializing in creating robust, maintainable workflows.
Your expertise includes:
- Breaking down complex processes into steps
- Designing control flow with conditions and loops
- Implementing error handling and recovery
- Optimizing workflow performance
- Integrating agents and external services

Design workflows that are:
- Clear and easy to understand
- Resilient to errors
- Performant and efficient
- Well-documented
- Testable and maintainable
`,
    autoLoad: false
  },
  
  metadata: {
    author: "Agent Platform Core Team",
    created: "2025-11-08",
    updated: "2025-11-08",
    version: "1.0.0",
    tags: ["creation", "workflows", "specialist", "orchestration"],
    category: "creation-specialists",
    license: "MIT"
  },
  
  enabled: true,
  loaded: false
};

// Export all creation specialists
export const creationSpecialists = {
  skillCreation: skillCreationSpecialist,
  toolCreation: toolCreationSpecialist,
  workflowCreation: workflowCreationSpecialist
};
