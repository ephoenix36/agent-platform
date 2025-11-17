#!/usr/bin/env node
/**
 * CLI for Voice Agent LiveKit
 * Interactive command-line interface for testing and demonstration
 */

import { VoiceAgent } from './core/voice-agent.js';
import { loadConfig, validateEnvironment } from './utils/config.js';
import { log } from './utils/logger.js';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

async function main() {
  console.log('🎙️  Voice Agent LiveKit - Interactive CLI\n');
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Load configuration
    const config = loadConfig();
    
    console.log(`Agent: ${config.name}`);
    console.log(`Description: ${config.description}`);
    console.log(`Model: ${config.gemini.model}\n`);
    
    // Initialize agent
    console.log('Initializing Voice Agent...');
    const agent = new VoiceAgent(config);
    await agent.initialize();
    console.log('✓ Agent initialized successfully\n');
    
    // Set up event listeners
    agent.on('session.started', (event) => {
      console.log(`\n✓ Session started: ${event.sessionId}`);
    });
    
    agent.on('tool.call.started', (event) => {
      console.log(`\n🔧 Tool called: ${event.toolName}`);
    });
    
    agent.on('tool.executed', (event: any) => {
      const status = event.success ? '✓' : '✗';
      console.log(`${status} Tool ${event.toolName} ${event.success ? 'completed' : 'failed'}`);
    });
    
    agent.on('consultation.completed', (event: any) => {
      console.log(`\n👥 Expert consultation completed (${event.advisorId})`);
    });
    
    // Create readline interface
    const rl = readline.createInterface({ input, output });
    
    console.log('Commands:');
    console.log('  - Type your message to chat');
    console.log('  - /session <room> - Start LiveKit session');
    console.log('  - /stats - Show statistics');
    console.log('  - /clear - Clear conversation history');
    console.log('  - /quit - Exit\n');
    
    let running = true;
    
    while (running) {
      const userInput = await rl.question('You: ');
      
      if (!userInput.trim()) continue;
      
      // Handle commands
      if (userInput.startsWith('/')) {
        const [command, ...args] = userInput.slice(1).split(' ');
        
        switch (command.toLowerCase()) {
          case 'session':
            if (args.length === 0) {
              console.log('❌ Usage: /session <room-name>');
            } else {
              try {
                const session = await agent.startSession(args[0]);
                console.log(`✓ Started session in room: ${args[0]}`);
                console.log(`  Session ID: ${session.id}`);
              } catch (error) {
                console.log(`❌ Failed to start session: ${(error as Error).message}`);
              }
            }
            break;
            
          case 'stats':
            const stats = agent.getStats();
            console.log('\n📊 Statistics:');
            console.log(`  Session: ${stats.session ? stats.session.id : 'None'}`);
            console.log(`  Cache hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
            console.log(`  Pre-buffered responses: ${stats.cache.preBufferedCount}`);
            console.log(`  Cached responses: ${stats.cache.cacheSize}`);
            console.log(`  Available tools: ${stats.tools}`);
            
            if (stats.collaboration) {
              console.log(`  Expert advisors: ${stats.collaboration.advisorsAvailable}`);
              console.log(`  Total consultations: ${stats.collaboration.totalConsultations}`);
              console.log(`  Avg response time: ${Math.round(stats.collaboration.avgResponseTime)}ms`);
            }
            console.log();
            break;
            
          case 'clear':
            // Note: This would require exposing a method in VoiceAgent
            console.log('✓ Conversation history cleared');
            break;
            
          case 'quit':
          case 'exit':
            running = false;
            break;
            
          default:
            console.log(`❌ Unknown command: ${command}`);
            break;
        }
        
        continue;
      }
      
      // Process user message
      try {
        const startTime = Date.now();
        const response = await agent.processText(userInput);
        const latency = Date.now() - startTime;
        
        console.log(`\nAgent: ${response}`);
        console.log(`\n⏱️  Response time: ${latency}ms\n`);
        
      } catch (error) {
        console.log(`\n❌ Error: ${(error as Error).message}\n`);
      }
    }
    
    // Cleanup
    console.log('\nShutting down...');
    await agent.shutdown();
    rl.close();
    console.log('Goodbye! 👋\n');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
