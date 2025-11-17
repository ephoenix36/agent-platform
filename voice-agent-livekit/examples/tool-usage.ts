/**
 * Example: Tool Usage
 * Demonstrates MCP tool integration and function calling
 */

import { VoiceAgent, loadConfig, validateEnvironment } from '../src/index.js';

async function main() {
  console.log('Voice Agent - Tool Usage Example\n');
  
  try {
    validateEnvironment();
    const config = loadConfig();
    
    const agent = new VoiceAgent(config);
    await agent.initialize();
    console.log('✓ Agent initialized\n');
    
    // Listen for tool calls
    agent.on('tool.call.started', (event) => {
      console.log(`\n🔧 Tool called: ${event.toolName}`);
    });
    
    agent.on('tool.executed', (event: any) => {
      const status = event.success ? '✅' : '❌';
      console.log(`${status} Tool ${event.toolName} ${event.success ? 'completed' : 'failed'}`);
      if (!event.success) {
        console.log(`   Error: ${event.error}`);
      }
    });
    
    // Queries that should trigger tool usage
    const toolQueries = [
      'Create a new agent for customer support',
      'Search for information about TypeScript',
      'Execute a code generation task',
      'Deploy the latest version',
    ];
    
    for (const query of toolQueries) {
      console.log(`\nYou: ${query}`);
      console.log('Processing...');
      
      const startTime = Date.now();
      const response = await agent.processText(query);
      const latency = Date.now() - startTime;
      
      console.log(`\nAgent: ${response}`);
      console.log(`⏱️  Total time: ${latency}ms`);
      console.log('-'.repeat(60));
    }
    
    // Show statistics
    const stats = agent.getStats();
    console.log('\n📊 Final Statistics:');
    console.log(`  Available tools: ${stats.tools}`);
    console.log(`  Cache hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    
    await agent.shutdown();
    console.log('\n✓ Agent shutdown complete');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
