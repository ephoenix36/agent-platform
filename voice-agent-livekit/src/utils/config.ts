/**
 * Configuration loader and validator
 * Loads environment variables and validates required configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import type { VoiceAgentConfig } from '../types.js';

// Load environment variables
dotenv.config();

// Configuration schema
const configSchema = z.object({
  name: z.string().default('VoiceAssistant'),
  description: z.string().default('Real-time voice assistant with advanced capabilities'),
  
  livekit: z.object({
    url: z.string().url(),
    apiKey: z.string().min(1),
    apiSecret: z.string().min(1),
    roomName: z.string().optional(),
    identity: z.string().optional(),
  }),
  
  gemini: z.object({
    apiKey: z.string().min(1),
    model: z.string().default('gemini-2.0-flash-exp'),
    systemInstruction: z.string().default(
      'You are a helpful, friendly voice assistant. Respond naturally and conversationally.'
    ),
    temperature: z.number().min(0).max(2).default(0.7),
    topP: z.number().min(0).max(1).default(0.95),
    topK: z.number().int().positive().default(40),
    maxOutputTokens: z.number().int().positive().default(2048),
  }),
  
  mcp: z.object({
    configPath: z.string().default('./mcp-servers.json'),
    enabledServers: z.array(z.string()).default(['agent-platform', 'advisors', 'voice-control']),
    toolTimeout: z.number().int().positive().default(10000),
  }).optional(),
  
  performance: z.object({
    enablePreBuffering: z.boolean().default(true),
    preBufferSize: z.number().int().positive().default(3),
    maxLatencyMs: z.number().int().positive().default(500),
    streamChunkSize: z.number().int().positive().default(4096),
    enableStreaming: z.boolean().default(true),
  }),
  
  collaboration: z.object({
    enableAdvisors: z.boolean().default(true),
    advisorEndpoint: z.string().url().optional(),
    validatorTimeout: z.number().int().positive().default(3000),
    investigationDepth: z.number().int().min(1).max(5).default(3),
  }).optional(),
});

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): VoiceAgentConfig {
  const rawConfig = {
    name: process.env.AGENT_NAME,
    description: process.env.AGENT_DESCRIPTION,
    
    livekit: {
      url: process.env.LIVEKIT_URL,
      apiKey: process.env.LIVEKIT_API_KEY,
      apiSecret: process.env.LIVEKIT_API_SECRET,
      roomName: process.env.LIVEKIT_ROOM_NAME,
      identity: process.env.LIVEKIT_IDENTITY,
    },
    
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      systemInstruction: process.env.GEMINI_SYSTEM_INSTRUCTION,
      temperature: process.env.GEMINI_TEMPERATURE ? parseFloat(process.env.GEMINI_TEMPERATURE) : undefined,
      topP: process.env.GEMINI_TOP_P ? parseFloat(process.env.GEMINI_TOP_P) : undefined,
      topK: process.env.GEMINI_TOP_K ? parseInt(process.env.GEMINI_TOP_K) : undefined,
      maxOutputTokens: process.env.GEMINI_MAX_OUTPUT_TOKENS ? parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS) : undefined,
    },
    
    mcp: {
      configPath: process.env.MCP_SERVERS_CONFIG_PATH,
      enabledServers: process.env.MCP_ENABLED_SERVERS?.split(','),
      toolTimeout: process.env.MCP_TOOL_TIMEOUT ? parseInt(process.env.MCP_TOOL_TIMEOUT) : undefined,
    },
    
    performance: {
      enablePreBuffering: process.env.ENABLE_PRE_BUFFERING === 'true',
      preBufferSize: process.env.PRE_BUFFER_SIZE ? parseInt(process.env.PRE_BUFFER_SIZE) : undefined,
      maxLatencyMs: process.env.MAX_LATENCY_MS ? parseInt(process.env.MAX_LATENCY_MS) : undefined,
      streamChunkSize: process.env.STREAM_CHUNK_SIZE ? parseInt(process.env.STREAM_CHUNK_SIZE) : undefined,
      enableStreaming: process.env.ENABLE_STREAMING !== 'false',
    },
    
    collaboration: {
      enableAdvisors: process.env.ENABLE_EXPERT_ADVISORS === 'true',
      advisorEndpoint: process.env.ADVISOR_AGENT_ENDPOINT,
      validatorTimeout: process.env.VALIDATOR_TIMEOUT_MS ? parseInt(process.env.VALIDATOR_TIMEOUT_MS) : undefined,
      investigationDepth: process.env.INVESTIGATION_DEPTH ? parseInt(process.env.INVESTIGATION_DEPTH) : undefined,
    },
  };
  
  try {
    const validated = configSchema.parse(rawConfig);
    return validated as VoiceAgentConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid configuration. Please check your .env file.');
    }
    throw error;
  }
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const required = [
    'LIVEKIT_URL',
    'LIVEKIT_API_KEY',
    'LIVEKIT_API_SECRET',
    'GEMINI_API_KEY',
  ];
  
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and fill in the required values.'
    );
  }
}
