/**
 * Example: LiveKit Session
 * Demonstrates starting a real-time voice session with LiveKit
 */

import { VoiceAgent, loadConfig, validateEnvironment } from '../src/index.js';

async function main() {
  console.log('Voice Agent - LiveKit Session Example\n');
  
  try {
    validateEnvironment();
    const config = loadConfig();
    
    const agent = new VoiceAgent(config);
    await agent.initialize();
    console.log('✓ Agent initialized\n');
    
    // Set up event listeners
    agent.on('session.started', (event) => {
      console.log(`\n✓ Session started`);
      console.log(`  Session ID: ${event.sessionId}`);
      console.log(`  Room: ${event.roomName}`);
    });
    
    agent.on('participant.joined', (event) => {
      console.log(`\n👤 Participant joined: ${event.participantName}`);
    });
    
    agent.on('participant.left', (event) => {
      console.log(`\n👋 Participant left: ${event.participantName}`);
    });
    
    agent.on('audio.received', (chunk) => {
      console.log(`🎵 Audio received: ${chunk.duration.toFixed(2)}s`);
    });
    
    // Start session in a LiveKit room
    const roomName = process.argv[2] || 'voice-agent-demo';
    console.log(`Starting session in room: ${roomName}\n`);
    
    const session = await agent.startSession(roomName, {
      userName: 'Demo User',
      tags: ['demo', 'example'],
    });
    
    console.log('Session active. Press Ctrl+C to end.\n');
    
    // Keep alive
    process.on('SIGINT', async () => {
      console.log('\n\nEnding session...');
      await agent.endSession();
      await agent.shutdown();
      console.log('✓ Session ended\n');
      process.exit(0);
    });
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
