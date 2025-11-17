# Architecture Overview

This document describes the architecture of the Voice Agent LiveKit system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User/Client                               │
│                      (LiveKit Client SDK)                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ WebRTC/Audio
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                         LiveKit Server                              │
│                  (Media Routing & Distribution)                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ LiveKit SDK
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                         Voice Agent                                 │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    LiveKitManager                             │ │
│  │  • Room Connection        • Participant Tracking              │ │
│  │  • Audio Publishing       • Event Handling                    │ │
│  └───────────────┬───────────────────────────────────────────────┘ │
│                  │                                                   │
│  ┌───────────────▼───────────────────────────────────────────────┐ │
│  │                   Audio Processing                            │ │
│  │  • STT (Speech-to-Text)   • Audio Buffering                   │ │
│  │  • TTS (Text-to-Speech)   • Format Conversion                 │ │
│  └───────────────┬───────────────────────────────────────────────┘ │
│                  │                                                   │
│  ┌───────────────▼───────────────────────────────────────────────┐ │
│  │                   VoiceAgent Core                             │ │
│  │  • Session Management     • Event Orchestration               │ │
│  │  • Message Processing     • State Management                  │ │
│  └──┬────────┬────────┬────────┬────────┬────────────────────────┘ │
│     │        │        │        │        │                           │
│  ┌──▼──┐  ┌─▼───┐  ┌─▼──┐  ┌─▼────┐  ┌▼─────────┐                 │
│  │Gemini│  │MCP │  │Buffer│  │Collab│  │Analytics│                 │
│  │Mgr   │  │Mgr │  │Mgr   │  │Mgr   │  │& Metrics│                 │
│  └──┬───┘  └─┬──┘  └─┬──┘  └─┬────┘  └──────────┘                 │
└─────┼────────┼────────┼────────┼───────────────────────────────────┘
      │        │        │        │
      │        │        │        │
┌─────▼─────┐  │        │        │
│  Gemini   │  │        │        │
│  2.0 Flash│  │        │        │
│   (LLM)   │  │        │        │
└───────────┘  │        │        │
               │        │        │
         ┌─────▼─────┐  │        │
         │    MCP    │  │        │
         │  Servers  │  │        │
         │ (Tools)   │  │        │
         └───────────┘  │        │
                        │        │
                  ┌─────▼─────┐  │
                  │  Response │  │
                  │   Cache   │  │
                  │  (Redis)  │  │
                  └───────────┘  │
                                 │
                         ┌───────▼────────┐
                         │ Expert Advisors│
                         │ • Technical    │
                         │ • Business     │
                         │ • Research     │
                         └────────────────┘
```

## Component Details

### 1. LiveKitManager

**Responsibilities:**
- WebRTC connection management
- Room creation and joining
- Participant lifecycle tracking
- Audio track publishing/subscribing
- Connection state management

**Key Features:**
- Automatic reconnection
- Participant event handling
- Audio format conversion
- Token generation and validation

**Performance Characteristics:**
- Connection time: <2s
- Audio latency: <100ms (local), <300ms (global)
- Concurrent participants: 10+ per room

### 2. GeminiManager

**Responsibilities:**
- LLM interaction management
- Streaming response generation
- Function calling coordination
- Conversation history management

**Key Features:**
- Streaming text generation
- Tool/function calling
- Context window management
- Response quality optimization

**Performance Characteristics:**
- First token latency: 100-300ms
- Streaming throughput: 50-100 tokens/s
- Context limit: 32K tokens (Gemini 2.0 Flash)

### 3. MCPManager

**Responsibilities:**
- MCP server connection management
- Tool discovery and registration
- Tool execution with timeout
- Multi-server coordination

**Key Features:**
- Dynamic tool loading
- Timeout protection
- Error isolation
- Server health monitoring

**Performance Characteristics:**
- Tool discovery: <1s per server
- Tool execution: varies by tool (timeout: 10s default)
- Concurrent tool calls: 5+ simultaneous

### 4. BufferManager

**Responsibilities:**
- Response pre-generation
- LRU caching with TTL
- Pattern matching for quick responses
- Cache statistics tracking

**Key Features:**
- Regex and exact matching
- Automatic eviction
- Hit rate tracking
- Custom response registration

**Performance Characteristics:**
- Pre-buffered response time: <10ms
- Cache hit response time: <50ms
- Cache size: 100 entries (configurable)
- Hit rate target: >40%

### 5. CollaborationManager

**Responsibilities:**
- Expert advisor discovery
- Query routing and delegation
- Validation coordination
- Investigation management

**Key Features:**
- Domain-based routing
- Parallel consultation
- Timeout management
- Response synthesis

**Performance Characteristics:**
- Expert consultation: 500ms-3s
- Validation: 1-2s
- Investigation: 2-5s (depth dependent)

## Data Flow

### Text Message Processing

```
User Input
    │
    ▼
Buffer Check (Pre-buffered/Cache)
    │
    ├─► Hit ──────────────────────────┐
    │                                  │
    └─► Miss                           │
        │                              │
        ▼                              │
    Complexity Assessment              │
        │                              │
        ├─► Simple Query               │
        │   └─► Gemini Direct          │
        │                              │
        └─► Complex Query              │
            └─► Expert Consultation    │
                │                      │
                ▼                      │
            Gemini + Expert Input      │
                │                      │
                ▼                      │
            Tool Detection             │
                │                      │
                ├─► No Tools           │
                │   └─► Direct Response│
                │                      │
                └─► With Tools         │
                    └─► MCP Execution  │
                        │              │
                        ▼              │
                    Tool Results       │
                        │              │
                        ▼              │
                    Final Synthesis    │
                        │              │
                        ▼              ▼
                    Response ──────► User
                        │
                        ▼
                    Cache Store
```

### Voice Message Processing

```
User Audio (WebRTC)
    │
    ▼
LiveKit Room
    │
    ▼
Audio Chunk Buffering
    │
    ▼
Speech-to-Text (STT)
    │
    ▼
Text Processing (as above)
    │
    ▼
Text-to-Speech (TTS)
    │
    ▼
Audio Publishing
    │
    ▼
LiveKit Room
    │
    ▼
User Audio Output
```

## Scaling Considerations

### Horizontal Scaling

**Load Balancing:**
- Session affinity for LiveKit rooms
- Stateless request processing
- Shared cache (Redis cluster)

**Challenges:**
- LiveKit room assignment
- MCP server connection pooling
- Conversation history persistence

**Solutions:**
- Room-based routing with sticky sessions
- Centralized MCP proxy
- Distributed conversation store (DynamoDB, MongoDB)

### Vertical Scaling

**CPU Optimization:**
- Async I/O for all network calls
- Minimal CPU processing (delegate to services)
- Efficient event handling

**Memory Optimization:**
- Bounded conversation history (20 messages)
- LRU cache eviction
- Streaming responses (no full buffering)

**Recommendations:**
- 2 CPU cores minimum
- 2GB RAM per instance
- 5-10 concurrent sessions per instance

## Security Architecture

### Authentication & Authorization

```
User ─────────────► Frontend
                        │
                        ▼
                    Auth Service
                        │
                        ├─► JWT Validation
                        │
                        ▼
                    API Gateway
                        │
                        ▼
                   Voice Agent
                        │
                        ├─► LiveKit Token
                        │   (with room grants)
                        │
                        └─► MCP Auth
                            (per-server credentials)
```

### Data Protection

- TLS 1.3 for all connections
- End-to-end encryption for audio (WebRTC SRTP)
- API key encryption at rest
- No PII in logs
- Conversation data encryption

### Rate Limiting

- Per-user: 100 requests/15min
- Per-IP: 1000 requests/hour
- Tool execution: 10 concurrent/user
- Expert consultation: 5/minute

## Monitoring & Observability

### Metrics

**System Metrics:**
- CPU usage per container
- Memory usage and GC stats
- Network I/O
- Disk I/O

**Application Metrics:**
- Request latency (p50, p95, p99)
- Cache hit rate
- Tool execution time
- Expert consultation count
- Error rate by type

**Business Metrics:**
- Active sessions
- Messages per session
- Average session duration
- Tool usage frequency

### Logging

**Log Levels:**
- ERROR: System failures, tool errors
- WARN: Degraded performance, fallbacks
- INFO: Session events, tool calls
- DEBUG: Detailed flow, cache hits

**Log Aggregation:**
- Structured JSON logs
- Correlation IDs for request tracing
- ELK/Loki for centralized logging

### Tracing

**Distributed Tracing:**
- OpenTelemetry integration
- Trace propagation through components
- Span annotations for key operations

## Failure Modes & Recovery

### Component Failures

| Component | Failure Mode | Recovery Strategy |
|-----------|-------------|-------------------|
| LiveKit | Connection drop | Auto-reconnect with exponential backoff |
| Gemini | API error | Retry with backoff, fallback to cache |
| MCP Server | Timeout | Cancel request, return error to user |
| Expert Advisor | Unavailable | Fallback to direct Gemini response |
| Cache | Eviction | Regenerate on next request |

### Degraded Mode

When external dependencies fail:
1. Disable tool calling
2. Disable expert consultation
3. Rely on cache and pre-buffered responses
4. Return degraded service notification

### Circuit Breaker

Implemented for:
- Gemini API calls (5 failures → 30s break)
- MCP tool execution (3 failures → 60s break)
- Expert consultations (5 failures → 2min break)

## Future Enhancements

1. **Multimodal Support**
   - Image input/output
   - Video processing
   - Screen sharing integration

2. **Advanced NLU**
   - Intent classification
   - Entity extraction
   - Sentiment analysis

3. **Conversation Analytics**
   - Topic modeling
   - Conversation summarization
   - Quality scoring

4. **Personalization**
   - User profile learning
   - Preference adaptation
   - Context carryover across sessions

5. **Performance Optimizations**
   - Response speculation (predict next query)
   - Parallel expert consultation
   - Smart prefetching

---

For implementation details, see individual component documentation in the `/src` directory.
