# Agent Autonomous Operations Guide

## 🤖 How Agents Can Use the Agents Platform

This guide demonstrates how AI agents can autonomously leverage the Agents Platform MCP Server to accomplish complex tasks without human intervention.

---

## 🎯 Core Principle: Tool Accessibility

**All registered tools are automatically available to agents via MCP sampling.** This means:
- ✅ Agents can discover available tools
- ✅ Agents can execute tools with proper parameters
- ✅ Agents can chain tool calls for complex workflows
- ✅ Agents can self-configure their environment

---

## 🔧 Self-Configuration Workflows

### Scenario 1: Agent Needs GitHub Integration

```typescript
/**
 * Agent Task: "Set up GitHub integration for code review automation"
 * Agent Reasoning: I need the GitHub MCP server to access repositories
 */

// Step 1: Check if GitHub server is configured
const servers = await execute_tool('mcp_list_servers', {
  scope: 'workspace'
});

// Step 2: If not configured, add it
if (!servers.success || !servers.servers['github-mcp']) {
  const result = await execute_tool('mcp_add_server', {
    serverName: 'github-mcp',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN
    },
    scope: 'workspace'
  });
  
  console.log('✅ GitHub MCP server configured automatically');
}

// Step 3: Now use GitHub tools
const repos = await execute_tool('github_list_repos', {
  owner: 'my-org'
});
```

**Key Insight:** Agents can install their own dependencies!

---

## 📁 File-Based Task Automation

### Scenario 2: Automated Code Review

```typescript
/**
 * Agent Task: "Review all TypeScript files and suggest improvements"
 * Agent Reasoning: I need to find files, analyze them, and document findings
 */

// Step 1: Find all TypeScript files
const files = await execute_tool('file_search', {
  pattern: '**/*.ts',
  cwd: './src',
  limit: 100
});

// Step 2: Search for common issues
const issues = [];

// Find TODO comments
const todos = await execute_tool('file_grep', {
  pattern: 'TODO:|FIXME:|XXX:',
  filePattern: '**/*.ts',
  cwd: './src',
  contextLines: 2
});

issues.push(...todos.matches.map(m => ({
  type: 'todo',
  file: m.file,
  line: m.line,
  content: m.content
})));

// Find console.log statements (should be removed in production)
const consoleLogs = await execute_tool('file_grep', {
  pattern: 'console\\.log',
  filePattern: '**/*.ts',
  cwd: './src'
});

issues.push(...consoleLogs.matches.map(m => ({
  type: 'console-log',
  file: m.file,
  line: m.line,
  content: m.content
})));

// Step 3: Generate review report
const report = `# Code Review Report
Generated: ${new Date().toISOString()}

## Summary
- Files reviewed: ${files.count}
- Issues found: ${issues.length}

## Issues

${issues.map(issue => 
  `### ${issue.type} in ${issue.file}:${issue.line}
\`\`\`
${issue.content}
\`\`\`
`).join('\n')}

## Recommendations
1. Address all TODO comments before next release
2. Remove console.log statements
3. Consider adding ESLint rules to prevent these issues
`;

// Step 4: Write report
await execute_tool('file_write', {
  path: './reports/code-review.md',
  content: report
});

console.log('✅ Code review completed and documented');
```

---

## 📋 Project Management Automation

### Scenario 3: Autonomous Project Setup

```typescript
/**
 * Agent Task: "Set up a new machine learning project with full documentation"
 * Agent Reasoning: Need to create project structure, generate docs, set up sprints
 */

// Step 1: Create project
const project = await execute_tool('pm_create_project', {
  name: 'Customer Churn Prediction',
  description: 'ML model to predict customer churn risk',
  owner: 'data-science-team',
  tags: ['ml', 'customer-success', 'prediction'],
  templateType: 'python-fastapi',
  sprintDuration: 14
});

// Step 2: Generate comprehensive documentation
await execute_tool('pm_generate_readme', {
  slug: project.project.slug,
  features: [
    'XGBoost-based churn prediction model',
    'Real-time prediction API',
    'Feature importance visualization',
    'A/B testing framework',
    'Model drift monitoring'
  ]
});

await execute_tool('pm_generate_roadmap', {
  slug: project.project.slug
});

await execute_tool('pm_generate_architecture_doc', {
  slug: project.project.slug,
  techStack: [
    'ML: XGBoost, scikit-learn, pandas',
    'API: FastAPI, Pydantic',
    'Data: PostgreSQL, Redis',
    'Monitoring: MLflow, Prometheus',
    'Deployment: Docker, Kubernetes'
  ]
});

// Step 3: Create first sprint
const sprint = await execute_tool('pm_create_sprint', {
  projectSlug: project.project.slug,
  name: 'Sprint 1: Data Pipeline',
  goal: 'Build data ingestion and preprocessing pipeline',
  startDate: new Date().toISOString(),
  durationDays: 14
});

// Step 4: Create initial tasks
const tasks = [
  {
    title: 'Set up data warehouse connection',
    description: 'Configure PostgreSQL connection with customer data',
    type: 'task',
    priority: 'high'
  },
  {
    title: 'Implement feature engineering pipeline',
    description: 'Create reusable feature transformations',
    type: 'task',
    priority: 'high'
  },
  {
    title: 'Build data quality checks',
    description: 'Implement validation for incoming data',
    type: 'task',
    priority: 'medium'
  },
  {
    title: 'Design model training workflow',
    description: 'Define model training and validation process',
    type: 'story',
    priority: 'high'
  }
];

for (const task of tasks) {
  await execute_tool('pm_create_task', {
    projectSlug: project.project.slug,
    sprintId: sprint.sprint.id,
    ...task
  });
}

console.log('✅ Project fully initialized with documentation and tasks');
```

---

## 🎨 Interactive Widget Creation

### Scenario 4: Dynamic Dashboard for Sprint Monitoring

```typescript
/**
 * Agent Task: "Create a real-time dashboard for current sprint"
 * Agent Reasoning: Team needs visibility into sprint progress
 */

// Step 1: Get current sprint data
const project = await execute_tool('pm_get_project', {
  slug: 'customer-churn-prediction'
});

const sprints = await execute_tool('pm_list_sprints', {
  projectSlug: project.project.slug,
  status: 'active'
});

const activeSprint = sprints.sprints[0];

// Step 2: Get sprint tasks
const tasks = await execute_tool('pm_list_sprint_tasks', {
  projectSlug: project.project.slug,
  sprintId: activeSprint.id
});

// Step 3: Create dashboard widget
const dashboard = await execute_tool('create_widget', {
  templateId: 'dashboard',
  props: {
    title: `${activeSprint.name} Dashboard`,
    sprintId: activeSprint.id,
    projectSlug: project.project.slug,
    refreshInterval: 30000, // Update every 30 seconds
    panels: [
      {
        type: 'burndown-chart',
        title: 'Sprint Burndown',
        data: {
          totalStoryPoints: activeSprint.totalStoryPoints,
          remainingStoryPoints: activeSprint.remainingStoryPoints,
          idealBurndown: generateIdealBurndown(activeSprint)
        }
      },
      {
        type: 'task-list',
        title: 'In Progress Tasks',
        filter: 'in-progress',
        tasks: tasks.tasks.filter(t => t.status === 'in-progress')
      },
      {
        type: 'team-velocity',
        title: 'Team Velocity',
        historical: true,
        sprints: sprints.sprints.slice(-5)
      },
      {
        type: 'blockers',
        title: 'Blockers',
        tasks: tasks.tasks.filter(t => t.status === 'blocked')
      }
    ]
  },
  workflowId: 'sprint-monitoring'
});

// Step 4: Set up automatic updates
await execute_tool('send_widget_message', {
  instanceId: dashboard.instance.id,
  type: 'command',
  data: {
    action: 'enable-auto-refresh',
    interval: 30000
  }
});

console.log('✅ Sprint dashboard created and auto-updating');
```

---

## 🔄 Workflow Orchestration

### Scenario 5: Multi-Agent Code Review Pipeline

```typescript
/**
 * Agent Task: "Set up automated code review pipeline with multiple specialists"
 * Agent Reasoning: Different aspects need different expertise
 */

// Step 1: Define agent team
const reviewWorkflow = await execute_tool('execute_workflow', {
  workflowId: 'code-review-pipeline',
  name: 'Comprehensive Code Review',
  steps: [
    {
      id: 'find_changes',
      type: 'agent',
      config: {
        agentId: 'file-analyzer',
        prompt: 'Find all changed files in the last commit',
        tools: ['file_search', 'file_read', 'file_info']
      }
    },
    {
      id: 'parallel_reviews',
      type: 'parallel',
      config: {
        steps: [
          {
            id: 'security_review',
            type: 'agent',
            config: {
              agentId: 'security-specialist',
              prompt: 'Review code for security vulnerabilities',
              tools: ['file_grep', 'file_read']
            }
          },
          {
            id: 'performance_review',
            type: 'agent',
            config: {
              agentId: 'performance-specialist',
              prompt: 'Analyze code for performance issues',
              tools: ['file_grep', 'file_read']
            }
          },
          {
            id: 'style_review',
            type: 'agent',
            config: {
              agentId: 'style-specialist',
              prompt: 'Check code style and best practices',
              tools: ['file_grep', 'file_read']
            }
          }
        ],
        waitForAll: true
      }
    },
    {
      id: 'synthesize',
      type: 'agent_team',
      config: {
        prompt: 'Synthesize all reviews into actionable feedback',
        agents: [
          {
            id: 'synthesizer',
            role: 'Review Synthesizer',
            model: 'claude-4.5-sonnet',
            temperature: 0.3
          }
        ]
      }
    },
    {
      id: 'create_tasks',
      type: 'agent',
      config: {
        agentId: 'task-creator',
        prompt: 'Create tasks for each issue found',
        tools: ['pm_create_task']
      }
    },
    {
      id: 'generate_report',
      type: 'agent',
      config: {
        agentId: 'report-generator',
        prompt: 'Generate comprehensive review report',
        tools: ['file_write']
      }
    }
  ],
  input: {
    commitHash: 'HEAD',
    projectSlug: 'customer-churn-prediction'
  }
});

console.log('✅ Code review pipeline executed with multi-agent collaboration');
```

---

## 🧠 Self-Improvement Workflows

### Scenario 6: Agent Analyzes Its Own Performance

```typescript
/**
 * Agent Task: "Analyze my recent task completions and improve efficiency"
 * Agent Reasoning: I should optimize my workflows based on actual performance
 */

// Step 1: Get my recent task history
const myTasks = await execute_tool('list_tasks', {
  status: 'completed',
  sortBy: 'recently-completed'
});

// Step 2: Analyze execution times
const analysis = myTasks.tasks.map(task => ({
  taskId: task.id,
  name: task.name,
  duration: task.timer.elapsed,
  toolsUsed: task.metadata.toolsUsed || [],
  complexity: task.metadata.complexity || 'unknown'
}));

// Step 3: Identify patterns
const avgDuration = analysis.reduce((sum, t) => sum + t.duration, 0) / analysis.length;
const slowTasks = analysis.filter(t => t.duration > avgDuration * 1.5);

// Step 4: Generate improvement report
const improvements = [];

for (const task of slowTasks) {
  // Check if file operations could be parallelized
  const fileOps = task.toolsUsed.filter(t => t.startsWith('file_'));
  if (fileOps.length > 3) {
    improvements.push({
      taskType: task.name,
      suggestion: 'Parallelize file operations for faster execution',
      expectedSpeedup: '2-3x'
    });
  }
  
  // Check if MCP config changes were needed
  const mcpOps = task.toolsUsed.filter(t => t.startsWith('mcp_'));
  if (mcpOps.length > 0) {
    improvements.push({
      taskType: task.name,
      suggestion: 'Pre-configure MCP servers at project setup',
      expectedSpeedup: '30-50%'
    });
  }
}

// Step 5: Create optimization hook
const hookId = `optimization-${Date.now()}`;
await execute_tool('register_hook', {
  id: hookId,
  event: 'tool:before',
  handlerCode: `
    // Optimize file operations
    if (context.toolName === 'file_read' && context.batch) {
      return {
        type: 'parallel',
        operations: context.batch
      };
    }
  `,
  priority: 10
});

// Step 6: Document learnings
await execute_tool('file_write', {
  path: './agent-learnings/performance-optimization.md',
  content: `# Performance Optimization Learnings

## Analysis Date: ${new Date().toISOString()}

## Key Findings
- Average task duration: ${avgDuration}ms
- Slow tasks identified: ${slowTasks.length}

## Improvements Implemented
${improvements.map(i => 
  `### ${i.taskType}
- **Suggestion**: ${i.suggestion}
- **Expected Speedup**: ${i.expectedSpeedup}
`).join('\n')}

## New Optimization Hook
Hook ID: ${hookId}
Purpose: Automatically parallelize file operations

## Next Steps
1. Monitor performance after optimizations
2. A/B test with and without parallelization
3. Adjust based on results
`
});

console.log('✅ Performance analysis complete and optimizations applied');
```

---

## 🎓 Best Practices for Autonomous Agents

### 1. **Always Validate Tool Availability**

```typescript
// Before using a toolkit, check if it's enabled
const toolkits = await execute_tool('list_toolkits', {
  onlyEnabled: true
});

if (!toolkits.toolkits.find(t => t.id === 'file-operations')) {
  await execute_tool('enable_toolkit', {
    toolkitId: 'file-operations'
  });
}
```

### 2. **Use Error Handling and Retries**

```typescript
async function safeToolExecution(toolName, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await execute_tool(toolName, params);
      if (result.success) {
        return result;
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

### 3. **Document Your Actions**

```typescript
// Always log what you're doing and why
await execute_tool('file_append', {
  path: './agent-logs/actions.md',
  content: `
## ${new Date().toISOString()}
**Action**: Created project documentation
**Reason**: Project setup automation
**Tools Used**: pm_generate_readme, pm_generate_roadmap
**Result**: Success
**Next Steps**: Create initial sprint and tasks
`
});
```

### 4. **Use Widgets for Human Collaboration**

```typescript
// When decisions need human input, create approval widgets
const approvalWidget = await execute_tool('create_widget', {
  templateId: 'approval-form',
  props: {
    title: 'Approve Deployment to Production',
    description: 'All tests passed. Ready to deploy?',
    actions: ['approve', 'reject', 'request-changes'],
    metadata: {
      deploymentId: 'deploy-123',
      environment: 'production',
      changes: deploymentChanges
    }
  }
});

// Wait for human approval
const response = await execute_tool('wait_for', {
  handleId: approvalWidget.instance.id,
  timeoutMs: 3600000 // 1 hour
});

if (response.result.action === 'approve') {
  // Proceed with deployment
}
```

### 5. **Optimize Tool Chains**

```typescript
// Instead of sequential operations
// ❌ Slow
for (const file of files) {
  await execute_tool('file_read', { path: file });
}

// ✅ Fast - use workflow for parallelization
await execute_tool('execute_workflow', {
  workflowId: 'parallel-file-read',
  steps: [{
    id: 'read_files',
    type: 'parallel',
    config: {
      steps: files.map(file => ({
        id: `read-${file}`,
        type: 'agent',
        config: {
          tools: ['file_read'],
          prompt: `Read ${file}`
        }
      }))
    }
  }]
});
```

---

## 🚀 Advanced Patterns

### Pattern 1: Self-Healing Workflows

```typescript
/**
 * Agent creates a workflow that can recover from failures
 */
const resilientWorkflow = {
  workflowId: 'resilient-deployment',
  steps: [
    {
      id: 'deploy',
      type: 'try_catch',
      config: {
        tryStep: {
          type: 'agent',
          config: { /* deployment logic */ }
        },
        catchStep: {
          type: 'agent',
          config: {
            prompt: 'Deployment failed. Analyze error and attempt fix',
            tools: ['file_read', 'file_write', 'file_grep']
          }
        },
        finallyStep: {
          type: 'agent',
          config: {
            prompt: 'Log deployment attempt',
            tools: ['file_append']
          }
        }
      }
    }
  ]
};
```

### Pattern 2: Adaptive Tool Selection

```typescript
/**
 * Agent chooses tools based on context
 */
async function adaptiveTaskExecution(task) {
  const context = analyzeTask(task);
  
  const tools = [];
  
  if (context.requiresFiles) tools.push('file-operations');
  if (context.requiresGit) tools.push('mcp-config-management'); // Install git MCP
  if (context.requiresDocumentation) tools.push('project-management');
  if (context.requiresHumanInput) tools.push('widgets');
  
  // Enable needed toolkits
  for (const toolkit of tools) {
    await execute_tool('enable_toolkit', { toolkitId: toolkit });
  }
  
  // Execute task with optimal tool set
  return executeWithTools(task, tools);
}
```

### Pattern 3: Context Accumulation

```typescript
/**
 * Agent builds knowledge base over time
 */
class AgentKnowledgeBase {
  async learn(topic, information) {
    // Store learning
    await execute_tool('file_append', {
      path: './agent-knowledge/learned-patterns.md',
      content: `
## ${topic}
**Learned**: ${new Date().toISOString()}
${information}
---
`
    });
    
    // Create searchable index
    await execute_tool('file_write', {
      path: `./agent-knowledge/index/${topic}.json`,
      content: JSON.stringify({
        topic,
        timestamp: new Date().toISOString(),
        keywords: extractKeywords(information),
        related: findRelatedTopics(topic)
      }, null, 2)
    });
  }
  
  async recall(query) {
    // Search knowledge base
    const results = await execute_tool('file_grep', {
      pattern: query,
      filePattern: '**/*.md',
      cwd: './agent-knowledge',
      contextLines: 5
    });
    
    return synthesizeKnowledge(results.matches);
  }
}
```

---

## 📊 Measuring Agent Effectiveness

Agents should track their own performance:

```typescript
class AgentMetrics {
  async recordTaskExecution(taskId, metrics) {
    const record = {
      taskId,
      timestamp: new Date().toISOString(),
      duration: metrics.duration,
      toolsUsed: metrics.toolsUsed.length,
      tokensUsed: metrics.tokensUsed,
      success: metrics.success,
      errorRate: metrics.errors / metrics.totalOperations,
      humanInterventionsRequired: metrics.humanInterventions
    };
    
    // Store metrics
    await execute_tool('file_append', {
      path: './agent-metrics/execution-log.jsonl',
      content: JSON.stringify(record) + '\n',
      newline: false
    });
    
    // Update dashboard
    await execute_tool('update_widget_data', {
      instanceId: this.metricsWidgetId,
      data: {
        latestTask: record,
        averageTokens: calculateAverage('tokensUsed'),
        successRate: calculateSuccessRate()
      }
    });
  }
}
```

---

## 🎯 Conclusion

The Agents Platform enables truly autonomous AI agents by providing:

1. **Self-Configuration**: Agents install their own tools
2. **File System Access**: Read/write/search files safely
3. **Project Management**: Create and track complex projects
4. **Human Collaboration**: Interactive widgets for decisions
5. **Multi-Agent Teams**: Collaborative problem solving
6. **Self-Improvement**: Agents analyze and optimize themselves

**Key Principle**: Every tool is accessible. Every workflow is achievable. Every agent is autonomous.

---

## 🔗 Related Documentation

- [Feature Parity Report](./FEATURE_PARITY_REPORT.md)
- [Tool Registry](./docs/TOOL_REGISTRY.md)
- [Toolkit Development Guide](./docs/TOOLKIT_DEVELOPMENT.md)
- [Widget System Documentation](./docs/WIDGETS.md)

---

**The future is autonomous. The tools are ready. Let's build.** 🚀
