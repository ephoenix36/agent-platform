# API Reference

Complete API documentation for Voice Agent LiveKit.

## Table of Contents

- [VoiceAgent](#voiceagent)
- [LiveKitManager](#livekitmanager)
- [GeminiManager](#geminimanager)
- [MCPManager](#mcpmanager)
- [BufferManager](#buffermanager)
- [CollaborationManager](#collaborationmanager)
- [Configuration](#configuration)
- [Types](#types)

---

## VoiceAgent

Main orchestration class that coordinates all subsystems.

### Constructor

```typescript
constructor(config: VoiceAgentConfig)
```

Creates a new VoiceAgent instance with the specified configuration.

**Parameters:**
- `config`: VoiceAgentConfig - Complete agent configuration

**Example:**
```typescript
const agent = new VoiceAgent(loadConfig());
```

### Methods

#### `initialize(): Promise<void>`

Initialize all subsystems (MCP, collaboration, buffers).

**Returns:** Promise that resolves when initialization is complete

**Throws:** Error if initialization fails

**Example:**
```typescript
await agent.initialize();
```

#### `startSession(roomName: string, metadata?: SessionMetadata): Promise<VoiceSession>`

Start a LiveKit voice session.

**Parameters:**
- `roomName`: string - Name of the LiveKit room to join
- `metadata`: SessionMetadata (optional) - Additional session metadata

**Returns:** Promise<VoiceSession> - Session object with room and participant info

**Example:**
```typescript
const session = await agent.startSession('my-room', {
  userName: 'John Doe',
  tags: ['demo'],
});
```

#### `endSession(): Promise<void>`

End the current voice session and disconnect from LiveKit.

**Example:**
```typescript
await agent.endSession();
```

#### `processText(input: string): Promise<string>`

Process text input and generate a response.

**Parameters:**
- `input`: string - User's text input

**Returns:** Promise<string> - Agent's response

**Features:**
- Checks pre-buffered responses first (ultra-low latency)
- Falls back to cache (low latency)
- Consults experts for complex queries
- Uses tools when needed
- Caches new responses

**Example:**
```typescript
const response = await agent.processText('Hello, how are you?');
console.log(response); // "Hello! How can I assist you today?"
```

#### `getSession(): VoiceSession | null`

Get the current active session.

**Returns:** VoiceSession | null

#### `getStats(): AgentStats`

Get comprehensive agent statistics.

**Returns:** Object containing:
- `session`: Current session or null
- `cache`: Cache hit rate and size statistics
- `collaboration`: Expert consultation statistics (if enabled)
- `tools`: Number of available tools

**Example:**
```typescript
const stats = agent.getStats();
console.log(`Hit rate: ${stats.cache.hitRate * 100}%`);
console.log(`Tools: ${stats.tools}`);
```

#### `shutdown(): Promise<void>`

Shutdown the agent and cleanup all resources.

**Example:**
```typescript
await agent.shutdown();
```

### Events

```typescript
agent.on('session.started', (event: SessionStartedEvent) => void);
agent.on('session.ended', (event: SessionEndedEvent) => void);
agent.on('participant.joined', (event: ParticipantJoinedEvent) => void);
agent.on('participant.left', (event: ParticipantLeftEvent) => void);
agent.on('message.received', (event: MessageReceivedEvent) => void);
agent.on('message.sent', (event: MessageSentEvent) => void);
agent.on('tool.call.started', (event: ToolCallStartedEvent) => void);
agent.on('tool.call.completed', (event: ToolCallCompletedEvent) => void);
agent.on('consultation.completed', (event: ConsultationEvent) => void);
agent.on('error', (event: ErrorEvent) => void);
```

---

## LiveKitManager

Manages LiveKit room connections and audio streaming.

### Methods

#### `connect(roomName: string, metadata?: SessionMetadata): Promise<VoiceSession>`

Connect to a LiveKit room and create a session.

**Parameters:**
- `roomName`: string - LiveKit room name
- `metadata`: SessionMetadata (optional)

**Returns:** Promise<VoiceSession>

#### `disconnect(): Promise<void>`

Disconnect from the current room.

#### `publishAudio(audioData: Buffer, sampleRate?: number): Promise<void>`

Publish audio data to the room.

**Parameters:**
- `audioData`: Buffer - Audio data to publish
- `sampleRate`: number (optional, default: 48000) - Sample rate in Hz

#### `subscribeToParticipantAudio(participantId: string, callback: (audio: AudioChunk) => void): void`

Subscribe to a participant's audio stream.

**Parameters:**
- `participantId`: string - Participant to subscribe to
- `callback`: Function called for each audio chunk

#### `getSession(): VoiceSession | null`

Get current session.

#### `updateMetadata(metadata: Partial<SessionMetadata>): void`

Update session metadata.

---

## GeminiManager

Manages Gemini AI model interactions.

### Methods

#### `generateStreamingResponse(userInput: string): Promise<StreamingResponse>`

Generate a streaming response from Gemini.

**Parameters:**
- `userInput`: string - User's message

**Returns:** Promise<StreamingResponse> with async text stream

**Example:**
```typescript
const response = await gemini.generateStreamingResponse('Tell me a story');

for await (const chunk of response.textStream) {
  process.stdout.write(chunk);
}

console.log('\nFull text:', response.fullText);
```

#### `generateResponse(userInput: string): Promise<string>`

Generate a complete response (non-streaming).

**Parameters:**
- `userInput`: string

**Returns:** Promise<string>

#### `generateWithTools(userInput: string): Promise<{ text: string; toolCalls: ToolCall[] }>`

Generate response with function calling support.

**Parameters:**
- `userInput`: string

**Returns:** Promise with text and tool calls

**Example:**
```typescript
const result = await gemini.generateWithTools('Create a new agent');

if (result.toolCalls.length > 0) {
  // Execute tools
  for (const toolCall of result.toolCalls) {
    const result = await mcp.executeTool(toolCall);
    console.log('Tool result:', result);
  }
}
```

#### `registerTools(tools: MCPTool[]): void`

Register MCP tools for function calling.

#### `getHistory(): ConversationMessage[]`

Get conversation history.

#### `clearHistory(): void`

Clear conversation history.

---

## MCPManager

Manages Model Context Protocol servers and tools.

### Methods

#### `initialize(): Promise<void>`

Initialize and connect to MCP servers.

#### `executeTool(toolCall: ToolCall): Promise<unknown>`

Execute a tool call.

**Parameters:**
- `toolCall`: ToolCall - Tool to execute

**Returns:** Promise<unknown> - Tool execution result

**Throws:** Error if tool not found or execution fails

#### `getTools(): MCPTool[]`

Get all available tools from connected servers.

**Returns:** Array of MCPTool

#### `getTool(name: string): MCPTool | undefined`

Get a specific tool by name.

#### `disconnect(): Promise<void>`

Disconnect from all MCP servers.

---

## BufferManager

Manages response pre-buffering and caching.

### Methods

#### `initialize(): Promise<void>`

Initialize pre-buffered responses.

#### `getPreBufferedResponse(userInput: string): string | null`

Try to get a pre-buffered response.

**Parameters:**
- `userInput`: string - User input to match

**Returns:** string | null - Pre-buffered response or null

**Matching:**
- Exact matches for simple phrases
- Regex patterns for variations

#### `cacheResponse(input: string, response: string, ttlSeconds?: number): void`

Cache a generated response.

**Parameters:**
- `input`: string - User input (normalized)
- `response`: string - Agent response
- `ttlSeconds`: number (optional, default: 3600) - Time to live

#### `getCachedResponse(input: string): string | null`

Try to get a cached response.

#### `addPreBufferedResponse(trigger: string | RegExp, response: string, priority?: number): void`

Add a custom pre-buffered response.

**Parameters:**
- `trigger`: string | RegExp - Matching pattern
- `response`: string - Response to return
- `priority`: number (optional, default: 5) - Priority (1-10)

**Example:**
```typescript
bufferManager.addPreBufferedResponse(
  /^what('s| is) the time$/i,
  `It's ${new Date().toLocaleTimeString()}`,
  8
);
```

#### `getStats(): CacheStats`

Get cache statistics.

**Returns:**
```typescript
{
  hits: number;
  misses: number;
  evictions: number;
  cacheSize: number;
  preBufferedCount: number;
  hitRate: number; // 0-1
}
```

#### `clear(): void`

Clear all caches.

---

## CollaborationManager

Manages multi-agent collaboration.

### Methods

#### `initialize(): Promise<void>`

Initialize and discover advisor agents.

#### `consultExpert(request: ExpertRequest): Promise<string>`

Consult an expert advisor.

**Parameters:**
```typescript
{
  domain: string; // 'technical', 'business', 'research', etc.
  query: string;
  context?: Record<string, unknown>;
  priority?: number;
}
```

**Returns:** Promise<string> - Expert's response

**Example:**
```typescript
const response = await collaboration.consultExpert({
  domain: 'technical',
  query: 'Best practices for WebSocket scaling?',
  priority: 8,
});
```

#### `requestValidation(request: ValidationRequest): Promise<ValidationResult>`

Request validation from validator agent.

**Parameters:**
```typescript
{
  content: string;
  criteria: string[]; // ['accuracy', 'completeness', 'clarity']
  strictness?: 'low' | 'medium' | 'high';
}
```

**Returns:**
```typescript
{
  isValid: boolean;
  score: number; // 0-1
  issues: string[];
  suggestions: string[];
}
```

#### `requestInvestigation(request: InvestigationRequest): Promise<InvestigationResult>`

Request investigation from investigator agent.

**Parameters:**
```typescript
{
  topic: string;
  depth: number; // 1-5
  sources?: string[];
}
```

**Returns:**
```typescript
{
  findings: string[];
  sources: string[];
  confidence: number; // 0-1
  summary: string;
}
```

#### `getExpertRecommendation(query: string): Promise<ExpertRecommendation>`

Get recommended experts for a query.

**Returns:**
```typescript
{
  recommendedExperts: string[]; // Domain names
  reasoning: string;
}
```

#### `getStats(): CollaborationStats`

Get collaboration statistics.

---

## Configuration

### loadConfig(): VoiceAgentConfig

Load configuration from environment variables.

**Returns:** VoiceAgentConfig

**Throws:** Error if validation fails

### validateEnvironment(): void

Validate required environment variables exist.

**Throws:** Error if missing required variables

**Required variables:**
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `GEMINI_API_KEY`

---

## Types

### VoiceAgentConfig

```typescript
interface VoiceAgentConfig {
  name: string;
  description: string;
  livekit: LiveKitConfig;
  gemini: GeminiConfig;
  mcp?: MCPConfig;
  performance: PerformanceConfig;
  collaboration?: CollaborationConfig;
}
```

### VoiceSession

```typescript
interface VoiceSession {
  id: string;
  room: Room;
  localParticipant: LocalParticipant;
  remoteParticipants: Map<string, RemoteParticipant>;
  startedAt: Date;
  metadata: SessionMetadata;
  context: ConversationContext;
}
```

### StreamingResponse

```typescript
interface StreamingResponse {
  id: string;
  textStream: AsyncIterable<string>;
  audioStream?: AsyncIterable<AudioChunk>;
  fullText: string;
  metadata: StreamMetadata;
}
```

### MCPTool

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  server: string;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}
```

---

## Error Handling

All async methods can throw errors. Always use try-catch:

```typescript
try {
  const response = await agent.processText(input);
  console.log(response);
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

Common errors:
- `Error: Not initialized` - Call `initialize()` first
- `Error: Tool not found` - Tool doesn't exist in MCP servers
- `Error: Tool execution timeout` - Tool took too long
- `Error: Invalid configuration` - Check .env file
- `Error: Connection failed` - Check network/credentials

---

## Performance Tips

1. **Use pre-buffering** - Set `ENABLE_PRE_BUFFERING=true` for common queries
2. **Enable caching** - Responses are cached automatically
3. **Streaming for long responses** - Better perceived latency
4. **Tool timeout** - Set appropriate `MCP_TOOL_TIMEOUT` value
5. **Monitor stats** - Use `getStats()` to track performance

---

## Next Steps

- See [README.md](../README.md) for getting started guide
- Check [examples/](../examples/) for code samples
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
