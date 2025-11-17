#!/usr/bin/env ts-node
// @ts-nocheck
/**
 * Project Management Toolkit Smoke Test
 *
 * Spins up the MCP server, enables the project-management toolkit (if needed),
 * then exercises the core pm_* tools end-to-end: project → epic → feature → task.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

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
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function parseResult(result: any) {
  if (!result?.content?.length) {
    return {};
  }
  try {
    return JSON.parse(result.content[0].text ?? "{}");
  } catch (error) {
    log(`Failed to parse tool response: ${error}`, colors.red);
    return {};
  }
}

async function main() {
  log(`${colors.bright}🧪 Project Management Toolkit Smoke Test${colors.reset}`);

  const serverPath = path.join(__dirname, "build", "index.js");
  log(`${colors.cyan}Using server binary at: ${serverPath}${colors.reset}`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    cwd: __dirname,
  });

  const client = new Client(
    {
      name: "pm-demo-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  log(`${colors.green}✓ Connected to MCP server${colors.reset}`);

  try {
    const toolkitEnable = parseResult(
      await client.callTool({
        name: "enable_toolkit",
        arguments: { toolkitId: "project-management" },
      })
    );
    if (toolkitEnable?.success) {
      log(`${colors.green}✓ project-management toolkit enabled (toolCount=${toolkitEnable.toolCount})${colors.reset}`);
    } else {
      log(`${colors.yellow}ℹ project-management toolkit already active${colors.reset}`);
    }

    const uniqueId = Date.now();
    const projectName = `Demo PM Project ${uniqueId}`;

    const projectCreate = parseResult(
      await client.callTool({
        name: "pm_create_project",
        arguments: {
          name: projectName,
          description: "Smoke-test project for pm toolkit",
          owner: "pm-demo",
          tags: ["demo", "automation"],
          sprintDuration: 14,
          timezone: "UTC",
          templateType: "nodejs",
          initializeTemplates: false,
        },
      })
    );

    if (!projectCreate?.project) throw new Error("Project creation failed");
    const projectSlug = projectCreate.project.slug;
    log(`${colors.green}✓ Created project ${projectSlug}${colors.reset}`);

    const epicCreate = parseResult(
      await client.callTool({
        name: "pm_create_epic",
        arguments: {
          projectSlug,
          name: `Demo Epic ${uniqueId}`,
          objective: "Validate pm toolchain",
          owner: "pm-demo",
          priority: "high",
          tags: ["demo"],
          successCriteria: ["feature shipped"],
        },
      })
    );
    if (!epicCreate?.epic) throw new Error("Epic creation failed");
    const epicSlug = epicCreate.epic.slug;
    log(`${colors.green}✓ Created epic ${epicSlug}${colors.reset}`);

    const featureCreate = parseResult(
      await client.callTool({
        name: "pm_create_feature",
        arguments: {
          projectSlug,
          epicRef: epicSlug,
          name: `Demo Feature ${uniqueId}`,
          goal: "Demonstrate project hierarchy",
          owner: "pm-demo",
          tags: ["demo"],
          overview: {
            summary: "End-to-end project hierarchy validation",
            goals: ["project", "epic", "feature", "task"],
          },
          requirements: {
            functional: ["link task to feature"],
            nonFunctional: ["run via script"],
          },
          acceptance: ["Feature progress shows linked task"],
        },
      })
    );
    if (!featureCreate?.feature) throw new Error("Feature creation failed");
    const featureSlug = featureCreate.feature.slug;
    log(`${colors.green}✓ Created feature ${featureSlug}${colors.reset}`);

    const taskCreate = parseResult(
      await client.callTool({
        name: "pm_create_task",
        arguments: {
          projectSlug,
          title: "Implement smoke-test task",
          description: "Linking task to newly created feature",
          type: "feature",
          priority: "medium",
          assignee: "pm-demo-assignee",
          points: 3,
          complexity: "medium",
          acceptanceCriteria: ["Task linked to feature"],
          tags: ["demo"],
          labels: ["automation"],
          epicRef: epicSlug,
          featureRef: featureSlug,
        },
      })
    );
    if (!taskCreate?.task) throw new Error("Task creation failed");
    const taskId = taskCreate.task.id;
    log(`${colors.green}✓ Created task ${taskCreate.task.number}${colors.reset}`);

    const tasksForFeature = parseResult(
      await client.callTool({
        name: "pm_list_tasks",
        arguments: {
          projectSlug,
          featureRef: featureSlug,
        },
      })
    );
    log(`${colors.green}✓ Retrieved ${tasksForFeature.total} task(s) for feature${colors.reset}`);

    const featureProgress = parseResult(
      await client.callTool({
        name: "pm_get_feature_progress",
        arguments: {
          projectSlug,
          featureRef: featureSlug,
        },
      })
    );
    log(`${colors.green}✓ Feature progress: ${(featureProgress.progress?.progress * 100 || 0).toFixed(1)}% complete${colors.reset}`);

    const epicsList = parseResult(
      await client.callTool({
        name: "pm_list_epics",
        arguments: {
          projectSlug,
        },
      })
    );
    log(`${colors.green}✓ Epics listed: ${epicsList.total}${colors.reset}`);

    const featuresList = parseResult(
      await client.callTool({
        name: "pm_list_features",
        arguments: {
          projectSlug,
          epicRef: epicSlug,
        },
      })
    );
    log(`${colors.green}✓ Features for epic: ${featuresList.total}${colors.reset}`);

    log(`\n${colors.bright}${colors.blue}Summary${colors.reset}`);
    log(`  • Project slug: ${projectSlug}`);
    log(`  • Epic slug: ${epicSlug}`);
    log(`  • Feature slug: ${featureSlug}`);
    log(`  • Task ID: ${taskId}`);
    log(`  • Tasks linked: ${tasksForFeature.total}`);
  } catch (error) {
    log(`${colors.red}❌ Smoke test failed: ${error}${colors.reset}`);
    throw error;
  } finally {
    await client.close();
    log(`${colors.cyan}Connection closed${colors.reset}`);
  }
}

main().catch((error) => {
  log(`${colors.red}Unhandled error: ${error}${colors.reset}`);
  console.error(error);
  process.exit(1);
});
