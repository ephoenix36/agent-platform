/**
 * Project Management Skill Definition
 * 
 * Comprehensive project management skill with instructions, rules, and best practices.
 * Built on top of the project-management toolkit.
 */

import { Skill, SkillRule, SkillInstructions } from '../../types/skill.js';

/**
 * Project management instructions
 */
const projectManagementInstructions: SkillInstructions = {
  overview: `
This skill provides comprehensive project, sprint, and task management capabilities following Agile/Scrum methodology.
It enables structured project planning, sprint-based execution, task tracking, and documentation management.

The system supports:
- Projects: High-level containers for work with goals, scope, and milestones
- Sprints: Time-boxed iterations (typically 1-4 weeks) for executing project work
- Tasks: Atomic units of work with status tracking, assignments, and dependencies
- Documentation: Structured documents for requirements, designs, and notes
- Memory: Knowledge retention across projects and sprints
`,

  usage: `
## Project Lifecycle
1. Create a project with clear goals and scope
2. Break down work into manageable sprints
3. Define tasks within each sprint
4. Execute sprints, tracking task progress
5. Complete sprints and review outcomes
6. Document learnings and best practices

## Sprint Management
- Create sprints with specific goals and timeframes
- Assign tasks to sprints based on priority and capacity
- Start sprints to begin execution
- Update task status throughout the sprint
- Complete sprints with retrospectives

## Task Management
- Create tasks with clear descriptions and acceptance criteria
- Set priorities: critical, high, medium, low
- Assign tasks to team members
- Track dependencies between tasks
- Update status: not-started → in-progress → completed
- Add comments for collaboration

## Documentation
- Create structured documents for:
  - Requirements and specifications
  - Technical designs and architecture
  - Meeting notes and decisions
  - Retrospectives and learnings
- Link documents to projects, sprints, and tasks
- Version control for documentation

## Memory Management
- Store key learnings and decisions
- Create reusable templates
- Track patterns and anti-patterns
- Build organizational knowledge base
`,

  examples: [
    `
Example 1: Creating a new project
\`\`\`
create_project({
  name: "E-commerce Platform",
  description: "Build a scalable e-commerce platform with React and Node.js",
  goals: [
    "Launch MVP in 3 months",
    "Support 10,000 concurrent users",
    "Integrate with Stripe for payments"
  ],
  scope: {
    inScope: ["Product catalog", "Shopping cart", "Checkout", "User accounts"],
    outOfScope: ["Mobile apps", "Inventory management", "Shipping integration"]
  }
})
\`\`\`
`,
    `
Example 2: Planning a sprint
\`\`\`
create_sprint({
  projectId: "e-commerce-platform",
  name: "Sprint 1: Core Infrastructure",
  goal: "Set up development environment and basic architecture",
  startDate: "2025-11-08",
  endDate: "2025-11-22",
  capacity: {
    developers: 3,
    hoursPerWeek: 120
  }
})
\`\`\`
`,
    `
Example 3: Creating and managing tasks
\`\`\`
// Create task
create_task({
  projectId: "e-commerce-platform",
  sprintId: "sprint-1",
  title: "Set up React app with TypeScript",
  description: "Initialize React project with TypeScript configuration",
  type: "technical",
  priority: "high",
  complexity: "medium",
  estimatedHours: 4,
  assignee: "developer@example.com"
})

// Update task status
update_task({
  projectId: "e-commerce-platform",
  taskId: "TASK-001",
  updates: {
    status: "in-progress",
    progress: 50
  }
})

// Complete task
update_task({
  projectId: "e-commerce-platform",
  taskId: "TASK-001",
  updates: {
    status: "completed",
    progress: 100,
    actualHours: 3.5
  }
})
\`\`\`
`,
    `
Example 4: Sprint completion and retrospective
\`\`\`
complete_sprint({
  projectId: "e-commerce-platform",
  sprintId: "sprint-1",
  outcomes: {
    goalsAchieved: ["Dev environment set up", "Basic architecture defined"],
    metrics: {
      velocityPoints: 21,
      tasksCompleted: 8,
      tasksCarriedOver: 2
    }
  },
  retrospective: {
    whatWentWell: ["Good team communication", "Clear task definitions"],
    whatCanImprove: ["Better time estimates", "More frequent standups"],
    actionItems: ["Set up daily standup schedule", "Create estimation guide"]
  }
})
\`\`\`
`
  ],

  bestPractices: [
    "Break down large tasks into smaller, actionable items (ideally < 1 day)",
    "Write clear acceptance criteria for each task",
    "Set realistic sprint goals based on team capacity",
    "Conduct daily standups to track progress and blockers",
    "Hold sprint retrospectives to continuously improve",
    "Document key decisions and learnings immediately",
    "Use task dependencies to sequence work properly",
    "Keep projects and sprints focused with clear scope",
    "Update task status frequently to maintain visibility",
    "Add comments to tasks for collaboration and context",
    "Track actual vs estimated hours to improve estimations",
    "Use memory system to capture reusable patterns",
    "Create templates for common task types",
    "Link documentation to relevant tasks and sprints",
    "Review and archive completed projects periodically"
  ],

  warnings: [
    "Don't overload sprints - leave buffer for unexpected work",
    "Avoid changing sprint goals mid-sprint",
    "Don't create tasks that are too large (> 2 days)",
    "Avoid circular task dependencies",
    "Don't skip retrospectives - they're crucial for improvement",
    "Avoid working on tasks not in the current sprint",
    "Don't create sprints without clear goals",
    "Avoid assigning tasks to people without checking capacity",
    "Don't forget to update task status regularly",
    "Avoid creating projects without defined scope",
    "Don't ignore blockers - escalate them immediately",
    "Avoid documentation debt - document as you go"
  ],

  prerequisites: [
    "Understanding of Agile/Scrum methodology",
    "Familiarity with project management concepts",
    "Knowledge of task breakdown and estimation",
    "Experience with collaborative development",
    "Understanding of software development lifecycle"
  ]
};

/**
 * Project management rules
 */
const projectManagementRules: SkillRule[] = [
  {
    id: "project-naming",
    description: "Project names must be clear, concise, and descriptive (3-50 characters)",
    priority: 10,
    enabled: true
  },
  {
    id: "sprint-duration",
    description: "Sprints should be 1-4 weeks in duration (preferably 2 weeks)",
    priority: 9,
    enabled: true
  },
  {
    id: "task-size",
    description: "Tasks should be completable in 1 day or less (max 2 days)",
    priority: 10,
    enabled: true
  },
  {
    id: "task-acceptance-criteria",
    description: "Every task must have clear acceptance criteria",
    priority: 8,
    enabled: true
  },
  {
    id: "sprint-goal",
    description: "Every sprint must have a clear, measurable goal",
    priority: 9,
    enabled: true
  },
  {
    id: "status-updates",
    description: "Task status must be updated at least daily during active sprints",
    priority: 7,
    enabled: true
  },
  {
    id: "dependency-tracking",
    description: "Task dependencies must be explicitly defined and tracked",
    priority: 8,
    enabled: true
  },
  {
    id: "retrospective-required",
    description: "Every completed sprint must have a retrospective",
    priority: 9,
    enabled: true
  },
  {
    id: "documentation-linking",
    description: "All design and requirement documents must be linked to tasks",
    priority: 7,
    enabled: true
  },
  {
    id: "scope-definition",
    description: "Projects must have clearly defined in-scope and out-of-scope items",
    priority: 8,
    enabled: true
  },
  {
    id: "capacity-planning",
    description: "Sprint capacity must be defined based on team availability",
    priority: 8,
    enabled: true
  },
  {
    id: "priority-assignment",
    description: "All tasks must have an assigned priority level",
    priority: 7,
    enabled: true
  },
  {
    id: "blocker-escalation",
    description: "Blocked tasks must be escalated within 24 hours",
    priority: 10,
    enabled: true
  },
  {
    id: "estimation-tracking",
    description: "Track actual vs estimated hours to improve future estimations",
    priority: 6,
    enabled: true
  },
  {
    id: "memory-capture",
    description: "Capture key learnings and decisions in memory system",
    priority: 7,
    enabled: true
  }
];

/**
 * System prompt for project management
 */
const projectManagementSystemPrompt = `
You are a project management specialist with expertise in Agile/Scrum methodology.
Your role is to help plan, organize, and track software development projects.

Key responsibilities:
1. Create well-structured projects with clear goals and scope
2. Plan sprints with realistic goals and capacity
3. Break down work into manageable, actionable tasks
4. Track progress and identify blockers early
5. Facilitate effective sprint retrospectives
6. Maintain comprehensive documentation
7. Build reusable knowledge and templates

Always follow project management best practices:
- Keep tasks small and focused
- Write clear acceptance criteria
- Track dependencies explicitly
- Update status frequently
- Document decisions and learnings
- Conduct thorough retrospectives

When creating tasks:
- Use descriptive titles (not generic)
- Specify type, priority, and complexity
- Provide clear description and acceptance criteria
- Set realistic time estimates
- Define dependencies if applicable

When planning sprints:
- Set clear, measurable goals
- Consider team capacity
- Balance priorities and dependencies
- Leave buffer for unexpected work

Remember: The goal is sustainable, predictable delivery with continuous improvement.
`;

/**
 * Complete project management skill definition
 */
export const projectManagementSkill: Skill = {
  id: "project-management",
  name: "Project Management (Agile/Scrum)",
  description: "Comprehensive project, sprint, and task management following Agile/Scrum methodology with documentation and memory management",
  
  config: {
    toolkits: ["project-management"],
    instructions: projectManagementInstructions,
    rules: projectManagementRules,
    systemPrompt: projectManagementSystemPrompt,
    autoLoad: true,
    
    validators: [
      {
        type: "pre-execution",
        code: `
// Validate sprint is active before creating tasks
function validateActiveSprintForTask(params) {
  if (params.sprintId) {
    const sprint = getSprint(params.projectId, params.sprintId);
    if (sprint.status !== 'active') {
      throw new Error('Cannot create task for inactive sprint. Start the sprint first.');
    }
  }
  return true;
}
        `,
        message: "Validation failed: Check sprint status before task creation"
      },
      {
        type: "parameter",
        code: `
// Validate task size
function validateTaskSize(params) {
  if (params.estimatedHours && params.estimatedHours > 16) {
    throw new Error('Task is too large (>2 days). Break it down into smaller tasks.');
  }
  return true;
}
        `,
        message: "Validation failed: Task size exceeds maximum (16 hours)"
      }
    ]
  },
  
  metadata: {
    author: "Agent Platform Team",
    created: "2025-11-07",
    updated: "2025-11-07",
    version: "1.0.0",
    tags: ["project-management", "agile", "scrum", "sprints", "tasks", "documentation"],
    category: "project-management",
    homepage: "https://github.com/agent-platform/mcp-server",
    documentation: "https://github.com/agent-platform/mcp-server/docs/skills/project-management.md",
    license: "MIT"
  },
  
  enabled: true,
  loaded: false
};

/**
 * Export as a function to create the skill
 */
export function createProjectManagementSkill(): Skill {
  return projectManagementSkill;
}
