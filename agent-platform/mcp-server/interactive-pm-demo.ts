#!/usr/bin/env ts-node
// @ts-nocheck
/**
 * Interactive PM Tools Demo
 * 
 * Shows real-time tool invocations with visual output
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}╔${"═".repeat(title.length + 2)}╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║ ${title} ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚${"═".repeat(title.length + 2)}╝${colors.reset}\n`);
}

function parseResult(result: any) {
  if (!result?.content?.length) return {};
  try {
    return JSON.parse(result.content[0].text ?? "{}");
  } catch (error) {
    log(`Failed to parse: ${error}`, colors.red);
    return {};
  }
}

async function callTool(client: Client, name: string, args: any, description?: string) {
  if (description) {
    log(`${colors.gray}→ ${description}${colors.reset}`);
  }
  log(`${colors.yellow}📞 Calling: ${colors.bright}${name}${colors.reset}`, colors.yellow);
  log(`${colors.gray}   Args: ${JSON.stringify(args, null, 2).split('\n').join('\n   ')}${colors.reset}`);
  
  const start = Date.now();
  const result = await client.callTool({ name, arguments: args });
  const elapsed = Date.now() - start;
  
  const data = parseResult(result);
  log(`${colors.green}✓ Response (${elapsed}ms)${colors.reset}`);
  log(`${colors.gray}${JSON.stringify(data, null, 2).split('\n').slice(0, 15).join('\n')}${colors.reset}`);
  if (JSON.stringify(data).split('\n').length > 15) {
    log(`${colors.gray}   ... (truncated)${colors.reset}`);
  }
  console.log();
  return data;
}

async function main() {
  log(`${colors.bright}${colors.magenta}🎭 Interactive PM Tools Demo${colors.reset}\n`);
  log(`${colors.cyan}Launching MCP server...${colors.reset}`);

  const serverPath = path.join(__dirname, "build", "index.js");
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    cwd: __dirname,
  });

  const client = new Client(
    { name: "pm-interactive", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  log(`${colors.green}✓ Connected${colors.reset}\n`);

  try {
    // ===== SETUP =====
    section("Setup: List Available Toolkits");
    const toolkits = await callTool(client, "list_toolkits", {}, "Discovery: What toolkits are available?");
    const pmToolkit = toolkits.toolkits?.find((t: any) => t.id === "project-management");
    if (pmToolkit) {
      log(`${colors.green}✓ Found PM toolkit: ${pmToolkit.toolCount} tools${colors.reset}\n`);
    }

    // ===== CREATE PROJECT =====
    section("1. Create a New Project");
    const projectData = await callTool(
      client,
      "pm_create_project",
      {
        name: "AI Agent Demo",
        description: "Interactive demonstration of project management tools",
        owner: "demo-user",
        tags: ["demo", "interactive", "ai-agent"],
        sprintDuration: 7,
        timezone: "America/New_York",
        templateType: "nodejs",
        initializeTemplates: false,
      },
      "Creating a project for AI agent workflows..."
    );

    if (!projectData.project) {
      throw new Error("Project creation failed");
    }

    const projectSlug = projectData.project.slug;
    log(`${colors.bright}${colors.green}📁 Project created: ${projectSlug}${colors.reset}\n`);

    // ===== CREATE EPIC =====
    section("2. Create an Epic");
    const epicData = await callTool(
      client,
      "pm_create_epic",
      {
        projectSlug,
        name: "Core Agent Framework",
        objective: "Build foundational capabilities for autonomous agents",
        owner: "demo-user",
        priority: "critical",
        tags: ["architecture", "core"],
        successCriteria: [
          "Agent can self-configure tools",
          "Agent can plan multi-step workflows",
          "Agent can learn from feedback"
        ],
        metrics: {
          targetFeatures: 5,
          targetCompletion: 0.8
        }
      },
      "Defining high-level initiative..."
    );

    const epicSlug = epicData.epic.slug;
    log(`${colors.bright}${colors.blue}🎯 Epic created: ${epicSlug}${colors.reset}\n`);

    // ===== CREATE FEATURES =====
    section("3. Create Features");
    
    const feature1 = await callTool(
      client,
      "pm_create_feature",
      {
        projectSlug,
        epicRef: epicSlug,
        name: "Tool Discovery System",
        goal: "Enable agents to discover and load tools dynamically",
        owner: "demo-user",
        priority: "critical",
        tags: ["tooling", "discovery"],
        overview: {
          summary: "Runtime tool discovery and loading mechanism",
          motivation: "Agents need to adapt to new capabilities without redeployment",
          goals: ["List available toolkits", "Enable/disable tools on-demand", "Query tool capabilities"]
        },
        requirements: {
          functional: [
            "List all registered toolkits",
            "Filter toolkits by category",
            "Enable toolkit at runtime",
            "Provide tool usage examples"
          ],
          nonFunctional: [
            "Response time < 100ms for listing",
            "Zero-downtime tool loading",
            "Thread-safe toolkit registry"
          ]
        },
        acceptance: [
          "Agent can list toolkits without errors",
          "Agent can enable a toolkit and immediately use its tools",
          "Enabling conflicting toolkits raises clear errors"
        ]
      },
      "Feature 1: Tool discovery..."
    );

    const feature1Slug = feature1.feature.slug;
    log(`${colors.green}✓ Feature 1: ${feature1Slug}${colors.reset}\n`);

    const feature2 = await callTool(
      client,
      "pm_create_feature",
      {
        projectSlug,
        epicRef: epicSlug,
        name: "Memory & Context Management",
        goal: "Persistent context and learning across agent sessions",
        owner: "demo-user",
        priority: "high",
        tags: ["memory", "learning"],
        overview: {
          summary: "Long-term memory system for agent knowledge retention",
          goals: ["Store decisions", "Recall patterns", "Learn from feedback"]
        },
        requirements: {
          functional: ["Save decisions", "Query memory by tags", "Export memory snapshots"],
          nonFunctional: ["Memory persistence across restarts", "Fast recall (< 50ms)"]
        },
        acceptance: ["Agent remembers past decisions", "Memory survives restarts"]
      },
      "Feature 2: Memory system..."
    );

    const feature2Slug = feature2.feature.slug;
    log(`${colors.green}✓ Feature 2: ${feature2Slug}${colors.reset}\n`);

    // ===== CREATE TASKS =====
    section("4. Create Tasks for Feature 1");

    const task1 = await callTool(
      client,
      "pm_create_task",
      {
        projectSlug,
        title: "Implement toolkit registry API",
        description: "Create core registry class with CRUD operations for toolkits",
        type: "feature",
        priority: "critical",
        assignee: "dev-alice",
        points: 5,
        complexity: "medium",
        acceptanceCriteria: [
          "ToolkitManager class created",
          "Register/unregister methods work",
          "List toolkits returns correct data",
          "Unit tests pass"
        ],
        tags: ["backend", "api"],
        featureRef: feature1Slug,
        epicRef: epicSlug,
      },
      "Task 1: Build the registry..."
    );

    log(`${colors.green}✓ Task ${task1.task.number} created${colors.reset}\n`);

    const task2 = await callTool(
      client,
      "pm_create_task",
      {
        projectSlug,
        title: "Add runtime toolkit loading",
        description: "Enable/disable toolkits dynamically without server restart",
        type: "feature",
        priority: "high",
        assignee: "dev-bob",
        points: 8,
        complexity: "high",
        acceptanceCriteria: [
          "enable_toolkit tool works",
          "disable_toolkit tool works",
          "Dependencies resolved automatically",
          "No memory leaks on repeated load/unload"
        ],
        tags: ["backend", "runtime"],
        featureRef: feature1Slug,
        epicRef: epicSlug,
      },
      "Task 2: Dynamic loading..."
    );

    log(`${colors.green}✓ Task ${task2.task.number} created${colors.reset}\n`);

    const task3 = await callTool(
      client,
      "pm_create_task",
      {
        projectSlug,
        title: "Design toolkit manifest schema",
        description: "Define JSON schema for toolkit metadata and configuration",
        type: "design",
        priority: "high",
        assignee: "dev-alice",
        points: 3,
        complexity: "low",
        acceptanceCriteria: [
          "Schema documented",
          "Example manifests created",
          "Validation logic implemented"
        ],
        tags: ["design", "schema"],
        featureRef: feature1Slug,
        epicRef: epicSlug,
      },
      "Task 3: Schema design..."
    );

    log(`${colors.green}✓ Task ${task3.task.number} created${colors.reset}\n`);

    // ===== QUERY & UPDATE =====
    section("5. Query Feature Progress");

    const progress = await callTool(
      client,
      "pm_get_feature_progress",
      { projectSlug, featureRef: feature1Slug },
      "Checking Feature 1 completion..."
    );

    log(`${colors.bright}Progress: ${(progress.progress.progress * 100).toFixed(1)}%${colors.reset}`);
    log(`  Total tasks: ${progress.progress.totalTasks}`);
    log(`  Completed: ${progress.progress.completedTasks}`);
    log(`  In progress: ${progress.progress.inProgressTasks}\n`);

    // ===== LIST TASKS =====
    section("6. List Tasks by Feature");

    const tasks = await callTool(
      client,
      "pm_list_tasks",
      { projectSlug, featureRef: feature1Slug },
      "All tasks for Feature 1..."
    );

    log(`${colors.bright}Found ${tasks.total} tasks:${colors.reset}`);
    tasks.tasks.forEach((t: any, i: number) => {
      log(`  ${i + 1}. ${t.number} - ${t.title} [${t.status}]`, colors.yellow);
    });
    console.log();

    // ===== UPDATE TASK =====
    section("7. Update Task Status");

    await callTool(
      client,
      "pm_update_task",
      {
        projectSlug,
        taskId: task1.task.id,
        status: "in-progress",
        assignee: "dev-alice"
      },
      "Moving task to in-progress..."
    );

    log(`${colors.green}✓ Task ${task1.task.number} now in-progress${colors.reset}\n`);

    // ===== CHECK UPDATED PROGRESS =====
    section("8. Re-check Feature Progress");

    const updatedProgress = await callTool(
      client,
      "pm_get_feature_progress",
      { projectSlug, featureRef: feature1Slug },
      "Progress after status update..."
    );

    log(`${colors.bright}Updated Progress: ${(updatedProgress.progress.progress * 100).toFixed(1)}%${colors.reset}`);
    log(`  In progress: ${updatedProgress.progress.inProgressTasks} task(s)\n`);

    // ===== LIST ALL EPICS =====
    section("9. List All Epics");

    const epics = await callTool(
      client,
      "pm_list_epics",
      { projectSlug },
      "View all epics in project..."
    );

    log(`${colors.bright}Found ${epics.total} epic(s):${colors.reset}`);
    epics.epics.forEach((e: any) => {
      log(`  🎯 ${e.name} [${e.status}]`, colors.blue);
      log(`     Owner: ${e.owner} | Priority: ${e.priority}`, colors.gray);
      log(`     Features: ${e.stats.totalFeatures} (${e.stats.completedFeatures} complete)`, colors.gray);
    });
    console.log();

    // ===== LIST ALL FEATURES =====
    section("10. List All Features");

    const features = await callTool(
      client,
      "pm_list_features",
      { projectSlug, epicRef: epicSlug },
      "All features under epic..."
    );

    log(`${colors.bright}Found ${features.total} feature(s):${colors.reset}`);
    features.features.forEach((f: any) => {
      log(`  💡 ${f.name} [${f.status}]`, colors.green);
      log(`     Priority: ${f.priority} | Owner: ${f.owner || "unassigned"}`, colors.gray);
      log(`     Tasks: ${f.stats.totalTasks} total, ${f.stats.completedTasks} complete`, colors.gray);
    });
    console.log();

    // ===== FINAL SUMMARY =====
    section("✅ Demo Complete");

    log(`${colors.bright}Summary:${colors.reset}`);
    log(`  📁 Project: ${projectSlug}`);
    log(`  🎯 Epic: ${epicSlug}`);
    log(`  💡 Features: 2`);
    log(`  📝 Tasks: 3`);
    log(`  ⚡ All operations successful!\n`);

    log(`${colors.cyan}All PM tools exercised successfully through MCP protocol!${colors.reset}\n`);

  } catch (error) {
    log(`${colors.red}❌ Error: ${error}${colors.reset}`);
    console.error(error);
  } finally {
    await client.close();
    log(`${colors.gray}Connection closed${colors.reset}`);
  }
}

main().catch(console.error);
