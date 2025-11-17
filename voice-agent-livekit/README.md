# Voice Agent LiveKit 🎙️

A state-of-the-art real-time voice agent powered by **LiveKit** and **Gemini 2.0 Flash**, featuring advanced capabilities including pre-buffered responses, streaming, MCP tool integration, and multi-agent collaboration.

## ✨ Features

### Core Capabilities
- 🎯 **Real-time Voice Communication** - LiveKit integration for low-latency audio streaming
- 🚀 **Gemini 2.0 Flash Integration** - Latest Google AI model with streaming responses
- 🔧 **MCP Tools Support** - Model Context Protocol for extensible tool calling
- ⚡ **Pre-buffered Responses** - Ultra-low latency for common queries
- 📊 **Streaming Responses** - Progressive response generation for better UX
- 🤝 **Multi-Agent Collaboration** - Consult expert advisors for complex queries

### Advanced Features
- **Response Caching** - LRU cache with TTL for frequently asked questions
- **Expert Consultation** - Automatically route complex queries to domain experts
- **Validation & Investigation** - Quality assurance and deep research capabilities
- **Tool Auto-detection** - Smart detection of when to use tools
- **Performance Monitoring** - Comprehensive metrics and logging
- **Event System** - Rich event emission for observability

## 🚀 Quick Start

### Prerequisites

- Node.js 20.0.0 or higher
- LiveKit account and API credentials
- Google AI (Gemini) API key
- Optional: MCP servers for extended functionality

### Installation

```bash
# Clone or navigate to the project
cd Agents/voice-agent-livekit

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Required:
#   LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
#   GEMINI_API_KEY
```

### Environment Configuration

Edit `.env` with your credentials:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Agent Configuration
AGENT_NAME=VoiceAssistant
AGENT_DESCRIPTION="Real-time voice assistant with advanced capabilities"
DEFAULT_LANGUAGE=en-US

# MCP Configuration (optional)
MCP_SERVERS_CONFIG_PATH=./mcp-servers.json

# Performance Tuning
ENABLE_PRE_BUFFERING=true
PRE_BUFFER_SIZE=3
MAX_LATENCY_MS=500
STREAM_CHUNK_SIZE=4096

# Multi-Agent Collaboration (optional)
ENABLE_EXPERT_ADVISORS=true
ADVISOR_AGENT_ENDPOINT=http://localhost:8000/api/v1/agents
```

### Usage

#### Interactive CLI

```bash
# Start interactive CLI
npm run cli

# Or with development mode
npm run dev
```

**CLI Commands:**
- Type your message to chat with the agent
- `/session <room>` - Start LiveKit session in a specific room
- `/stats` - View performance statistics
- `/clear` - Clear conversation history
- `/quit` - Exit

#### Programmatic Usage

```typescript
import { VoiceAgent, loadConfig } from '@agents/voice-agent-livekit';

async function main() {
  // Load configuration
  const config = loadConfig();
  
  // Create and initialize agent
  const agent = new VoiceAgent(config);
  await agent.initialize();
  
  // Start LiveKit session
  const session = await agent.startSession('my-room');
  
  // Process text input
  const response = await agent.processText('Hello, how can you help me?');
  console.log(response);
  
  // Get statistics
  const stats = agent.getStats();
  console.log('Cache hit rate:', stats.cache.hitRate);
  
  // Listen to events
  agent.on('tool.call.started', (event) => {
    console.log('Tool called:', event.toolName);
  });
  
  // Clean up
  await agent.shutdown();
}

main();
```

## 📚 Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        VoiceAgent                           │
│  (Main orchestration - coordinates all subsystems)          │
└─────────────────────────────────────────────────────────────┘
         │        │          │           │            │
         ▼        ▼          ▼           ▼            ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │LiveKit │ │Gemini  │ │  MCP   │ │ Buffer │ │Collab  │
    │Manager │ │Manager │ │Manager │ │Manager │ │Manager │
    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
    Audio     Streaming    Tool      Response   Expert
    Streams   Responses   Calling   Caching    Advisors
```

### Key Components

#### 1. **LiveKitManager**
- Manages LiveKit room connections
- Handles participant tracking
- Processes audio streams
- Publishes agent responses

#### 2. **GeminiManager**
- Integrates Gemini 2.0 Flash model
- Supports streaming responses
- Function calling for tools
- Conversation history management

#### 3. **MCPManager**
- Connects to MCP servers
- Loads and manages tools
- Executes tool calls with timeout
- Provides tool discovery

#### 4. **BufferManager**
- Pre-buffers common responses
- LRU cache with TTL
- Response matching (exact + regex)
- Performance metrics

#### 5. **CollaborationManager**
- Discovers expert advisors
- Routes complex queries
- Validation requests
- Investigation coordination

## 🔧 MCP Tools Integration

The agent supports any MCP server. Configure in `mcp-servers.json`:

```json
{
  "mcpServers": {
    "agent-platform": {
      "command": "node",
      "args": ["../agent-platform/mcp-server/build/index.js"],
      "description": "Main agent platform tools",
      "enabled": true
    },
    "advisors": {
      "command": "node",
      "args": ["../advisors-mcp/build/index.js"],
      "description": "Expert advisor agents",
      "enabled": true
    }
  }
}
```

## 🤝 Multi-Agent Collaboration

### Expert Consultation

```typescript
// Automatically consults experts for complex queries
const response = await agent.processText(
  'Analyze the market trends for AI voice assistants in 2024'
);
// → Routes to business/research expert → Synthesizes response
```

### Validation

```typescript
const validation = await collaborationManager.requestValidation({
  content: generatedContent,
  criteria: ['accuracy', 'completeness', 'clarity'],
  strictness: 'high'
});

console.log('Valid:', validation.isValid);
console.log('Score:', validation.score);
console.log('Issues:', validation.issues);
```

### Investigation

```typescript
const investigation = await collaborationManager.requestInvestigation({
  topic: 'Latest developments in real-time AI',
  depth: 3,
  sources: ['arxiv', 'github', 'news']
});

console.log('Findings:', investigation.findings);
console.log('Confidence:', investigation.confidence);
```

## ⚡ Performance Optimization

### Pre-buffering

Common responses are pre-generated on startup:
- Greetings (hi, hello, hey)
- Acknowledgments (thanks, ok, sure)
- Farewells (bye, goodbye)
- Help requests

**Impact:** <50ms latency for common queries (vs 200-500ms for LLM calls)

### Response Caching

- LRU cache with configurable TTL
- Automatic eviction when full
- Hit rate tracking

### Streaming Responses

- Progressive text generation
- First chunk typically <100ms
- Better perceived latency

## 📊 Events

The agent emits comprehensive events for observability:

```typescript
agent.on('session.started', (event) => {
  console.log('Session:', event.sessionId, event.roomName);
});

agent.on('participant.joined', (event) => {
  console.log('Participant:', event.participantId);
});

agent.on('message.received', (event) => {
  console.log('Message:', event.content);
});

agent.on('tool.call.started', (event) => {
  console.log('Tool:', event.toolName);
});

agent.on('consultation.completed', (event) => {
  console.log('Expert:', event.advisorId, event.duration);
});
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📈 Statistics & Monitoring

```typescript
const stats = agent.getStats();

console.log('Session:', stats.session?.id);
console.log('Cache hit rate:', stats.cache.hitRate);
console.log('Pre-buffered:', stats.cache.preBufferedCount);
console.log('Tools available:', stats.tools);

if (stats.collaboration) {
  console.log('Expert advisors:', stats.collaboration.advisorsAvailable);
  console.log('Consultations:', stats.collaboration.totalConsultations);
  console.log('Avg response:', stats.collaboration.avgResponseTime, 'ms');
}
```

## 🔐 Security Best Practices

1. **Never commit `.env`** - Keep credentials secure
2. **Use environment-specific configs** - Separate dev/prod
3. **Rotate API keys regularly** - Especially in production
4. **Limit tool permissions** - Only grant necessary access
5. **Monitor usage** - Track API calls and costs

## 🚢 Deployment

### Docker (Recommended)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

### Systemd Service

```ini
[Unit]
Description=Voice Agent LiveKit
After=network.target

[Service]
Type=simple
User=voiceagent
WorkingDirectory=/opt/voice-agent
ExecStart=/usr/bin/node /opt/voice-agent/dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT - See [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- [LiveKit](https://livekit.io/) - Real-time communication platform
- [Google Gemini](https://deepmind.google/technologies/gemini/) - Advanced AI model
- [Model Context Protocol](https://modelcontextprotocol.io/) - Tool integration standard

## 📞 Support

- GitHub Issues: [Report a bug or request a feature](../issues)
- Documentation: See `docs/` folder for detailed guides
- Examples: Check `examples/` for code samples

## 🗺️ Roadmap

- [ ] Text-to-Speech (TTS) integration
- [ ] Speech-to-Text (STT) with Gemini
- [ ] Multi-language support
- [ ] Voice activity detection (VAD)
- [ ] Conversation summarization
- [ ] Persistent conversation storage
- [ ] Web dashboard for monitoring
- [ ] Mobile SDK support

---

**Built with ❤️ by the Agent Platform Team**
