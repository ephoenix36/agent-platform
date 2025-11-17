/**
 * Example: Basic Usage
 * Demonstrates simple text-based interaction with the voice agent
 */

import { VoiceAgent, loadConfig, validateEnvironment } from '../src/index.js';

async function main() {
  console.log('Voice Agent - Basic Usage Example\n');
  
  try {
    // Validate environment variables
    validateEnvironment();
    
    // Load configuration
    const config = loadConfig();
    console.log(`✓ Configuration loaded`);
    console.log(`  Agent: ${config.name}`);
    console.log(`  Model: ${config.gemini.model}\n`);
    
    // Create agent
    const agent = new VoiceAgent(config);
    
    // Initialize
    console.log('Initializing agent...');
    await agent.initialize();
    console.log('✓ Agent initialized\n');
    
    // Simple conversation
    const queries = [
      'Hello!',
      'What can you help me with?',
      'Tell me about yourself',
      'Thank you!',
    ];
    
    for (const query of queries) {
      console.log(`You: ${query}`);
      
      const startTime = Date.now();
      const response = await agent.processText(query);
      const latency = Date.now() - startTime;
      
      console.log(`Agent: ${response}`);
      console.log(`(${latency}ms)\n`);
    }
    
    // Show statistics
    const stats = agent.getStats();
    console.log('Statistics:');
    console.log(`  Cache hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`  Pre-buffered responses: ${stats.cache.preBufferedCount}`);
    console.log(`  Available tools: ${stats.tools}\n`);
    
    // Cleanup
    await agent.shutdown();
    console.log('✓ Agent shutdown complete');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
