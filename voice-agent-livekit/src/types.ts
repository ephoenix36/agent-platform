/**
 * Type definitions for the Voice Agent LiveKit system
 */

import type { Room, RemoteParticipant, LocalParticipant, TrackPublication } from '@livekit/rtc-node';
import type { GenerativeModel } from '@google/generative-ai';

// ============================================================================
// Core Agent Types
// ============================================================================

export interface VoiceAgentConfig {
  /** Agent display name */
  name: string;
  
  /** Agent description/purpose */
  description: string;
  
  /** LiveKit configuration */
  livekit: LiveKitConfig;
  
  /** Gemini configuration */
  gemini: GeminiConfig;
  
  /** MCP tools configuration */
  mcp?: MCPConfig;
  
  /** Performance tuning */
  performance: PerformanceConfig;
  
  /** Multi-agent collaboration */
  collaboration?: CollaborationConfig;
}

export interface LiveKitConfig {
  /** LiveKit server URL */
  url: string;
  
  /** API key for authentication */
  apiKey: string;
  
  /** API secret for authentication */
  apiSecret: string;
  
  /** Room name to join/create */
  roomName?: string;
  
  /** Agent participant identity */
  identity?: string;
}

export interface GeminiConfig {
  /** Gemini API key */
  apiKey: string;
  
  /** Model name (e.g., gemini-2.0-flash-exp) */
  model: string;
  
  /** System instructions for the agent */
  systemInstruction: string;
  
  /** Temperature for generation (0.0-2.0) */
  temperature?: number;
  
  /** Top-p sampling parameter */
  topP?: number;
  
  /** Top-k sampling parameter */
  topK?: number;
  
  /** Maximum output tokens */
  maxOutputTokens?: number;
  
  /** Safety settings */
  safetySettings?: GeminiSafetySettings[];
}

export interface GeminiSafetySettings {
  category: string;
  threshold: string;
}

export interface MCPConfig {
  /** Path to MCP servers configuration */
  configPath: string;
  
  /** Enabled MCP servers */
  enabledServers: string[];
  
  /** Tool call timeout in ms */
  toolTimeout?: number;
}

export interface PerformanceConfig {
  /** Enable pre-buffering of common responses */
  enablePreBuffering: boolean;
  
  /** Number of responses to pre-buffer */
  preBufferSize: number;
  
  /** Maximum acceptable latency in ms */
  maxLatencyMs: number;
  
  /** Audio stream chunk size in bytes */
  streamChunkSize: number;
  
  /** Enable streaming responses */
  enableStreaming: boolean;
}

export interface CollaborationConfig {
  /** Enable expert advisor agents */
  enableAdvisors: boolean;
  
  /** Advisor agent endpoint */
  advisorEndpoint?: string;
  
  /** Validator timeout in ms */
  validatorTimeout?: number;
  
  /** Investigation depth (1-5) */
  investigationDepth?: number;
}

// ============================================================================
// Session & State Types
// ============================================================================

export interface VoiceSession {
  /** Unique session ID */
  id: string;
  
  /** LiveKit room instance */
  room: Room;
  
  /** Local participant (agent) */
  localParticipant: LocalParticipant;
  
  /** Remote participants (users) */
  remoteParticipants: Map<string, RemoteParticipant>;
  
  /** Session start time */
  startedAt: Date;
  
  /** Session metadata */
  metadata: SessionMetadata;
  
  /** Current conversation context */
  context: ConversationContext;
}

export interface SessionMetadata {
  /** User ID (if authenticated) */
  userId?: string;
  
  /** User display name */
  userName?: string;
  
  /** Session tags/labels */
  tags?: string[];
  
  /** Custom metadata */
  custom?: Record<string, unknown>;
}

export interface ConversationContext {
  /** Conversation history */
  messages: ConversationMessage[];
  
  /** Active tool calls */
  activeToolCalls: ToolCall[];
  
  /** Session state */
  state: SessionState;
  
  /** Language preference */
  language: string;
  
  /** User preferences */
  preferences?: UserPreferences;
}

export interface ConversationMessage {
  /** Message ID */
  id: string;
  
  /** Message role */
  role: 'user' | 'agent' | 'system';
  
  /** Message content */
  content: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Audio track ID (if applicable) */
  audioTrackId?: string;
  
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export type SessionState = 'initializing' | 'active' | 'paused' | 'ended' | 'error';

export interface UserPreferences {
  /** Preferred response style */
  responseStyle?: 'concise' | 'detailed' | 'balanced';
  
  /** Enable background music */
  backgroundMusic?: boolean;
  
  /** Voice speed (0.5-2.0) */
  voiceSpeed?: number;
  
  /** Enable notifications */
  notifications?: boolean;
}

// ============================================================================
// Tool & MCP Types
// ============================================================================

export interface ToolCall {
  /** Tool call ID */
  id: string;
  
  /** Tool name */
  name: string;
  
  /** Tool arguments */
  args: Record<string, unknown>;
  
  /** Call status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  /** Result (if completed) */
  result?: unknown;
  
  /** Error (if failed) */
  error?: Error;
  
  /** Start time */
  startedAt: Date;
  
  /** End time */
  endedAt?: Date;
}

export interface MCPTool {
  /** Tool name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Input schema */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  
  /** Server providing this tool */
  server: string;
  
  /** Handler function */
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

// ============================================================================
// Audio Processing Types
// ============================================================================

export interface AudioChunk {
  /** Chunk ID */
  id: string;
  
  /** Audio data */
  data: Buffer;
  
  /** Timestamp */
  timestamp: number;
  
  /** Sample rate */
  sampleRate: number;
  
  /** Number of channels */
  channels: number;
  
  /** Duration in seconds */
  duration: number;
}

export interface TranscriptionResult {
  /** Transcribed text */
  text: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Language detected */
  language: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Word-level timestamps */
  words?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

// ============================================================================
// Streaming & Buffering Types
// ============================================================================

export interface StreamingResponse {
  /** Response ID */
  id: string;
  
  /** Stream of text chunks */
  textStream: AsyncIterable<string>;
  
  /** Stream of audio chunks (if TTS enabled) */
  audioStream?: AsyncIterable<AudioChunk>;
  
  /** Complete text (populated as stream progresses) */
  fullText: string;
  
  /** Metadata */
  metadata: StreamMetadata;
}

export interface StreamMetadata {
  /** First chunk time */
  firstChunkAt?: Date;
  
  /** Last chunk time */
  lastChunkAt?: Date;
  
  /** Total chunks */
  totalChunks: number;
  
  /** Average latency per chunk (ms) */
  avgLatencyMs: number;
  
  /** Model used */
  model: string;
}

export interface PreBufferedResponse {
  /** Trigger phrase/pattern */
  trigger: string | RegExp;
  
  /** Pre-generated response */
  response: string;
  
  /** Pre-generated audio (if applicable) */
  audio?: Buffer;
  
  /** Priority (higher = more likely to use) */
  priority: number;
  
  /** Usage count */
  usageCount: number;
  
  /** Last used timestamp */
  lastUsed?: Date;
}

// ============================================================================
// Multi-Agent Collaboration Types
// ============================================================================

export interface AgentCollaboration {
  /** Primary agent (this instance) */
  primary: string;
  
  /** Expert advisors */
  advisors: ExpertAdvisor[];
  
  /** Active consultations */
  consultations: Consultation[];
}

export interface ExpertAdvisor {
  /** Advisor ID */
  id: string;
  
  /** Advisor name */
  name: string;
  
  /** Domain expertise */
  domain: string;
  
  /** Endpoint URL */
  endpoint: string;
  
  /** Availability status */
  available: boolean;
  
  /** Response time (ms) */
  avgResponseTimeMs: number;
}

export interface Consultation {
  /** Consultation ID */
  id: string;
  
  /** Advisor being consulted */
  advisorId: string;
  
  /** Query sent to advisor */
  query: string;
  
  /** Status */
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  
  /** Response from advisor */
  response?: string;
  
  /** Start time */
  startedAt: Date;
  
  /** End time */
  endedAt?: Date;
}

// ============================================================================
// Event Types
// ============================================================================

export type VoiceAgentEvent = 
  | SessionStartedEvent
  | SessionEndedEvent
  | ParticipantJoinedEvent
  | ParticipantLeftEvent
  | MessageReceivedEvent
  | MessageSentEvent
  | ToolCallStartedEvent
  | ToolCallCompletedEvent
  | ErrorEvent;

export interface BaseEvent {
  type: string;
  timestamp: Date;
  sessionId: string;
}

export interface SessionStartedEvent extends BaseEvent {
  type: 'session.started';
  roomName: string;
  participantCount: number;
}

export interface SessionEndedEvent extends BaseEvent {
  type: 'session.ended';
  duration: number;
  messageCount: number;
  reason?: string;
}

export interface ParticipantJoinedEvent extends BaseEvent {
  type: 'participant.joined';
  participantId: string;
  participantName: string;
}

export interface ParticipantLeftEvent extends BaseEvent {
  type: 'participant.left';
  participantId: string;
  participantName: string;
}

export interface MessageReceivedEvent extends BaseEvent {
  type: 'message.received';
  messageId: string;
  content: string;
  participantId: string;
}

export interface MessageSentEvent extends BaseEvent {
  type: 'message.sent';
  messageId: string;
  content: string;
  latencyMs: number;
}

export interface ToolCallStartedEvent extends BaseEvent {
  type: 'tool.call.started';
  toolCallId: string;
  toolName: string;
}

export interface ToolCallCompletedEvent extends BaseEvent {
  type: 'tool.call.completed';
  toolCallId: string;
  toolName: string;
  success: boolean;
  durationMs: number;
}

export interface ErrorEvent extends BaseEvent {
  type: 'error';
  error: Error;
  context?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}
