#!/usr/bin/env node
/**
 * Comprehensive Migration Script
 * Migrates agents, toolkits, MCP servers, collections, teams, and tools to persistent storage
 */

import { PersistentStorageManager, AgentTeam, Tool } from '../src/core/persistent-storage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationStats {
  agents: { total: number; success: number; errors: number };
  teams: { total: number; success: number; errors: number };
  skills: { total: number; success: number; errors: number };
  toolsets: { total: number; success: number; errors: number };
  tools: { total: number; success: number; errors: number };
  workflows: { total: number; success: number; errors: number };
  collections: { total: number; success: number; errors: number };
  mcpServers: { total: number; success: number; errors: number };
}

async function migrate() {
  console.log('='.repeat(70));
  console.log('  Comprehensive Migration: All Assets → Persistent Storage');
  console.log('='.repeat(70));
  console.log('');

  const stats: MigrationStats = {
    agents: { total: 0, success: 0, errors: 0 },
    teams: { total: 0, success: 0, errors: 0 },
    skills: { total: 0, success: 0, errors: 0 },
    toolsets: { total: 0, success: 0, errors: 0 },
    tools: { total: 0, success: 0, errors: 0 },
    workflows: { total: 0, success: 0, errors: 0 },
    collections: { total: 0, success: 0, errors: 0 },
    mcpServers: { total: 0, success: 0, errors: 0 },
  };

  try {
    // Initialize storage
    console.log('Initializing persistent storage...');
    const storage = new PersistentStorageManager();
    await storage.initialize();
    console.log('✓ Storage initialized\n');

    const rootPath = path.join(__dirname, '..');

    // ========================================================================
    // 1. MIGRATE AGENTS FROM COLLECTIONS
    // ========================================================================
    console.log('1. Migrating Agents from collections/');
    console.log('-'.repeat(70));

    const collectionsPath = path.join(rootPath, 'collections');
    const agentCollections = [
      'agent-workflows',
      'agent-performance-metrics',
      'automation',
      'business-agents',
      'creative-tools',
      'meta-agents',
      'research',
      'web-development',
    ];

    for (const collection of agentCollections) {
      try {
        const collectionPath = path.join(collectionsPath, collection);
        const exists = await fs.access(collectionPath).then(() => true).catch(() => false);
        
        if (!exists) continue;

        const files = await fs.readdir(collectionPath, { withFileTypes: true });
        
        for (const file of files) {
          if (file.isFile() && file.name.endsWith('.json')) {
            stats.agents.total++;
            try {
              const filePath = path.join(collectionPath, file.name);
              const data = await fs.readFile(filePath, 'utf-8');
              const agent = JSON.parse(data);

              // Determine category
              let category = 'custom';
              if (collection.includes('meta')) category = 'configured';
              if (agent.marketplace) category = 'marketplace';

              // Ensure required fields
              if (!agent.id) agent.id = file.name.replace('.json', '');
              if (!agent.version) agent.version = '1.0.0';

              await storage.saveAgent(agent, 'json', category);
              stats.agents.success++;
              console.log(`  ✓ ${agent.name || agent.id} → ${category}/`);
            } catch (err) {
              stats.agents.errors++;
              console.error(`  ✗ ${file.name}: ${err}`);
            }
          }
        }
      } catch (err) {
        console.error(`  ✗ Collection ${collection}: ${err}`);
      }
    }

    console.log('');

    // ========================================================================
    // 2. MIGRATE AGENT TEAMS
    // ========================================================================
    console.log('2. Migrating Agent Teams');
    console.log('-'.repeat(70));

    // Look for team definitions in various locations
    const teamSources = [
      path.join(rootPath, 'config', 'teams'),
      path.join(rootPath, 'collections', 'teams'),
    ];

    for (const teamSource of teamSources) {
      const exists = await fs.access(teamSource).then(() => true).catch(() => false);
      if (!exists) continue;

      const files = await fs.readdir(teamSource);
      for (const file of files) {
        if (file.endsWith('.json')) {
          stats.teams.total++;
          try {
            const filePath = path.join(teamSource, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const team = JSON.parse(data);

            if (!team.id) team.id = file.replace('.json', '');
            if (!team.version) team.version = '1.0.0';
            if (!team.mode) team.mode = 'linear';

            await storage.saveTeam(team as AgentTeam, 'active');
            stats.teams.success++;
            console.log(`  ✓ ${team.name || team.id}`);
          } catch (err) {
            stats.teams.errors++;
            console.error(`  ✗ ${file}: ${err}`);
          }
        }
      }
    }

    if (stats.teams.total === 0) {
      console.log('  No agent teams found');
    }
    console.log('');

    // ========================================================================
    // 3. MIGRATE SKILLS
    // ========================================================================
    console.log('3. Migrating Skills');
    console.log('-'.repeat(70));

    const skillsPath = path.join(collectionsPath, 'skills');
    const skillsExist = await fs.access(skillsPath).then(() => true).catch(() => false);

    if (skillsExist) {
      const walkSkills = async (dir: string, category: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await walkSkills(fullPath, category);
          } else if (entry.name.endsWith('.json')) {
            stats.skills.total++;
            try {
              const data = await fs.readFile(fullPath, 'utf-8');
              const skill = JSON.parse(data);

              if (!skill.id) skill.id = entry.name.replace('.json', '');
              if (!skill.version) skill.version = '1.0.0';
              if (!skill.rules) skill.rules = [];

              await storage.saveSkill(skill, 'user');
              stats.skills.success++;
              console.log(`  ✓ ${skill.name || skill.id}`);
            } catch (err) {
              stats.skills.errors++;
              console.error(`  ✗ ${entry.name}: ${err}`);
            }
          }
        }
      };

      await walkSkills(skillsPath, 'user');
    } else {
      console.log('  No skills found');
    }
    console.log('');

    // ========================================================================
    // 4. MIGRATE TOOLSETS
    // ========================================================================
    console.log('4. Migrating Toolsets from MCP Server');
    console.log('-'.repeat(70));

    // Check agent-platform MCP server toolkits
    const mcpServerPath = path.join(rootPath, 'agent-platform', 'mcp-server', 'src', 'toolkits');
    const mcpExists = await fs.access(mcpServerPath).then(() => true).catch(() => false);

    if (mcpExists) {
      const walkToolkits = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const toolkitPath = path.join(dir, entry.name);
            const indexPath = path.join(toolkitPath, 'index.ts');
            const indexExists = await fs.access(indexPath).then(() => true).catch(() => false);

            if (indexExists) {
              stats.toolsets.total++;
              try {
                // Read toolkit registration
                const indexContent = await fs.readFile(indexPath, 'utf-8');
                const nameMatch = indexContent.match(/name:\s*['"](.+)['"]/);
                const descMatch = indexContent.match(/description:\s*['"](.+)['"]/);

                const toolset = {
                  id: entry.name,
                  name: nameMatch ? nameMatch[1] : entry.name,
                  version: '1.0.0',
                  description: descMatch ? descMatch[1] : `Toolset: ${entry.name}`,
                  tools: [],
                  instructions: `See source code at agent-platform/mcp-server/src/toolkits/${entry.name}/`,
                  rules: [],
                  metadata: {
                    source: 'mcp-server',
                    path: `agent-platform/mcp-server/src/toolkits/${entry.name}`,
                  },
                };

                await storage.saveToolset(toolset, 'core');
                stats.toolsets.success++;
                console.log(`  ✓ ${toolset.name}`);
              } catch (err) {
                stats.toolsets.errors++;
                console.error(`  ✗ ${entry.name}: ${err}`);
              }
            }

            await walkToolkits(toolkitPath);
          }
        }
      };

      await walkToolkits(mcpServerPath);
    }

    if (stats.toolsets.total === 0) {
      console.log('  No toolsets found');
    }
    console.log('');

    // ========================================================================
    // 5. MIGRATE MCP TOOLS/SERVERS
    // ========================================================================
    console.log('5. Migrating MCP Server Configurations');
    console.log('-'.repeat(70));

    // Look for mcp.json files
    const mcpJsonPaths = [
      path.join(rootPath, 'config', 'mcp.json'),
      path.join(rootPath, 'voice-agent-livekit', 'mcp-servers.json'),
    ];

    for (const mcpJsonPath of mcpJsonPaths) {
      const exists = await fs.access(mcpJsonPath).then(() => true).catch(() => false);
      if (!exists) continue;

      try {
        const data = await fs.readFile(mcpJsonPath, 'utf-8');
        const mcpConfig = JSON.parse(data);

        if (mcpConfig.mcpServers) {
          for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
            stats.mcpServers.total++;
            try {
              const config = serverConfig as any;
              const tool: Tool = {
                id: `mcp-${serverName}`,
                name: serverName,
                version: '1.0.0',
                description: config.description || `MCP Server: ${serverName}`,
                type: 'remote-mcp',
                mcpServer: {
                  name: serverName,
                  command: config.command,
                  args: config.args || [],
                  env: config.env || {},
                },
                metadata: {
                  source: mcpJsonPath,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              await storage.saveTool(tool, 'remote-mcp');
              stats.mcpServers.success++;
              console.log(`  ✓ ${serverName} (MCP Server)`);
            } catch (err) {
              stats.mcpServers.errors++;
              console.error(`  ✗ ${serverName}: ${err}`);
            }
          }
        }
      } catch (err) {
        console.error(`  ✗ ${mcpJsonPath}: ${err}`);
      }
    }

    if (stats.mcpServers.total === 0) {
      console.log('  No MCP servers found');
    }
    console.log('');

    // ========================================================================
    // 6. MIGRATE WORKFLOWS
    // ========================================================================
    console.log('6. Migrating Workflows');
    console.log('-'.repeat(70));

    const workflowsPath = path.join(collectionsPath, 'agent-workflows');
    const workflowsExist = await fs.access(workflowsPath).then(() => true).catch(() => false);

    if (workflowsExist) {
      const files = await fs.readdir(workflowsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          stats.workflows.total++;
          try {
            const filePath = path.join(workflowsPath, file);
            const data = await fs.readFile(filePath, 'utf-8');
            const workflow = JSON.parse(data);

            if (!workflow.id) workflow.id = file.replace('.json', '');
            if (!workflow.version) workflow.version = '1.0.0';
            if (!workflow.steps) workflow.steps = [];

            await storage.saveWorkflow(workflow, 'active');
            stats.workflows.success++;
            console.log(`  ✓ ${workflow.name || workflow.id}`);
          } catch (err) {
            stats.workflows.errors++;
            console.error(`  ✗ ${file}: ${err}`);
          }
        }
      }
    }

    if (stats.workflows.total === 0) {
      console.log('  No workflows found');
    }
    console.log('');

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('='.repeat(70));
    console.log('Migration Summary:');
    console.log('='.repeat(70));

    const categories = ['agents', 'teams', 'skills', 'toolsets', 'tools', 'workflows', 'mcpServers'] as const;
    
    for (const category of categories) {
      const stat = stats[category];
      if (stat.total > 0) {
        console.log(`\n${category.toUpperCase()}:`);
        console.log(`  Total found:        ${stat.total}`);
        console.log(`  Successfully migrated: ${stat.success}`);
        if (stat.errors > 0) {
          console.log(`  Errors:             ${stat.errors}`);
        }
      }
    }

    console.log('');
    console.log('='.repeat(70));

    // Storage statistics
    console.log('\nStorage Statistics:');
    const storageStats = await storage.getStats();
    for (const [area, data] of Object.entries(storageStats.areas)) {
      const areaData = data as any;
      if (areaData.files > 0) {
        console.log(`  ${area.padEnd(20)} ${areaData.files} file(s), ${(areaData.size / 1024).toFixed(2)} KB`);
      }
    }
    console.log('');

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('✓ Migration complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Migration error:', error);
    process.exit(1);
  });
