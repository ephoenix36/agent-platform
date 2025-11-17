#!/usr/bin/env node
/**
 * Test MCP server integration with persistent storage
 */

import { PersistentStorageManager } from '../src/core/persistent-storage.js';

async function testIntegration() {
  console.log('Testing Persistent Storage Integration');
  console.log('='.repeat(70));
  console.log('');

  const storage = new PersistentStorageManager();
  await storage.initialize();

  // Test 1: List migrated agents
  console.log('1. Listing Migrated Agents');
  console.log('-'.repeat(70));
  const agents = await storage.listAgents('custom');
  console.log(`Found ${agents.length} custom agents`);
  agents.slice(0, 5).forEach(agent => {
    console.log(`  • ${agent.name} (${agent.id})`);
  });
  console.log('');

  // Test 2: List toolsets
  console.log('2. Listing Migrated Toolsets');
  console.log('-'.repeat(70));
  const toolsets = await storage.listToolsets('core');
  console.log(`Found ${toolsets.length} core toolsets`);
  toolsets.slice(0, 5).forEach(toolset => {
    console.log(`  • ${toolset.name} (${toolset.id})`);
  });
  console.log('');

  // Test 3: List MCP tools
  console.log('3. Listing MCP Server Tools');
  console.log('-'.repeat(70));
  const tools = await storage.listTools('remote-mcp', 'remote-mcp');
  console.log(`Found ${tools.length} MCP server tools`);
  tools.forEach(tool => {
    console.log(`  • ${tool.name}: ${tool.description}`);
    console.log(`    Command: ${tool.mcpServer?.command} ${tool.mcpServer?.args?.join(' ')}`);
  });
  console.log('');

  // Test 4: List workflows
  console.log('4. Listing Migrated Workflows');
  console.log('-'.repeat(70));
  const workflows = await storage.listWorkflows('active');
  console.log(`Found ${workflows.length} active workflows`);
  workflows.slice(0, 5).forEach(workflow => {
    console.log(`  • ${workflow.name} (${workflow.steps?.length || 0} steps)`);
  });
  console.log('');

  // Test 5: Create a sample team
  console.log('5. Creating Sample Agent Team');
  console.log('-'.repeat(70));
  await storage.saveTeam({
    id: 'test-research-team',
    name: 'Test Research Team',
    version: '1.0.0',
    description: 'A test team for research tasks',
    mode: 'linear',
    agents: [
      { id: 'research-agent', role: 'Primary researcher' },
      { id: 'analyst-agent', role: 'Data analyst' },
      { id: 'writer-agent', role: 'Report writer' }
    ],
    skills: ['web-research'],
    metadata: { created_by: 'test-script' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, 'templates');
  console.log('✓ Sample team created: test-research-team');
  console.log('');

  // Test 6: Create a sample skill with all links
  console.log('6. Creating Sample Skill with Links');
  console.log('-'.repeat(70));
  await storage.saveSkill({
    id: 'test-comprehensive-skill',
    name: 'Test Comprehensive Skill',
    version: '1.0.0',
    description: 'A test skill demonstrating all link types',
    toolkits: ['agent-development', 'file-operations'],
    systemInstructions: 'Test instructions for comprehensive skill',
    rules: [
      'Always test thoroughly',
      'Document all changes',
      'Follow best practices'
    ],
    agents: ['test-agent'],
    teams: ['test-research-team'],
    projects: ['test-project'],
    databases: ['test-db'],
    collections: ['test-collection'],
    metadata: { created_by: 'test-script' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, 'templates');
  console.log('✓ Sample skill created with links:');
  console.log('  - Agents: test-agent');
  console.log('  - Teams: test-research-team');
  console.log('  - Projects: test-project');
  console.log('  - Databases: test-db');
  console.log('  - Collections: test-collection');
  console.log('');

  // Test 7: Storage statistics
  console.log('7. Storage Statistics');
  console.log('-'.repeat(70));
  const stats = await storage.getStats();
  console.log(`Root: ${stats.root}`);
  console.log('Asset counts:');
  for (const [area, data] of Object.entries(stats.areas)) {
    const areaData = data as any;
    if (areaData.files > 0) {
      console.log(`  ${area.padEnd(20)} ${areaData.files} file(s), ${(areaData.size / 1024).toFixed(2)} KB`);
    }
  }
  console.log('');

  console.log('='.repeat(70));
  console.log('✓ All tests passed!');
  console.log('='.repeat(70));
}

testIntegration().catch(console.error);
