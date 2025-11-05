#!/usr/bin/env node
/**
 * Simple test to verify the MCP server starts and responds correctly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Voice Control MCP Server...\n');

// Start the server
const serverPath = join(__dirname, 'build', 'index.js');
console.log(`Starting server from: ${serverPath}\n`);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('STDERR:', data.toString());
});

// Send a simple MCP request
setTimeout(() => {
  console.log('\n📤 Sending test request...\n');
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

// Wait for response
setTimeout(() => {
  console.log('\n📊 Test Results:');
  console.log('================\n');
  
  if (errorOutput.includes('Voice Control MCP Server started successfully')) {
    console.log('✅ Server started successfully');
  } else {
    console.log('❌ Server failed to start');
  }
  
  if (output.length > 0) {
    console.log('✅ Server is responding');
    console.log('\nResponse preview:', output.substring(0, 200));
  } else {
    console.log('❌ No response received');
  }
  
  console.log('\n🎉 Basic test complete!');
  console.log('\nTo test interactively:');
  console.log('  pnpm inspect\n');
  
  server.kill();
  process.exit(0);
}, 3000);

server.on('error', (err) => {
  console.error('❌ Error starting server:', err);
  process.exit(1);
});
