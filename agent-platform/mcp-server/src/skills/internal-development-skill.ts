/**
 * Internal Platform Development Skill
 * 
 * Skill for agents and developers working on the agent platform itself.
 * Includes tools, instructions, and rules for platform development.
 */

import { Skill, SkillRule, SkillInstructions } from '../types/skill.js';

/**
 * Internal development instructions
 */
const internalDevInstructions: SkillInstructions = {
  overview: `
This skill is designed for AI agents and developers working on the Agent Platform itself.
It provides comprehensive tools and guidance for platform development, maintenance, and enhancement.

The platform consists of:
- MCP Server: Model Context Protocol server for agent communication
- Toolkits: Modular tool collections (core, agent-development, workflow, etc.)
- Skills: Higher-level abstractions combining toolkits with instructions/rules
- Services: Backend services (SkillsService, CollectionService, ToolkitManager, etc.)
- Type System: Comprehensive TypeScript type definitions
- Tools: Individual MCP tools for specific operations

Architecture Principles:
1. Modular toolkit system for selective feature loading
2. Type-safe TypeScript with comprehensive interfaces
3. Service-oriented architecture with dependency injection
4. Hook-based extensibility for lifecycle events
5. Test-driven development with Jest
6. Comprehensive documentation and examples
`,

  usage: `
## Development Workflow

### 1. Adding New Tools
\`\`\`typescript
// Create tool file: src/tools/my-tool.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { withHooks } from "../utils/hooked-registry.js";

const myToolSchema = z.object({
  param: z.string().describe("Description")
});

export async function registerMyTools(server: McpServer, logger: Logger) {
  server.tool(
    "my_tool",
    "Tool description",
    myToolSchema.shape,
    withHooks("my_tool", async (input) => {
      // Implementation
      return {
        content: [{ type: "text", text: "result" }]
      };
    })
  );
}
\`\`\`

### 2. Creating New Toolkits
\`\`\`typescript
// Create toolkit: src/toolkits/my-toolkit/index.ts
import { Toolkit } from '../../types/toolkit.js';
import { registerMyTools } from '../../tools/my-tool.js';

export const myToolkit: Toolkit = {
  id: "my-toolkit",
  name: "My Toolkit",
  description: "What it does",
  version: "1.0.0",
  category: "custom",
  enabled: true,
  toolCount: 5,
  register: async (server, logger) => {
    await registerMyTools(server, logger);
  },
  metadata: {
    author: "Your Name",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: ["tag1", "tag2"]
  }
};
\`\`\`

### 3. Creating New Skills
\`\`\`typescript
// Use create_skill tool
create_skill({
  id: "my-skill",
  name: "My Skill",
  description: "Skill description",
  config: {
    toolkits: ["my-toolkit"],
    instructions: {
      overview: "What it does",
      usage: "How to use it",
      examples: ["Example 1", "Example 2"],
      bestPractices: ["Practice 1"],
      warnings: ["Warning 1"]
    },
    rules: [
      {
        id: "rule-1",
        description: "Rule description",
        priority: 10
      }
    ],
    systemPrompt: "Additional prompt"
  },
  metadata: {
    author: "Your Name",
    version: "1.0.0",
    tags: ["tag1"]
  }
});
\`\`\`

### 4. Adding Services
\`\`\`typescript
// Create service: src/services/my-service.ts
export class MyService {
  constructor(private logger: Logger) {}
  
  async initialize(): Promise<void> {
    // Initialization logic
  }
  
  // Service methods
}

// Register in service-registry.ts
let myService: MyService | null = null;

export function initializeMyService(logger: Logger): MyService {
  myService = new MyService(logger);
  return myService;
}

export function getMyService(): MyService {
  if (!myService) {
    throw new Error('MyService not initialized');
  }
  return myService;
}
\`\`\`

### 5. Testing
\`\`\`typescript
// Create test: src/tools/__tests__/my-tool.test.ts
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '../my-tool';

describe('MyTool', () => {
  it('should perform operation', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});

// Run tests
npm test
npm run test:watch
npm run test:coverage
\`\`\`

### 6. Building and Running
\`\`\`bash
# Development mode (with auto-reload)
npm run dev

# Build TypeScript
npm run build

# Run built server
npm start

# Test with MCP Inspector
npm run inspect
\`\`\`

## Code Organization

\`\`\`
src/
├── types/           # TypeScript type definitions
│   ├── toolkit.ts   # Toolkit types
│   ├── skill.ts     # Skill types
│   ├── agent.ts     # Agent types
│   └── ...
├── services/        # Backend services
│   ├── toolkit-manager.ts
│   ├── skills-service.ts
│   ├── collection-service.ts
│   └── service-registry.ts
├── toolkits/        # Tool collections
│   ├── core/
│   ├── skills/
│   ├── project-management/
│   └── ...
├── tools/           # Individual tool implementations
│   ├── agent-tools.ts
│   ├── skill-tools.ts
│   ├── workflow-tools.ts
│   └── ...
├── hooks/           # Hook system
│   └── HookManager.ts
├── utils/           # Utilities
│   ├── logging.ts
│   ├── hooked-registry.ts
│   └── ...
└── index.ts         # Main server entry point
\`\`\`
`,

  examples: [
    `
Example 1: Adding a new tool to existing toolkit
\`\`\`typescript
// In src/tools/agent-tools.ts

const newToolSchema = z.object({
  agentId: z.string(),
  config: z.object({
    model: z.string(),
    temperature: z.number()
  })
});

server.tool(
  "configure_agent_advanced",
  "Advanced agent configuration",
  newToolSchema.shape,
  withHooks("configure_agent_advanced", async (input) => {
    // Implementation
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({ success: true })
      }]
    };
  })
);
\`\`\`
`,
    `
Example 2: Creating a new collection type
\`\`\`typescript
// In src/types/collection.ts

export interface MyCollectionItem extends CollectionItem {
  data: {
    specificField: string;
    anotherField: number;
  };
}

// In src/services/collection-service.ts

async createMyCollection(
  id: string,
  config: CollectionConfig
): Promise<Collection<MyCollectionItem>> {
  // Implementation
}
\`\`\`
`,
    `
Example 3: Registering a new toolkit
\`\`\`typescript
// In src/index.ts

import { myNewToolkit } from "./toolkits/my-new-toolkit/index.js";

// In initializeServer function
toolkitManager.registerToolkit(myNewToolkit);
\`\`\`
`
  ],

  bestPractices: [
    "Always define comprehensive TypeScript types for new features",
    "Use Zod schemas for input validation with clear descriptions",
    "Implement tools with withHooks wrapper for lifecycle events",
    "Write tests before implementing features (TDD)",
    "Use service-registry pattern for dependency injection",
    "Document all public APIs with JSDoc comments",
    "Follow existing code patterns and conventions",
    "Keep tools focused and single-purpose",
    "Use semantic versioning for toolkits and skills",
    "Implement proper error handling with descriptive messages",
    "Log important operations for debugging",
    "Use async/await consistently for asynchronous operations",
    "Validate inputs at service boundaries",
    "Persist important state to disk",
    "Provide meaningful tool descriptions for AI agents",
    "Use hooks for cross-cutting concerns",
    "Keep configuration external (environment variables)",
    "Write integration tests for tool interactions"
  ],

  warnings: [
    "Don't modify types in types/ without checking all usages",
    "Avoid circular dependencies between services",
    "Don't use any type - prefer unknown or proper typing",
    "Avoid global state - use services and dependency injection",
    "Don't skip TypeScript compilation errors",
    "Avoid coupling tools to specific implementations",
    "Don't forget to export new functions and types",
    "Avoid synchronous file operations in tools",
    "Don't ignore linting errors",
    "Avoid breaking changes without version updates",
    "Don't commit sensitive data or API keys",
    "Avoid complex tool logic - delegate to services"
  ],

  prerequisites: [
    "TypeScript proficiency",
    "Understanding of async/await and Promises",
    "Familiarity with Node.js and npm",
    "Knowledge of Model Context Protocol (MCP)",
    "Experience with Zod validation",
    "Understanding of dependency injection patterns",
    "Git version control knowledge"
  ]
};

/**
 * Internal development rules
 */
const internalDevRules: SkillRule[] = [
  {
    id: "type-safety",
    description: "All new code must be fully typed (no 'any' types)",
    priority: 10,
    enabled: true
  },
  {
    id: "input-validation",
    description: "All tool inputs must be validated with Zod schemas",
    priority: 10,
    enabled: true
  },
  {
    id: "error-handling",
    description: "All tools must have comprehensive error handling",
    priority: 9,
    enabled: true
  },
  {
    id: "testing-required",
    description: "All new tools and services must have unit tests",
    priority: 9,
    enabled: true
  },
  {
    id: "documentation",
    description: "All public APIs must have JSDoc comments",
    priority: 8,
    enabled: true
  },
  {
    id: "tool-descriptions",
    description: "All tool parameters must have clear descriptions",
    priority: 8,
    enabled: true
  },
  {
    id: "service-pattern",
    description: "Use service-registry for service access",
    priority: 8,
    enabled: true
  },
  {
    id: "async-consistency",
    description: "Use async/await consistently (no callbacks or raw promises)",
    priority: 7,
    enabled: true
  },
  {
    id: "hooks-usage",
    description: "Use withHooks wrapper for tool implementations",
    priority: 7,
    enabled: true
  },
  {
    id: "versioning",
    description: "Update version numbers for breaking changes",
    priority: 9,
    enabled: true
  },
  {
    id: "logging",
    description: "Log all important operations with appropriate levels",
    priority: 7,
    enabled: true
  },
  {
    id: "build-check",
    description: "Run TypeScript build before committing",
    priority: 10,
    enabled: true
  },
  {
    id: "test-check",
    description: "Run tests before committing",
    priority: 10,
    enabled: true
  },
  {
    id: "no-secrets",
    description: "Never commit API keys or secrets to repository",
    priority: 10,
    enabled: true
  },
  {
    id: "code-review",
    description: "Complex changes should be reviewed before merging",
    priority: 8,
    enabled: true
  }
];

/**
 * System prompt for internal development
 */
const internalDevSystemPrompt = `
You are a senior software engineer working on the Agent Platform MCP server.
You have deep knowledge of the codebase architecture and best practices.

Your responsibilities:
1. Implement new features following existing patterns
2. Maintain type safety throughout the codebase
3. Write comprehensive tests for new functionality
4. Document APIs clearly for other developers and AI agents
5. Ensure backward compatibility when possible
6. Optimize performance and memory usage
7. Handle errors gracefully with clear messages

When implementing new features:
- Start by defining TypeScript types
- Create Zod schemas for validation
- Implement service layer logic first
- Add tool layer with proper hooks
- Write tests covering edge cases
- Document with JSDoc and examples
- Update relevant documentation files

When modifying existing code:
- Check all usages before changing types
- Maintain backward compatibility
- Update tests to reflect changes
- Document breaking changes clearly
- Increment version numbers appropriately

Always prioritize:
- Type safety over convenience
- Clarity over cleverness
- Maintainability over performance (unless performance is critical)
- Comprehensive error handling
- Clear, descriptive names

Remember: The code you write will be used by AI agents and developers alike.
Make it clear, well-documented, and robust.
`;

/**
 * Complete internal development skill definition
 */
export const internalDevelopmentSkill: Skill = {
  id: "internal-platform-development",
  name: "Internal Platform Development",
  description: "Comprehensive skill for developing and maintaining the Agent Platform MCP server",
  
  config: {
    toolkits: ["core", "skills", "agent-development", "project-management"],
    tools: [
      // Core tools
      "list_toolkits",
      "get_toolkit_info",
      "enable_toolkit",
      "disable_toolkit",
      
      // Skill tools
      "create_skill",
      "update_skill",
      "list_skills",
      "load_skill",
      
      // Project management tools
      "create_project",
      "create_sprint",
      "create_task",
      "update_task",
      "list_tasks",
      
      // Agent tools
      "execute_agent",
      "configure_agent"
    ],
    
    instructions: internalDevInstructions,
    rules: internalDevRules,
    systemPrompt: internalDevSystemPrompt,
    autoLoad: false,  // Opt-in for platform developers
    exclusive: false,
    
    validators: [
      {
        type: "pre-execution",
        code: `
// Validate TypeScript compilation before deployment
function validateTypeScriptBuild() {
  // Would execute: npm run build
  return true;
}
        `,
        message: "TypeScript compilation must succeed before deployment"
      },
      {
        type: "pre-execution",
        code: `
// Validate tests pass before deployment
function validateTests() {
  // Would execute: npm test
  return true;
}
        `,
        message: "All tests must pass before deployment"
      }
    ]
  },
  
  metadata: {
    author: "Agent Platform Core Team",
    created: "2025-11-07",
    updated: "2025-11-07",
    version: "1.0.0",
    tags: ["development", "platform", "internal", "typescript", "mcp", "architecture"],
    category: "development",
    homepage: "https://github.com/agent-platform/mcp-server",
    repository: "https://github.com/agent-platform/mcp-server",
    documentation: "https://github.com/agent-platform/mcp-server/docs/development.md",
    license: "MIT"
  },
  
  enabled: true,
  loaded: false
};

/**
 * Export as a function to create the skill
 */
export function createInternalDevelopmentSkill(): Skill {
  return internalDevelopmentSkill;
}
