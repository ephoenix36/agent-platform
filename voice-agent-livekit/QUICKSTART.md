# Quick Start Guide

Get up and running with Voice Agent LiveKit in 5 minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 20.0.0 or higher
- ✅ npm or pnpm package manager
- ✅ LiveKit account (or self-hosted server)
- ✅ Google AI (Gemini) API key

## Step 1: Installation

```bash
# Navigate to the project directory
cd Agents/voice-agent-livekit

# Install dependencies
npm install
```

## Step 2: Configuration

```bash
# Copy the environment template
cp .env.example .env

# Open .env in your editor
code .env  # or nano .env
```

### Required Configuration

Edit `.env` and set these required values:

```env
# LiveKit (Get from livekit.io)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here

# Gemini API (Get from ai.google.dev)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Configuration

These have sensible defaults but can be customized:

```env
# Agent Settings
AGENT_NAME=VoiceAssistant
DEFAULT_LANGUAGE=en-US

# Performance
ENABLE_PRE_BUFFERING=true
PRE_BUFFER_SIZE=3
MAX_LATENCY_MS=500

# Features
ENABLE_EXPERT_ADVISORS=false  # Set true to enable multi-agent
```

## Step 3: Run the Agent

### Option A: Interactive CLI (Recommended for testing)

```bash
npm run cli
```

You'll see:

```
🎙️  Voice Agent LiveKit - Interactive CLI

Agent: VoiceAssistant
Description: Real-time voice assistant with advanced capabilities
Model: gemini-2.0-flash-exp

Initializing Voice Agent...
✓ Agent initialized successfully

Commands:
  - Type your message to chat
  - /session <room> - Start LiveKit session
  - /stats - Show statistics
  - /quit - Exit

You: _
```

### Option B: Programmatic Usage

Create a file `test.ts`:

```typescript
import { VoiceAgent, loadConfig, validateEnvironment } from './src/index.js';

async function main() {
  validateEnvironment();
  const config = loadConfig();
  
  const agent = new VoiceAgent(config);
  await agent.initialize();
  
  const response = await agent.processText('Hello!');
  console.log(response);
  
  await agent.shutdown();
}

main();
```

Run it:

```bash
npx tsx test.ts
```

## Step 4: Try It Out!

### Text Chat Example

In the CLI:

```
You: Hello!
Agent: Hello! How can I assist you today?
⏱️  Response time: 45ms

You: What can you help me with?
Agent: I'm a voice assistant that can help you with various tasks...
⏱️  Response time: 1250ms
```

### Start a LiveKit Session

In the CLI:

```
You: /session demo-room
✓ Started session in room: demo-room
  Session ID: session_1234567890_abc123
```

Now you can connect from a LiveKit client app!

### Check Statistics

```
You: /stats

📊 Statistics:
  Session: session_1234567890_abc123
  Cache hit rate: 33.3%
  Pre-buffered responses: 10
  Cached responses: 5
  Available tools: 0
```

## Step 5: Next Steps

### Enable MCP Tools (Optional)

1. Ensure MCP servers are running:

```bash
# In another terminal, start the agent platform MCP server
cd ../agent-platform/mcp-server
npm run dev
```

2. Update `.env`:

```env
MCP_SERVERS_CONFIG_PATH=./mcp-servers.json
```

3. Verify in `mcp-servers.json`:

```json
{
  "mcpServers": {
    "agent-platform": {
      "command": "node",
      "args": ["../agent-platform/mcp-server/build/index.js"],
      "enabled": true
    }
  }
}
```

4. Restart the agent and check stats:

```
You: /stats
Available tools: 15
```

### Enable Multi-Agent Collaboration (Optional)

1. Start the advisor agents endpoint
2. Update `.env`:

```env
ENABLE_EXPERT_ADVISORS=true
ADVISOR_AGENT_ENDPOINT=http://localhost:8000/api/v1/agents
```

3. Restart and test with complex queries:

```
You: Analyze the market trends for AI voice assistants
🤔 Processing (may consult experts)...
👥 Expert consultation completed
Agent: [Comprehensive analysis with expert insights]
```

## Common Issues

### "Missing required environment variables"

❌ **Problem:** Required variables not set in `.env`

✅ **Solution:** 
```bash
# Check which variables are missing
npm run cli

# The error will tell you which ones
# Example: Missing required environment variables: GEMINI_API_KEY
```

### "Cannot find module '@livekit/rtc-node'"

❌ **Problem:** Dependencies not installed

✅ **Solution:**
```bash
npm install
# Or force reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Connection failed"

❌ **Problem:** Invalid LiveKit credentials or URL

✅ **Solution:**
1. Verify credentials at livekit.io
2. Check URL format: `wss://your-project.livekit.cloud`
3. Test credentials with LiveKit CLI

### High latency responses

❌ **Problem:** Network issues or Gemini API throttling

✅ **Solution:**
1. Check network connection
2. Enable pre-buffering: `ENABLE_PRE_BUFFERING=true`
3. Reduce max tokens: `GEMINI_MAX_OUTPUT_TOKENS=1024`

## Examples

### Example 1: Simple Q&A

```
You: What is 2 + 2?
Agent: 2 + 2 equals 4.
⏱️  Response time: 890ms
```

### Example 2: Pre-buffered Response

```
You: Hello
Agent: Hello! How can I assist you today?
⏱️  Response time: 8ms  ⚡ (pre-buffered)
```

### Example 3: With Tools

```
You: Create a new agent for customer support
🔧 Tool called: create_agent
✓ Tool create_agent completed
Agent: I've created a new customer support agent with the following configuration...
⏱️  Total time: 2340ms
```

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

Or with the CLI:

```bash
npm run cli
```

## Build for Production

```bash
# Build TypeScript
npm run build

# Run built version
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Getting Help

- 📖 **Documentation:** Check `/docs` folder
- 🐛 **Bug Reports:** Open an issue on GitHub
- 💡 **Feature Requests:** Use the feature request template
- 💬 **Questions:** Start a discussion

## What's Next?

- ✅ Explore the [examples/](../examples/) directory
- ✅ Read the [API Reference](docs/API.md)
- ✅ Learn about [deployment](docs/DEPLOYMENT.md)
- ✅ Check out the [architecture](docs/ARCHITECTURE.md)
- ✅ Review [contributing guidelines](CONTRIBUTING.md)

## Quick Reference

### CLI Commands

| Command | Description |
|---------|-------------|
| `/session <room>` | Start LiveKit session |
| `/stats` | Show statistics |
| `/clear` | Clear history |
| `/quit` | Exit |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LIVEKIT_URL` | ✅ | - | LiveKit server URL |
| `LIVEKIT_API_KEY` | ✅ | - | LiveKit API key |
| `LIVEKIT_API_SECRET` | ✅ | - | LiveKit API secret |
| `GEMINI_API_KEY` | ✅ | - | Gemini API key |
| `AGENT_NAME` | ❌ | VoiceAssistant | Agent name |
| `ENABLE_PRE_BUFFERING` | ❌ | true | Enable pre-buffering |
| `MAX_LATENCY_MS` | ❌ | 500 | Max latency target |

---

**That's it! You're ready to start building with Voice Agent LiveKit! 🚀**
