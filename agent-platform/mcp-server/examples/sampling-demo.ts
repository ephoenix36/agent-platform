/**
 * MCP Sampling Demonstration
 * 
 * This example shows how to use the SamplingClient for LLM interactions
 * with retry logic, caching, and error handling.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SamplingClient } from '../src/services/SamplingClient.js';

async function main() {
  console.log('=== MCP Sampling Demo ===\n');

  // Create MCP server (required for sampling)
  const server = new Server(
    {
      name: 'sampling-demo',
      version: '1.0.0'
    },
    {
      capabilities: {
        sampling: {}
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Create sampling client with 5-minute cache
  const samplingClient = new SamplingClient(server);

  // Example 1: Basic sampling
  console.log('1. Basic Sampling');
  console.log('-------------------');
  
  try {
    const result = await samplingClient.sample({
      messages: [
        {
          role: 'user',
          content: { 
            type: 'text', 
            text: 'What is 2 + 2?' 
          }
        }
      ],
      maxTokens: 100,
      temperature: 0.7
    });

    console.log('Response:', result.content.text);
  } catch (error: any) {
    console.log('Error (expected in demo):', error.message);
  }

  console.log();

  // Example 2: Retry logic
  console.log('2. Automatic Retry');
  console.log('--------------------');

  try {
    const result = await samplingClient.sample({
      messages: [
        {
          role: 'user',
          content: { 
            type: 'text', 
            text: 'Explain quantum computing' 
          }
        }
      ],
      maxTokens: 500,
      retries: 5, // Will retry up to 5 times on failure
      timeout: 60000 // 60 second timeout
    });

    console.log('Response received after retries (if needed)');
    console.log('Length:', result.content.text.length, 'characters');
  } catch (error: any) {
    console.log('Failed after all retries:', error.message);
  }

  console.log();

  // Example 3: Response caching
  console.log('3. Response Caching');
  console.log('---------------------');

  const question = 'What is the capital of France?';

  console.log('First request (cache miss)...');
  const start1 = Date.now();
  try {
    await samplingClient.sample({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: question }
        }
      ],
      maxTokens: 50
    });
    console.log(`  Time: ${Date.now() - start1}ms`);
  } catch (error: any) {
    console.log(`  Time: ${Date.now() - start1}ms (failed: ${error.message})`);
  }

  console.log('Second request (cache hit)...');
  const start2 = Date.now();
  try {
    await samplingClient.sample({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: question }
        }
      ],
      maxTokens: 50
    });
    console.log(`  Time: ${Date.now() - start2}ms`);
  } catch (error: any) {
    console.log(`  Time: ${Date.now() - start2}ms (failed: ${error.message})`);
  }

  // Get cache statistics
  const stats = samplingClient.getCacheStats();
  console.log(`  Cache stats: ${stats.hits} hits, ${stats.misses} misses`);
  console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  console.log();

  // Example 4: Cache management
  console.log('4. Cache Management');
  console.log('---------------------');

  console.log('Cache size before clear:', stats.size);
  samplingClient.clearCache();
  const clearedStats = samplingClient.getCacheStats();
  console.log('Cache size after clear:', clearedStats.size);
  console.log();

  // Example 5: Skip caching
  console.log('5. Skip Caching');
  console.log('-----------------');

  try {
    const result = await samplingClient.sample({
      messages: [
        {
          role: 'user',
          content: { 
            type: 'text', 
            text: 'Generate a random number' 
          }
        }
      ],
      maxTokens: 50,
      skipCache: true // Force fresh response
    });

    console.log('Fresh response (not cached)');
  } catch (error: any) {
    console.log('Error:', error.message);
  }

  console.log();

  // Example 6: Multi-turn conversation
  console.log('6. Multi-turn Conversation');
  console.log('----------------------------');

  const conversation = [
    {
      role: 'user' as const,
      content: { type: 'text' as const, text: 'My name is Alice' }
    },
    {
      role: 'assistant' as const,
      content: { type: 'text' as const, text: 'Hello Alice! How can I help you?' }
    },
    {
      role: 'user' as const,
      content: { type: 'text' as const, text: 'What is my name?' }
    }
  ];

  try {
    const result = await samplingClient.sample({
      messages: conversation,
      maxTokens: 100,
      temperature: 0.5
    });

    console.log('Assistant should remember name:', result.content.text);
  } catch (error: any) {
    console.log('Error:', error.message);
  }

  console.log();

  // Example 7: Configuration
  console.log('7. Client Configuration');
  console.log('-------------------------');

  const config = samplingClient.getConfig();
  console.log('Default timeout:', config.defaultTimeout, 'ms');
  console.log('Cache TTL:', config.cacheTTL, 'ms');
  console.log('Supports streaming:', config.supportsStreaming);
  console.log();

  // Example 8: Temperature variations
  console.log('8. Temperature Variations');
  console.log('---------------------------');

  const prompt = 'Write a creative sentence';

  console.log('Low temperature (0.2) - more deterministic:');
  try {
    const conservative = await samplingClient.sample({
      messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
      maxTokens: 50,
      temperature: 0.2,
      skipCache: true
    });
    console.log(' ', conservative.content.text);
  } catch (error: any) {
    console.log('  Error:', error.message);
  }

  console.log('High temperature (1.5) - more creative:');
  try {
    const creative = await samplingClient.sample({
      messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
      maxTokens: 50,
      temperature: 1.5,
      skipCache: true
    });
    console.log(' ', creative.content.text);
  } catch (error: any) {
    console.log('  Error:', error.message);
  }

  console.log();

  // Summary
  console.log('=== Summary ===');
  console.log('This demo showed:');
  console.log('  1. Basic LLM sampling via MCP');
  console.log('  2. Automatic retry with exponential backoff');
  console.log('  3. Response caching for performance');
  console.log('  4. Cache management and clearing');
  console.log('  5. Option to skip caching');
  console.log('  6. Multi-turn conversation support');
  console.log('  7. Configuration inspection');
  console.log('  8. Temperature parameter tuning');
  console.log();
  console.log('Key features:');
  console.log('  • 5-minute cache TTL (configurable)');
  console.log('  • Exponential backoff retry (100ms, 200ms, 400ms...)');
  console.log('  • 30-second default timeout');
  console.log('  • Streaming support (when available)');
  console.log();
  console.log('Note: This demo requires an active MCP client connection.');
  console.log('Run with: npx @modelcontextprotocol/inspector node examples/sampling-demo.js');
}

// Run the demo
main().catch(console.error);
