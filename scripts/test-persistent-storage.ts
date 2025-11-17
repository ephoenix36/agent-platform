#!/usr/bin/env node
/**
 * Quick test: Save test agent to persistent storage
 */

import { PersistentStorageManager } from '../src/core/persistent-storage.js';

async function saveTestAgent() {
  console.log('Initializing persistent storage...');
  const storage = new PersistentStorageManager();
  await storage.initialize();
  console.log('✓ Storage initialized\n');

  // The test agent we created earlier
  const testAgent = {
    id: 'test-agent',
    name: 'Test Agent',
    version: '1.0.0',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0,
    systemPrompt: `You are a test agent designed to demonstrate agent capabilities. Your role is to:

1. Process user requests efficiently
2. Provide clear, structured responses
3. Demonstrate the agent system's functionality

You have access to file operations and other tools. Be helpful, accurate, and concise in your responses.`,
    toolkits: ['agent-development', 'file-operations'],
    skills: [],
    metadata: {
      category: 'test',
      author: 'system',
      purpose: 'demonstration'
    }
  };

  console.log('Saving test agent...');
  await storage.saveAgent(testAgent, 'json', 'configured');
  console.log('✓ Test agent saved to: ~/.agents/agents/configured/test-agent.json\n');

  // Also save as markdown
  console.log('Saving test agent (markdown format)...');
  await storage.saveAgent(testAgent, 'markdown', 'configured');
  console.log('✓ Test agent saved to: ~/.agents/agents/configured/test-agent.md\n');

  // List all agents
  console.log('Listing all agents:');
  const agents = await storage.listAgents();
  console.log(`Found ${agents.length} agent(s):`);
  agents.forEach(agent => {
    console.log(`  - ${agent.name} (${agent.id}) [${agent._format}]`);
  });
  console.log('');

  // Get statistics
  console.log('Storage statistics:');
  const stats = await storage.getStats();
  console.log(`Root: ${stats.root}`);
  console.log('Areas:');
  for (const [area, data] of Object.entries(stats.areas)) {
    if (data.files > 0) {
      console.log(`  ${area.padEnd(20)} ${data.files} file(s), ${(data.size / 1024).toFixed(2)} KB`);
    }
  }
  console.log('');

  console.log('✓ Test complete!');
}

saveTestAgent().catch(console.error);
