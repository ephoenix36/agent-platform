/**
 * Example: Multi-Agent Collaboration
 * Demonstrates expert advisor consultation and validation
 */

import { VoiceAgent, loadConfig, validateEnvironment } from '../src/index.js';

async function main() {
  console.log('Voice Agent - Multi-Agent Collaboration Example\n');
  
  try {
    validateEnvironment();
    
    // Ensure collaboration is enabled
    const config = loadConfig();
    if (!config.collaboration?.enableAdvisors) {
      console.log('⚠️  Multi-agent collaboration is disabled.');
      console.log('Set ENABLE_EXPERT_ADVISORS=true in .env\n');
      return;
    }
    
    const agent = new VoiceAgent(config);
    await agent.initialize();
    console.log('✓ Agent initialized\n');
    
    // Listen for consultation events
    agent.on('consultation.completed', (event: any) => {
      console.log(`\n👥 Expert consultation completed`);
      console.log(`   Advisor: ${event.advisorId}`);
      console.log(`   Domain: ${event.domain}`);
      console.log(`   Duration: ${event.duration}ms`);
    });
    
    // Complex queries that should trigger expert consultation
    const complexQueries = [
      'Analyze the current state of real-time voice AI and provide a comprehensive market analysis',
      'What are the best practices for implementing secure authentication in a distributed system?',
      'Investigate the latest research on low-latency audio streaming protocols',
      'Provide a detailed technical architecture for a scalable voice agent platform',
    ];
    
    for (let i = 0; i < complexQueries.length; i++) {
      const query = complexQueries[i];
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Query ${i + 1}/${complexQueries.length}`);
      console.log(${'='.repeat(80)}`);
      console.log(`\nYou: ${query}\n`);
      console.log('🤔 Processing (may consult experts)...\n');
      
      const startTime = Date.now();
      const response = await agent.processText(query);
      const latency = Date.now() - startTime;
      
      console.log(`\nAgent: ${response}`);
      console.log(`\n⏱️  Total time: ${latency}ms`);
    }
    
    // Show collaboration statistics
    const stats = agent.getStats();
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Collaboration Statistics');
    console.log('='.repeat(80));
    
    if (stats.collaboration) {
      console.log(`  Available advisors: ${stats.collaboration.advisorsAvailable}`);
      console.log(`  Total consultations: ${stats.collaboration.totalConsultations}`);
      console.log(`  Avg response time: ${Math.round(stats.collaboration.avgResponseTime)}ms`);
      
      if (Object.keys(stats.collaboration.consultationsByDomain).length > 0) {
        console.log('\n  Consultations by domain:');
        for (const [domain, count] of Object.entries(stats.collaboration.consultationsByDomain)) {
          console.log(`    ${domain}: ${count}`);
        }
      }
    }
    
    console.log('\n  Cache statistics:');
    console.log(`    Hit rate: ${(stats.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`    Hits: ${stats.cache.hits}`);
    console.log(`    Misses: ${stats.cache.misses}`);
    
    await agent.shutdown();
    console.log('\n✓ Agent shutdown complete\n');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
